import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Update contract status to 'viewed' if it's currently 'sent'
    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString()
      })
      .eq('signing_token', token)
      .eq('status', 'sent');

    if (error) {
      console.error('Error marking contract as viewed:', error);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking contract as viewed:', error);
    res.status(500).json({ error: 'Failed to update contract status' });
  }
}

