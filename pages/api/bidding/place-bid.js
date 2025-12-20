const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { createRateLimitMiddleware, getClientIp } = require('@/utils/rate-limiter');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Rate limiting: 10 bids per minute per IP
const rateLimiter = createRateLimitMiddleware({
  maxRequests: 10,
  windowMs: 60 * 1000,
  keyGenerator: (req) => getClientIp(req)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  await rateLimiter(req, res);
  if (res.headersSent) {
    return;
  }

  const {
    requestId,
    biddingRoundId,
    bidAmount, // In cents
    bidderName,
    bidderEmail,
    bidderPhone,
    organizationId
  } = req.body;

  // Validate required fields
  if (!requestId || !biddingRoundId || !bidAmount || !bidderName) {
    return res.status(400).json({ error: 'Missing required fields: requestId, biddingRoundId, bidAmount, bidderName' });
  }

  // Validate bid amount (must be positive integer)
  if (!Number.isInteger(bidAmount) || bidAmount <= 0) {
    return res.status(400).json({ error: 'Bid amount must be a positive integer (in cents)' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify bidding round is active and not expired
    const { data: round, error: roundError } = await supabase
      .from('bidding_rounds')
      .select('*')
      .eq('id', biddingRoundId)
      .eq('status', 'active')
      .single();

    if (roundError || !round) {
      return res.status(404).json({ error: 'Bidding round not found or not active' });
    }

    if (new Date(round.ends_at) <= new Date()) {
      return res.status(400).json({ error: 'Bidding round has ended' });
    }

    // 2. Verify request exists and is part of this round
    const { data: request, error: requestError } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', requestId)
      .eq('bidding_round_id', biddingRoundId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Request not found or not part of this bidding round' });
    }

    // 3. Get all requests in this round to find the current winning bid
    const { data: allRequests, error: requestsError } = await supabase
      .from('crowd_requests')
      .select('current_bid_amount')
      .eq('bidding_round_id', biddingRoundId)
      .eq('bidding_enabled', true);

    if (requestsError) {
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    // Find the current winning bid (highest bid across all requests in the round)
    const currentWinningBid = allRequests && allRequests.length > 0
      ? Math.max(...allRequests.map(r => r.current_bid_amount || 0))
      : 0;

    // 4. Get organization minimum bid setting
    const { data: org } = await supabase
      .from('organizations')
      .select('requests_bidding_minimum_bid')
      .eq('id', round.organization_id)
      .single();

    const minimumBidIncrement = 100; // $1.00 minimum increment
    const currentBid = request.current_bid_amount || 0;
    const orgMinimumBid = org?.requests_bidding_minimum_bid || 500; // $5.00 default
    
    // Calculate minimum bid:
    // - If bidding on the current winning request, must be at least $1 more than its current bid
    // - If bidding on a different request, must beat the winning bid
    const isBiddingOnWinningRequest = currentBid === currentWinningBid && currentWinningBid > 0;
    const minimumBid = isBiddingOnWinningRequest
      ? currentBid + minimumBidIncrement // Must be at least $1 more than current bid on this request
      : Math.max(currentWinningBid + minimumBidIncrement, orgMinimumBid); // Must beat the winning bid, minimum $5

    if (bidAmount < minimumBid) {
      if (currentWinningBid > 0) {
        return res.status(400).json({ 
          error: `Your bid must be higher than the current winning bid of $${(currentWinningBid / 100).toFixed(2)}. Minimum bid: $${(minimumBid / 100).toFixed(2)}`,
          minimumBid,
          currentWinningBid,
          currentBid
        });
      } else {
        return res.status(400).json({ 
          error: `Bid must be at least $${(minimumBid / 100).toFixed(2)}`,
          minimumBid,
          currentBid
        });
      }
    }

    // 4. Create Stripe Payment Intent (authorize but don't charge yet)
    let paymentIntentId = null;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: bidAmount,
        currency: 'usd',
        capture_method: 'manual', // Authorize but don't charge
        payment_method_types: ['card'],
        metadata: {
          type: 'bidding_bid',
          request_id: requestId,
          bidding_round_id: biddingRoundId,
          organization_id: round.organization_id,
          bidder_name: bidderName,
          bidder_email: bidderEmail || ''
        }
      });
      paymentIntentId = paymentIntent.id;
    } catch (stripeError) {
      console.error('Stripe payment intent creation failed:', stripeError);
      return res.status(500).json({ 
        error: 'Failed to create payment authorization',
        details: stripeError.message 
      });
    }

    // 5. Get previous highest bidder (if exists) to refund
    let previousBidderPaymentIntent = null;
    if (request.current_bid_amount > 0) {
      const { data: previousBid } = await supabase
        .from('bid_history')
        .select('payment_intent_id, bidder_name, bidder_email')
        .eq('request_id', requestId)
        .eq('bidding_round_id', biddingRoundId)
        .eq('bid_amount', request.current_bid_amount)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (previousBid?.payment_intent_id) {
        previousBidderPaymentIntent = previousBid.payment_intent_id;
      }
    }

    // 6. Create bid history record
    const { data: newBid, error: bidError } = await supabase
      .from('bid_history')
      .insert({
        bidding_round_id: biddingRoundId,
        request_id: requestId,
        bidder_name: bidderName,
        bidder_email: bidderEmail || null,
        bidder_phone: bidderPhone || null,
        bid_amount: bidAmount,
        payment_intent_id: paymentIntentId,
        payment_status: 'pending'
      })
      .select()
      .single();

    if (bidError) {
      // Cancel payment intent if bid creation fails
      try {
        await stripe.paymentIntents.cancel(paymentIntentId);
      } catch (cancelError) {
        console.error('Failed to cancel payment intent:', cancelError);
      }
      return res.status(500).json({ 
        error: 'Failed to record bid',
        details: bidError.message 
      });
    }

    // 7. Update crowd_requests with new highest bid
    const { error: updateError } = await supabase
      .from('crowd_requests')
      .update({
        current_bid_amount: bidAmount,
        highest_bidder_name: bidderName,
        highest_bidder_email: bidderEmail || null
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Failed to update request bid amount:', updateError);
      // Don't fail the bid, but log the error
    }

    // 8. Cancel previous highest bidder's authorization (if exists)
    // Note: This releases the authorization - no refund needed since nothing was charged
    if (previousBidderPaymentIntent) {
      try {
        // Cancel the previous payment intent (releases authorization)
        await stripe.paymentIntents.cancel(previousBidderPaymentIntent);
        
        // Update previous bid status
        await supabase
          .from('bid_history')
          .update({ payment_status: 'refunded' }) // Status name kept for UI consistency
          .eq('payment_intent_id', previousBidderPaymentIntent);
        
        console.log(`✅ Released previous bidder's authorization: ${previousBidderPaymentIntent}`);
      } catch (cancelError) {
        console.error('Failed to cancel previous bidder authorization:', cancelError);
        // Don't fail the new bid if cancellation fails - log for manual intervention
      }
    }

    // 9. Return success with updated bid info
    const { data: updatedRequest } = await supabase
      .from('crowd_requests')
      .select('current_bid_amount, highest_bidder_name')
      .eq('id', requestId)
      .single();

    return res.status(200).json({
      success: true,
      bid: {
        id: newBid.id,
        bidAmount,
        bidderName,
        createdAt: newBid.created_at
      },
      request: {
        currentBidAmount: updatedRequest?.current_bid_amount || bidAmount,
        highestBidderName: updatedRequest?.highest_bidder_name || bidderName
      },
      round: {
        endsAt: round.ends_at,
        timeRemaining: Math.max(0, Math.floor((new Date(round.ends_at) - new Date()) / 1000))
      }
    });

  } catch (error) {
    console.error('Error placing bid:', error);
    return res.status(500).json({
      error: 'Failed to place bid',
      message: error.message
    });
  }
}

