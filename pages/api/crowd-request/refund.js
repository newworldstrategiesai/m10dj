// API endpoint to refund a crowd request payment via Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, amount, reason } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the crowd request
    const { data: crowdRequest, error: requestError } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !crowdRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check if payment was made via Stripe
    if (!crowdRequest.payment_intent_id) {
      return res.status(400).json({ 
        error: 'This payment cannot be refunded through Stripe. Payment was made via CashApp or Venmo.' 
      });
    }

    // Check if already refunded
    if (crowdRequest.payment_status === 'refunded') {
      return res.status(400).json({ error: 'This payment has already been refunded' });
    }

    // Check if payment is actually paid
    if (crowdRequest.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment must be paid before it can be refunded' });
    }

    // Determine refund amount (full refund if not specified)
    const refundAmount = amount 
      ? Math.round(amount * 100) // Convert dollars to cents
      : crowdRequest.amount_paid; // Full refund

    // Validate refund amount
    if (refundAmount <= 0 || refundAmount > crowdRequest.amount_paid) {
      return res.status(400).json({ 
        error: `Refund amount must be between $0.01 and $${(crowdRequest.amount_paid / 100).toFixed(2)}` 
      });
    }

    // Create refund in Stripe
    let refund;
    try {
      refund = await stripe.refunds.create({
        payment_intent: crowdRequest.payment_intent_id,
        amount: refundAmount,
        reason: reason || 'requested_by_customer',
        metadata: {
          request_id: crowdRequest.id,
          request_type: crowdRequest.request_type,
          refund_reason: reason || 'requested_by_customer',
        },
      });
    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError);
      return res.status(500).json({ 
        error: 'Failed to process refund in Stripe',
        details: stripeError.message 
      });
    }

    // Update crowd request in database
    const isFullRefund = refundAmount === crowdRequest.amount_paid;
    const updateData = {
      payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
      refund_amount: refundAmount,
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If full refund, also update status
    if (isFullRefund) {
      updateData.status = 'cancelled';
    }

    const { error: updateError } = await supabase
      .from('crowd_requests')
      .update(updateData)
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating crowd request:', updateError);
      // Refund was successful in Stripe, but DB update failed
      // This is a critical error - we should log it
      return res.status(500).json({ 
        error: 'Refund processed in Stripe but failed to update database',
        refund_id: refund.id,
        warning: 'Please manually update the database'
      });
    }

    console.log(`✅ Refund processed for request ${requestId}: $${(refundAmount / 100).toFixed(2)}`);

    return res.status(200).json({
      success: true,
      refund_id: refund.id,
      refund_amount: refundAmount,
      refund_status: refund.status,
      message: isFullRefund 
        ? 'Full refund processed successfully' 
        : `Partial refund of $${(refundAmount / 100).toFixed(2)} processed successfully`,
    });
  } catch (error) {
    console.error('❌ Error processing refund:', error);
    return res.status(500).json({
      error: 'Failed to process refund',
      message: error.message,
    });
  }
}

