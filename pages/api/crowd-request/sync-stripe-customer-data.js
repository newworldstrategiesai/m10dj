// API endpoint to sync Stripe customer data to all crowd requests
// This updates existing requests with customer data from Stripe (source of truth)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { requestId, organizationId } = req.body;

    // If specific request ID provided, sync just that one
    if (requestId) {
      return await syncSingleRequest(requestId, supabase, res);
    }

    // Otherwise, sync all requests with payment_intent_id or stripe_session_id
    let query = supabase
      .from('crowd_requests')
      .select('id, payment_intent_id, stripe_session_id, requester_name, requester_email, requester_phone')
      .or('payment_intent_id.not.is.null,stripe_session_id.not.is.null')
      .order('created_at', { ascending: false });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: requests, error: fetchError } = await query.limit(1000);

    if (fetchError) {
      return res.status(500).json({
        error: 'Failed to fetch requests',
        details: fetchError.message,
      });
    }

    if (!requests || requests.length === 0) {
      return res.status(200).json({
        success: true,
        synced: 0,
        updated: 0,
        skipped: 0,
        message: 'No requests with Stripe payment data found',
      });
    }

    const results = {
      synced: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    for (const request of requests) {
      try {
        let customerName = null;
        let customerEmail = null;
        let customerPhone = null;
        let updated = false;

        // Try to get customer data from payment intent
        if (request.payment_intent_id) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(request.payment_intent_id, {
              expand: ['customer', 'latest_charge'],
            });

            // Get customer from payment intent
            if (paymentIntent.customer) {
              try {
                const customer = typeof paymentIntent.customer === 'string'
                  ? await stripe.customers.retrieve(paymentIntent.customer)
                  : paymentIntent.customer;
                
                customerName = customer.name;
                customerEmail = customer.email;
                customerPhone = customer.phone;
              } catch (err) {
                console.warn(`Could not fetch customer for request ${request.id}:`, err.message);
              }
            }

            // Get billing details from charge if available
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
                console.warn(`Could not fetch charge for request ${request.id}:`, err.message);
              }
            }
          } catch (err) {
            console.warn(`Could not fetch payment intent ${request.payment_intent_id}:`, err.message);
          }
        }

        // Try to get customer data from session if payment intent didn't work
        if ((!customerName && !customerEmail) && request.stripe_session_id) {
          try {
            const session = await stripe.checkout.sessions.retrieve(request.stripe_session_id, {
              expand: ['customer', 'payment_intent'],
            });

            if (session.customer) {
              try {
                const customer = typeof session.customer === 'string'
                  ? await stripe.customers.retrieve(session.customer)
                  : session.customer;
                
                if (!customerName) customerName = customer.name;
                if (!customerEmail) customerEmail = customer.email;
                if (!customerPhone) customerPhone = customer.phone;
              } catch (err) {
                console.warn(`Could not fetch customer from session for request ${request.id}:`, err.message);
              }
            }

            // Get from session customer_details
            if (session.customer_details) {
              if (!customerName && session.customer_details.name) customerName = session.customer_details.name;
              if (!customerEmail && session.customer_details.email) customerEmail = session.customer_details.email;
              if (!customerPhone && session.customer_details.phone) customerPhone = session.customer_details.phone;
            }

            if (session.customer_email && !customerEmail) {
              customerEmail = session.customer_email;
            }
          } catch (err) {
            console.warn(`Could not fetch session ${request.stripe_session_id}:`, err.message);
          }
        }

        // Update request if we have Stripe data that differs from current data
        const updateData = {};
        
        if (customerName && customerName.trim() && customerName !== 'Guest') {
          const trimmedName = customerName.trim();
          if (trimmedName !== request.requester_name) {
            updateData.requester_name = trimmedName;
            updated = true;
          }
        }
        
        if (customerEmail && customerEmail.trim()) {
          const trimmedEmail = customerEmail.trim();
          if (trimmedEmail !== request.requester_email) {
            updateData.requester_email = trimmedEmail;
            updated = true;
          }
        }
        
        if (customerPhone && customerPhone.trim()) {
          const trimmedPhone = customerPhone.trim();
          if (trimmedPhone !== request.requester_phone) {
            updateData.requester_phone = trimmedPhone;
            updated = true;
          }
        }

        if (updated) {
          updateData.updated_at = new Date().toISOString();
          
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
            results.updated++;
          }
        } else {
          results.skipped++;
        }

        results.synced++;
      } catch (error) {
        results.errors.push({
          requestId: request.id,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      synced: results.synced,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors.slice(0, 10), // Limit error details
      message: `Synced ${results.synced} requests. Updated ${results.updated}, skipped ${results.skipped}.`,
    });
  } catch (error) {
    console.error('Error syncing Stripe customer data:', error);
    return res.status(500).json({
      error: 'Failed to sync Stripe customer data',
      message: error.message,
    });
  }
}

async function syncSingleRequest(requestId, supabase, res) {
  try {
    const { data: request, error: requestError } = await supabase
      .from('crowd_requests')
      .select('id, payment_intent_id, stripe_session_id, requester_name, requester_email, requester_phone')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (!request.payment_intent_id && !request.stripe_session_id) {
      return res.status(400).json({ error: 'Request does not have Stripe payment data' });
    }

    // Use the same logic as the bulk sync
    let customerName = null;
    let customerEmail = null;
    let customerPhone = null;

    // Try payment intent first
    if (request.payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(request.payment_intent_id, {
          expand: ['customer', 'latest_charge'],
        });

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
      } catch (err) {
        console.warn('Could not fetch payment intent:', err.message);
      }
    }

    // Try session if payment intent didn't work
    if ((!customerName && !customerEmail) && request.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(request.stripe_session_id, {
          expand: ['customer'],
        });

        if (session.customer) {
          try {
            const customer = typeof session.customer === 'string'
              ? await stripe.customers.retrieve(session.customer)
              : session.customer;
            
            if (!customerName) customerName = customer.name;
            if (!customerEmail) customerEmail = customer.email;
            if (!customerPhone) customerPhone = customer.phone;
          } catch (err) {
            console.warn('Could not fetch customer from session:', err.message);
          }
        }

        if (session.customer_details) {
          if (!customerName && session.customer_details.name) customerName = session.customer_details.name;
          if (!customerEmail && session.customer_details.email) customerEmail = session.customer_details.email;
          if (!customerPhone && session.customer_details.phone) customerPhone = session.customer_details.phone;
        }

        if (session.customer_email && !customerEmail) {
          customerEmail = session.customer_email;
        }
      } catch (err) {
        console.warn('Could not fetch session:', err.message);
      }
    }

    // Update request
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (customerName && customerName.trim() && customerName !== 'Guest') {
      updateData.requester_name = customerName.trim();
    }
    if (customerEmail && customerEmail.trim()) {
      updateData.requester_email = customerEmail.trim();
    }
    if (customerPhone && customerPhone.trim()) {
      updateData.requester_phone = customerPhone.trim();
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('crowd_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Failed to update request',
        details: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      updated: true,
      request: updatedRequest,
      customerName,
      customerEmail,
      customerPhone,
    });
  } catch (error) {
    console.error('Error syncing single request:', error);
    return res.status(500).json({
      error: 'Failed to sync request',
      message: error.message,
    });
  }
}

