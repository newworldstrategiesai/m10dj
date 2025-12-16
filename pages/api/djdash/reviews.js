/**
 * API endpoint to fetch DJ reviews
 * GET /api/djdash/reviews?dj_profile_id=xxx
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dj_profile_id } = req.query;

    if (!dj_profile_id) {
      return res.status(400).json({ error: 'dj_profile_id is required' });
    }

    // Fetch verified and approved reviews
    const { data: reviews, error } = await supabase
      .from('dj_reviews')
      .select('*')
      .eq('dj_profile_id', dj_profile_id)
      .eq('is_verified', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    return res.status(200).json({
      reviews: reviews || [],
      count: reviews?.length || 0
    });
  } catch (error) {
    console.error('Error in reviews API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

