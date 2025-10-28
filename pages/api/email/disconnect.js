/**
 * Disconnect Email Account API
 * Removes OAuth tokens and disconnects Gmail integration
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all OAuth tokens
    const { error } = await supabase
      .from('email_oauth_tokens')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('Error deleting tokens:', error);
      return res.status(500).json({ error: 'Failed to disconnect email' });
    }

    console.log('✅ Email account disconnected');

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error disconnecting email:', error);
    res.status(500).json({ error: 'Failed to disconnect email' });
  }
}

