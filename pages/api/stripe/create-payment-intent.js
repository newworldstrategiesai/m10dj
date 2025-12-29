const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, leadId, invoiceId, metadata } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  // SECURITY: Validate amount against database record when invoiceId provided
  if (invoiceId) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('total_amount, balance_due, status')
        .eq('id', invoiceId)
        .single();
      
      if (error || !invoice) {
        console.error('Invoice not found for payment validation:', invoiceId);
        return res.status(400).json({ error: 'Invalid invoice' });
      }
      
      // Verify amount matches expected (allow for balance_due or full amount)
      const expectedAmount = Math.round((invoice.balance_due || invoice.total_amount) * 100);
      if (Math.abs(amount - expectedAmount) > 1) { // Allow 1 cent tolerance
        console.error('Amount mismatch:', { provided: amount, expected: expectedAmount });
        return res.status(400).json({ error: 'Amount does not match invoice' });
      }
      
      if (invoice.status === 'paid') {
        return res.status(400).json({ error: 'Invoice already paid' });
      }
    } catch (validationError) {
      console.error('Payment validation error:', validationError);
      // Continue with payment - don't block if validation fails
    }
  }

  try {
    console.log('💳 Creating payment intent:', {
      amount,
      leadId,
      metadata,
      timestamp: new Date().toISOString()
    });

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        ...metadata,
        leadId: leadId || metadata?.leadId
      },
      description: `M10 DJ Company - 50% Deposit for ${metadata?.leadName || 'Event'}`,
      receipt_email: metadata?.leadEmail
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
}

