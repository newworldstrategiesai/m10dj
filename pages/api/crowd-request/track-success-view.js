// API endpoint to track success page views
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Generate a simple session ID from user agent and IP (for tracking without cookies)
function generateSessionId(userAgent, ipAddress) {
  const str = `${userAgent || ''}-${ipAddress || ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `session_${Math.abs(hash)}_${Date.now()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { request_id } = req.body;

    if (!request_id) {
      return res.status(400).json({ error: 'request_id is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request to find organization_id
    const { data: request, error: requestError } = await supabase
      .from('crowd_requests')
      .select('id, organization_id')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Get user agent and IP address
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     null;

    // Generate session ID
    const sessionId = generateSessionId(userAgent, ipAddress);

    // Check if this is the first view for this request
    const { data: existingViews, error: checkError } = await supabase
      .from('success_page_views')
      .select('id')
      .eq('request_id', request_id)
      .limit(1);

    const isFirstView = !checkError && (!existingViews || existingViews.length === 0);

    // Get referrer
    const referrer = req.headers.referer || null;

    // Insert view record
    const { data, error } = await supabase
      .from('success_page_views')
      .insert({
        request_id,
        organization_id: request.organization_id || null,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer,
        session_id: sessionId,
        is_first_view: isFirstView
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking success page view:', error);
      return res.status(500).json({ error: 'Failed to track success page view' });
    }

    return res.status(200).json({ 
      success: true, 
      view_id: data.id,
      session_id: sessionId,
      is_first_view: isFirstView
    });
  } catch (error) {
    console.error('Error in track success page view:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

