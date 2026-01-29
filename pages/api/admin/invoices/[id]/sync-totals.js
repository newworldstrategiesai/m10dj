/**
 * POST /api/admin/invoices/[id]/sync-totals
 *
 * Syncs an invoice with payments for the same contact: links payments that have
 * this invoice's contact_id but no (or wrong) invoice_id, then recalculates
 * amount_paid, balance_due, and invoice_status from the sum of linked payments.
 * Use this to fix an invoice (e.g. Marlee Cordo) after linking a deposit.
 */
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: invoiceId } = req.query;
  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, contact_id, total_amount, amount_paid, balance_due, invoice_status')
      .eq('id', invoiceId)
      .single();

    if (invError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const contactId = invoice.contact_id;
    if (!contactId) {
      return res.status(400).json({ error: 'Invoice has no contact_id' });
    }

    // Find all paid payments for this contact (with this invoice_id or no invoice_id)
    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('id, total_amount, invoice_id')
      .eq('contact_id', contactId)
      .in('payment_status', ['Paid', 'paid'])
      .or(`invoice_id.is.null,invoice_id.eq.${invoiceId}`);

    if (payError) {
      return res.status(500).json({ error: 'Failed to fetch payments', details: payError.message });
    }

    const paidList = payments || [];
    const toLink = paidList.filter((p) => p.invoice_id !== invoiceId);

    // Link payments that have no invoice_id to this invoice (don't unlink from other invoices)
    if (toLink.length > 0) {
      const { error: updateError } = await supabase
        .from('payments')
        .update({ invoice_id: invoiceId, updated_at: new Date().toISOString() })
        .eq('contact_id', contactId)
        .in('payment_status', ['Paid', 'paid'])
        .is('invoice_id', null);

      if (updateError) {
        return res.status(500).json({ error: 'Failed to link payments', details: updateError.message });
      }
    }

    // Re-fetch payments for this invoice (now including newly linked)
    const { data: allPayments } = await supabase
      .from('payments')
      .select('id, total_amount')
      .eq('invoice_id', invoiceId)
      .in('payment_status', ['Paid', 'paid']);
    const paidListForTotal = allPayments || paidList;

    // Recalculate amount_paid from all paid payments for this invoice
    const totalPaid = paidListForTotal.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
    const totalAmount = parseFloat(invoice.total_amount) || 0;
    const balanceDue = Math.max(0, totalAmount - totalPaid);
    let status = invoice.invoice_status;
    if (totalPaid >= totalAmount && totalAmount > 0) {
      status = 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partial';
    }

    const { error: invoiceUpdateError } = await supabase
      .from('invoices')
      .update({
        amount_paid: totalPaid,
        balance_due: balanceDue,
        invoice_status: status,
        paid_date: status === 'Paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (invoiceUpdateError) {
      return res.status(500).json({ error: 'Failed to update invoice totals', details: invoiceUpdateError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Invoice synced with payments',
      invoice_id: invoiceId,
      payments_linked: toLink.length,
      amount_paid: totalPaid,
      balance_due: balanceDue,
      invoice_status: status,
    });
  } catch (error) {
    console.error('Error in sync-totals:', error);
    return res.status(500).json({ error: 'Failed to sync invoice', message: error.message });
  }
}
