// API endpoint to get bid history for a request
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, res);

    const { requestId } = req.query;

    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the request to find its bidding round
    const { data: request, error: requestError } = await supabase
      .from('crowd_requests')
      .select('bidding_round_id, bidding_enabled')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (!request.bidding_enabled || !request.bidding_round_id) {
      return res.status(200).json({ bids: [] });
    }

    // Get all bids for this request in the bidding round
    const { data: bids, error: bidsError } = await supabase
      .from('bid_history')
      .select('*')
      .eq('request_id', requestId)
      .eq('bidding_round_id', request.bidding_round_id)
      .order('created_at', { ascending: false });

    if (bidsError) {
      console.error('Error fetching bid history:', bidsError);
      return res.status(500).json({ error: 'Failed to fetch bid history' });
    }

    // Get bidding round info
    const { data: round } = await supabase
      .from('bidding_rounds')
      .select('*')
      .eq('id', request.bidding_round_id)
      .single();

    res.status(200).json({
      bids: bids || [],
      round: round || null
    });

  } catch (error) {
    console.error('Error fetching bid history:', error);
    
    if (res.headersSent) {
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch bid history',
      details: error.message 
    });
  }
}

