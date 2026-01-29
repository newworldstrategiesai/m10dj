/**
 * GET /api/invoices/[id]/stripe-payment-details
 * Returns Stripe payment details for an invoice (session, charge, receipt_url, etc.)
 * Admin only. Used to display payment time, amount, and receipt link on invoice page.
 */
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice with Stripe IDs; also get from payments table (multiple payments possible)
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, stripe_session_id, stripe_payment_intent, contact_id')
      .eq('id', invoiceId)
      .single();

    if (invError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get all payments for this invoice that have Stripe IDs
    const { data: payments } = await supabase
      .from('payments')
      .select('id, stripe_session_id, stripe_payment_intent, total_amount, gratuity, transaction_date, payment_notes')
      .eq('invoice_id', invoiceId)
      .eq('payment_status', 'Paid')
      .order('transaction_date', { ascending: false });

    const stripeDetails = [];
    const seenCharges = new Set();

    // Collect unique session/payment_intent IDs (from invoice or payments)
    const sessionIds = new Set();
    const paymentIntentIds = new Set();
    if (invoice.stripe_session_id) sessionIds.add(invoice.stripe_session_id);
    if (invoice.stripe_payment_intent) paymentIntentIds.add(invoice.stripe_payment_intent);
    (payments || []).forEach((p) => {
      if (p.stripe_session_id) sessionIds.add(p.stripe_session_id);
      if (p.stripe_payment_intent) paymentIntentIds.add(p.stripe_payment_intent);
    });

    for (const sessionId of sessionIds) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['payment_intent', 'payment_intent.latest_charge'],
        });
        const pi = session.payment_intent;
        if (!pi || typeof pi === 'string') continue;
        const charge = pi.latest_charge;
        if (!charge || typeof charge === 'string') continue;
        const chargeId = charge.id || charge;
        if (seenCharges.has(chargeId)) continue;
        seenCharges.add(chargeId);

        const chargeObj = typeof charge === 'object' ? charge : await stripe.charges.retrieve(chargeId);
        const customerEmail = session.customer_email || session.customer_details?.email || chargeObj?.billing_details?.email || null;
        const paidAt = chargeObj.created ? new Date(chargeObj.created * 1000).toISOString() : null;
        const amount = session.amount_total != null ? session.amount_total / 100 : (chargeObj.amount / 100);
        const card = chargeObj.payment_method_details?.card;

        stripeDetails.push({
          session_id: sessionId,
          payment_intent_id: pi.id,
          charge_id: chargeId,
          amount,
          currency: session.currency || 'usd',
          paid_at: paidAt,
          receipt_url: chargeObj.receipt_url || null,
          receipt_email: chargeObj.receipt_email || customerEmail,
          customer_email: customerEmail,
          payment_method: card ? `${card.brand} •••• ${card.last4}` : 'Card',
          status: session.payment_status || chargeObj.status,
        });
      } catch (e) {
        console.warn('Stripe session retrieve error:', e.message);
      }
    }

    // If we only have payment_intent IDs (no session), fetch by payment intent
    for (const piId of paymentIntentIds) {
      if (stripeDetails.some((d) => d.payment_intent_id === piId)) continue;
      try {
        const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] });
        const charge = pi.latest_charge;
        if (!charge) continue;
        const chargeId = typeof charge === 'string' ? charge : charge.id;
        if (seenCharges.has(chargeId)) continue;
        seenCharges.add(chargeId);

        const chargeObj = typeof charge === 'object' ? charge : await stripe.charges.retrieve(chargeId);
        const paidAt = chargeObj.created ? new Date(chargeObj.created * 1000).toISOString() : null;
        const card = chargeObj.payment_method_details?.card;

        stripeDetails.push({
          session_id: null,
          payment_intent_id: pi.id,
          charge_id: chargeId,
          amount: chargeObj.amount / 100,
          currency: chargeObj.currency || 'usd',
          paid_at: paidAt,
          receipt_url: chargeObj.receipt_url || null,
          receipt_email: chargeObj.receipt_email || chargeObj.billing_details?.email || null,
          customer_email: chargeObj.billing_details?.email || null,
          payment_method: card ? `${card.brand} •••• ${card.last4}` : 'Card',
          status: chargeObj.status,
        });
      } catch (e) {
        console.warn('Stripe payment intent retrieve error:', e.message);
      }
    }

    // Sort by paid_at descending
    stripeDetails.sort((a, b) => (b.paid_at || '').localeCompare(a.paid_at || ''));

    return res.status(200).json({
      success: true,
      invoice_id: invoiceId,
      payments: stripeDetails,
    });
  } catch (error) {
    console.error('Error fetching Stripe payment details:', error);
    return res.status(500).json({
      error: 'Failed to fetch payment details',
      message: error.message,
    });
  }
}
