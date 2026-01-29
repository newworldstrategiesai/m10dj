/**
 * POST /api/invoices/[id]/send-receipt
 * Sends the Stripe payment receipt to the customer.
 * Uses Stripe's Charge update: setting receipt_email triggers Stripe to send the receipt email.
 * Admin only. Optional body: { charge_id?, email? } to target a specific charge or override email.
 */
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
  const { charge_id: chargeIdFromBody, email: emailOverride } = req.body || {};

  if (!invoiceId) {
    return res.status(400).json({ error: 'Invoice ID is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice and contact email
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, stripe_session_id, stripe_payment_intent, contact_id')
      .eq('id', invoiceId)
      .single();

    if (invError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    let contactEmail = emailOverride;
    if (!contactEmail && invoice.contact_id) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('email_address')
        .eq('id', invoice.contact_id)
        .single();
      contactEmail = contact?.email_address || null;
    }

    if (!contactEmail) {
      return res.status(400).json({
        error: 'No email address for this invoice. Add a contact email or pass "email" in the request body.',
      });
    }

    let chargeId = chargeIdFromBody;

    if (!chargeId) {
      // Resolve charge from session or payment intent
      if (invoice.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(invoice.stripe_session_id, {
          expand: ['payment_intent.latest_charge'],
        });
        const pi = session.payment_intent;
        if (pi?.latest_charge) {
          chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge.id;
        }
      }
      if (!chargeId && invoice.stripe_payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(invoice.stripe_payment_intent, {
          expand: ['latest_charge'],
        });
        if (pi.latest_charge) {
          chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge.id;
        }
      }
      // If invoice has multiple payments, use first payment's Stripe charge
      if (!chargeId) {
        const { data: payments } = await supabase
          .from('payments')
          .select('stripe_session_id, stripe_payment_intent')
          .eq('invoice_id', invoiceId)
          .eq('payment_status', 'Paid')
          .order('transaction_date', { ascending: false })
          .limit(1);
        const p = payments?.[0];
        if (p?.stripe_session_id) {
          const session = await stripe.checkout.sessions.retrieve(p.stripe_session_id, {
            expand: ['payment_intent.latest_charge'],
          });
          const pi = session.payment_intent;
          if (pi?.latest_charge) {
            chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge.id;
          }
        }
        if (!chargeId && p?.stripe_payment_intent) {
          const pi = await stripe.paymentIntents.retrieve(p.stripe_payment_intent, { expand: ['latest_charge'] });
          if (pi.latest_charge) {
            chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge.id;
          }
        }
      }
    }

    if (!chargeId) {
      return res.status(400).json({
        error: 'No Stripe charge found for this invoice. Receipt can only be sent for Stripe Checkout payments.',
      });
    }

    // Updating the charge's receipt_email causes Stripe to send the receipt to that email
    await stripe.charges.update(chargeId, {
      receipt_email: contactEmail,
    });

    return res.status(200).json({
      success: true,
      message: 'Receipt sent successfully',
      sent_to: contactEmail,
      charge_id: chargeId,
    });
  } catch (error) {
    console.error('Error sending receipt:', error);
    return res.status(500).json({
      error: 'Failed to send receipt',
      message: error.message,
    });
  }
}
