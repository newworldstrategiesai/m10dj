/**
 * Auto-Create Quote, Invoice, and Contract for New Contact
 * 
 * When a contact is created, automatically creates:
 * 1. A draft quote selection record
 * 2. A draft invoice
 * 3. A draft contract
 * 
 * All records start in "draft" status and are linked together
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate a unique contract number
 */
function generateContractNumber() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CONTRACT-${year}${month}-${random}`;
}

/**
 * Auto-create quote, invoice, and contract for a new contact
 * @param {Object} contact - Contact record from database
 * @param {Object} supabase - Supabase client (optional, will create if not provided)
 * @returns {Object} Result with created records
 */
export async function autoCreateQuoteInvoiceContract(contact, supabaseClient = null) {
  const supabase = supabaseClient || createClient(supabaseUrl, supabaseKey);
  
  const results = {
    quote: { success: false, id: null, error: null },
    invoice: { success: false, id: null, error: null },
    contract: { success: false, id: null, error: null }
  };

  try {
    console.log(`🔄 Auto-creating quote, invoice, and contract for contact: ${contact.id}`);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(supabase);
    
    // Generate contract number
    const contractNumber = generateContractNumber();

    // 1. Create Quote Selection (draft)
    try {
      console.log('📝 Creating draft quote selection...');
      const quoteData = {
        lead_id: contact.id,
        package_id: 'pending', // Will be updated when customer selects
        package_name: 'Service Selection Pending',
        package_price: 0,
        addons: [],
        total_price: 0,
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
      
      const invoiceData = {
        contact_id: contact.id,
        invoice_number: invoiceNumber,
        invoice_status: 'Draft',
        invoice_title: `${contact.event_type || 'Event'} - ${contact.first_name || 'Client'} ${contact.last_name || ''}`.trim(),
        invoice_description: `Invoice for ${contact.event_type || 'event'} services`,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: 0,
        total_amount: 0,
        balance_due: 0,
        line_items: []
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
      
      const contractData = {
        contact_id: contact.id,
        invoice_id: results.invoice.success ? results.invoice.id : null,
        contract_number: contractNumber,
        contract_type: 'service_agreement',
        event_name: contact.event_type ? `${contact.first_name || ''} ${contact.last_name || ''} ${contact.event_type}`.trim() : null,
        event_type: contact.event_type || null,
        event_date: contact.event_date || null,
        event_time: contact.event_time || null,
        venue_name: contact.venue_name || null,
        venue_address: contact.venue_address || null,
        guest_count: contact.guest_count || null,
        total_amount: 0,
        deposit_amount: 0,
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

