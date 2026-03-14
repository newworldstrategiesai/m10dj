/**
 * POST /api/door/record-sale
 * Records a door ticket sale in event_tickets after successful payment.
 * Verifies payment via Stripe before inserting.
 * Sends email receipt when purchaser_email is provided.
 */
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { createRateLimitMiddleware, getClientIp } from '@/utils/rate-limiter';
import { sendDoorTicketReceipt } from '@/lib/email/door-receipt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const rateLimiter = createRateLimitMiddleware({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (r) => getClientIp(r),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await rateLimiter(req, res);
  if (res.headersSent) return;

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

    // Idempotency: return existing ticket if already recorded (prevents duplicate tickets)
    const { data: existing } = await supabase
      .from('event_tickets')
      .select('id, qr_code')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        success: true,
        ticketId: existing.id,
        qrCode: existing.qr_code,
        existing: true,
      });
    }

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
      if (error.code === '23505') {
        // Unique violation - another request recorded it; fetch and return
        const { data: existing } = await supabase
          .from('event_tickets')
          .select('id, qr_code')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();
        if (existing) {
          return res.status(200).json({
            success: true,
            ticketId: existing.id,
            qrCode: existing.qr_code,
            existing: true,
          });
        }
      }
      console.error('[door/record-sale] insert error:', error);
      return res.status(500).json({ error: 'Failed to record sale' });
    }

    let receiptSent = false;
    if (purchaserEmail && purchaserEmail.trim()) {
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('name, door_settings')
          .eq('id', organizationId)
          .single();
        const venueDisplay = org?.door_settings?.venue_display || null;
        const emailResult = await sendDoorTicketReceipt({
          to: purchaserEmail.trim(),
          purchaserName: purchaserName || 'Customer',
          organizationName: meta.organization_name || org?.name || 'Event',
          venueDisplay: venueDisplay || undefined,
          quantity,
          totalAmount,
          qrCode: ticket.qr_code,
          ticketId: ticket.id,
        });
        receiptSent = emailResult.success;
      } catch (emailErr) {
        console.warn('[door/record-sale] Receipt email failed:', emailErr);
      }
    }

    return res.status(200).json({
      success: true,
      ticketId: ticket.id,
      qrCode: ticket.qr_code,
      receiptSent,
    });
  } catch (err) {
    console.error('[door/record-sale]', err);
    return res.status(500).json({ error: err?.message || 'Failed to record sale' });
  }
}
