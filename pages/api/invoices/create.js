/**
 * Create Invoice API
 * Creates a new invoice for a contact and optionally links it to an event/project
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate invoice number
 */
async function generateInvoiceNumber(supabase, organizationId = null) {
  try {
    // Try to use database function first
    const { data, error } = await supabase.rpc('generate_invoice_number');
    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('⚠️ Database function not available, generating manually:', err.message);
  }

  // Fallback: Generate manually
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get count of invoices this month, scoped to organization if provided
  let query = supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `INV-${year}${month}%`);
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { count } = await query;

  const sequenceNum = String((count || 0) + 1).padStart(3, '0');
  return `INV-${year}${month}-${sequenceNum}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    const { 
      contactId, 
      projectId, 
      invoiceTitle, 
      invoiceDate, 
      dueDate, 
      subtotal, 
      taxRate,
      taxAmount,
      discountType,
      discountValue,
      discountAmount,
      totalAmount,
      paymentTerms,
      lateFeePercentage,
      depositAmount,
      paymentPlan, // Payment plan configuration
      lineItems, 
      notes,
      internalNotes
    } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Use service role client for queries
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    // Verify contact exists and user has access
    let contactQuery = adminSupabase
      .from('contacts')
      .select('id, first_name, last_name, email_address, event_type, organization_id')
      .eq('id', contactId)
      .is('deleted_at', null)
      .single();

    if (!isAdmin && orgId) {
      contactQuery = contactQuery.eq('organization_id', orgId);
    }

    const { data: contact, error: contactError } = await contactQuery;

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found or access denied' });
    }

    // Verify project exists if provided
    let project = null;
    if (projectId) {
      let projectQuery = adminSupabase
        .from('events')
        .select('id, event_name, client_name, event_date, organization_id')
        .eq('id', projectId)
        .single();

      if (!isAdmin && orgId) {
        projectQuery = projectQuery.eq('organization_id', orgId);
      }

      const { data: projectData, error: projectError } = await projectQuery;

      if (projectError || !projectData) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      project = projectData;
    }

    // Ensure organization_id is set (required for RLS)
    let finalOrgId = contact.organization_id || orgId;
    
    // If super admin and no organization_id found, default to M10 platform owner organization
    if (!finalOrgId && isAdmin) {
      console.log('[create-invoice] Super admin creating invoice without organization_id, finding M10 platform owner org...');
      const { data: m10Org, error: m10OrgError } = await adminSupabase
        .from('organizations')
        .select('id')
        .eq('is_platform_owner', true)
        .single();
      
      if (m10Org && !m10OrgError) {
        finalOrgId = m10Org.id;
        console.log('[create-invoice] Using M10 platform owner organization:', finalOrgId);
      } else {
        console.warn('[create-invoice] Could not find M10 platform owner organization:', m10OrgError);
        // Fallback: try to find any organization with M10 in the name
        const { data: fallbackOrg } = await adminSupabase
          .from('organizations')
          .select('id')
          .or('name.ilike.%m10%,slug.ilike.%m10%')
          .limit(1)
          .single();
        
        if (fallbackOrg) {
          finalOrgId = fallbackOrg.id;
          console.log('[create-invoice] Using fallback M10 organization:', finalOrgId);
        }
      }
    }
    
    if (!finalOrgId && !isAdmin) {
      console.error('Missing organization_id for invoice creation:', { contactId, orgId, contactOrgId: contact.organization_id });
      return res.status(400).json({ 
        error: 'Organization ID is required',
        details: 'Contact does not have an organization assigned. Please assign the contact to an organization first.'
      });
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(adminSupabase, finalOrgId);

    // Calculate dates
    const today = new Date();
    const invoiceDateValue = invoiceDate || today.toISOString().split('T')[0];
    const dueDateValue = dueDate || (() => {
      const due = new Date(today);
      due.setDate(due.getDate() + 30);
      return due.toISOString().split('T')[0];
    })();

    // Calculate amounts
    const subtotalValue = subtotal || 0;
    const taxRateValue = taxRate || null;
    const taxAmountValue = taxAmount || (taxRate ? subtotalValue * (taxRate / 100) : 0);
    const discountAmountValue = discountAmount || 0;
    const totalAmountValue = totalAmount || (subtotalValue + taxAmountValue - discountAmountValue);

    // Build invoice title
    const clientName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Client';
    const title = invoiceTitle || `${contact.event_type || 'Event'} - ${clientName}`.trim();

    // Generate payment token for invoice (secure random token)
    const crypto = require('crypto');
    const paymentToken = crypto.randomBytes(32).toString('hex');

    // Create invoice
    const invoiceData = {
      contact_id: contact.id,
      project_id: projectId || null,
      organization_id: finalOrgId, // Always set organization_id
      invoice_number: invoiceNumber,
      invoice_status: 'Draft',
      invoice_title: title,
      invoice_description: project ? `Invoice for ${project.event_name || 'event'}` : `Invoice for ${contact.event_type || 'event'} services`,
      invoice_date: invoiceDateValue,
      due_date: dueDateValue,
      subtotal: subtotalValue,
      tax_rate: taxRateValue !== null && taxRateValue !== undefined ? parseFloat(taxRateValue) : null,
      tax_amount: taxAmountValue,
      discount_amount: discountAmountValue,
      total_amount: totalAmountValue,
      balance_due: totalAmountValue,
      amount_paid: 0,
      payment_terms: paymentTerms || null,
      late_fee_percentage: lateFeePercentage !== null && lateFeePercentage !== undefined && lateFeePercentage !== '' ? parseFloat(lateFeePercentage) : null,
      deposit_amount: depositAmount ? parseFloat(depositAmount) : null,
      payment_plan: paymentPlan || null, // Store payment plan configuration
      line_items: lineItems || [],
      notes: notes || null,
      internal_notes: internalNotes || null,
      payment_token: paymentToken // Generate payment token for secure payment links
    };

    console.log('[create-invoice] Attempting to create invoice:', {
      contact_id: invoiceData.contact_id,
      organization_id: invoiceData.organization_id,
      invoice_number: invoiceData.invoice_number,
      isAdmin,
      orgId
    });

    const { data: invoice, error: invoiceError } = await adminSupabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', {
        error: invoiceError,
        code: invoiceError.code,
        message: invoiceError.message,
        details: invoiceError.details,
        hint: invoiceError.hint,
        invoiceData: {
          ...invoiceData,
          line_items: invoiceData.line_items ? '[...]' : null
        }
      });
      return res.status(500).json({ 
        error: 'Failed to create invoice',
        details: invoiceError.message,
        code: invoiceError.code,
        hint: invoiceError.hint
      });
    }

    // Ensure contract exists for invoice (invoice-first workflow)
    // This runs asynchronously so it doesn't block the response
    (async () => {
      try {
        const { ensureContractExistsForInvoice } = await import('../../../utils/ensure-contract-exists-for-invoice');
        const contractResult = await ensureContractExistsForInvoice(invoice.id, adminSupabase);
        
        if (contractResult.success) {
          console.log(`✅ Contract ${contractResult.created ? 'created' : 'exists'} for invoice ${invoice.id}:`, contractResult.contract_id);
        } else {
          console.warn(`⚠️ Could not ensure contract exists for invoice ${invoice.id}:`, contractResult.error);
        }
      } catch (err) {
        console.error('Error ensuring contract exists for invoice (non-blocking):', err);
      }
    })();

    return res.status(200).json({
      success: true,
      invoice: invoice,
      message: 'Invoice created successfully'
    });

  } catch (error) {
    console.error('Error in create invoice API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
