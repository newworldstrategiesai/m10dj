// API endpoint to update requester name for a crowd request
const { createClient } = require('@supabase/supabase-js');
const { requireAdmin } = require('@/utils/auth-helpers/api-auth');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure only authenticated admins can access this
    // requireAdmin throws an error if not authenticated/admin, so we catch it
    await requireAdmin(req, res);
  } catch (authError) {
    // If requireAdmin throws, it has already sent the response, so we just return
    // But we need to check if response was already sent
    if (!res.headersSent) {
      // If it's an auth error, requireAdmin should have sent the response
      // But if it didn't, we'll send a generic error
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return;
  }

  const { requestId, requesterName } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  if (!requesterName || !requesterName.trim()) {
    return res.status(400).json({ error: 'Requester name is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the requester name
    const { data, error } = await supabase
      .from('crowd_requests')
      .update({
        requester_name: requesterName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating requester name:', error);
      return res.status(500).json({ 
        error: 'Failed to update requester name',
        details: error.message 
      });
    }

    console.log(`✅ Updated requester name for request ${requestId}: ${requesterName.trim()}`);

    return res.status(200).json({
      success: true,
      request: data
    });
  } catch (error) {
    console.error('Error updating requester name:', error);
    return res.status(500).json({
      error: 'Failed to update requester name',
      message: error.message,
    });
  }
}

