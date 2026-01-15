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
  const { invoice_status } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  if (!invoice_status) {
    return res.status(400).json({ error: 'Invoice status is required' });
  }

  // Validate status value
  const validStatuses = ['Draft', 'Sent', 'Viewed', 'Paid', 'Partial', 'Overdue', 'Cancelled'];
  if (!validStatuses.includes(invoice_status)) {
    return res.status(400).json({ 
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
    });
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
      invoice_status: invoice_status,
      updated_at: new Date().toISOString()
    };

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
