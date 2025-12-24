// API endpoint to manually charge a winning bid
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, res);

    const { bidId, requestId } = req.body;

    if (!bidId || !requestId) {
      return res.status(400).json({ error: 'Bid ID and Request ID are required' });
    }

    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the bid
    const { data: bid, error: bidError } = await supabase
      .from('bid_history')
      .select('*')
      .eq('id', bidId)
      .eq('request_id', requestId)
      .single();

    if (bidError || !bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (!bid.payment_intent_id) {
      return res.status(400).json({ error: 'Bid has no payment intent' });
    }

    if (bid.payment_status === 'charged') {
      return res.status(400).json({ error: 'Bid has already been charged' });
    }

    // Charge the payment intent
    try {
      const paymentIntent = await stripe.paymentIntents.capture(bid.payment_intent_id);

      if (paymentIntent.status === 'succeeded') {
        // Update bid status
        await supabase
          .from('bid_history')
          .update({ 
            payment_status: 'charged',
            is_winning_bid: true
          })
          .eq('id', bidId);

        // Update request payment status
        await supabase
          .from('crowd_requests')
          .update({
            payment_status: 'paid',
            amount_paid: bid.bid_amount,
            paid_at: new Date().toISOString(),
            payment_intent_id: bid.payment_intent_id
          })
          .eq('id', requestId);

        res.status(200).json({
          success: true,
          message: 'Bid charged successfully',
          paymentIntent: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status
          }
        });
      } else {
        throw new Error(`Payment intent status: ${paymentIntent.status}`);
      }
    } catch (stripeError) {
      console.error('Stripe charge error:', stripeError);
      
      // Update bid status to failed
      await supabase
        .from('bid_history')
        .update({ payment_status: 'failed' })
        .eq('id', bidId);

      return res.status(500).json({
        error: 'Failed to charge bid',
        details: stripeError.message
      });
    }

  } catch (error) {
    console.error('Error charging bid:', error);
    
    if (res.headersSent) {
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to charge bid',
      details: error.message 
    });
  }
}

