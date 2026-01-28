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
  const { invoice_status, amount_paid, balance_due, paid_date } = req.body;

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

    res.status(200).json({
      success: true,
      invoice: updatedInvoice,
      message: `Invoice status updated to ${invoice_status}`
    });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
}
