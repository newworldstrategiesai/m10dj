/**
 * Validate Service Selection Token
 * Checks if a token is valid and returns associated contact info
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get token details
    const { data: tokenData, error: tokenError } = await supabase
      .from('service_selection_tokens')
      .select('*, contacts(*)')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return res.status(404).json({ 
        valid: false,
        error: 'Token not found' 
      });
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt < now) {
      return res.status(401).json({ 
        valid: false,
        error: 'Token expired',
        expired: true
      });
    }

    // Check if already used
    if (tokenData.is_used) {
      return res.status(200).json({ 
        valid: true,
        already_used: true,
        used_at: tokenData.used_at,
        contact: {
          first_name: tokenData.contacts.first_name,
          event_type: tokenData.contacts.event_type
        },
        message: 'You have already submitted your selections. We\'ll be in touch soon!'
      });
    }

    // Token is valid
    const contact = tokenData.contacts;

    res.status(200).json({
      valid: true,
      already_used: false,
      token_id: tokenData.id,
      contact: {
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email_address: contact.email_address || contact.primary_email,
        phone: contact.phone,
        event_type: contact.event_type,
        event_date: contact.event_date,
        venue_name: contact.venue_name,
        venue_address: contact.venue_address,
        guest_count: contact.guest_count,
        budget_range: contact.budget_range
      },
      expires_at: tokenData.expires_at
    });

  } catch (error) {
    console.error('❌ Error validating token:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Token validation failed',
      message: error.message 
    });
  }
}

