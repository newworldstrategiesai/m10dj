// Stripe webhook handler for automatic payment processing
// This ensures payments are always processed even if the user doesn't visit the success page
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Get raw body for signature verification
  let rawBody;
  let event;

  try {
    rawBody = await getRawBody(req);
    
    // Verify webhook signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured - parsing JSON without verification');
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`📥 Received Stripe webhook: ${event.type} (ID: ${event.id})`);
  console.log(`   Event data:`, JSON.stringify({
    type: event.type,
    id: event.id,
    livemode: event.livemode,
    created: new Date(event.created * 1000).toISOString(),
    request_id: event.data?.object?.metadata?.request_id || event.data?.object?.request_id,
    payment_intent_id: event.data?.object?.payment_intent || event.data?.object?.id,
  }, null, 2));

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, supabase);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object, supabase);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object, supabase);
        break;

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object, supabase);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    // Still return 200 to prevent Stripe from retrying (we'll handle retries ourselves)
    return res.status(200).json({ 
      received: true, 
      error: error.message 
    });
  }
}

// Handle checkout session completion
async function handleCheckoutSessionCompleted(session, supabase) {
  console.log(`✅ Processing checkout.session.completed for session ${session.id}`);

  // Handle live stream tips
  if (session.metadata?.type === 'live_stream_tip') {
    const { broadcastTipToLiveStream } = await import('../../../lib/livekit-tip-broadcast');
    const streamerUserId = session.metadata.streamer_user_id;
    const tipperName = session.metadata.tipper_name || 'Anonymous';
    const tipMessage = session.metadata.tip_message || '';
    const amount = (session.amount_total || 0) / 100;

    if (streamerUserId && amount > 0) {
      try {
        await broadcastTipToLiveStream(streamerUserId, {
          amount,
          name: tipperName,
          message: tipMessage,
        });
        console.log(`✅ Broadcasted tip of $${amount} from ${tipperName} to live stream`);
      } catch (error) {
        console.error('❌ Error broadcasting tip to live stream:', error);
      }
    }
    return; // Don't process as crowd request
  }

  // Handle PPV stream payments
  if (session.metadata?.type === 'ppv_stream') {
    const streamId = session.metadata.stream_id;
    const ppvToken = session.metadata.ppv_token;

    if (streamId && ppvToken) {
      // Token is already created in ppv-payment route
      // Just verify it exists and mark payment as completed
      const { data: tokenData } = await supabase
        .from('ppv_tokens')
        .select('*')
        .eq('token', ppvToken)
        .eq('stream_id', streamId)
        .single();

      if (tokenData) {
        console.log(`✅ PPV payment successful for stream ${streamId}, token: ${ppvToken}`);
      }
    }
    return; // Don't process as crowd request
  }

  const requestId = session.metadata?.request_id;

  if (!requestId) {
    console.warn('⚠️ No request_id in session metadata');
    return;
  }

  // Get payment intent ID
  const paymentIntentId = session.payment_intent;
  
  if (!paymentIntentId) {
    console.warn('⚠️ No payment_intent in session');
    return;
  }

  // Process payment success (same logic as process-payment-success.js)
  await processPaymentSuccess(requestId, paymentIntentId, session.id, supabase);
}

// Handle payment intent success
async function handlePaymentIntentSucceeded(paymentIntent, supabase) {
  console.log(`✅ Processing payment_intent.succeeded for ${paymentIntent.id}`);

  const requestId = paymentIntent.metadata?.request_id;

  if (!requestId) {
    console.warn('⚠️ No request_id in payment intent metadata');
    return;
  }

  // Check if already processed
  const { data: request } = await supabase
    .from('crowd_requests')
    .select('payment_intent_id, payment_status')
    .eq('id', requestId)
    .single();

  if (request?.payment_intent_id === paymentIntent.id && request?.payment_status === 'paid') {
    console.log(`ℹ️ Payment ${paymentIntent.id} already processed for request ${requestId}`);
    return;
  }

  // Process payment success
  await processPaymentSuccess(requestId, paymentIntent.id, null, supabase);
}

