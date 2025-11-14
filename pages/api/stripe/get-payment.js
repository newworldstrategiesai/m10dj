import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id, payment_intent } = req.query;

  if (!session_id && !payment_intent) {
    return res.status(400).json({ error: 'session_id or payment_intent is required' });
  }

  try {
    let paymentData = null;

    if (session_id) {
      // Retrieve checkout session
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['payment_intent', 'line_items']
      });

      paymentData = {
        id: session.id,
        payment_intent: session.payment_intent?.id || session.payment_intent,
        amount_total: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        created: session.created,
        customer_email: session.customer_email,
        metadata: session.metadata
      };
    } else if (payment_intent) {
      // Retrieve payment intent directly
      const intent = await stripe.paymentIntents.retrieve(payment_intent);

      paymentData = {
        id: intent.id,
        payment_intent: intent.id,
        amount_total: intent.amount,
        currency: intent.currency,
        status: intent.status,
        created: intent.created,
        metadata: intent.metadata
      };
    }

    if (!paymentData) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.status(200).json(paymentData);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment details',
      details: error.message 
    });
  }
}

