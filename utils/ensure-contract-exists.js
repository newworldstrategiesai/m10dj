/**
 * Ensure Contract Exists for Quote
 * 
 * Creates a draft contract if one doesn't exist for a quote_selections record.
 * This ensures contracts exist immediately when quotes are created, allowing
 * proper tracking of views, signatures, etc.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate a contract number based on contact/quote ID
 */
function generateContractNumberFromId(id) {
  if (!id || typeof id !== 'string') {
    return null;
  }
  // Use first 8 characters of ID (uppercase) for contract number
  // Format: CONT-XXXXXXXX
  return `CONT-${id.substring(0, 8).toUpperCase()}`;
}

/**
 * Ensure a contract exists for a quote_selections record
 * @param {string} quoteId - The quote_selections.id (which equals lead_id/contact_id)
 * @param {Object} supabaseClient - Optional Supabase client
 * @returns {Object} Result with contract info
 */
export async function ensureContractExists(quoteId, supabaseClient = null) {
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

    // Check if contract already exists
    if (quote.contract_id) {
      const { data: existingContract } = await supabase
        .from('contracts')
        .select('id, status')
        .eq('id', quote.contract_id)
        .single();

      if (existingContract) {
        return { 
          success: true, 
          contract_id: existingContract.id,
          created: false,
          contract: existingContract
        };
      }
    }

    // Get contact info (quote.contacts might be populated from the join)
    const contact = quote.contacts || (quote.lead_id ? await getContact(quote.lead_id, supabase) : null);
    
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Generate contract number
    const contractNumber = generateContractNumberFromId(quoteId) || 
      `CONT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Create draft contract
    const contractData = {
      contact_id: quote.lead_id,
      contract_number: contractNumber,
      contract_type: 'service_agreement',
      event_name: contact.event_type ? `${contact.first_name || ''} ${contact.last_name || ''} ${contact.event_type}`.trim() : null,
      event_type: contact.event_type || null,
      event_date: contact.event_date || null,
      event_time: contact.event_time || null,
      venue_name: contact.venue_name || null,
      venue_address: contact.venue_address || null,
      guest_count: contact.guest_count || null,
      total_amount: quote.total_price || 0,
      deposit_amount: (quote.total_price || 0) * 0.5,
      status: 'draft',
      contract_template: 'standard_service_agreement'
    };

    // Link invoice if it exists
    if (quote.invoice_id) {
      contractData.invoice_id = quote.invoice_id;
    }

    const { data: newContract, error: contractError } = await supabase
      .from('contracts')
      .insert([contractData])
      .select()
      .single();

    if (contractError) {
      console.error('Error creating contract:', contractError);
      return { success: false, error: contractError.message };
    }

    // Update quote_selections with contract_id
    await supabase
      .from('quote_selections')
      .update({ contract_id: newContract.id })
      .eq('lead_id', quoteId);

    console.log(`✅ Created draft contract ${newContract.id} for quote ${quoteId}`);

    return { 
      success: true, 
      contract_id: newContract.id,
      created: true,
      contract: newContract
    };

  } catch (error) {
    console.error('Error in ensureContractExists:', error);
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

