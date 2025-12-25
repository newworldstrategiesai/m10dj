/**
 * API endpoint to verify Stripe checkout session payment status
 * GET /api/events/tickets/verify-session?session_id=xxx
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE || '', {
  apiVersion: '2025-07-30.preview',
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Missing session_id parameter' });
  }

  try {
    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent']
    });

    // Check if payment was successful
    const isPaid = session.payment_status === 'paid';
    const isComplete = session.status === 'complete';

    return res.status(200).json({
      success: true,
      payment_status: session.payment_status,
      session_status: session.status,
      is_paid: isPaid && isComplete,
      payment_intent_id: session.payment_intent?.id || null,
      customer_email: session.customer_email || session.customer_details?.email || null,
      amount_total: session.amount_total,
      currency: session.currency
    });

  } catch (error) {
    console.error('Error verifying Stripe session:', error);
    
    // If session not found, return a specific error
    if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'The checkout session could not be found. Please check your session ID.'
      });
    }

    return res.status(500).json({
      error: 'Failed to verify session',
      message: error.message
    });
  }
}

