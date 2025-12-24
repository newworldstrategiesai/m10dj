// Stripe webhook handler for payment intent events
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper to get raw body for Stripe webhook verification
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data, 'utf8'));
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  let rawBody;

  try {
    // Get raw body for signature verification
    rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabase);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object, supabase);
        break;

      case 'payment_intent.requires_capture':
        // Payment intent is ready to be captured (authorized)
        // This is expected for bidding - no action needed
        console.log(`✅ Payment intent ${event.data.object.id} requires capture (authorized)`);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent, supabase) {
  console.log(`✅ Payment intent ${paymentIntent.id} succeeded`);

  // Find the bid associated with this payment intent
  const { data: bid, error } = await supabase
    .from('bid_history')
    .select('*, bidding_rounds!inner(*)')
    .eq('payment_intent_id', paymentIntent.id)
    .single();

  if (error || !bid) {
    console.warn(`⚠️ No bid found for payment intent ${paymentIntent.id}`);
    return;
  }

  // Update bid status if it's not already charged
  if (bid.payment_status !== 'charged') {
    await supabase
      .from('bid_history')
      .update({ 
        payment_status: 'charged',
        is_winning_bid: true
      })
      .eq('id', bid.id);

    console.log(`✅ Updated bid ${bid.id} status to charged`);
  }
}

async function handlePaymentIntentFailed(paymentIntent, supabase) {
  console.error(`❌ Payment intent ${paymentIntent.id} failed`);

  // Find the bid associated with this payment intent
  const { data: bid, error } = await supabase
    .from('bid_history')
    .select('*, bidding_rounds!inner(*)')
    .eq('payment_intent_id', paymentIntent.id)
    .single();

  if (error || !bid) {
    console.warn(`⚠️ No bid found for payment intent ${paymentIntent.id}`);
    return;
  }

  // Update bid status to failed
  await supabase
    .from('bid_history')
    .update({ payment_status: 'failed' })
    .eq('id', bid.id);

  // Notify admin if this is a winning bid
  if (bid.is_winning_bid) {
    const { notifyAdminBiddingFailure } = require('../../../utils/bidding-notifications');
    await notifyAdminBiddingFailure(
      bid.bidding_round_id,
      bid.bidding_rounds.organization_id,
      `Payment failed for winning bid: ${paymentIntent.id}`,
      {
        bidId: bid.id,
        bidAmount: bid.bid_amount,
        paymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown'
      }
    );
  }

  console.log(`✅ Updated bid ${bid.id} status to failed`);
}

async function handlePaymentIntentCanceled(paymentIntent, supabase) {
  console.log(`ℹ️ Payment intent ${paymentIntent.id} was canceled`);

  // Find the bid associated with this payment intent
  const { data: bid, error } = await supabase
    .from('bid_history')
    .select('*')
    .eq('payment_intent_id', paymentIntent.id)
    .single();

  if (error || !bid) {
    return;
  }

  // Update bid status to refunded (authorization released)
  if (bid.payment_status === 'pending') {
    await supabase
      .from('bid_history')
      .update({ payment_status: 'refunded' })
      .eq('id', bid.id);

    console.log(`✅ Updated bid ${bid.id} status to refunded (canceled)`);
  }
}

// Disable body parsing for webhook (Stripe needs raw body)
export const config = {
  api: {
    bodyParser: false,
  },
}
