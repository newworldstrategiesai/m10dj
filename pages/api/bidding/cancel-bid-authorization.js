// API endpoint to cancel/refund a bid authorization
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

    const { bidId } = req.body;

    if (!bidId) {
      return res.status(400).json({ error: 'Bid ID is required' });
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
      .single();

    if (bidError || !bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (!bid.payment_intent_id) {
      return res.status(400).json({ error: 'Bid has no payment intent' });
    }

    if (bid.payment_status === 'charged') {
      return res.status(400).json({ error: 'Cannot cancel a charged bid. Use refund instead.' });
    }

    if (bid.payment_status === 'refunded') {
      return res.status(400).json({ error: 'Bid authorization has already been cancelled' });
    }

    // Cancel the payment intent (releases authorization)
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(bid.payment_intent_id);

      // Update bid status
      await supabase
        .from('bid_history')
        .update({ payment_status: 'refunded' })
        .eq('id', bidId);

      res.status(200).json({
        success: true,
        message: 'Bid authorization cancelled successfully',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        }
      });
    } catch (stripeError) {
      console.error('Stripe cancel error:', stripeError);
      
      // If already cancelled, just update status
      if (stripeError.code === 'payment_intent_unexpected_state') {
        await supabase
          .from('bid_history')
          .update({ payment_status: 'refunded' })
          .eq('id', bidId);

        return res.status(200).json({
          success: true,
          message: 'Bid authorization was already cancelled',
          warning: 'Payment intent was already in cancelled state'
        });
      }

      return res.status(500).json({
        error: 'Failed to cancel bid authorization',
        details: stripeError.message
      });
    }

  } catch (error) {
    console.error('Error cancelling bid:', error);
    
    if (res.headersSent) {
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to cancel bid authorization',
      details: error.message 
    });
  }
}

