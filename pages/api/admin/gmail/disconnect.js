import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        gmail_access_token: null,
        gmail_refresh_token: null,
        gmail_token_expiry: null,
        gmail_email_address: null,
        gmail_connected_at: null,
        email_provider: 'resend'
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error disconnecting Gmail:', updateError);
      return res.status(500).json({ 
        error: 'Failed to disconnect Gmail',
        details: updateError.message 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Gmail disconnected successfully' 
    });
  } catch (error) {
    console.error('Error in disconnect Gmail:', error);
    return res.status(500).json({ 
      error: 'Failed to disconnect Gmail',
      details: error.message 
    });
  }
}

