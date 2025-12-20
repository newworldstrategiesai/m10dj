const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    requestId,
    organizationId,
    forceBiddingMode = false // Allow forcing bidding mode (e.g., from /bid route)
  } = req.body;

  if (!requestId || !organizationId) {
    return res.status(400).json({ error: 'requestId and organizationId are required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('requests_bidding_enabled')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // 2. Check if bidding is enabled (either via setting or forced)
    if (!forceBiddingMode && !org.requests_bidding_enabled) {
      return res.status(400).json({ error: 'Bidding is not enabled for this organization' });
    }

    // 2. Get or create active bidding round
    let { data: activeRound } = await supabase
      .from('bidding_rounds')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    // If no active round exists, create one
    if (!activeRound) {
      // Get next round number
      const { data: lastRound } = await supabase
        .from('bidding_rounds')
        .select('round_number')
        .eq('organization_id', organizationId)
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      const nextRoundNumber = lastRound ? lastRound.round_number + 1 : 1;
      const now = new Date();
      const endsAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

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

      if (createError) {
        return res.status(500).json({ error: 'Failed to create bidding round', details: createError.message });
      }

      activeRound = newRound;
    }

    // 3. Verify request exists
    const { data: request, error: requestError } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // 4. Update request to join bidding round
    const { error: updateError } = await supabase
      .from('crowd_requests')
      .update({
        bidding_enabled: true,
        bidding_round_id: activeRound.id,
        current_bid_amount: 0 // Start with no bids
      })
      .eq('id', requestId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to add request to bidding round', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      biddingRoundId: activeRound.id,
      round: {
        id: activeRound.id,
        roundNumber: activeRound.round_number,
        endsAt: activeRound.ends_at,
        timeRemaining: Math.max(0, Math.floor((new Date(activeRound.ends_at) - new Date()) / 1000))
      }
    });

  } catch (error) {
    console.error('Error adding request to bidding round:', error);
    return res.status(500).json({
      error: 'Failed to add request to bidding round',
      message: error.message
    });
  }
}

