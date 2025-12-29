// API endpoint to fetch success page views for multiple requests at once
const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('@/utils/auth-helpers/api-auth');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

  const { request_ids } = req.body;

  if (!request_ids || !Array.isArray(request_ids) || request_ids.length === 0) {
    return res.status(400).json({ error: 'request_ids array is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all success page views for these requests
    const { data: views, error } = await supabase
      .from('success_page_views')
      .select('*')
      .in('request_id', request_ids)
      .order('viewed_at', { ascending: true });

    if (error) {
      console.error('Error fetching bulk success page views:', error);
      return res.status(500).json({ error: 'Failed to fetch success page views' });
    }

    // Group by request_id for easier lookup
    const viewsByRequest = {};
    (views || []).forEach(view => {
      if (!viewsByRequest[view.request_id]) {
        viewsByRequest[view.request_id] = [];
      }
      viewsByRequest[view.request_id].push(view);
    });

    return res.status(200).json({
      success: true,
      views: views || [],
      viewsByRequest
    });
  } catch (error) {
    console.error('Error in bulk fetch success page views:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

