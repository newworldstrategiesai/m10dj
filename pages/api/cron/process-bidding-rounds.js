// Cron job to process bidding rounds every minute
// Checks for rounds that ended in the last minute and processes them
// 
// ⚠️ IMPORTANT: Vercel free tier only allows 2 cron jobs and max once per day
// We need this to run EVERY MINUTE, so use external cron service:
// 
// RECOMMENDED: cron-job.org (free, reliable)
// 1. Sign up at https://cron-job.org
// 2. Create cron job pointing to: https://yourdomain.com/api/cron/process-bidding-rounds
// 3. Schedule: Every minute (* * * * *)
// 4. Add header: Authorization: Bearer YOUR_CRON_SECRET
// 
// See EXTERNAL_CRON_SETUP.md for detailed instructions

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { 
  notifyBidWinner, 
  notifyBidLoser, 
  notifyAdminBiddingFailure 
} = require('../../../utils/bidding-notifications');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // Verify this is a legitimate cron request
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Processing bidding rounds...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Find all active rounds that have ended (within last 2 minutes to account for timing)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const now = new Date();

    const { data: endedRounds, error: roundsError } = await supabase
      .from('bidding_rounds')
      .select('*')
      .eq('status', 'active')
      .lte('ends_at', now.toISOString())
      .gte('ends_at', twoMinutesAgo.toISOString());

    if (roundsError) {
      console.error('❌ Error fetching ended rounds:', roundsError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!endedRounds || endedRounds.length === 0) {
      console.log('✅ No ended rounds to process');
      return res.status(200).json({ 
        success: true, 
        message: 'No ended rounds',
        processed: 0 
      });
    }

    console.log(`📊 Processing ${endedRounds.length} ended round(s)`);

    let processed = 0;
    let errors = 0;

    // 2. Process each ended round
    for (const round of endedRounds) {
      try {
        await processBiddingRound(supabase, stripe, round);
        processed++;
      } catch (error) {
        console.error(`❌ Error processing round ${round.id}:`, error);
        errors++;
        
        // Notify admin of failure
        await notifyAdminBiddingFailure(
          round.id,
          round.organization_id,
          error.message,
          {
            roundNumber: round.round_number,
            endsAt: round.ends_at,
            error: error.message,
            stack: error.stack
          }
        );
        
        // Mark round as having processing error (but don't mark as completed)
        await supabase
          .from('bidding_rounds')
          .update({ 
            status: 'active', // Keep as active so it can be retried
            updated_at: new Date().toISOString()
          })
          .eq('id', round.id);
      }
    }

    // 3. Create new rounds for organizations that had rounds end
    const organizationIds = [...new Set(endedRounds.map(r => r.organization_id))];
    
    for (const orgId of organizationIds) {
      try {
        await createNewBiddingRound(supabase, orgId);
      } catch (error) {
        console.error(`❌ Error creating new round for org ${orgId}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      processed,
      errors,
      roundsProcessed: endedRounds.length
    });

  } catch (error) {
    console.error('❌ Error processing bidding rounds:', error);
    return res.status(500).json({
      error: 'Failed to process bidding rounds',
      message: error.message
    });
  }
}

// Process a single bidding round
async function processBiddingRound(supabase, stripe, round) {
  console.log(`🎯 Processing round ${round.id} for org ${round.organization_id}`);

  // 1. Get all requests in this round
  const { data: requests, error: requestsError } = await supabase
    .from('crowd_requests')
    .select('*')
    .eq('bidding_round_id', round.id)
    .eq('bidding_enabled', true)
    .gt('current_bid_amount', 0)
    .order('current_bid_amount', { ascending: false })
    .order('created_at', { ascending: true });

  if (requestsError) {
    throw new Error(`Failed to fetch requests: ${requestsError.message}`);
  }

  if (!requests || requests.length === 0) {
    console.log(`⚠️ No requests with bids in round ${round.id}`);
    // Mark round as completed with no winner
    await supabase
      .from('bidding_rounds')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', round.id);
    return;
  }

  // 2. Find winner (request with highest bid)
  const winner = requests[0];
  console.log(`🏆 Winner: Request ${winner.id} with bid $${(winner.current_bid_amount / 100).toFixed(2)}`);

  // 3. Get winning bid details
  const { data: winningBid, error: bidError } = await supabase
    .from('bid_history')
    .select('*')
    .eq('request_id', winner.id)
    .eq('bidding_round_id', round.id)
    .eq('bid_amount', winner.current_bid_amount)
    .order('created_at', { ascending: true }) // First bid at this amount wins ties
    .limit(1)
    .single();

  if (bidError || !winningBid) {
    throw new Error(`Failed to find winning bid: ${bidError?.message || 'Not found'}`);
  }

  // 4. Charge the winner
  let chargeSuccess = false;
  let attempts = 0;
  const maxAttempts = Math.min(requests.length, 3); // Try up to 3 bidders
  
  while (!chargeSuccess && attempts < maxAttempts) {
    const candidate = requests[attempts];
    const candidateBid = await supabase
      .from('bid_history')
      .select('*')
      .eq('request_id', candidate.id)
      .eq('bidding_round_id', round.id)
      .eq('bid_amount', candidate.current_bid_amount)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (candidateBid.error || !candidateBid.data) {
      attempts++;
      continue;
    }

    try {
      if (candidateBid.data.payment_intent_id) {
        // Check payment intent status first
        const paymentIntent = await stripe.paymentIntents.retrieve(candidateBid.data.payment_intent_id);
        
        if (paymentIntent.status === 'requires_capture') {
          // Capture the payment intent (charge it)
          const captured = await stripe.paymentIntents.capture(candidateBid.data.payment_intent_id);
          
          if (captured.status === 'succeeded') {
            chargeSuccess = true;
            console.log(`✅ Charged winner (attempt ${attempts + 1}): Request ${candidate.id} with bid $${(candidateBid.data.bid_amount / 100).toFixed(2)}`);
            
            // Update bid status
            await supabase
              .from('bid_history')
              .update({ 
                payment_status: 'charged',
                is_winning_bid: true
              })
              .eq('id', candidateBid.data.id);

            // Update winner reference
            const winner = candidate;
            const winningBid = candidateBid.data;
            
            // Continue with winner processing below
            await processWinner(supabase, stripe, round, winner, winningBid, requests);
            return; // Success, exit function
          }
        } else if (paymentIntent.status === 'succeeded') {
          // Already charged (shouldn't happen, but handle gracefully)
          chargeSuccess = true;
          await supabase
            .from('bid_history')
            .update({ 
              payment_status: 'charged',
              is_winning_bid: true
            })
            .eq('id', candidateBid.data.id);
          
          await processWinner(supabase, stripe, round, candidate, candidateBid.data, requests);
          return;
        } else if (paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method') {
          // Payment intent was canceled or expired - skip this bidder
          console.warn(`⚠️ Payment intent ${candidateBid.data.payment_intent_id} is ${paymentIntent.status}, skipping`);
          attempts++;
          continue;
        } else {
          throw new Error(`Payment intent status: ${paymentIntent.status}`);
        }
      } else {
        throw new Error('No payment intent ID for bid');
      }
    } catch (chargeError) {
      console.error(`❌ Failed to charge bidder ${attempts + 1}:`, chargeError);
      attempts++;
      // Continue to next bidder
    }
  }

  // If we get here, all attempts failed
  const errorMsg = `Failed to charge any bidder after ${attempts} attempts. Manual intervention required.`;
  
  // Notify admin immediately
  await notifyAdminBiddingFailure(
    round.id,
    round.organization_id,
    errorMsg,
    {
      roundNumber: round.round_number,
      attempts: attempts,
      requestsCount: requests.length
    }
  );
  
  throw new Error(errorMsg);
}

// Helper function to process winner
async function processWinner(supabase, stripe, round, winner, winningBid, allRequests) {

  // Process refunds and update round status
  await processRefundsAndUpdateRound(supabase, stripe, round, winner, winningBid, allRequests);
}

// Helper function to process refunds and update round
async function processRefundsAndUpdateRound(supabase, stripe, round, winner, winningBid, allRequests) {
  // 5. Cancel all losing bidders' payment authorizations
  // Note: These are authorized but not captured, so we cancel (release) them, not refund
  const { data: allBids } = await supabase
    .from('bid_history')
    .select('*')
    .eq('bidding_round_id', round.id)
    .neq('id', winningBid.id)
    .eq('payment_status', 'pending');

  if (allBids && allBids.length > 0) {
    console.log(`🔓 Releasing ${allBids.length} losing bid authorization(s)`);
    
    for (const losingBid of allBids) {
      if (losingBid.payment_intent_id) {
        try {
          // Cancel the payment intent (releases authorization - money never left customer's account)
          await stripe.paymentIntents.cancel(losingBid.payment_intent_id);
          
          // Update bid status to 'cancelled' (not 'refunded' since nothing was charged)
          await supabase
            .from('bid_history')
            .update({ payment_status: 'refunded' }) // Keep as 'refunded' for consistency in UI, but it's actually just cancelled
            .eq('id', losingBid.id);
          
          console.log(`✅ Released authorization for bid ${losingBid.id}`);
        } catch (cancelError) {
          console.error(`⚠️ Failed to cancel payment intent for bid ${losingBid.id}:`, cancelError);
          // Continue processing other cancellations
        }
      }
    }
  }

  // 6. Update round with winner
  await supabase
    .from('bidding_rounds')
    .update({
      status: 'completed',
      winning_request_id: winner.id,
      winning_bid_amount: winningBid.bid_amount,
      processed_at: new Date().toISOString()
    })
    .eq('id', round.id);

  // 7. Update winning request
  await supabase
    .from('crowd_requests')
    .update({
      is_auction_winner: true,
      auction_won_at: new Date().toISOString(),
      status: 'acknowledged', // Move to acknowledged/playing status
      payment_status: 'paid',
      amount_paid: winningBid.bid_amount,
      paid_at: new Date().toISOString(),
      payment_intent_id: winningBid.payment_intent_id
    })
    .eq('id', winner.id);

  // 8. Send notifications
  try {
    // Notify winner
    if (winningBid.bidder_email) {
      await notifyBidWinner(
        winningBid.bidder_email,
        winningBid.bidder_name,
        winner.song_title || 'Your Song Request',
        winner.song_artist || 'Unknown Artist',
        winningBid.bid_amount,
        round.round_number
      );
    }

    // Notify all losing bidders
    if (allBids && allBids.length > 0) {
      for (const losingBid of allBids) {
        if (losingBid.bidder_email && losingBid.bidder_email !== winningBid.bidder_email) {
          await notifyBidLoser(
            losingBid.bidder_email,
            losingBid.bidder_name,
            winner.song_title || 'Song Request',
            winner.song_artist || 'Unknown Artist',
            losingBid.bid_amount,
            winningBid.bid_amount
          );
        }
      }
    }
  } catch (notifError) {
    console.error('⚠️ Error sending notifications (non-critical):', notifError);
    // Don't fail the round processing if notifications fail
  }

  console.log(`✅ Round ${round.id} processed successfully`);
}

// Create a new bidding round for an organization
async function createNewBiddingRound(supabase, organizationId) {
  // Check if organization has bidding enabled
  const { data: org } = await supabase
    .from('organizations')
    .select('requests_bidding_enabled')
    .eq('id', organizationId)
    .single();

  if (!org || !org.requests_bidding_enabled) {
    console.log(`⚠️ Bidding not enabled for org ${organizationId}`);
    return;
  }

  // Check if there's already an active round
  const { data: activeRound } = await supabase
    .from('bidding_rounds')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single();

  if (activeRound) {
    console.log(`⚠️ Active round already exists for org ${organizationId}`);
    return;
  }

  // Get next round number
  const { data: lastRound } = await supabase
    .from('bidding_rounds')
    .select('round_number')
    .eq('organization_id', organizationId)
    .order('round_number', { ascending: false })
    .limit(1)
    .single();

  const nextRoundNumber = lastRound ? lastRound.round_number + 1 : 1;

  // Create new round (30 minutes from now)
  const now = new Date();
  const endsAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

  const { data: newRound, error } = await supabase
    .from('bidding_rounds')
    .insert({
      organization_id: organizationId,
      round_number: nextRoundNumber,
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create new round: ${error.message}`);
  }

  console.log(`✅ Created new bidding round ${newRound.id} for org ${organizationId}`);
  return newRound;
}

// Export processBiddingRound for manual reprocessing (CommonJS for require)
if (typeof module !== 'undefined' && module.exports) {
  module.exports.processBiddingRound = processBiddingRound;
}

