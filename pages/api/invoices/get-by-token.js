/**
 * Get Invoice by Payment Token
 * Public endpoint for payment page
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[get-by-token] Looking up invoice with token:', token.substring(0, 20) + '...');

    // First, try to get the invoice by payment token
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('payment_token', token)
      .single();

    if (invoiceError) {
      console.error('[get-by-token] Query error:', {
        error: invoiceError,
        code: invoiceError?.code,
        message: invoiceError?.message,
        details: invoiceError?.details,
        hint: invoiceError?.hint,
        token: token.substring(0, 20) + '...'
      });
      
      // Check if it's a column doesn't exist error (PostgreSQL error code 42703 = undefined_column)
      const errorMessage = invoiceError?.message || '';
      const errorDetails = invoiceError?.details || '';
      const isColumnError = invoiceError?.code === '42703' || 
                           (errorMessage.includes('column') && errorMessage.includes('does not exist')) ||
                           (errorDetails.includes('column') && errorDetails.includes('does not exist')) ||
                           errorMessage.includes('payment_token') ||
                           errorDetails.includes('payment_token');
      
      if (isColumnError) {
        return res.status(500).json({ 
          error: 'Database schema error',
          message: 'Payment token column not found. Please run database migrations.',
          code: 'MIGRATION_REQUIRED',
          hint: 'Run migration: 20250129000001_add_payment_token_to_invoices.sql'
        });
      }
      
      // If it's a "no rows returned" error (PGRST116), return 404
      if (invoiceError?.code === 'PGRST116') {
        return res.status(404).json({ error: 'Invoice not found or link expired' });
      }
      
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    if (!invoice) {
      console.error('[get-by-token] Invoice not found (no data returned):', {
        token: token.substring(0, 20) + '...'
      });
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    // Verify that the invoice actually has the payment_token we're looking for
    // (in case of race condition or data inconsistency)
    if (invoice.payment_token !== token) {
      console.error('[get-by-token] Token mismatch:', {
        invoice_id: invoice.id,
        expected_token: token.substring(0, 20) + '...',
        actual_token: invoice.payment_token ? invoice.payment_token.substring(0, 20) + '...' : 'NULL'
      });
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    console.log('[get-by-token] Invoice found:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      contact_id: invoice.contact_id
    });

    // Then fetch contact details separately to avoid RLS issues
    let contact = null;
    if (invoice.contact_id) {
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email_address, phone')
        .eq('id', invoice.contact_id)
        .single();
      
      if (contactError) {
        console.warn('Error fetching contact (non-critical):', contactError);
        // Continue even if contact fetch fails
      } else {
        contact = contactData;
      }
    }

    // Ensure contract exists for invoice (creates one if it doesn't exist)
    let contract = null;
    try {
      const { ensureContractExistsForInvoice } = await import('../../../utils/ensure-contract-exists-for-invoice');
      const contractResult = await ensureContractExistsForInvoice(invoice.id, supabase);
      
      if (contractResult.success && contractResult.contract_id) {
        // Fetch contract with signing token
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select('id, contract_number, status, signing_token, signing_token_expires_at')
          .eq('id', contractResult.contract_id)
          .single();
        
        if (!contractError && contractData) {
          contract = contractData;
        }
      }
    } catch (contractErr) {
      console.warn('Error ensuring contract exists (non-critical):', contractErr);
      // Continue even if contract creation fails - invoice can still be paid
    }

    // Check if token is expired (optional: add expiry logic)
    // For now, just check if invoice exists and isn't deleted

    // Map line items to ensure consistent format (amount -> total)
    const lineItems = (invoice.line_items || []).map(item => ({
      description: item.description || '',
      quantity: item.quantity || 1,
      rate: item.rate || item.unit_price || 0,
      total: item.total || item.amount || (item.rate || item.unit_price || 0) * (item.quantity || 1)
    }));

    // Don't send sensitive data
    const safeInvoice = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_amount: invoice.total_amount,
      subtotal: invoice.subtotal,
      tax: invoice.tax_amount || invoice.tax || 0,
      tax_rate: invoice.tax_rate || null,
      discount_amount: invoice.discount_amount || 0,
      status: invoice.invoice_status || invoice.status,
      due_date: invoice.due_date,
      issue_date: invoice.invoice_date || invoice.issue_date,
      line_items: lineItems,
      notes: invoice.notes,
      contacts: contact || {
        id: invoice.contact_id || null,
        first_name: 'Client',
        last_name: '',
        email_address: null,
        phone: null
      },
      // Include contract info if available
      contract: contract ? {
        id: contract.id,
        contract_number: contract.contract_number,
        status: contract.status,
        signing_token: contract.signing_token, // Needed for signing link
        signing_url: contract.signing_token ? 
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sign-contract/${contract.signing_token}` : 
          null
      } : null
    };

    res.status(200).json({
      success: true,
      invoice: safeInvoice
    });

  } catch (error) {
    console.error('[get-by-token] Unexpected error:', {
      error: error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    res.status(500).json({
      error: 'Failed to fetch invoice',
      message: error?.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
}

