// API endpoint to find and sync orphaned Stripe payments
// Payments that succeeded in Stripe but don't have payment_intent_id stored in the request
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
    
    // Get all requests that don't have payment_intent_id but might have payments
    // Check requests from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data: requests, error: requestsError } = await supabase
      .from('crowd_requests')
      .select('id, created_at, amount_requested, payment_status')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .is('payment_intent_id', null)
      .neq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(100); // Limit to avoid too many API calls
    
    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    if (!requests || requests.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No requests found to check',
        synced: 0
      });
    }

    const synced = [];
    const errors = [];

    // Search Stripe for payments with request_id in metadata
    for (const request of requests) {
      try {
        // Search for payment intents with this request_id in metadata
        const paymentIntents = await stripe.paymentIntents.search({
          query: `metadata['request_id']:'${request.id}'`,
          limit: 10,
        });

        if (paymentIntents.data && paymentIntents.data.length > 0) {
          // Find the first succeeded payment
          const succeededPayment = paymentIntents.data.find(
            (pi) => pi.status === 'succeeded'
          );

          if (succeededPayment) {
            // Update the request with payment information
            const { error: updateError } = await supabase
              .from('crowd_requests')
              .update({
                payment_intent_id: succeededPayment.id,
                payment_status: 'paid',
                amount_paid: succeededPayment.amount,
                paid_at: new Date(succeededPayment.created * 1000).toISOString(),
                payment_method: 'card',
                updated_at: new Date().toISOString(),
              })
              .eq('id', request.id);

            if (updateError) {
              console.error(`Error updating request ${request.id}:`, updateError);
              errors.push({ requestId: request.id, error: updateError.message });
            } else {
              synced.push({
                requestId: request.id,
                paymentIntentId: succeededPayment.id,
                amount: succeededPayment.amount,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error checking request ${request.id}:`, error);
        errors.push({ requestId: request.id, error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Synced ${synced.length} orphaned payment(s)`,
      synced: synced.length,
      details: synced,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error syncing orphaned payments:', error);
    return res.status(500).json({
      error: 'Failed to sync orphaned payments',
      message: error.message,
    });
  }
}
