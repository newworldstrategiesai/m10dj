const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('@/utils/auth-helpers/api-auth');
const { getEnv } = require('@/utils/env-validator');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here

    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { organizationId, biddingRoundId, requests } = req.body;

    // Validate required fields
    if (!organizationId || !biddingRoundId || !requests || !Array.isArray(requests)) {
      return res.status(400).json({ 
        error: 'Missing required fields: organizationId, biddingRoundId, and requests array are required' 
      });
    }

    if (requests.length === 0) {
      return res.status(400).json({ error: 'Requests array cannot be empty' });
    }

    // Validate each request
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      if (!req.song_title || !req.song_artist) {
        return res.status(400).json({ 
          error: `Request ${i + 1}: song_title and song_artist are required` 
        });
      }
      if (!req.bid_amount || typeof req.bid_amount !== 'number' || req.bid_amount < 100) {
        return res.status(400).json({ 
          error: `Request ${i + 1}: bid_amount must be at least 100 cents ($1.00)` 
        });
      }
    }

    // Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Verify bidding round exists and is active
    const { data: round, error: roundError } = await supabase
      .from('bidding_rounds')
      .select('id, status, organization_id')
      .eq('id', biddingRoundId)
      .single();

    if (roundError || !round) {
      return res.status(404).json({ error: 'Bidding round not found' });
    }

    if (round.organization_id !== organizationId) {
      return res.status(403).json({ error: 'Bidding round does not belong to this organization' });
    }

    if (round.status !== 'active') {
      return res.status(400).json({ error: 'Bidding round is not active' });
    }

    // Create crowd_requests entries
    const now = new Date().toISOString();
    const requestsToInsert = requests.map(req => ({
      organization_id: organizationId,
      request_type: 'song_request',
      song_title: req.song_title.trim(),
      song_artist: req.song_artist.trim(),
      requester_name: req.bidder_name?.trim() || 'Guest',
      requester_email: null,
      requester_phone: null,
      amount_requested: 0, // Bidding mode - amount is 0 initially
      amount_paid: 0,
      payment_status: 'pending',
      bidding_enabled: true,
      bidding_round_id: biddingRoundId,
      current_bid_amount: req.bid_amount, // Set initial bid amount
      highest_bidder_name: req.bidder_name?.trim() || 'Guest',
      status: 'new',
      created_at: now,
      updated_at: now
    }));

    const { data: createdRequests, error: createError } = await supabase
      .from('crowd_requests')
      .insert(requestsToInsert)
      .select('id, song_title, song_artist, current_bid_amount, highest_bidder_name');

    if (createError) {
      console.error('Error creating crowd requests:', createError);
      return res.status(500).json({ 
        error: 'Failed to create crowd requests', 
        details: createError.message 
      });
    }

    // Create bid_history entries for each request
    const bidsToInsert = createdRequests.map(req => ({
      bidding_round_id: biddingRoundId,
      request_id: req.id,
      bid_amount: req.current_bid_amount,
      bidder_name: req.highest_bidder_name,
      is_dummy: true, // Mark as dummy bid
      created_at: now
    }));

    const { error: bidError } = await supabase
      .from('bid_history')
      .insert(bidsToInsert);

    if (bidError) {
      console.error('Error creating bid history:', bidError);
      // Don't fail the request - the requests were created successfully
      // Just log the error
    }

    return res.status(200).json({
      success: true,
      created: createdRequests.length,
      requests: createdRequests.map(req => ({
        id: req.id,
        song_title: req.song_title,
        song_artist: req.song_artist,
        bid_amount: req.current_bid_amount
      }))
    });

  } catch (error) {
    // If requireAdmin already sent a response, don't send another one
    if (res.headersSent) {
      return;
    }
    
    console.error('Error creating dummy requests:', error);
    return res.status(500).json({
      error: 'Failed to create dummy requests',
      message: error.message
    });
  }
}

