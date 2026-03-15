/**
 * POST /api/door/record-venmo-sale
 * Creates a pending door ticket for Venmo payment.
 * Customer pays via Venmo; staff marks as paid when payment is received.
 * Body: { organizationId, quantity, priceCents, purchaserName, purchaserEmail?, purchaserPhone? }
 */
import { createClient } from '@supabase/supabase-js';
import { createRateLimitMiddleware, getClientIp } from '@/utils/rate-limiter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const rateLimiter = createRateLimitMiddleware({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (r) => getClientIp(r),
});

function generateQrCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'door-';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generatePaymentCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'DT-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await rateLimiter(req, res);
  if (res.headersSent) return;

  const { organizationId, quantity = 1, priceCents, purchaserName, purchaserEmail, purchaserPhone } = req.body || {};

  if (!organizationId || !priceCents) {
    return res.status(400).json({ error: 'organizationId and priceCents are required' });
  }

  const qty = Math.max(1, Math.min(50, parseInt(quantity, 10) || 1));
  const cents = Math.round(Math.max(50, Math.min(99999, parseInt(priceCents, 10) || 1500)));
  const name = (purchaserName || '').trim() || 'Walk-up';
  const email = (purchaserEmail || '').trim() || '';
  const phone = (purchaserPhone || '').trim() || null;

  const pricePerTicket = cents / 100;
  const totalAmount = pricePerTicket * qty;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, door_settings, requests_venmo_username')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const ds = org.door_settings || {};
    if (ds.enabled !== true) {
      return res.status(400).json({ error: 'Door ticket sales are not enabled' });
    }

    const maxQty = ds.max_quantity_per_transaction ?? 10;
    if (qty > maxQty) {
      return res.status(400).json({ error: `Maximum ${maxQty} tickets per transaction` });
    }

    if (!org.requests_venmo_username) {
      return res.status(400).json({ error: 'Venmo is not configured for this organization' });
    }

    const qrCode = generateQrCode();
    const paymentCode = generatePaymentCode();

    const { data: ticket, error } = await supabase
      .from('event_tickets')
      .insert({
        event_id: null,
        organization_id: organizationId,
        ticket_type: 'door',
        purchaser_name: name,
        purchaser_email: email || 'walk-up@door.local',
        purchaser_phone: phone,
        quantity: qty,
        price_per_ticket: pricePerTicket,
        total_amount: totalAmount,
        stripe_payment_intent_id: null,
        payment_status: 'pending',
        payment_method: 'venmo',
        qr_code: qrCode,
        notes: `Venmo pending. Code: ${paymentCode}`,
      })
      .select('id, qr_code')
      .single();

    if (error) {
      console.error('[door/record-venmo-sale]', error);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

    return res.status(200).json({
      success: true,
      ticketId: ticket.id,
      qrCode: ticket.qr_code,
      paymentCode,
      totalAmount,
    });
  } catch (err) {
    console.error('[door/record-venmo-sale]', err);
    return res.status(500).json({ error: err?.message || 'Failed to create ticket' });
  }
}
