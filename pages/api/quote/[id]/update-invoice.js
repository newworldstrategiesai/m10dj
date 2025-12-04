import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { total_price, package_price, custom_line_items, custom_addons, is_custom_price, discount_type, discount_value, discount_note, show_line_item_prices, due_date_type, due_date, deposit_due_date, remaining_balance_due_date, payment_terms_type, number_of_payments, payment_schedule } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Quote ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, find the quote_selections record by lead_id (since id in URL is actually lead_id)
    const { data: existingQuote, error: findError } = await supabase
      .from('quote_selections')
      .select('id')
      .eq('lead_id', id)
      .single();

    if (findError || !existingQuote) {
      console.error('Error finding quote:', findError);
      return res.status(404).json({ 
        error: 'Quote not found', 
        details: findError?.message || 'No quote found for this lead'
      });
    }

    const quoteId = existingQuote.id;
    console.log('Found quote_selections ID:', quoteId, 'for lead_id:', id);

    // Update the quote_selections record
    const updateData = {
      total_price: total_price ? parseFloat(total_price) : null,
      package_price: package_price ? parseFloat(package_price) : null,
      is_custom_price: is_custom_price || false,
      updated_at: new Date().toISOString()
    };

    // If custom line items or addons are provided, store them
    if (custom_line_items) {
      updateData.custom_line_items = custom_line_items;
    }
    if (custom_addons) {
      updateData.custom_addons = custom_addons;
    }
    
    // Add discount fields - always include them, set to null if not provided
    // This ensures we can clear existing discounts
    if (discount_type && (discount_type === 'percentage' || discount_type === 'flat')) {
      updateData.discount_type = discount_type;
      updateData.discount_value = discount_value ? parseFloat(discount_value) : null;
      updateData.discount_note = discount_note || null;
    } else {
      // Clear discount if type is not provided or invalid
      updateData.discount_type = null;
      updateData.discount_value = null;
      updateData.discount_note = null;
    }
    
    // Add show_line_item_prices setting
    if (show_line_item_prices !== undefined) {
      updateData.show_line_item_prices = Boolean(show_line_item_prices);
    }
    
    // Add due date type and calculated due date
    if (due_date_type) {
      updateData.due_date_type = due_date_type;
    }
    if (due_date) {
      updateData.due_date = due_date;
    }
    
    // Add deposit and remaining balance due dates
    if (deposit_due_date !== undefined) {
      updateData.deposit_due_date = deposit_due_date;
    }
    if (remaining_balance_due_date !== undefined) {
      updateData.remaining_balance_due_date = remaining_balance_due_date;
    }
    
    // Add deposit and remaining balance due dates
    if (deposit_due_date !== undefined) {
      updateData.deposit_due_date = deposit_due_date;
    }
    if (remaining_balance_due_date !== undefined) {
      updateData.remaining_balance_due_date = remaining_balance_due_date;
    }

    console.log('Updating quote_selections with:', JSON.stringify(updateData, null, 2));
    console.log('Using quote_selections ID:', quoteId);
    
    const { data, error } = await supabase
      .from('quote_selections')
      .update(updateData)
      .eq('id', quoteId)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error hint:', error.hint);
      return res.status(500).json({ 
        error: 'Failed to update invoice', 
        details: error.message,
        code: error.code,
        hint: error.hint,
        fullError: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }

    if (!data) {
      console.error('No data returned from update');
      return res.status(404).json({ error: 'Quote not found' });
    }

    console.log('Invoice updated successfully:', data);
    
    // Update the actual invoice amount if invoice exists and total_price changed
    if (data.invoice_id && total_price) {
      try {
        const invoiceAmount = parseFloat(total_price);
        const { error: invoiceUpdateError } = await supabase
          .from('invoices')
          .update({
            subtotal: invoiceAmount,
            total_amount: invoiceAmount,
            balance_due: invoiceAmount, // Will be recalculated by trigger if amount_paid exists
            updated_at: new Date().toISOString()
          })
          .eq('id', data.invoice_id);
        
        if (invoiceUpdateError) {
          console.warn('⚠️ Could not update invoice amount:', invoiceUpdateError);
        } else {
          console.log(`✅ Updated invoice ${data.invoice_id} amount to ${invoiceAmount}`);
        }
      } catch (err) {
        console.warn('⚠️ Error updating invoice amount (non-critical):', err);
      }
    }
    
    // Ensure invoice and contract drafts exist (non-blocking, only if missing)
    // This handles cases where drafts weren't created initially
    (async () => {
      try {
        const { ensureInvoiceExists } = await import('../../../../utils/ensure-invoice-exists');
        const { ensureContractExists } = await import('../../../../utils/ensure-contract-exists');
        
        // Ensure invoice exists (only creates if missing)
        const invoiceResult = await ensureInvoiceExists(quoteId, supabase);
        if (invoiceResult.success && invoiceResult.created) {
          console.log(`✅ Created missing invoice draft for quote ${quoteId}`);
        }
        
        // Ensure contract exists (only creates if missing)
        const contractResult = await ensureContractExists(quoteId, supabase);
        if (contractResult.success && contractResult.created) {
          console.log(`✅ Created missing contract draft for quote ${quoteId}`);
        }
      } catch (err) {
        console.warn('⚠️ Error ensuring invoice/contract drafts exist (non-critical):', err);
        // Non-critical - quote is updated, drafts can be created later
      }
    })();
    
    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Return updated quote data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in update-invoice API:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

