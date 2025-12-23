const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get active bidding round for organization
    let { data: round, error: roundError } = await supabase
      .rpc('get_active_bidding_round', { p_organization_id: organizationId })
      .single();

    // If no active round exists (or round has ended), create one automatically
    // This handles the case where a round ended but hasn't been processed yet
    if (roundError || !round) {
      console.log(`📝 No active round found for org ${organizationId}, creating new round...`);
      
      // First, check if there are any rounds that ended but are still marked as 'active'
      // This can happen if the cron job hasn't run yet
      const { data: expiredRounds } = await supabase
        .from('bidding_rounds')
        .select('id, round_number, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .lt('ends_at', new Date().toISOString())
        .order('round_number', { ascending: false })
        .limit(1);
      
      // If we found expired rounds, mark them as completed
      if (expiredRounds && expiredRounds.length > 0) {
        console.log(`⚠️ Found ${expiredRounds.length} expired round(s), marking as completed...`);
        for (const expiredRound of expiredRounds) {
          await supabase
            .from('bidding_rounds')
            .update({ status: 'completed' })
            .eq('id', expiredRound.id);
        }
      }
      
      // Get the last round number for this organization
      const { data: lastRound } = await supabase
        .from('bidding_rounds')
        .select('round_number')
        .eq('organization_id', organizationId)
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      const nextRoundNumber = lastRound ? lastRound.round_number + 1 : 1;
      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

      // Create new active round
      const { data: newRound, error: createError } = await supabase
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

      if (createError || !newRound) {
        console.error('❌ Error creating new round:', createError);
        return res.status(500).json({ 
          error: 'Failed to create bidding round',
          details: createError?.message 
        });
      }

      round = newRound;
      console.log(`✅ Created new bidding round ${round.id} (Round #${nextRoundNumber})`);
    }

    // 2. Get all requests in this round with their current bids
    const { data: requests, error: requestsError } = await supabase
      .from('crowd_requests')
      .select(`
        id,
        song_title,
        song_artist,
        recipient_name,
        recipient_message,
        request_type,
        current_bid_amount,
        highest_bidder_name,
        created_at,
        bidding_round_id
      `)
      .eq('bidding_round_id', round.id)
      .eq('bidding_enabled', true)
      .order('current_bid_amount', { ascending: false })
      .order('created_at', { ascending: true });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    // 3. Get recent bid history for each request (last 5 bids)
    const requestsWithBids = await Promise.all(
      (requests || []).map(async (request) => {
        const { data: recentBids } = await supabase
          .from('bid_history')
          .select('bid_amount, bidder_name, created_at')
          .eq('request_id', request.id)
          .eq('bidding_round_id', round.id)
          .order('created_at', { ascending: false })
          .limit(5);

        return {
          ...request,
          recentBids: recentBids || []
        };
      })
    );

    // 4. Get organization bidding dummy data settings
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select(`
        bidding_dummy_data_enabled,
        bidding_dummy_data_aggressiveness,
        bidding_dummy_data_max_bid_multiplier,
        bidding_dummy_data_frequency_multiplier,
        bidding_dummy_data_scale_with_real_activity
      `)
      .eq('id', organizationId)
      .single();

    // 5. Calculate time remaining
    const now = new Date();
    const endsAt = new Date(round.ends_at);
    const timeRemaining = Math.max(0, Math.floor((endsAt - now) / 1000));

    return res.status(200).json({
      active: true,
      round: {
        id: round.id,
        roundNumber: round.round_number,
        startedAt: round.started_at,
        endsAt: round.ends_at,
        timeRemaining,
        status: round.status
      },
      requests: requestsWithBids,
      dummyDataSettings: org ? {
        enabled: org.bidding_dummy_data_enabled ?? true,
        aggressiveness: org.bidding_dummy_data_aggressiveness ?? 'medium',
        maxBidMultiplier: parseFloat(org.bidding_dummy_data_max_bid_multiplier ?? 1.5),
        frequencyMultiplier: parseFloat(org.bidding_dummy_data_frequency_multiplier ?? 1.0),
        scaleWithRealActivity: org.bidding_dummy_data_scale_with_real_activity ?? true
      } : null
    });

  } catch (error) {
    console.error('Error fetching current round:', error);
    return res.status(500).json({
      error: 'Failed to fetch current bidding round',
      message: error.message
    });
  }
}