// Handle payment intent failure
async function handlePaymentIntentFailed(paymentIntent, supabase) {
  console.log(`❌ Processing payment_intent.payment_failed for ${paymentIntent.id}`);

  const requestId = paymentIntent.metadata?.request_id;

  if (!requestId) {
    return;
  }

  // Update request with failed status
  await supabase
    .from('crowd_requests')
    .update({
      payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);
}

// Handle charge success (backup handler)
async function handleChargeSucceeded(charge, supabase) {
  // Only process if we have a payment intent
  if (!charge.payment_intent) {
    return;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
    const requestId = paymentIntent.metadata?.request_id;

    if (!requestId) {
      return;
    }

    // Check if already processed
    const { data: request } = await supabase
      .from('crowd_requests')
      .select('payment_intent_id, payment_status')
      .eq('id', requestId)
      .single();

    if (request?.payment_intent_id === paymentIntent.id && request?.payment_status === 'paid') {
      return;
    }

    // Process payment success
    await processPaymentSuccess(requestId, paymentIntent.id, null, supabase);
  } catch (error) {
    console.error('Error processing charge.succeeded:', error);
  }
}

// Core payment processing logic (shared with process-payment-success.js)
async function processPaymentSuccess(requestId, paymentIntentId, sessionId, supabase) {
  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['customer', 'latest_charge'],
    });

    // Get customer details
    let customerName = null;
    let customerEmail = null;
    let customerPhone = null;

    if (paymentIntent.customer) {
      try {
        const customer = typeof paymentIntent.customer === 'string'
          ? await stripe.customers.retrieve(paymentIntent.customer)
          : paymentIntent.customer;
        
        customerName = customer.name;
        customerEmail = customer.email;
        customerPhone = customer.phone;
      } catch (err) {
        console.warn('Could not fetch customer:', err.message);
      }
    }

    // Get billing details from charge
    if (paymentIntent.latest_charge) {
      try {
        const charge = typeof paymentIntent.latest_charge === 'string'
          ? await stripe.charges.retrieve(paymentIntent.latest_charge)
          : paymentIntent.latest_charge;
        
        const billing = charge.billing_details;
        if (billing.name && !customerName) customerName = billing.name;
        if (billing.email && !customerEmail) customerEmail = billing.email;
        if (billing.phone && !customerPhone) customerPhone = billing.phone;
      } catch (err) {
        console.warn('Could not fetch charge:', err.message);
      }
    }

    // If we have session ID, also get customer details from session
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['customer'],
        });

        if (session.customer_details?.name && !customerName) {
          customerName = session.customer_details.name;
        }
        if (session.customer_email && !customerEmail) {
          customerEmail = session.customer_email;
        }
        if (session.customer_details?.phone && !customerPhone) {
          customerPhone = session.customer_details.phone;
        }
      } catch (err) {
        console.warn('Could not fetch session:', err.message);
      }
    }

    // Update the crowd request
    const updateData = {
      payment_intent_id: paymentIntentId,
      payment_status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
      payment_method: 'card',
      updated_at: new Date().toISOString(),
    };

    if (sessionId) {
      updateData.stripe_session_id = sessionId;
    }

    // Update amount_paid if payment succeeded
    if (paymentIntent.status === 'succeeded' && paymentIntent.amount > 0) {
      updateData.amount_paid = paymentIntent.amount;
      updateData.paid_at = new Date(paymentIntent.created * 1000).toISOString();
    }

    // ALWAYS update customer information from Stripe (source of truth)
    if (customerName && customerName.trim() && customerName !== 'Guest') {
      updateData.requester_name = customerName.trim();
    }
    if (customerEmail && customerEmail.trim()) {
      updateData.requester_email = customerEmail.trim();
    }
    if (customerPhone && customerPhone.trim()) {
      updateData.requester_phone = customerPhone.trim();
    }

    // Update the request
    const { error: updateError } = await supabase
      .from('crowd_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      console.error(`❌ Error updating request ${requestId}:`, updateError);
      throw updateError;
    }

    // Create invoice for successful payments
    if (paymentIntent.status === 'succeeded' && paymentIntent.amount > 0) {
      try {
        const { createInvoiceFromCrowdRequest } = await import('../../../utils/create-invoice-from-crowd-request');
        const invoiceResult = await createInvoiceFromCrowdRequest(requestId, paymentIntent, supabase);
        
        if (invoiceResult.success) {
          console.log(`✅ Created invoice ${invoiceResult.invoice_id} for crowd request ${requestId}`);
        } else {
          console.warn(`⚠️ Could not create invoice for request ${requestId}:`, invoiceResult.error);
          // Non-critical - payment is still processed
        }
      } catch (invoiceError) {
        console.warn(`⚠️ Error creating invoice for request ${requestId}:`, invoiceError);
        // Non-critical - payment is still processed
      }
    }

    console.log(`✅ Successfully processed payment ${paymentIntentId} for request ${requestId}`);
    console.log(`   Updated fields: payment_status=${updateData.payment_status}, amount_paid=${updateData.amount_paid}, payment_intent_id=${paymentIntentId}`);
  } catch (error) {
    console.error(`❌ Error processing payment success for request ${requestId}:`, error);
    console.error(`   Error details:`, {
      message: error.message,
      stack: error.stack,
      paymentIntentId,
      requestId,
    });
    throw error;
  }
}
