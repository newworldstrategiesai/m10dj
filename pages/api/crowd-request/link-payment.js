// API endpoint to link a Stripe payment intent to a crowd request
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, paymentIntentId } = req.body;

  if (!requestId || !paymentIntentId) {
    return res.status(400).json({ error: 'Request ID and Payment Intent ID are required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve payment intent from Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err) {
      // If payment intent not found, try as charge ID
      try {
        const charge = await stripe.charges.retrieve(paymentIntentId);
        if (charge.payment_intent) {
          paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
        } else {
          return res.status(404).json({ error: 'Payment intent or charge not found in Stripe' });
        }
      } catch (chargeErr) {
        return res.status(404).json({ error: 'Payment intent or charge not found in Stripe' });
      }
    }

    // Get customer details
    let customerName = null;
    let customerEmail = null;
    let customerPhone = null;

    if (paymentIntent.customer) {
      try {
        const customer = await stripe.customers.retrieve(paymentIntent.customer);
        customerName = customer.name;
        customerEmail = customer.email;
        customerPhone = customer.phone;
      } catch (err) {
        console.warn('Could not fetch customer:', err.message);
      }
    }

    // Get charge details for billing info
    let billingDetails = null;
    if (paymentIntent.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        billingDetails = charge.billing_details;
        if (billingDetails.name && !customerName) customerName = billingDetails.name;
        if (billingDetails.email && !customerEmail) customerEmail = billingDetails.email;
        if (billingDetails.phone && !customerPhone) customerPhone = billingDetails.phone;
      } catch (err) {
        console.warn('Could not fetch charge:', err.message);
      }
    }

    // Update the crowd request
    const updateData = {
      payment_intent_id: paymentIntent.id,
      payment_status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
      payment_method: 'card',
      updated_at: new Date().toISOString(),
    };

    // Update amount_paid if payment succeeded
    if (paymentIntent.status === 'succeeded' && paymentIntent.amount > 0) {
      updateData.amount_paid = paymentIntent.amount;
      updateData.paid_at = new Date(paymentIntent.created * 1000).toISOString();
    }

    // ALWAYS update customer information from Stripe when available (Stripe is source of truth)
    // Stripe data is more reliable than form data since it's collected during payment
    if (customerName && customerName.trim() && customerName !== 'Guest') {
      updateData.requester_name = customerName.trim();
    }
    
    // Always update email and phone from Stripe if available (more reliable)
    if (customerEmail && customerEmail.trim()) {
      updateData.requester_email = customerEmail.trim();
    }
    
    if (customerPhone && customerPhone.trim()) {
      updateData.requester_phone = customerPhone.trim();
    }
    
    // Also check billing details from charge if available
    if (billingDetails) {
      // Use billing details if customer object didn't have them
      if (!updateData.requester_name && billingDetails.name && billingDetails.name.trim() && billingDetails.name !== 'Guest') {
        updateData.requester_name = billingDetails.name.trim();
      }
      if (!updateData.requester_email && billingDetails.email && billingDetails.email.trim()) {
        updateData.requester_email = billingDetails.email.trim();
      }
      if (!updateData.requester_phone && billingDetails.phone && billingDetails.phone.trim()) {
        updateData.requester_phone = billingDetails.phone.trim();
      }
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('crowd_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating request:', updateError);
      return res.status(500).json({
        error: 'Failed to update request',
        details: updateError.message,
      });
    }

    console.log(`✅ Linked payment intent ${paymentIntent.id} to request ${requestId}`);

    return res.status(200).json({
      success: true,
      request: updatedRequest,
      customerName,
      customerEmail,
    });
  } catch (error) {
    console.error('Error linking payment:', error);
    return res.status(500).json({
      error: 'Failed to link payment',
      message: error.message,
    });
  }
}

