/**
 * Auto-Create Quote, Invoice, and Contract for New Contact
 * 
 * When a contact is created, automatically creates:
 * 1. A draft quote selection record
 * 2. A draft invoice
 * 3. A draft contract
 * 
 * All records start in "draft" status and are linked together
 * 
 * IMPORTANT: All records inherit organization_id from the contact
 * to maintain multi-tenant data isolation.
 * 
 * See ENTITY_RELATIONSHIPS.md for full documentation.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate a unique contract number
 * Format: CONT-YYYYMMDD-XXX (consistent with other contract creation paths)
 */
async function generateContractNumber(supabase, organizationId = null) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get count of contracts created today for sequence number
  // Scoped to organization if provided
  let query = supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString().slice(0, 10) + 'T00:00:00Z')
    .lt('created_at', today.toISOString().slice(0, 10) + 'T23:59:59Z');
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { count: todayCount } = await query;

  const sequenceNum = String((todayCount || 0) + 1).padStart(3, '0');
  return `CONT-${dateStr}-${sequenceNum}`;
}

/**
 * Auto-create quote, invoice, and contract for a new contact
 * @param {Object} contact - Contact record from database (must include organization_id for multi-tenant)
 * @param {Object} supabaseClient - Supabase client (optional, will create if not provided)
 * @returns {Object} Result with created records
 * 
 * @example
 * const results = await autoCreateQuoteInvoiceContract(contact);
 * // results.quote.id, results.invoice.id, results.contract.id
 */
export async function autoCreateQuoteInvoiceContract(contact, supabaseClient = null) {
  const supabase = supabaseClient || createClient(supabaseUrl, supabaseKey);
  
  const results = {
    quote: { success: false, id: null, error: null },
    invoice: { success: false, id: null, error: null },
    contract: { success: false, id: null, error: null }
  };

  // Extract organization_id for multi-tenant isolation
  const organizationId = contact.organization_id || null;
  
  // Extract initial pricing from contact if available
  const initialPrice = contact.quoted_price || 0;
  const depositAmount = contact.deposit_amount || (initialPrice * 0.5);

  try {
    console.log(`🔄 Auto-creating quote, invoice, and contract for contact: ${contact.id}`);
    if (organizationId) {
      console.log(`   Organization: ${organizationId}`);
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase, organizationId);
    
    // Generate contract number
    const contractNumber = await generateContractNumber(supabase, organizationId);

    // 1. Create Quote Selection (draft)
    try {
      console.log('📝 Creating draft quote selection...');
      const quoteData = {
        lead_id: contact.id,
        organization_id: organizationId, // Multi-tenant isolation
        package_id: 'pending', // Will be updated when customer selects
        package_name: 'Service Selection Pending',
        package_price: initialPrice,
        addons: [],
        total_price: initialPrice,
        deposit_amount: depositAmount,
        status: 'pending'
      };

      const { data: quote, error: quoteError } = await supabase
        .from('quote_selections')
        .insert([quoteData])
        .select()
        .single();

      if (quoteError) {
        console.error('❌ Error creating quote:', quoteError);
        results.quote.error = quoteError.message;
      } else {
        console.log('✅ Quote selection created:', quote.id);
        results.quote.success = true;
        results.quote.id = quote.id;
      }
    } catch (quoteErr) {
      console.error('❌ Exception creating quote:', quoteErr);
      results.quote.error = quoteErr.message;
    }

    // 2. Create Invoice (draft)
    try {
      console.log('💰 Creating draft invoice...');
      
      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Build client name safely
      const clientName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Client';
      
      const invoiceData = {
        contact_id: contact.id,
        organization_id: organizationId, // Multi-tenant isolation
        invoice_number: invoiceNumber,
        invoice_status: 'Draft',
        invoice_title: `${contact.event_type || 'Event'} - ${clientName}`.trim(),
        invoice_description: `Invoice for ${contact.event_type || 'event'} services`,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: initialPrice,
        total_amount: initialPrice,
        balance_due: initialPrice,
        line_items: initialPrice > 0 ? [
          {
            description: `${contact.event_type || 'DJ'} Services`,
            type: 'service',
            quantity: 1,
            rate: initialPrice,
            amount: initialPrice
          }
        ] : []
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) {
        console.error('❌ Error creating invoice:', invoiceError);
        results.invoice.error = invoiceError.message;
      } else {
        console.log('✅ Invoice created:', invoice.id);
        results.invoice.success = true;
        results.invoice.id = invoice.id;
        
        // Link invoice to quote if quote was created
        if (results.quote.success && results.quote.id) {
          await supabase
            .from('quote_selections')
            .update({ invoice_id: invoice.id })
            .eq('id', results.quote.id);
        }
      }
    } catch (invoiceErr) {
      console.error('❌ Exception creating invoice:', invoiceErr);
      results.invoice.error = invoiceErr.message;
    }

    // 3. Create Contract (draft)
    try {
      console.log('📄 Creating draft contract...');
      
      // Build event name from contact details
      const eventName = [
        contact.first_name,
        contact.last_name,
        '-',
        contact.event_type || 'Event'
      ].filter(Boolean).join(' ').trim();
      
      const contractData = {
        contact_id: contact.id,
        organization_id: organizationId, // Multi-tenant isolation
        invoice_id: results.invoice.success ? results.invoice.id : null,
        quote_selection_id: results.quote.success ? results.quote.id : null,
        contract_number: contractNumber,
        contract_type: 'service_agreement',
        event_name: eventName,
        event_type: contact.event_type || null,
        event_date: contact.event_date || null,
        event_time: contact.event_time || null,
        venue_name: contact.venue_name || null,
        venue_address: contact.venue_address || null,
        guest_count: contact.guest_count || null,
        total_amount: initialPrice,
        deposit_amount: depositAmount,
        deposit_percentage: 50, // 50% deposit default
        status: 'draft',
        contract_template: 'standard_service_agreement'
      };

      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single();

      if (contractError) {
        console.error('❌ Error creating contract:', contractError);
        results.contract.error = contractError.message;
      } else {
        console.log('✅ Contract created:', contract.id);
        results.contract.success = true;
        results.contract.id = contract.id;
        
        // Link contract to quote if quote was created
        if (results.quote.success && results.quote.id) {
          await supabase
            .from('quote_selections')
            .update({ contract_id: contract.id })
            .eq('id', results.quote.id);
        }
      }
    } catch (contractErr) {
      console.error('❌ Exception creating contract:', contractErr);
      results.contract.error = contractErr.message;
    }

    // Summary
    const allSuccess = results.quote.success && results.invoice.success && results.contract.success;
    const anySuccess = results.quote.success || results.invoice.success || results.contract.success;
    
    if (allSuccess) {
      console.log('✅ All records created successfully!');
      console.log(`   Quote: ${results.quote.id}`);
      console.log(`   Invoice: ${results.invoice.id}`);
      console.log(`   Contract: ${results.contract.id}`);
    } else if (anySuccess) {
      console.log('⚠️ Partial success - some records created:');
      if (results.quote.success) console.log(`   ✅ Quote: ${results.quote.id}`);
      if (results.invoice.success) console.log(`   ✅ Invoice: ${results.invoice.id}`);
      if (results.contract.success) console.log(`   ✅ Contract: ${results.contract.id}`);
      if (!results.quote.success) console.log(`   ❌ Quote failed: ${results.quote.error}`);
      if (!results.invoice.success) console.log(`   ❌ Invoice failed: ${results.invoice.error}`);
      if (!results.contract.success) console.log(`   ❌ Contract failed: ${results.contract.error}`);
    } else {
      console.error('❌ Failed to create any records');
    }

    return results;

  } catch (error) {
    console.error('❌ Fatal error in autoCreateQuoteInvoiceContract:', error);
    return results;
  }
}

