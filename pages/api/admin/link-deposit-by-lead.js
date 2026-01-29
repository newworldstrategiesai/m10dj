/**
 * POST /api/admin/link-deposit-by-lead
 *
 * Links a Stripe deposit payment to a lead. Use when a deposit was paid but
 * didn't get recorded (e.g. webhook missed, or manual link needed).
 *
 * Body:
 *   - lead_id (required): contact/lead UUID, e.g. c082f6bd-d63c-4c23-992d-caa68c299017
 *   - payment_intent_id (optional): Stripe Payment Intent ID (pi_xxx). If omitted,
 *     we search Stripe for the most recent succeeded PaymentIntent with this lead_id in metadata.
 *
 * Returns: same shape as /api/admin/verify-payment (payment record + quote_selections updated).
 */
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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

  const { lead_id, payment_intent_id } = req.body || {};

  if (!lead_id) {
    return res.status(400).json({ error: 'lead_id is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    let paymentIntent;

    if (payment_intent_id) {
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    } else {
      // Search Stripe for succeeded PaymentIntents with this lead_id in metadata
      const searchQuery = `metadata["lead_id"]:"${lead_id}" AND status:"succeeded"`;
      let searchResults;
      try {
        searchResults = await stripe.paymentIntents.search({
          query: searchQuery,
          limit: 20,
        });
      } catch (searchErr) {
        return res.status(500).json({
          error: 'Stripe search failed',
          message: searchErr.message,
          hint: 'You can pass payment_intent_id (pi_xxx) from Stripe Dashboard instead.',
        });
      }

      const candidates = searchResults?.data || [];
      if (candidates.length === 0) {
        return res.status(404).json({
          error: 'No succeeded payment found in Stripe for this lead_id',
          lead_id,
          hint: 'Check Stripe Dashboard → Payments and pass payment_intent_id (pi_xxx) in the request body.',
        });
      }

      // Sort by created desc (most recent first)
      candidates.sort((a, b) => (b.created || 0) - (a.created || 0));
      // Find which candidate PIs are already linked (payment_notes contains "Stripe Payment Intent: pi_xxx")
      const { data: existingPayments } = await supabaseAdmin
        .from('payments')
        .select('payment_notes')
        .not('payment_notes', 'is', null);
      const alreadyLinkedIds = new Set(
        (existingPayments || []).map((p) => {
          const m = p.payment_notes?.match(/pi_[a-zA-Z0-9]+/);
          return m ? m[0] : null;
        }).filter(Boolean)
      );
      paymentIntent = candidates.find((pi) => !alreadyLinkedIds.has(pi.id)) || candidates[0];
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: `Payment intent status is ${paymentIntent.status}, not succeeded`,
        status: paymentIntent.status,
      });
    }

    const payment_intent_id_used = paymentIntent.id;
    const paymentAmount = paymentIntent.amount / 100;
    const paymentType = paymentIntent.metadata?.payment_type || 'deposit';
    const leadIdFromMeta = paymentIntent.metadata?.lead_id || paymentIntent.metadata?.leadId || lead_id;

    // Resolve contact_id from lead_id
    let contactId = leadIdFromMeta;
    const { data: quoteSelection } = await supabaseAdmin
      .from('quote_selections')
      .select('contact_submission_id')
      .eq('lead_id', leadIdFromMeta)
      .maybeSingle();

    if (quoteSelection?.contact_submission_id) {
      const { data: submission } = await supabaseAdmin
        .from('contact_submissions')
        .select('contact_id')
        .eq('id', quoteSelection.contact_submission_id)
        .maybeSingle();
      if (submission?.contact_id) {
        contactId = submission.contact_id;
      }
    }

    // Skip if payment record already exists
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('payment_notes', `Stripe Payment Intent: ${payment_intent_id_used}`)
      .maybeSingle();

    if (existingPayment) {
      return res.status(200).json({
        message: 'Payment already linked',
        payment_id: existingPayment.id,
        payment_intent_id: payment_intent_id_used,
        lead_id: leadIdFromMeta,
        contact_id: contactId,
      });
    }

    const paymentRecord = {
      contact_id: contactId,
      payment_name: paymentType === 'deposit' ? 'Deposit' : 'Full Payment',
      total_amount: paymentAmount,
      payment_status: 'Paid',
      payment_method: 'Credit Card',
      transaction_date: new Date(paymentIntent.created * 1000).toISOString().split('T')[0],
      payment_notes: `Stripe Payment Intent: ${payment_intent_id_used}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newPayment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();

    if (paymentError) {
      return res.status(500).json({
        error: 'Failed to create payment record',
        details: paymentError.message,
      });
    }

    await supabaseAdmin
      .from('quote_selections')
      .update({
        payment_status: paymentType === 'full' ? 'paid' : 'partial',
        payment_intent_id: payment_intent_id_used,
        deposit_amount: paymentType === 'deposit' ? paymentAmount : null,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('lead_id', leadIdFromMeta);

    // Link payment to invoice if this lead has an invoice (so it shows on invoice page and totals stay correct)
    const { data: quoteRow } = await supabaseAdmin
      .from('quote_selections')
      .select('invoice_id')
      .eq('lead_id', leadIdFromMeta)
      .not('invoice_id', 'is', null)
      .maybeSingle();

    let invoiceIdLinked = null;
    if (quoteRow?.invoice_id) {
      await supabaseAdmin
        .from('payments')
        .update({ invoice_id: quoteRow.invoice_id, updated_at: new Date().toISOString() })
        .eq('id', newPayment.id);

      const { data: inv } = await supabaseAdmin
        .from('invoices')
        .select('total_amount, amount_paid')
        .eq('id', quoteRow.invoice_id)
        .single();
      const totalAmount = parseFloat(inv?.total_amount) || 0;
      const previousPaid = parseFloat(inv?.amount_paid) || 0;
      const newAmountPaid = previousPaid + paymentAmount;
      const balanceDue = Math.max(0, totalAmount - newAmountPaid);
      const status = newAmountPaid >= totalAmount && totalAmount > 0 ? 'Paid' : 'Partial';
      await supabaseAdmin
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          balance_due: balanceDue,
          invoice_status: status,
          paid_date: status === 'Paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteRow.invoice_id);
      invoiceIdLinked = quoteRow.invoice_id;
    }

    return res.status(200).json({
      message: 'Deposit linked successfully',
      payment: newPayment,
      payment_intent_id: payment_intent_id_used,
      amount: paymentAmount,
      payment_type: paymentType,
      lead_id: leadIdFromMeta,
      contact_id: contactId,
      invoice_id: invoiceIdLinked,
    });
  } catch (error) {
    console.error('Error in link-deposit-by-lead:', error);
    return res.status(500).json({
      error: 'Failed to link deposit',
      message: error.message,
    });
  }
}
