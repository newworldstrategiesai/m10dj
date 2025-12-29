// API endpoint to find organization_id from event code
// This helps event-specific request pages determine which organization to use
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventCode } = req.query;

  if (!eventCode) {
    return res.status(400).json({ error: 'Event code is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to find an existing request with the same event code to get its organization
    const { data: existingRequest, error } = await supabase
      .from('crowd_requests')
      .select('organization_id')
      .eq('event_qr_code', eventCode)
      .not('organization_id', 'is', null)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error finding organization from event code:', error);
    }

    if (existingRequest?.organization_id) {
      return res.status(200).json({
        organizationId: existingRequest.organization_id,
        source: 'existing_request'
      });
    }

    // If no existing request found, return null
    // The backend will use fallback detection methods
    return res.status(200).json({
      organizationId: null,
      source: 'not_found'
    });
  } catch (error) {
    console.error('Error finding organization:', error);
    return res.status(200).json({
      organizationId: null,
      source: 'error',
      error: error.message
    });
  }
}

