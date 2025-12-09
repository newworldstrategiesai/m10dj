/**
 * Charge a saved payment method
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId, paymentMethodId, amount, description, paymentType, gratuityAmount, gratuityType, gratuityPercentage } = req.body;

  if (!leadId || !paymentMethodId || !amount) {
    return res.status(400).json({ error: 'leadId, paymentMethodId, and amount are required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get contact's Stripe customer ID
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('stripe_customer_id')
      .eq('id', leadId)
      .single();

    if (contactError || !contact?.stripe_customer_id) {
      return res.status(400).json({ error: 'No saved payment methods found for this contact' });
    }

    // Create payment intent with saved payment method
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: contact.stripe_customer_id,
      payment_method: paymentMethodId,
      confirmation_method: 'automatic',
      confirm: true,
      description: description || `Payment for ${paymentType || 'event'}`,
      metadata: {
        lead_id: leadId,
        payment_type: paymentType || 'payment'
      },
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/quote/${leadId}/thank-you`
    });

    // Update quote_selections
    const { data: quote } = await supabase
      .from('quote_selections')
      .select('*')
      .eq('lead_id', leadId)
      .single();

    if (quote) {
      await supabase
        .from('quote_selections')
        .update({
          payment_status: paymentType === 'full' ? 'paid' : 'partial',
          payment_intent_id: paymentIntent.id,
          deposit_amount: paymentType === 'deposit' ? amount : null,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId);
    }

    // Extract gratuity from request body if provided
    const { gratuityAmount, gratuityType, gratuityPercentage } = req.body;
    const gratuity = gratuityAmount ? parseFloat(gratuityAmount) : 0;
    
    // Build payment notes with gratuity info if applicable
    let paymentNotes = `Stripe Payment Intent: ${paymentIntent.id} (Saved Payment Method)`;
    if (gratuity > 0) {
      if (gratuityType === 'percentage' && gratuityPercentage) {
        paymentNotes += ` | Gratuity: ${gratuityPercentage}% ($${gratuity.toFixed(2)})`;
      } else {
        paymentNotes += ` | Gratuity: $${gratuity.toFixed(2)}`;
      }
    }

    // Create payment record
    const paymentRecord = {
      contact_id: leadId,
      payment_name: paymentType === 'deposit' ? 'Deposit' : paymentType === 'remaining' ? 'Remaining Balance' : 'Full Payment',
      total_amount: amount,
      gratuity: gratuity,
      payment_status: 'Paid',
      payment_method: 'Credit Card (Saved)',
      transaction_date: new Date().toISOString().split('T')[0],
      payment_notes: paymentNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabase.from('payments').insert(paymentRecord);

    res.status(200).json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error charging saved payment method:', error);
    res.status(500).json({ 
      error: 'Failed to charge saved payment method',
      message: error.message 
    });
  }
}

