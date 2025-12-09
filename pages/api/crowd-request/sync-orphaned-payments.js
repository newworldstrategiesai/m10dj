// API endpoint to find and link orphaned Stripe payments (payments that exist in Stripe but aren't linked to requests)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId, organizationId } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If specific payment intent ID provided, process just that one
    if (paymentIntentId) {
      return await processSinglePayment(paymentIntentId, supabase, res);
    }

    // Otherwise, search for orphaned payments
    // Get all requests that have stripe_session_id but no payment_intent_id
    const { data: requestsWithSession, error: sessionError } = await supabase
      .from('crowd_requests')
      .select('id, stripe_session_id, created_at, requester_email, requester_name')
      .not('stripe_session_id', 'is', null)
      .is('payment_intent_id', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (sessionError) {
      console.error('Error fetching requests with sessions:', sessionError);
    }

    const results = [];
    const errors = [];

    // Process each request with a session ID
    if (requestsWithSession && requestsWithSession.length > 0) {
      for (const request of requestsWithSession) {
        try {
          if (!request.stripe_session_id) continue;

          const session = await stripe.checkout.sessions.retrieve(request.stripe_session_id, {
            expand: ['payment_intent', 'customer'],
          });

          if (session.payment_intent) {
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
              errors.push({
                requestId: request.id,
                paymentIntentId,
                error: 'Payment intent already linked to another request',
              });
              continue;
            }

            // Update the request with payment intent ID
            const updateData = {
              payment_intent_id: paymentIntentId,
              payment_status: session.payment_status === 'paid' ? 'paid' : 'pending',
              updated_at: new Date().toISOString(),
            };

            if (session.payment_status === 'paid' && session.amount_total) {
              updateData.amount_paid = session.amount_total;
              updateData.paid_at = new Date().toISOString();
            }

            // Get customer details from session
            if (session.customer_details?.name) {
              updateData.requester_name = session.customer_details.name;
            }
            if (session.customer_email) {
              updateData.requester_email = session.customer_email;
            }
            if (session.customer_details?.phone) {
              updateData.requester_phone = session.customer_details.phone;
            }

            const { error: updateError } = await supabase
              .from('crowd_requests')
              .update(updateData)
              .eq('id', request.id);

            if (updateError) {
              errors.push({
                requestId: request.id,
                paymentIntentId,
                error: updateError.message,
              });
            } else {
              results.push({
                requestId: request.id,
                paymentIntentId,
                status: 'linked',
              });
            }
          }
        } catch (err) {
          errors.push({
            requestId: request.id,
            error: err.message,
          });
        }
      }
    }

    // Also search for payment intents that might be orphaned (created in last 90 days)
    // This is more expensive, so we'll do it as a secondary pass
    const ninetyDaysAgo = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100,
        created: { gte: ninetyDaysAgo },
      });

      for (const pi of paymentIntents.data) {
        // Skip if already processed
        if (results.some(r => r.paymentIntentId === pi.id)) continue;

        // Check if this payment intent is already linked
        const { data: existingRequest } = await supabase
          .from('crowd_requests')
          .select('id')
          .eq('payment_intent_id', pi.id)
          .maybeSingle();

        if (existingRequest) continue; // Already linked

        // Try to find matching request by metadata or customer info
        let matchingRequest = null;

        // Check metadata
        if (pi.metadata && pi.metadata.request_id) {
          const { data: request } = await supabase
            .from('crowd_requests')
            .select('id')
            .eq('id', pi.metadata.request_id)
            .maybeSingle();

          if (request) {
            matchingRequest = request;
          }
        }

        // If not found, try by customer email and date
        if (!matchingRequest && pi.customer) {
          try {
            const customer = await stripe.customers.retrieve(pi.customer);
            if (customer.email) {
              const paymentDate = new Date(pi.created * 1000);
              const dayBefore = new Date(paymentDate);
              dayBefore.setDate(dayBefore.getDate() - 1);
              const dayAfter = new Date(paymentDate);
              dayAfter.setDate(dayAfter.getDate() + 1);

              const { data: matchingRequests } = await supabase
                .from('crowd_requests')
                .select('id')
                .eq('requester_email', customer.email)
                .gte('created_at', dayBefore.toISOString())
                .lte('created_at', dayAfter.toISOString())
                .is('payment_intent_id', null)
                .order('created_at', { ascending: false })
                .limit(1);

              if (matchingRequests && matchingRequests.length > 0) {
                matchingRequest = matchingRequests[0];
              }
            }
          } catch (err) {
            console.warn('Could not fetch customer:', err.message);
          }
        }

        // Link if we found a match
        if (matchingRequest) {
          const updateData = {
            payment_intent_id: pi.id,
            payment_status: pi.status === 'succeeded' ? 'paid' : 'pending',
            payment_method: 'card',
            updated_at: new Date().toISOString(),
          };

          if (pi.status === 'succeeded' && pi.amount > 0) {
            updateData.amount_paid = pi.amount;
            updateData.paid_at = new Date(pi.created * 1000).toISOString();
          }

          const { error: updateError } = await supabase
            .from('crowd_requests')
            .update(updateData)
            .eq('id', matchingRequest.id);

          if (!updateError) {
            results.push({
              requestId: matchingRequest.id,
              paymentIntentId: pi.id,
              status: 'linked',
              method: 'matched',
            });
          }
        }
      }
    } catch (err) {
      console.error('Error searching payment intents:', err);
      errors.push({
        error: `Error searching payment intents: ${err.message}`,
      });
    }

    return res.status(200).json({
      success: true,
      linked: results.length,
      errors: errors.length,
      results,
      errors: errors.slice(0, 10), // Limit error details
    });
  } catch (error) {
    console.error('Error syncing orphaned payments:', error);
    return res.status(500).json({
      error: 'Failed to sync orphaned payments',
      message: error.message,
    });
  }
}

