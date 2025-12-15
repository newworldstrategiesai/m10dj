// API endpoint to find payments in Stripe that don't have corresponding records in the app
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all payment intents from last 90 days
    const ninetyDaysAgo = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    
    console.log('🔍 Searching for orphaned payments in Stripe...');
    
    const orphanedPayments = [];
    const paymentsWithoutRequestId = [];
    let hasMore = true;
    let startingAfter = null;
    let totalChecked = 0;
    
    // Fetch payment intents in batches
    while (hasMore && totalChecked < 100) { // Limit to 100 to avoid timeout
      const params = {
        limit: 100,
        created: { gte: ninetyDaysAgo },
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const paymentIntents = await stripe.paymentIntents.list(params);
      totalChecked += paymentIntents.data.length;
      
      for (const paymentIntent of paymentIntents.data) {
        // Only check succeeded payments
        if (paymentIntent.status !== 'succeeded') {
          continue;
        }
        
        const requestId = paymentIntent.metadata?.request_id;
        
        if (!requestId) {
          // Payment without request_id in metadata
          paymentsWithoutRequestId.push({
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: new Date(paymentIntent.created * 1000).toISOString(),
            description: paymentIntent.description,
            customer: paymentIntent.customer,
            metadata: paymentIntent.metadata,
          });
          continue;
        }
        
        // Check if request exists in database
        const { data: request, error } = await supabase
          .from('crowd_requests')
          .select('id, payment_intent_id, payment_status')
          .eq('id', requestId)
          .single();
        
        if (error || !request) {
          // Request doesn't exist in database
          orphanedPayments.push({
            payment_intent_id: paymentIntent.id,
            request_id: requestId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: new Date(paymentIntent.created * 1000).toISOString(),
            description: paymentIntent.description,
            customer: paymentIntent.customer,
            metadata: paymentIntent.metadata,
            reason: 'Request not found in database',
          });
        } else if (!request.payment_intent_id || request.payment_status !== 'paid') {
          // Request exists but payment not linked or not marked as paid
          orphanedPayments.push({
            payment_intent_id: paymentIntent.id,
            request_id: requestId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: new Date(paymentIntent.created * 1000).toISOString(),
            description: paymentIntent.description,
            customer: paymentIntent.customer,
            metadata: paymentIntent.metadata,
            reason: request.payment_intent_id 
              ? 'Payment not marked as paid' 
              : 'Payment not linked to request',
            existing_request: {
              id: request.id,
              payment_intent_id: request.payment_intent_id,
              payment_status: request.payment_status,
            },
          });
        }
      }
      
      hasMore = paymentIntents.has_more;
      if (paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      }
    }
    
    // Also check checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: ninetyDaysAgo },
    });
    
    const orphanedSessions = [];
    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') {
        continue;
      }
      
      const requestId = session.metadata?.request_id;
      if (!requestId) {
        continue;
      }
      
      // Check if request exists
      const { data: request } = await supabase
        .from('crowd_requests')
        .select('id, payment_intent_id, payment_status, stripe_session_id')
        .eq('id', requestId)
        .single();
      
      if (!request) {
        orphanedSessions.push({
          session_id: session.id,
          payment_intent_id: session.payment_intent,
          request_id: requestId,
          amount_total: session.amount_total,
          currency: session.currency,
          created: new Date(session.created * 1000).toISOString(),
          customer_email: session.customer_email,
          metadata: session.metadata,
          reason: 'Request not found in database',
        });
      } else if (!request.stripe_session_id || request.payment_status !== 'paid') {
        orphanedSessions.push({
          session_id: session.id,
          payment_intent_id: session.payment_intent,
          request_id: requestId,
          amount_total: session.amount_total,
          currency: session.currency,
          created: new Date(session.created * 1000).toISOString(),
          customer_email: session.customer_email,
          metadata: session.metadata,
          reason: request.stripe_session_id 
            ? 'Payment not marked as paid' 
            : 'Session not linked to request',
          existing_request: {
            id: request.id,
            payment_intent_id: request.payment_intent_id,
            payment_status: request.payment_status,
            stripe_session_id: request.stripe_session_id,
          },
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      summary: {
        total_checked: totalChecked,
        orphaned_payments: orphanedPayments.length,
        orphaned_sessions: orphanedSessions.length,
        payments_without_request_id: paymentsWithoutRequestId.length,
      },
      orphaned_payments: orphanedPayments,
      orphaned_sessions: orphanedSessions,
      payments_without_request_id: paymentsWithoutRequestId,
      note: 'These are payments in Stripe that either have no request_id in metadata, or the request_id doesn\'t exist in the database, or the payment isn\'t properly linked.',
    });
  } catch (error) {
    console.error('Error finding orphaned payments:', error);
    return res.status(500).json({
      error: 'Failed to find orphaned payments',
      message: error.message,
    });
  }
}

