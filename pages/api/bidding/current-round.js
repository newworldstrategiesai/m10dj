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
    const { data: round, error: roundError } = await supabase
      .rpc('get_active_bidding_round', { p_organization_id: organizationId })
      .single();

    if (roundError || !round) {
      // No active round - return null (frontend can show "no active bidding")
      return res.status(200).json({
        active: false,
        round: null,
        requests: []
      });
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

    // 4. Calculate time remaining
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
      requests: requestsWithBids
    });

  } catch (error) {
    console.error('Error fetching current round:', error);
    return res.status(500).json({
      error: 'Failed to fetch current bidding round',
      message: error.message
    });
  }
}

