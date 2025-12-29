// API endpoint to fetch success page views for a request
const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('@/utils/auth-helpers/api-auth');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure only authenticated admins can access this
  try {
    await requireAdmin(req, res);
  } catch (error) {
    // requireAdmin throws an error if not authenticated/admin, and already sends response
    // If response wasn't sent (unlikely but possible), send one now
    if (!res.headersSent) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    // Always return early after auth failure
    return;
  }

  const { request_id } = req.query;

  if (!request_id) {
    return res.status(400).json({ error: 'request_id is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all success page views for this request, ordered by viewed_at
    const { data: views, error } = await supabase
      .from('success_page_views')
      .select('*')
      .eq('request_id', request_id)
      .order('viewed_at', { ascending: true });

    if (error) {
      console.error('Error fetching success page views:', error);
      return res.status(500).json({ error: 'Failed to fetch success page views' });
    }

    return res.status(200).json({
      success: true,
      views: views || []
    });
  } catch (error) {
    console.error('Error in fetch success page views:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

