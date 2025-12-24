// Manual endpoint to reprocess a failed bidding round
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireAdmin(req, res);
  } catch (error) {
    return; // requireAdmin already sent response
  }

  const { roundId } = req.body;

  if (!roundId) {
    return res.status(400).json({ error: 'roundId is required' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the round
    const { data: round, error: roundError } = await supabase
      .from('bidding_rounds')
      .select('*')
      .eq('id', roundId)
      .single();

    if (roundError || !round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    // Import the processing function
    const { processBiddingRound } = require('../cron/process-bidding-rounds');
    
    // Process the round
    await processBiddingRound(supabase, stripe, round);

    res.status(200).json({
      success: true,
      message: 'Round processed successfully'
    });

  } catch (error) {
    console.error('Error reprocessing round:', error);
    
    // Notify admin of failure
    await notifyAdminBiddingFailure(
      roundId,
      null,
      `Manual reprocess failed: ${error.message}`,
      { error: error.message, stack: error.stack }
    );

    res.status(500).json({
      error: 'Failed to reprocess round',
      message: error.message
    });
  }
}

