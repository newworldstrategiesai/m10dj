const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { payment_intent } = req.query;

  if (!payment_intent) {
    return res.status(400).json({ error: 'Payment intent ID is required' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
    
    console.log('✅ Payment verified:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
}