/**
 * Generate invoice number using database function or manual generation
 * @param {Object} supabase - Supabase client
 * @param {string|null} organizationId - Organization ID for scoping (optional)
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

/**
 * Check if a contact already has linked records
 * @param {Object} supabase - Supabase client
 * @param {string} contactId - Contact ID
 * @returns {Object} { hasQuote, hasInvoice, hasContract }
 */
export async function checkExistingRecords(supabase, contactId) {
  const [quoteResult, invoiceResult, contractResult] = await Promise.all([
    supabase.from('quote_selections').select('id').eq('lead_id', contactId).limit(1),
    supabase.from('invoices').select('id').eq('contact_id', contactId).limit(1),
    supabase.from('contracts').select('id').eq('contact_id', contactId).neq('status', 'cancelled').limit(1)
  ]);
  
  return {
    hasQuote: quoteResult.data?.length > 0,
    hasInvoice: invoiceResult.data?.length > 0,
    hasContract: contractResult.data?.length > 0,
    quoteId: quoteResult.data?.[0]?.id || null,
    invoiceId: invoiceResult.data?.[0]?.id || null,
    contractId: contractResult.data?.[0]?.id || null
  };
}

/**
 * Ensure a contact has all required linked records
 * Only creates missing records, doesn't duplicate existing ones
 * @param {Object} contact - Contact record
 * @param {Object} supabaseClient - Supabase client (optional)
 * @returns {Object} Result with record IDs
 */
export async function ensureContactRecords(contact, supabaseClient = null) {
  const supabase = supabaseClient || createClient(supabaseUrl, supabaseKey);
  
  // Check what already exists
  const existing = await checkExistingRecords(supabase, contact.id);
  
  if (existing.hasQuote && existing.hasInvoice && existing.hasContract) {
    console.log(`✅ Contact ${contact.id} already has all records`);
    return {
      quote: { success: true, id: existing.quoteId, existed: true },
      invoice: { success: true, id: existing.invoiceId, existed: true },
      contract: { success: true, id: existing.contractId, existed: true }
    };
  }
  
  console.log(`⚠️ Contact ${contact.id} missing records, creating...`);
  return autoCreateQuoteInvoiceContract(contact, supabase);
}

