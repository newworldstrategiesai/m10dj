// API endpoint to fetch Stripe payment details for a crowd request
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, paymentIntentId, sessionId } = req.query;

  if (!requestId && !paymentIntentId && !sessionId) {
    return res.status(400).json({ error: 'Request ID, Payment Intent ID, or Session ID is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let paymentIntentIdToUse = paymentIntentId;
    let sessionIdToUse = sessionId;

    // If requestId provided, get payment details from database
    if (requestId) {
      const { data: request, error: requestError } = await supabase
        .from('crowd_requests')
        .select('payment_intent_id, stripe_session_id')
        .eq('id', requestId)
        .single();

      if (requestError) {
        return res.status(404).json({ error: 'Request not found' });
      }

      paymentIntentIdToUse = request.payment_intent_id || paymentIntentIdToUse;
      sessionIdToUse = request.stripe_session_id || sessionIdToUse;
    }

    const stripeDetails = {
      paymentIntent: null,
      session: null,
      customer: null,
      charge: null,
    };

    // Fetch payment intent if we have it
    if (paymentIntentIdToUse) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentIdToUse);
        stripeDetails.paymentIntent = {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          created: paymentIntent.created,
          customer: paymentIntent.customer,
          description: paymentIntent.description,
          metadata: paymentIntent.metadata,
        };

        // Get customer details if available
        if (paymentIntent.customer) {
          try {
            const customer = await stripe.customers.retrieve(paymentIntent.customer);
            stripeDetails.customer = {
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              created: customer.created,
            };
          } catch (err) {
            console.warn('Could not fetch customer:', err.message);
          }
        }

        // If no customer ID but we have request info, try to search for customer
        if (!paymentIntent.customer && requestId) {
          try {
            const { data: request } = await supabase
              .from('crowd_requests')
              .select('requester_name, requester_email, requester_phone')
              .eq('id', requestId)
              .single();

            if (request) {
              // Try searching by email first
              if (request.requester_email) {
                try {
                  const searchResults = await stripe.customers.search({
                    query: `email:'${request.requester_email}'`,
                    limit: 1,
                  });
                  if (searchResults.data && searchResults.data.length > 0) {
                    const customer = searchResults.data[0];
                    stripeDetails.customer = {
                      id: customer.id,
                      name: customer.name,
                      email: customer.email,
                      phone: customer.phone,
                      address: customer.address,
                      created: customer.created,
                    };
                  }
                } catch (err) {
                  console.warn('Could not search customer by email:', err.message);
                }
              }

              // If still no customer, try searching by name
              if (!stripeDetails.customer && request.requester_name && request.requester_name !== 'Guest') {
                try {
                  const searchResults = await stripe.customers.search({
                    query: `name:'${request.requester_name}'`,
                    limit: 5,
                  });
                  // If multiple results, try to match by email or phone
                  if (searchResults.data && searchResults.data.length > 0) {
                    const matchedCustomer = searchResults.data.find(c => 
                      (!request.requester_email || c.email === request.requester_email) ||
                      (!request.requester_phone || c.phone === request.requester_phone)
                    ) || searchResults.data[0]; // Fallback to first result
                    
                    stripeDetails.customer = {
                      id: matchedCustomer.id,
                      name: matchedCustomer.name,
                      email: matchedCustomer.email,
                      phone: matchedCustomer.phone,
                      address: matchedCustomer.address,
                      created: matchedCustomer.created,
                    };
                  }
                } catch (err) {
                  console.warn('Could not search customer by name:', err.message);
                }
              }
            }
          } catch (err) {
            console.warn('Could not fetch request for customer search:', err.message);
          }
        }

        // Get charge details if available
        if (paymentIntent.latest_charge) {
          try {
            const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
            stripeDetails.charge = {
              id: charge.id,
              amount: charge.amount,
              currency: charge.currency,
              status: charge.status,
              paid: charge.paid,
              payment_method_details: {
                type: charge.payment_method_details?.type,
                card: charge.payment_method_details?.card ? {
                  brand: charge.payment_method_details.card.brand,
                  last4: charge.payment_method_details.card.last4,
                  country: charge.payment_method_details.card.country,
                } : null,
              },
              billing_details: charge.billing_details,
            };
          } catch (err) {
            console.warn('Could not fetch charge:', err.message);
          }
        }
      } catch (err) {
        console.error('Error fetching payment intent:', err.message);
        // Continue to try session if payment intent fails
      }
    }

    // Fetch session if we have it (and haven't gotten payment intent details)
    if (sessionIdToUse && !stripeDetails.paymentIntent) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionIdToUse, {
          expand: ['customer', 'payment_intent', 'payment_intent.payment_method'],
        });
        
        stripeDetails.session = {
          id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          status: session.status,
          payment_status: session.payment_status,
          customer_details: session.customer_details,
          customer_email: session.customer_email,
          created: session.created,
        };

        // Get customer from session if available
        if (session.customer) {
          try {
            const customer = typeof session.customer === 'string' 
              ? await stripe.customers.retrieve(session.customer)
              : session.customer;
            
            stripeDetails.customer = {
              id: customer.id,
              name: customer.name || session.customer_details?.name,
              email: customer.email || session.customer_email || session.customer_details?.email,
              phone: customer.phone || session.customer_details?.phone,
              address: customer.address,
              created: customer.created,
            };
          } catch (err) {
            console.warn('Could not fetch customer from session:', err.message);
          }
        } else if (session.customer_email || session.customer_details?.email) {
          // Try to find customer by email if no customer ID
          try {
            const email = session.customer_email || session.customer_details?.email;
            const searchResults = await stripe.customers.search({
              query: `email:'${email}'`,
              limit: 1,
            });
            if (searchResults.data && searchResults.data.length > 0) {
              const customer = searchResults.data[0];
              stripeDetails.customer = {
                id: customer.id,
                name: customer.name || session.customer_details?.name,
                email: customer.email,
                phone: customer.phone || session.customer_details?.phone,
                address: customer.address,
                created: customer.created,
              };
            }
          } catch (err) {
            console.warn('Could not search customer by email from session:', err.message);
          }
        }

        // Get payment intent from session if available
        if (session.payment_intent) {
          try {
            const paymentIntent = typeof session.payment_intent === 'string'
              ? await stripe.paymentIntents.retrieve(session.payment_intent)
              : session.payment_intent;
            
            stripeDetails.paymentIntent = {
              id: paymentIntent.id,
              amount: paymentIntent.amount,
              currency: paymentIntent.currency,
              status: paymentIntent.status,
              created: paymentIntent.created,
              customer: paymentIntent.customer,
              description: paymentIntent.description,
              metadata: paymentIntent.metadata,
            };

            // Get charge details
            if (paymentIntent.latest_charge) {
              try {
                const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
                stripeDetails.charge = {
                  id: charge.id,
                  amount: charge.amount,
                  currency: charge.currency,
                  status: charge.status,
                  paid: charge.paid,
                  payment_method_details: {
                    type: charge.payment_method_details?.type,
                    card: charge.payment_method_details?.card ? {
                      brand: charge.payment_method_details.card.brand,
                      last4: charge.payment_method_details.card.last4,
                      country: charge.payment_method_details.card.country,
                    } : null,
                  },
                  billing_details: charge.billing_details,
                };
              } catch (err) {
                console.warn('Could not fetch charge:', err.message);
              }
            }
          } catch (err) {
            console.warn('Could not fetch payment intent from session:', err.message);
          }
        }
      } catch (err) {
        console.error('Error fetching session:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      stripe: stripeDetails,
    });
  } catch (error) {
    console.error('Error fetching Stripe details:', error);
    return res.status(500).json({
      error: 'Failed to fetch Stripe details',
      message: error.message,
    });
  }
}

