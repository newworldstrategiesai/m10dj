// API endpoint to find a crowd request by Stripe payment intent ID
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId } = req.query;

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'Payment Intent ID is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, check if request already has this payment intent
    const { data: existingRequest } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (existingRequest) {
      return res.status(200).json({
        found: true,
        request: existingRequest,
        message: 'Request already linked to this payment',
      });
    }

    // Retrieve payment intent from Stripe to get metadata
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err) {
      // Try as charge ID
      try {
        const charge = await stripe.charges.retrieve(paymentIntentId);
        if (charge.payment_intent) {
          paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
        } else {
          return res.status(404).json({ error: 'Payment intent not found in Stripe' });
        }
      } catch (chargeErr) {
        return res.status(404).json({ error: 'Payment intent not found in Stripe' });
      }
    }

    // Check metadata for request_id
    if (paymentIntent.metadata && paymentIntent.metadata.request_id) {
      const { data: request } = await supabase
        .from('crowd_requests')
        .select('*')
        .eq('id', paymentIntent.metadata.request_id)
        .maybeSingle();

      if (request) {
        return res.status(200).json({
          found: true,
          request,
          message: 'Found request from payment intent metadata',
        });
      }
    }

    // Try to find by customer email/name if available
    if (paymentIntent.customer) {
      try {
        const customer = await stripe.customers.retrieve(paymentIntent.customer);
        if (customer.email) {
          // Search for requests with matching email and similar date
          const paymentDate = new Date(paymentIntent.created * 1000);
          const dayBefore = new Date(paymentDate);
          dayBefore.setDate(dayBefore.getDate() - 1);
          const dayAfter = new Date(paymentDate);
          dayAfter.setDate(dayAfter.getDate() + 1);

          const { data: matchingRequests } = await supabase
            .from('crowd_requests')
            .select('*')
            .eq('requester_email', customer.email)
            .gte('created_at', dayBefore.toISOString())
            .lte('created_at', dayAfter.toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

          if (matchingRequests && matchingRequests.length > 0) {
            return res.status(200).json({
              found: true,
              request: matchingRequests[0], // Return most recent
              requests: matchingRequests, // Also return all matches
              message: 'Found request(s) matching customer email and date',
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch customer:', err.message);
      }
    }

    return res.status(200).json({
      found: false,
      message: 'No request found matching this payment intent',
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    console.error('Error finding request by payment intent:', error);
    return res.status(500).json({
      error: 'Failed to find request',
      message: error.message,
    });
  }
}

