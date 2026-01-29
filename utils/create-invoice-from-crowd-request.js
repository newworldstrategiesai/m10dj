/**
 * Create Invoice from Crowd Request Payment
 * 
 * Automatically creates an invoice in the database when a crowd request payment succeeds.
 * This ensures all Stripe payments have corresponding invoices for accounting.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate invoice number
 */
async function generateInvoiceNumber(supabase) {
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
  
  // Get count of invoices this month
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `INV-${year}${month}%`);

  const sequenceNum = String((count || 0) + 1).padStart(3, '0');
  return `INV-${year}${month}-${sequenceNum}`;
}

/**
 * Find or create contact for crowd request
 */
async function findOrCreateContact(crowdRequest, supabase) {
  // Try to find existing contact by email or phone
  let contact = null;
  
  if (crowdRequest.requester_email) {
    const { data: emailContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('email_address', crowdRequest.requester_email)
      .is('deleted_at', null)
      .maybeSingle();
    
    if (emailContact) {
      contact = emailContact;
    }
  }
  
  // If not found by email, try phone
  if (!contact && crowdRequest.requester_phone) {
    const { data: phoneContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', crowdRequest.requester_phone)
      .is('deleted_at', null)
      .maybeSingle();
    
    if (phoneContact) {
      contact = phoneContact;
    }
  }
  
  // If still not found, create a new contact
  if (!contact) {
    // Get organization_id from crowd request or use default
    let organizationId = crowdRequest.organization_id;
    
    // If no organization_id, get the first organization
    if (!organizationId) {
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (defaultOrg) {
        organizationId = defaultOrg.id;
      }
    }
    
    // Parse name
    const nameParts = (crowdRequest.requester_name || 'Guest').trim().split(' ');
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const contactData = {
      first_name: firstName,
      last_name: lastName,
      email_address: crowdRequest.requester_email || null,
      phone: crowdRequest.requester_phone || null,
      organization_id: organizationId,
      lead_source: 'Crowd Request',
      lead_status: 'New',
      notes: `Created from crowd request: ${crowdRequest.request_type}`
    };
    
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating contact:', createError);
      return null;
    }
    
    contact = newContact;
  }
  
  return contact;
}

/**
 * Create invoice from crowd request payment
 * @param {string} requestId - The crowd_requests.id
 * @param {Object} paymentIntent - Stripe Payment Intent object
 * @param {Object} supabaseClient - Optional Supabase client
 * @returns {Object} Result with invoice info
 */
export async function createInvoiceFromCrowdRequest(requestId, paymentIntent, supabaseClient = null) {
  const supabase = supabaseClient || createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get the crowd request
    const { data: crowdRequest, error: requestError } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !crowdRequest) {
      return { success: false, error: 'Crowd request not found' };
    }

    // Song requests should NOT create invoices (they are tips/requests, not billable invoices)
    if (crowdRequest.request_type === 'song_request') {
      return { success: true, created: false, skip_reason: 'song_request' };
    }

    // Check if invoice already exists for this request
    if (crowdRequest.invoice_id) {
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id, invoice_status')
        .eq('id', crowdRequest.invoice_id)
        .single();

      if (existingInvoice) {
        // Update invoice status to Paid if payment succeeded
        if (paymentIntent.status === 'succeeded') {
          await supabase
            .from('invoices')
            .update({
              invoice_status: 'Paid',
              amount_paid: paymentIntent.amount / 100, // Convert from cents
              paid_date: new Date(paymentIntent.created * 1000).toISOString(),
              balance_due: 0
            })
            .eq('id', existingInvoice.id);
        }
        
        return { 
          success: true, 
          invoice_id: existingInvoice.id,
          created: false,
          invoice: existingInvoice
        };
      }
    }

    // Find or create contact
    const contact = await findOrCreateContact(crowdRequest, supabase);
    
    if (!contact) {
      return { success: false, error: 'Could not find or create contact' };
    }

    // Get organization_id
    let organizationId = crowdRequest.organization_id || contact.organization_id;
    
    if (!organizationId) {
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (defaultOrg) {
        organizationId = defaultOrg.id;
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase);
    
    // Calculate due date (already paid, so use payment date)
    const paymentDate = new Date(paymentIntent.created * 1000);
    const dueDate = new Date(paymentDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from payment

    // Build invoice title
    let invoiceTitle = 'Crowd Request Payment';
    if (crowdRequest.request_type === 'song_request') {
      invoiceTitle = `Song Request: ${crowdRequest.song_title || 'Song'}`;
      if (crowdRequest.song_artist) {
        invoiceTitle += ` by ${crowdRequest.song_artist}`;
      }
    } else if (crowdRequest.request_type === 'shoutout') {
      invoiceTitle = `Shoutout for ${crowdRequest.recipient_name || 'Recipient'}`;
    }

    // Build line items
    const lineItems = [{
      description: invoiceTitle,
      quantity: 1,
      rate: paymentIntent.amount / 100, // Convert from cents
      amount: paymentIntent.amount / 100,
      type: 'service'
    }];

    // Create invoice
    const invoiceData = {
      contact_id: contact.id,
      organization_id: organizationId,
      invoice_number: invoiceNumber,
      invoice_status: paymentIntent.status === 'succeeded' ? 'Paid' : 'Draft',
      invoice_title: invoiceTitle,
      invoice_description: `Payment for ${crowdRequest.request_type} via crowd request`,
      invoice_date: paymentDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal: paymentIntent.amount / 100,
      total_amount: paymentIntent.amount / 100,
      amount_paid: paymentIntent.status === 'succeeded' ? paymentIntent.amount / 100 : 0,
      balance_due: paymentIntent.status === 'succeeded' ? 0 : paymentIntent.amount / 100,
      paid_date: paymentIntent.status === 'succeeded' ? paymentDate.toISOString() : null,
      line_items: lineItems
    };

    const { data: newInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Update crowd request with invoice_id
    await supabase
      .from('crowd_requests')
      .update({ invoice_id: newInvoice.id })
      .eq('id', requestId);

    console.log(`✅ Created invoice ${newInvoice.id} for crowd request ${requestId}`);

    return { 
      success: true, 
      invoice_id: newInvoice.id,
      created: true,
      invoice: newInvoice
    };

  } catch (error) {
    console.error('Error in createInvoiceFromCrowdRequest:', error);
    return { success: false, error: error.message };
  }
}

