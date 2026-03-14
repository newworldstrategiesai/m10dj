/**
 * POST /api/door/create-payment-intent
 * Creates Stripe payment intent for door ticket purchase.
 * Validates amount against door_settings and returns clientSecret.
 */
import { createClient } from '@supabase/supabase-js';
import { createPaymentWithPlatformFee, calculatePlatformFee } from '@/utils/stripe/connect';
import { getStripeInstance } from '@/utils/stripe/config';
import { createRateLimitMiddleware, getClientIp } from '@/utils/rate-limiter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const rateLimiter = createRateLimitMiddleware({
  maxRequests: 15,
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await rateLimiter(req, res);
  if (res.headersSent) return;

  const { organizationId, quantity = 1, purchaser_name, purchaser_email } = req.body || {};

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  // Name and email optional for walk-up; use placeholders when empty
  const name = (purchaser_name || '').trim() || 'Walk-up';
  const email = (purchaser_email || '').trim() || '';

  if (quantity < 1 || quantity > 50) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 50' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, door_settings, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, platform_fee_percentage, platform_fee_fixed, is_platform_owner')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const ds = org.door_settings || {};
    if (!ds.enabled) {
      return res.status(400).json({ error: 'Door ticket sales are not enabled for this organization' });
    }

    const priceCents = ds.price_cents ?? 1500;
    const maxQty = ds.max_quantity_per_transaction ?? 10;
    if (quantity > maxQty) {
      return res.status(400).json({ error: `Maximum ${maxQty} tickets per transaction` });
    }

    const amountCents = priceCents * quantity;
    if (amountCents < 50) {
      return res.status(400).json({ error: 'Minimum charge is $0.50' });
    }

    const hasConnectAccount = org.stripe_connect_account_id &&
      org.stripe_connect_charges_enabled &&
      org.stripe_connect_payouts_enabled;
    const isPlatformOwner = org.is_platform_owner === true;

    if (!hasConnectAccount && !isPlatformOwner) {
      return res.status(400).json({ error: 'Stripe Connect is not set up for this organization' });
    }

    const platformFeePct = org.platform_fee_percentage ?? 3.5;
    const platformFeeFixed = org.platform_fee_fixed ?? 0.30;
    const feeCalc = calculatePlatformFee(amountCents / 100, platformFeePct, platformFeeFixed);

    const qrCode = generateQrCode();

    let paymentIntent;
    if (hasConnectAccount) {
      paymentIntent = await createPaymentWithPlatformFee(
        amountCents,
        org.stripe_connect_account_id,
        platformFeePct,
        platformFeeFixed,
        'tipjar'
      );
    } else {
      // Platform owner: payment goes to platform account (no Connect required)
      const stripeInstance = getStripeInstance('tipjar');
      if (!stripeInstance) {
        return res.status(500).json({ error: 'Stripe is not configured' });
      }
      paymentIntent = await stripeInstance.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        payment_method_types: ['card', 'cashapp'],
        metadata: {
          type: 'door_ticket',
          organization_id: org.id,
          organization_name: org.name,
          quantity: String(quantity),
          price_cents: String(priceCents),
          purchaser_name: name.substring(0, 200),
          purchaser_email: email.substring(0, 254),
          qr_code: qrCode,
        },
        ...(email && { receipt_email: email }),
      });
    }

    const stripeInstance = getStripeInstance('tipjar');
    if (!stripeInstance) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }
    const updatePayload = {
      metadata: {
        type: 'door_ticket',
        organization_id: org.id,
        organization_name: org.name,
        quantity: String(quantity),
        price_cents: String(priceCents),
        purchaser_name: name.substring(0, 200),
        purchaser_email: email.substring(0, 254),
        qr_code: qrCode,
      },
    };
    if (email) {
      updatePayload.receipt_email = email;
    }
    if (hasConnectAccount) {
      await stripeInstance.paymentIntents.update(paymentIntent.id, updatePayload);
    }

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountCents,
      quantity,
      priceCents,
      qrCode,
      feeCalculation: {
        totalAmount: amountCents / 100,
        platformFee: feeCalc.feeAmount,
        payoutAmount: feeCalc.payoutAmount,
      },
    });
  } catch (err) {
    console.error('[door/create-payment-intent]', err);
    return res.status(500).json({
      error: err?.message || 'Failed to create payment',
    });
  }
}
