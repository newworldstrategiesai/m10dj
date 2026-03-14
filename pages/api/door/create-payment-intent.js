/**
 * POST /api/door/create-payment-intent
 * Creates Stripe payment intent for door ticket purchase.
 * Validates amount against door_settings and returns clientSecret.
 */
import { createClient } from '@supabase/supabase-js';
import { createPaymentWithPlatformFee, calculatePlatformFee } from '@/utils/stripe/connect';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  const { organizationId, quantity = 1, purchaser_name, purchaser_email } = req.body || {};

  if (!organizationId || !purchaser_name || !purchaser_email) {
    return res.status(400).json({ error: 'organizationId, purchaser_name, and purchaser_email are required' });
  }

  if (quantity < 1 || quantity > 50) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 50' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, door_settings, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, platform_fee_percentage, platform_fee_fixed')
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

    if (!org.stripe_connect_account_id || !org.stripe_connect_charges_enabled || !org.stripe_connect_payouts_enabled) {
      return res.status(400).json({ error: 'Stripe Connect is not set up for this organization' });
    }

    const platformFeePct = org.platform_fee_percentage ?? 3.5;
    const platformFeeFixed = org.platform_fee_fixed ?? 0.30;
    const feeCalc = calculatePlatformFee(amountCents / 100, platformFeePct, platformFeeFixed);

    const qrCode = generateQrCode();

    const paymentIntent = await createPaymentWithPlatformFee(
      amountCents,
      org.stripe_connect_account_id,
      platformFeePct,
      platformFeeFixed,
      'tipjar'
    );

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        type: 'door_ticket',
        organization_id: org.id,
        organization_name: org.name,
        quantity: String(quantity),
        price_cents: String(priceCents),
        purchaser_name: (purchaser_name || '').substring(0, 200),
        purchaser_email: (purchaser_email || '').substring(0, 254),
        qr_code: qrCode,
      },
    });

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
