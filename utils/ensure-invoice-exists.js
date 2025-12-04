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
    console.log(`🔍 Looking for quote with lead_id: ${quoteId}`);
    
    // Get the quote_selections record (without join - we'll fetch contact separately)
    const { data: quote, error: quoteError } = await supabase
      .from('quote_selections')
      .select('*')
      .eq('lead_id', quoteId)
      .maybeSingle();

    if (quoteError) {
      console.error('❌ Error fetching quote:', quoteError);
      console.error('Quote error details:', JSON.stringify(quoteError, null, 2));
      return { success: false, error: quoteError.message };
    }

    let finalQuote = quote;
    
    if (!finalQuote) {
      console.warn(`⚠️ No quote_selections found for lead_id: ${quoteId}`);
      // Try to find by id instead (in case quoteId is actually a quote_selections.id)
      const { data: quoteById, error: quoteByIdError } = await supabase
        .from('quote_selections')
        .select('*')
        .eq('id', quoteId)
        .maybeSingle();
      
      if (quoteByIdError) {
        console.error('❌ Error fetching quote by id:', quoteByIdError);
        return { success: false, error: `Quote not found and error searching by id: ${quoteByIdError.message}` };
      }
      
      if (quoteById) {
        console.log(`✅ Found quote by id instead: ${quoteId}`);
        finalQuote = quoteById;
      } else {
        // No quote_selections exists - try to create one from the contact
        console.log(`📝 Creating quote_selections record for contact: ${quoteId}`);
        const contact = await getContact(quoteId, supabase);
        
        if (!contact) {
          return { success: false, error: `Contact not found for ID: ${quoteId}` };
        }
        
        // Create a minimal quote_selections record
        // Required fields: package_id, package_name, package_price, total_price
        const defaultPrice = contact.quoted_price || contact.final_price || 0;
        const { data: newQuote, error: createQuoteError } = await supabase
          .from('quote_selections')
          .insert([{
            lead_id: quoteId,
            package_id: 'manual', // Default package ID for manually created quotes
            package_name: contact.event_type ? `${contact.event_type.charAt(0).toUpperCase() + contact.event_type.slice(1)} Package` : 'Custom Package',
            package_price: defaultPrice,
            total_price: defaultPrice,
            status: 'pending', // Valid status: 'pending', 'confirmed', 'invoiced', 'paid', 'cancelled'
            addons: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select('*')
          .single();
        
        if (createQuoteError) {
          console.error('❌ Error creating quote_selections:', createQuoteError);
          return { success: false, error: `Failed to create quote_selections: ${createQuoteError.message}` };
        }
        
        console.log(`✅ Created quote_selections record: ${newQuote.id}`);
        finalQuote = newQuote;
      }
    }

    // Check if invoice already exists
    if (finalQuote.invoice_id) {
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id, invoice_status')
        .eq('id', finalQuote.invoice_id)
        .single();

      if (existingInvoice) {
        console.log(`✅ Invoice already exists: ${existingInvoice.id}`);
        return { 
          success: true, 
          invoice_id: existingInvoice.id,
          created: false,
          invoice: existingInvoice
        };
      }
    }

    // Get contact info (fetch separately since lead_id is not a foreign key)
    const contact = finalQuote.lead_id ? await getContact(finalQuote.lead_id, supabase) : null;
    
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Get organization_id from contact or contact's user
    let organizationId = contact.organization_id;
    
    // If contact doesn't have organization_id, try to get it from the user's organization
    if (!organizationId && contact.user_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', contact.user_id)
        .maybeSingle();
      
      if (org) {
        organizationId = org.id;
      }
    }
    
    // If still no organization_id, get the first organization (fallback for legacy data)
    if (!organizationId) {
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (defaultOrg) {
        organizationId = defaultOrg.id;
        console.warn(`⚠️ No organization found for contact ${contact.id}, using default organization ${organizationId}`);
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase);
    
    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Determine the correct total amount
    // Priority: 1. quote_selections.total_price (if set and > 0), 2. contact.quoted_price, 3. contact.final_price, 4. 0
    let invoiceTotal = 0;
    if (finalQuote.total_price && finalQuote.total_price > 0) {
      invoiceTotal = finalQuote.total_price;
      console.log(`💰 Using quote total_price: ${invoiceTotal}`);
    } else if (contact.quoted_price && contact.quoted_price > 0) {
      invoiceTotal = contact.quoted_price;
      console.log(`💰 Using contact quoted_price: ${invoiceTotal}`);
    } else if (contact.final_price && contact.final_price > 0) {
      invoiceTotal = contact.final_price;
      console.log(`💰 Using contact final_price: ${invoiceTotal}`);
    } else {
      console.warn(`⚠️ No price found in quote or contact, using 0. Invoice will need to be updated manually.`);
    }

    // Create draft invoice
    // Explicitly exclude 'id' to let database generate it
    const invoiceData = {
      contact_id: finalQuote.lead_id,
      organization_id: organizationId || null, // Set organization_id for multi-tenant support (can be null temporarily)
      invoice_number: invoiceNumber,
      invoice_status: 'Draft',
      invoice_title: `${contact.event_type || 'Event'} - ${contact.first_name || 'Client'} ${contact.last_name || ''}`.trim(),
      invoice_description: `Invoice for ${contact.event_type || 'event'} services`,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal: invoiceTotal,
      total_amount: invoiceTotal,
      balance_due: invoiceTotal,
      line_items: []
    };

    console.log('📝 Creating invoice with data:', {
      ...invoiceData,
      organization_id: organizationId || 'NULL (will be backfilled)'
    });

    // Explicitly construct the object without id to be absolutely sure
    // The database should auto-generate the UUID
    const cleanInvoiceData = {
      contact_id: invoiceData.contact_id,
      organization_id: invoiceData.organization_id,
      invoice_number: invoiceData.invoice_number,
      invoice_status: invoiceData.invoice_status,
      invoice_title: invoiceData.invoice_title,
      invoice_description: invoiceData.invoice_description,
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      subtotal: invoiceData.subtotal,
      total_amount: invoiceData.total_amount,
      balance_due: invoiceData.balance_due,
      line_items: invoiceData.line_items || []
    };

    console.log('📝 Clean invoice data (explicitly no id):', JSON.stringify(cleanInvoiceData, null, 2));

    const { data: newInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .insert([cleanInvoiceData])
      .select();
    
    // If successful, get the first (and should be only) invoice
    const newInvoice = newInvoices && newInvoices.length > 0 ? newInvoices[0] : null;
    
    if (newInvoice) {
      console.log('✅ Invoice created successfully with id:', newInvoice.id);
    }

    if (invoiceError) {
      console.error('❌ Error creating invoice:', invoiceError);
      console.error('Invoice error details:', JSON.stringify(invoiceError, null, 2));
      console.error('Invoice data attempted:', invoiceData);
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

