// API endpoint to link a Stripe payment to a request using metadata (request_id)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId, requestId } = req.body;

  if (!paymentIntentId && !requestId) {
    return res.status(400).json({ error: 'Payment Intent ID or Request ID is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let paymentIntent;
    let targetRequestId = requestId;

    // If payment intent ID provided, retrieve it and check metadata
    if (paymentIntentId) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // Check if metadata has request_id
        if (paymentIntent.metadata && paymentIntent.metadata.request_id) {
          targetRequestId = paymentIntent.metadata.request_id;
        }
      } catch (err) {
        return res.status(404).json({ error: 'Payment intent not found in Stripe' });
      }
    }

    if (!targetRequestId) {
      return res.status(400).json({ error: 'Could not determine request ID from payment intent metadata' });
    }

    // Check if request exists
    const { data: request, error: requestError } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', targetRequestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ 
        error: 'Request not found',
        requestId: targetRequestId,
        details: requestError?.message,
      });
    }

    // Check if payment is already linked to this request
    if (request.payment_intent_id === paymentIntentId) {
      return res.status(200).json({
        success: true,
        alreadyLinked: true,
        request,
        message: 'Payment is already linked to this request',
      });
    }

    // Check if payment is linked to a different request
    if (paymentIntentId) {
      const { data: existingRequest } = await supabase
        .from('crowd_requests')
        .select('id')
        .eq('payment_intent_id', paymentIntentId)
        .neq('id', targetRequestId)
        .maybeSingle();

      if (existingRequest) {
        return res.status(400).json({
          error: 'Payment intent is already linked to a different request',
          existingRequestId: existingRequest.id,
        });
      }
    }

    // Get payment intent if not already retrieved
    if (!paymentIntent && paymentIntentId) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (err) {
        return res.status(404).json({ error: 'Payment intent not found in Stripe' });
      }
    }

    // Get customer details from payment intent
    let customerName = null;
    let customerEmail = null;
    let customerPhone = null;

    if (paymentIntent && paymentIntent.customer) {
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
    if (paymentIntent && paymentIntent.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        const billing = charge.billing_details;
        if (billing.name && !customerName) customerName = billing.name;
        if (billing.email && !customerEmail) customerEmail = billing.email;
        if (billing.phone && !customerPhone) customerPhone = billing.phone;
      } catch (err) {
        console.warn('Could not fetch charge:', err.message);
      }
    }

    // Update the request with payment information
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (paymentIntentId) {
      updateData.payment_intent_id = paymentIntentId;
    }

    if (paymentIntent) {
      updateData.payment_status = paymentIntent.status === 'succeeded' ? 'paid' : 'pending';
      updateData.payment_method = 'card';

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
    if (paymentIntent && paymentIntent.latest_charge) {
      try {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        const billing = charge.billing_details;
        
        // Use billing details if customer object didn't have them
        if (!updateData.requester_name && billing.name && billing.name.trim() && billing.name !== 'Guest') {
          updateData.requester_name = billing.name.trim();
        }
        if (!updateData.requester_email && billing.email && billing.email.trim()) {
          updateData.requester_email = billing.email.trim();
        }
        if (!updateData.requester_phone && billing.phone && billing.phone.trim()) {
          updateData.requester_phone = billing.phone.trim();
        }
      } catch (err) {
        console.warn('Could not fetch charge for billing details:', err.message);
      }
    }
    }

    // Also update event_code from metadata if present
    if (paymentIntent && paymentIntent.metadata && paymentIntent.metadata.event_code) {
      updateData.event_qr_code = paymentIntent.metadata.event_code;
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('crowd_requests')
      .update(updateData)
      .eq('id', targetRequestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating request:', updateError);
      return res.status(500).json({
        error: 'Failed to update request',
        details: updateError.message,
      });
    }

    console.log(`✅ Linked payment intent ${paymentIntentId} to request ${targetRequestId} using metadata`);

    return res.status(200).json({
      success: true,
      linked: true,
      request: updatedRequest,
      paymentIntentId,
      customerName,
      customerEmail,
      message: 'Payment successfully linked to request using metadata',
    });
  } catch (error) {
    console.error('Error linking payment by metadata:', error);
    return res.status(500).json({
      error: 'Failed to link payment',
      message: error.message,
    });
  }
}

