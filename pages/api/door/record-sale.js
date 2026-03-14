/**
 * POST /api/door/record-sale
 * Records a door ticket sale in event_tickets after successful payment.
 * Verifies payment via Stripe before inserting.
 */
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId, purchaser_phone } = req.body || {};

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'paymentIntentId is required' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment has not succeeded' });
    }

    const meta = pi.metadata || {};
    if (meta.type !== 'door_ticket') {
      return res.status(400).json({ error: 'Invalid payment type' });
    }

    const organizationId = meta.organization_id;
    const quantity = parseInt(meta.quantity || '1', 10);
    const priceCents = parseInt(meta.price_cents || '1500', 10);
    const purchaserName = meta.purchaser_name || 'Customer';
    const purchaserEmail = meta.purchaser_email || '';
    const qrCode = meta.qr_code || `door-${pi.id.slice(-12)}`;

    const pricePerTicket = priceCents / 100;
    const totalAmount = pricePerTicket * quantity;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: ticket, error } = await supabase
      .from('event_tickets')
      .insert({
        event_id: null,
        organization_id: organizationId,
        ticket_type: 'door',
        purchaser_name: purchaserName,
        purchaser_email: purchaserEmail,
        purchaser_phone: purchaser_phone || null,
        quantity,
        price_per_ticket: pricePerTicket,
        total_amount: totalAmount,
        stripe_payment_intent_id: paymentIntentId,
        payment_status: 'paid',
        payment_method: 'stripe',
        qr_code: qrCode,
      })
      .select('id, qr_code')
      .single();

    if (error) {
      console.error('[door/record-sale] insert error:', error);
      return res.status(500).json({ error: 'Failed to record sale' });
    }

    return res.status(200).json({
      success: true,
      ticketId: ticket.id,
      qrCode: ticket.qr_code,
    });
  } catch (err) {
    console.error('[door/record-sale]', err);
    return res.status(500).json({ error: err?.message || 'Failed to record sale' });
  }
}