async function processSinglePayment(paymentIntentId, supabase, res) {
  try {
    // Retrieve payment intent from Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err) {
      return res.status(404).json({ error: 'Payment intent not found in Stripe' });
    }

    // Check if already linked
    const { data: existingRequest } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (existingRequest) {
      return res.status(200).json({
        success: true,
        alreadyLinked: true,
        request: existingRequest,
        message: 'Payment intent is already linked to a request',
      });
    }

    // Try to find matching request
    let matchingRequest = null;

    // Check metadata for request_id (this is the most reliable method)
    if (paymentIntent.metadata && paymentIntent.metadata.request_id) {
      const { data: request } = await supabase
        .from('crowd_requests')
        .select('*')
        .eq('id', paymentIntent.metadata.request_id)
        .maybeSingle();

      if (request) {
        matchingRequest = request;
        console.log(`Found request ${request.id} from payment intent metadata`);
      }
    }

    // Try by customer email and date
    if (!matchingRequest && paymentIntent.customer) {
      try {
        const customer = await stripe.customers.retrieve(paymentIntent.customer);
        if (customer.email) {
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
            .is('payment_intent_id', null)
            .order('created_at', { ascending: false })
            .limit(5);

          if (matchingRequests && matchingRequests.length > 0) {
            matchingRequest = matchingRequests[0];
          }
        }
      } catch (err) {
        console.warn('Could not fetch customer:', err.message);
      }
    }

    if (!matchingRequest) {
      return res.status(200).json({
        success: false,
        found: false,
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status,
          created: paymentIntent.created,
          customer: paymentIntent.customer,
          metadata: paymentIntent.metadata,
        },
        message: 'Payment intent found in Stripe but no matching request found. You may need to link it manually.',
      });
    }

    // Link the payment
    const updateData = {
      payment_intent_id: paymentIntent.id,
      payment_status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
      payment_method: 'card',
      updated_at: new Date().toISOString(),
    };

    if (paymentIntent.status === 'succeeded' && paymentIntent.amount > 0) {
      updateData.amount_paid = paymentIntent.amount;
      updateData.paid_at = new Date(paymentIntent.created * 1000).toISOString();
    }

    // Get customer details
    if (paymentIntent.customer) {
      try {
        const customer = await stripe.customers.retrieve(paymentIntent.customer);
        if (customer.name) updateData.requester_name = customer.name;
        if (customer.email) updateData.requester_email = customer.email;
        if (customer.phone) updateData.requester_phone = customer.phone;
      } catch (err) {
        // Ignore customer fetch errors
      }
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('crowd_requests')
      .update(updateData)
      .eq('id', matchingRequest.id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Failed to link payment',
        details: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      linked: true,
      request: updatedRequest,
      message: 'Payment intent successfully linked to request',
    });
  } catch (error) {
    console.error('Error processing single payment:', error);
    return res.status(500).json({
      error: 'Failed to process payment',
      message: error.message,
    });
  }
}

