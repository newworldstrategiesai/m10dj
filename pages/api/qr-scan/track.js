const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Generate a simple session ID from user agent and IP (for tracking without cookies)
function generateSessionId(userAgent, ipAddress) {
  // Create a simple hash-like identifier
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
    const {
      event_qr_code,
      organization_id,
      referrer,
      is_qr_scan = false,
      visitor_id // New: Accept visitor_id from frontend
    } = req.body;

    if (!event_qr_code) {
      return res.status(400).json({ error: 'event_qr_code is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user agent and IP address
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     null;

    // Generate session ID
    const sessionId = generateSessionId(userAgent, ipAddress);

    // Insert scan record
    const { data, error } = await supabase
      .from('qr_scans')
      .insert({
        event_qr_code,
        organization_id: organization_id || null,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer || null,
        session_id: sessionId,
        visitor_id: visitor_id || null, // Link to visitor tracking
        is_qr_scan: is_qr_scan === true || is_qr_scan === 'true' || is_qr_scan === 1 || is_qr_scan === '1'
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking QR scan:', error);
      return res.status(500).json({ error: 'Failed to track scan' });
    }

    // Return the scan ID so we can link it to a request later
    return res.status(200).json({ 
      success: true, 
      scan_id: data.id,
      session_id: sessionId
    });
  } catch (error) {
    console.error('Error in track QR scan:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

