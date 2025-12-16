import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('email_provider, gmail_email_address, gmail_connected_at, gmail_token_expiry')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const isConnected = org.email_provider === 'gmail' && org.gmail_email_address;
    const tokenExpiry = org.gmail_token_expiry ? new Date(org.gmail_token_expiry) : null;
    const isExpired = tokenExpiry && tokenExpiry.getTime() < Date.now();

    return res.status(200).json({
      connected: isConnected && !isExpired,
      email: org.gmail_email_address || null,
      connectedAt: org.gmail_connected_at || null,
      provider: org.email_provider || 'resend',
      tokenExpired: isExpired
    });
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    return res.status(500).json({ 
      error: 'Failed to check Gmail status',
      details: error.message 
    });
  }
}

