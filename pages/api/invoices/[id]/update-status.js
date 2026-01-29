import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Update invoice status
 * Allows changing invoice status from Draft to Sent, Paid, etc.
 */
export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: invoiceId } = req.query;
  const {
    invoice_status,
    amount_paid,
    balance_due,
    paid_date,
    total_amount,
    line_items,
    clear_pricing_lock,
  } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch current invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Clear admin pricing lock when requested (allows quote sync to overwrite again)
    if (clear_pricing_lock === true) {
      updateData.admin_pricing_adjusted_at = null;
    }

    // Update invoice status if provided
    if (invoice_status !== undefined) {
      // Validate status value
      const validStatuses = ['Draft', 'Sent', 'Viewed', 'Paid', 'Partial', 'Overdue', 'Cancelled'];
      if (!validStatuses.includes(invoice_status)) {
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }

      // If marking as "Paid", validate that payment records exist (unless manually overriding)
      if (invoice_status === 'Paid' && !amount_paid) {
        // Check if payment records exist for this invoice
        const { data: payments, error: paymentsError } = await supabaseAdmin
          .from('payments')
          .select('id, total_amount')
          .eq('invoice_id', invoiceId)
          .eq('payment_status', 'Paid');

        if (paymentsError) {
          console.warn('Could not check payment records:', paymentsError);
        }

        // If no payment records exist and no manual amount_paid override, warn but allow (for retroactive corrections)
        if (!payments || payments.length === 0) {
          console.warn(`⚠️ Marking invoice ${invoiceId} as Paid without payment records. This should be verified.`);
          // Don't block, but log a warning - admin may be doing retroactive correction
        }
      }

      updateData.invoice_status = invoice_status;

      // Set sent_date if status is 'Sent'
      if (invoice_status === 'Sent' && !invoice.sent_date) {
        updateData.sent_date = new Date().toISOString();
      }

      // Set paid_date if status is 'Paid' and not already set
      if (invoice_status === 'Paid' && !invoice.paid_date) {
        updateData.paid_date = new Date().toISOString();
      }

      // Set cancelled_date if status is 'Cancelled' and not already set
      if (invoice_status === 'Cancelled' && !invoice.cancelled_date) {
        updateData.cancelled_date = new Date().toISOString();
      }
    }

    // Allow manual override of amount_paid and balance_due (for retroactive corrections)
    if (amount_paid !== undefined) {
      updateData.amount_paid = parseFloat(amount_paid);
    }

    if (balance_due !== undefined) {
      updateData.balance_due = parseFloat(balance_due);
    } else if (amount_paid !== undefined && invoice.total_amount !== undefined) {
      // Auto-calculate balance_due if amount_paid is provided but balance_due is not
      updateData.balance_due = parseFloat(invoice.total_amount) - parseFloat(amount_paid);
    }

    // Allow manual override of paid_date (for retroactive corrections)
    if (paid_date !== undefined) {
      updateData.paid_date = paid_date;
    }

    // Allow manual override of total_amount and line_items (negotiated/custom pricing)
    if (total_amount !== undefined && clear_pricing_lock !== true) {
      const parsed = parseFloat(total_amount);
      if (!isNaN(parsed) && parsed >= 0) {
        updateData.total_amount = parsed;
        updateData.subtotal = parsed;
        updateData.admin_pricing_adjusted_at = new Date().toISOString();
      }
    }
    if (line_items !== undefined && Array.isArray(line_items) && clear_pricing_lock !== true) {
      updateData.line_items = line_items;
      updateData.admin_pricing_adjusted_at = updateData.admin_pricing_adjusted_at || new Date().toISOString();
    }

    // When admin changes amount_paid (manual correction), mark pricing as adjusted so quote sync won't overwrite
    if (amount_paid !== undefined && clear_pricing_lock !== true) {
      updateData.admin_pricing_adjusted_at = updateData.admin_pricing_adjusted_at || new Date().toISOString();
    }

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabaseAdmin
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
      return res.status(500).json({
        error: 'Failed to update invoice status',
        details: updateError.message
      });
    }

    // When admin set custom pricing, keep quote in sync so client pages show correct total
    if (updateData.admin_pricing_adjusted_at && (total_amount !== undefined || amount_paid !== undefined)) {
      const { data: quoteForSync } = await supabaseAdmin
        .from('quote_selections')
        .select('id')
        .eq('invoice_id', invoiceId)
        .maybeSingle();
      if (quoteForSync && updatedInvoice?.total_amount != null) {
        await supabaseAdmin
          .from('quote_selections')
          .update({
            updated_at: new Date().toISOString(),
            is_custom_price: true,
            total_price: parseFloat(updatedInvoice.total_amount),
          })
          .eq('id', quoteForSync.id);
      }
    }

    // When clearing pricing lock, trigger quote->invoice sync by touching the quote row
    if (clear_pricing_lock === true) {
      const { data: quoteRow } = await supabaseAdmin
        .from('quote_selections')
        .select('id')
        .eq('invoice_id', invoiceId)
        .maybeSingle();
      if (quoteRow) {
        await supabaseAdmin
          .from('quote_selections')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', quoteRow.id);
      }
    }

    res.status(200).json({
      success: true,
      invoice: updatedInvoice,
      message: updateData.admin_pricing_adjusted_at
        ? 'Invoice updated; custom pricing is locked from quote overwrites.'
        : `Invoice status updated to ${invoice_status || 'saved'}`
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
}
