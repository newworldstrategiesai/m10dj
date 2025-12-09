// Background job to automatically sync orphaned payments
// Run this periodically (e.g., every 5 minutes) to catch any missed payments
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Optional: Add authentication/authorization check
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req, res) {
  // Optional: Verify cron secret for security
  if (CRON_SECRET && req.headers['authorization'] !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find requests with stripe_session_id but no payment_intent_id
    // These are requests where payment succeeded but wasn't linked
    const { data: requestsWithSession, error: sessionError } = await supabase
      .from('crowd_requests')
      .select('id, stripe_session_id, created_at, payment_status')
      .not('stripe_session_id', 'is', null)
      .is('payment_intent_id', null)
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50); // Process up to 50 at a time

    if (sessionError) {
      console.error('Error fetching requests with sessions:', sessionError);
      return res.status(500).json({ error: sessionError.message });
    }

    const results = {
      processed: 0,
      linked: 0,
      errors: [],
    };

    // Process each request
    for (const request of requestsWithSession || []) {
      try {
        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(request.stripe_session_id, {
          expand: ['payment_intent', 'customer'],
        });

        // Check if payment was successful
        if (session.payment_status === 'paid' && session.payment_intent) {
          const paymentIntentId = typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent.id;

          // Check if this payment intent is already linked to another request
          const { data: existingRequest } = await supabase
            .from('crowd_requests')
            .select('id')
            .eq('payment_intent_id', paymentIntentId)
            .maybeSingle();

          if (existingRequest && existingRequest.id !== request.id) {
            results.errors.push({
              requestId: request.id,
              error: 'Payment intent already linked to another request',
            });
            continue;
          }

          // Get customer details
          let customerName = null;
          let customerEmail = null;
          let customerPhone = null;

          if (session.customer) {
            try {
              const customer = typeof session.customer === 'string'
                ? await stripe.customers.retrieve(session.customer)
                : session.customer;
              
              customerName = customer.name;
              customerEmail = customer.email;
              customerPhone = customer.phone;
            } catch (err) {
              console.warn(`Could not fetch customer for request ${request.id}:`, err.message);
            }
          }

          if (session.customer_details?.name) {
            customerName = customerName || session.customer_details.name;
          }
          if (session.customer_email) {
            customerEmail = customerEmail || session.customer_email;
          }
          if (session.customer_details?.phone) {
            customerPhone = customerPhone || session.customer_details.phone;
          }

          // Update the request
          const updateData = {
            payment_intent_id: paymentIntentId,
            payment_status: 'paid',
            payment_method: 'card',
            updated_at: new Date().toISOString(),
          };

          if (session.amount_total > 0) {
            updateData.amount_paid = session.amount_total;
            updateData.paid_at = new Date().toISOString();
          }

          // Update customer information from Stripe
          if (customerName && customerName.trim() && customerName !== 'Guest') {
            updateData.requester_name = customerName.trim();
          }
          if (customerEmail && customerEmail.trim()) {
            updateData.requester_email = customerEmail.trim();
          }
          if (customerPhone && customerPhone.trim()) {
            updateData.requester_phone = customerPhone.trim();
          }

          const { error: updateError } = await supabase
            .from('crowd_requests')
            .update(updateData)
            .eq('id', request.id);

          if (updateError) {
            results.errors.push({
              requestId: request.id,
              error: updateError.message,
            });
          } else {
            results.linked++;
            console.log(`✅ Linked payment ${paymentIntentId} to request ${request.id}`);
          }
        }

        results.processed++;
      } catch (error) {
        results.errors.push({
          requestId: request.id,
          error: error.message,
        });
        console.error(`❌ Error processing request ${request.id}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      processed: results.processed,
      linked: results.linked,
      errors: results.errors.length,
      message: `Processed ${results.processed} requests, linked ${results.linked} payments`,
    });
  } catch (error) {
    console.error('Error in sync-orphaned-payments cron:', error);
    return res.status(500).json({
      error: 'Failed to sync orphaned payments',
      message: error.message,
    });
  }
}

