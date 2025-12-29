const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');
const { createClient } = require('@supabase/supabase-js');
const { isPlatformAdmin } = require('@/utils/auth-helpers/platform-admin');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require admin authentication
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user is admin
  const isAdmin = isPlatformAdmin(session.user.email);
  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { requestId, venmoUsername } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  if (!venmoUsername || !venmoUsername.trim()) {
    return res.status(400).json({ error: 'Venmo username is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Clean the username (ensure it starts with @)
    let cleanUsername = venmoUsername.trim();
    if (!cleanUsername.startsWith('@')) {
      cleanUsername = '@' + cleanUsername;
    }

    // Update the request with the Venmo username
    const { data, error } = await supabaseAdmin
      .from('crowd_requests')
      .update({ 
        requester_venmo_username: cleanUsername,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating Venmo username:', error);
      return res.status(500).json({
        error: 'Failed to update Venmo username',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      request: data,
    });
  } catch (error) {
    console.error('Error updating Venmo username:', error);
    return res.status(500).json({
      error: 'Failed to update Venmo username',
      message: error.message,
    });
  }
}

