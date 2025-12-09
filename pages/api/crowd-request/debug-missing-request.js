// Debug endpoint to find why a request with a Stripe payment isn't showing up
// Blocked in production for security
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId, sessionId, requestId, organizationId } = req.query;

  if (!paymentIntentId && !sessionId && !requestId) {
    return res.status(400).json({ error: 'Payment Intent ID, Session ID, or Request ID is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const debugInfo = {
      stripe: {},
      database: {},
      issues: [],
      recommendations: [],
    };

    // Step 1: Get Stripe payment info
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ['customer', 'latest_charge'],
        });
        
        debugInfo.stripe.paymentIntent = {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status,
          created: paymentIntent.created,
          customer: paymentIntent.customer,
          metadata: paymentIntent.metadata,
        };

        // Check metadata for request_id
        if (paymentIntent.metadata && paymentIntent.metadata.request_id) {
          debugInfo.stripe.requestIdFromMetadata = paymentIntent.metadata.request_id;
        }

        // Get customer info
        if (paymentIntent.customer) {
          try {
            const customer = typeof paymentIntent.customer === 'string'
              ? await stripe.customers.retrieve(paymentIntent.customer)
              : paymentIntent.customer;
            
            debugInfo.stripe.customer = {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            };
          } catch (err) {
            debugInfo.stripe.customerError = err.message;
          }
        }
      } catch (err) {
        debugInfo.stripe.paymentIntentError = err.message;
        debugInfo.issues.push(`Could not retrieve payment intent: ${err.message}`);
      }
    }

    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['customer', 'payment_intent'],
        });
        
        debugInfo.stripe.session = {
          id: session.id,
          payment_status: session.payment_status,
          customer_email: session.customer_email,
          customer_details: session.customer_details,
          metadata: session.metadata,
        };

        if (session.metadata && session.metadata.request_id) {
          debugInfo.stripe.requestIdFromMetadata = session.metadata.request_id;
        }

        if (session.payment_intent) {
          const pi = typeof session.payment_intent === 'string'
            ? await stripe.paymentIntents.retrieve(session.payment_intent)
            : session.payment_intent;
          
          if (pi.metadata && pi.metadata.request_id) {
            debugInfo.stripe.requestIdFromMetadata = pi.metadata.request_id;
          }
        }
      } catch (err) {
        debugInfo.stripe.sessionError = err.message;
        debugInfo.issues.push(`Could not retrieve session: ${err.message}`);
      }
    }

    // Step 2: Find request in database
    let requestIdToCheck = requestId || debugInfo.stripe.requestIdFromMetadata;
    
    if (requestIdToCheck) {
      const { data: request, error: requestError } = await supabase
        .from('crowd_requests')
        .select('*')
        .eq('id', requestIdToCheck)
        .single();

      if (requestError) {
        debugInfo.database.requestError = requestError.message;
        debugInfo.issues.push(`Request ${requestIdToCheck} not found in database: ${requestError.message}`);
      } else {
        debugInfo.database.request = {
          id: request.id,
          event_qr_code: request.event_qr_code,
          request_type: request.request_type,
          organization_id: request.organization_id,
          payment_intent_id: request.payment_intent_id,
          stripe_session_id: request.stripe_session_id,
          payment_status: request.payment_status,
          status: request.status,
          requester_name: request.requester_name,
          requester_email: request.requester_email,
          created_at: request.created_at,
        };

        // Check if payment_intent_id matches
        if (paymentIntentId && request.payment_intent_id !== paymentIntentId) {
          debugInfo.issues.push(`Payment intent ID mismatch: DB has ${request.payment_intent_id}, Stripe has ${paymentIntentId}`);
        }

        // Check if organization_id is set
        if (!request.organization_id) {
          debugInfo.issues.push('Request has no organization_id (orphaned request)');
          debugInfo.recommendations.push('Use "Assign to My Organization" button or link payment to assign organization');
        }

        // Check if organization matches
        if (organizationId && request.organization_id !== organizationId) {
          debugInfo.issues.push(`Request belongs to different organization: ${request.organization_id} vs ${organizationId}`);
        }

        // Check if payment_intent_id is set
        if (!request.payment_intent_id && paymentIntentId) {
          debugInfo.issues.push('Request exists but payment_intent_id is not linked');
          debugInfo.recommendations.push('Use "Link Stripe Payment" button to link the payment');
        }
      }
    } else {
      debugInfo.issues.push('No request_id found in Stripe metadata - request may not have been created');
      debugInfo.recommendations.push('Check if the request was created before payment');
    }

    // Step 3: Check if request would be visible in admin UI
    if (debugInfo.database.request) {
      const request = debugInfo.database.request;
      
      // Check organization filter
      if (organizationId) {
        if (request.organization_id !== organizationId && request.organization_id !== null) {
          debugInfo.issues.push(`Request belongs to organization ${request.organization_id}, but you're viewing ${organizationId}`);
        } else if (request.organization_id === null) {
          debugInfo.issues.push('Request has null organization_id - may not appear in filtered view');
          debugInfo.recommendations.push('The admin UI shows orphaned requests, but they may be filtered out');
        }
      }

      // Check payment status
      if (request.payment_status !== 'paid' && debugInfo.stripe.paymentIntent?.status === 'succeeded') {
        debugInfo.issues.push('Payment succeeded in Stripe but payment_status in DB is not "paid"');
        debugInfo.recommendations.push('Payment success handler may not have run - try syncing payment');
      }
    }

    // Step 4: Search for request by customer email/name if we have it
    if (!debugInfo.database.request && debugInfo.stripe.customer) {
      const customer = debugInfo.stripe.customer;
      
      if (customer.email) {
        const { data: matchingRequests } = await supabase
          .from('crowd_requests')
          .select('id, requester_email, requester_name, created_at, organization_id, payment_intent_id')
          .eq('requester_email', customer.email)
          .order('created_at', { ascending: false })
          .limit(5);

        if (matchingRequests && matchingRequests.length > 0) {
          debugInfo.database.matchingRequestsByEmail = matchingRequests;
          debugInfo.recommendations.push(`Found ${matchingRequests.length} request(s) with matching email - may need to link payment`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      debug: debugInfo,
      summary: {
        requestFound: !!debugInfo.database.request,
        paymentLinked: !!(debugInfo.database.request?.payment_intent_id),
        organizationSet: !!(debugInfo.database.request?.organization_id),
        issuesCount: debugInfo.issues.length,
        recommendationsCount: debugInfo.recommendations.length,
      },
    });
  } catch (error) {
    console.error('Error debugging missing request:', error);
    return res.status(500).json({
      error: 'Failed to debug request',
      message: error.message,
    });
  }
}

