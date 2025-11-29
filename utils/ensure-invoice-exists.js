/**
 * Ensure Invoice Exists for Quote
 * 
 * Creates a draft invoice if one doesn't exist for a quote_selections record.
 * This ensures invoices exist immediately when quotes are created, allowing
 * proper tracking of payments, status, etc.
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
 * Ensure an invoice exists for a quote_selections record
 * @param {string} quoteId - The quote_selections.id (which equals lead_id/contact_id)
 * @param {Object} supabaseClient - Optional Supabase client
 * @returns {Object} Result with invoice info
 */
export async function ensureInvoiceExists(quoteId, supabaseClient = null) {
  const supabase = supabaseClient || createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get the quote_selections record
    const { data: quote, error: quoteError } = await supabase
      .from('quote_selections')
      .select('*, contacts:lead_id(*)')
      .eq('lead_id', quoteId)
      .maybeSingle();

    if (quoteError) {
      console.error('Error fetching quote:', quoteError);
      return { success: false, error: quoteError.message };
    }

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Check if invoice already exists
    if (quote.invoice_id) {
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id, invoice_status')
        .eq('id', quote.invoice_id)
        .single();

      if (existingInvoice) {
        return { 
          success: true, 
          invoice_id: existingInvoice.id,
          created: false,
          invoice: existingInvoice
        };
      }
    }

    // Get contact info (quote.contacts might be populated from the join)
    const contact = quote.contacts || (quote.lead_id ? await getContact(quote.lead_id, supabase) : null);
    
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase);
    
    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create draft invoice
    const invoiceData = {
      contact_id: quote.lead_id,
      invoice_number: invoiceNumber,
      invoice_status: 'Draft',
      invoice_title: `${contact.event_type || 'Event'} - ${contact.first_name || 'Client'} ${contact.last_name || ''}`.trim(),
      invoice_description: `Invoice for ${contact.event_type || 'event'} services`,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal: quote.total_price || 0,
      total_amount: quote.total_price || 0,
      balance_due: quote.total_price || 0,
      line_items: []
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

    // Update quote_selections with invoice_id
    await supabase
      .from('quote_selections')
      .update({ invoice_id: newInvoice.id })
      .eq('lead_id', quoteId);

    console.log(`✅ Created draft invoice ${newInvoice.id} for quote ${quoteId}`);

    return { 
      success: true, 
      invoice_id: newInvoice.id,
      created: true,
      invoice: newInvoice
    };

  } catch (error) {
    console.error('Error in ensureInvoiceExists:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get contact by ID
 */
async function getContact(contactId, supabase) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .is('deleted_at', null)
    .single();

  if (error) {
    return null;
  }

  return data;
}

