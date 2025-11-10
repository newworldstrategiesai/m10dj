/**
 * Validate Service Selection Token
 * Checks if a token is valid and returns associated contact info
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_EXPIRATION_DAYS = 30;
const INFINITE_EXPIRATION_DAYS = 365 * 100; // ~100 years

const resolveExpirationDays = () => {
  const value = Number(process.env.SERVICE_SELECTION_TOKEN_EXPIRATION_DAYS);

  if (Number.isFinite(value)) {
    if (value <= 0) {
      return INFINITE_EXPIRATION_DAYS;
    }

    return value;
  }

  return DEFAULT_EXPIRATION_DAYS;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      valid: false,
      error: 'Missing Supabase configuration' 
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const nowIso = now.toISOString();
    const expirationDays = resolveExpirationDays();

    let refreshed = false;
    let created = false;

    // ------------------------------------------------------------------
    // Attempt to fetch the token record
    // ------------------------------------------------------------------
    let { data: tokenData, error: tokenError } = await supabase
      .from('service_selection_tokens')
      .select('*, contacts(*)')
      .eq('token', token)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // ------------------------------------------------------------------
    // If no token row, fall back to the contacts table using stored token
    // ------------------------------------------------------------------
    if (tokenError || !tokenData) {
      const { data: contactFallback, error: contactFallbackError } = await supabase
        .from('contacts')
        .select('*')
        .eq('service_selection_token', token)
        .is('deleted_at', null)
        .single();

      if (contactFallbackError || !contactFallback) {
        return res.status(404).json({
          valid: false,
          error: 'Token not found'
        });
      }

      const expiresAt = addDays(now, expirationDays).toISOString();

      const { data: insertedToken, error: insertError } = await supabase
        .from('service_selection_tokens')
        .insert({
          contact_id: contactFallback.id,
          token,
          expires_at: expiresAt
        })
        .select('*, contacts(*)')
        .single();

      if (insertError || !insertedToken) {
        console.error('Error recreating token from contact fallback:', insertError);
        return res.status(500).json({
          valid: false,
          error: 'Unable to restore token'
        });
      }

      tokenData = insertedToken;
      created = true;
    }

    if (!tokenData) {
      return res.status(404).json({
        valid: false,
        error: 'Token not found'
      });
    }

    const contact = tokenData.contacts;

    // ------------------------------------------------------------------
    // Refresh expiration if necessary so the same link keeps working
    // ------------------------------------------------------------------
    const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
    if (!expiresAt || expiresAt < now) {
      const newExpiresAt = addDays(now, expirationDays).toISOString();

      const { data: updatedToken, error: updateError } = await supabase
        .from('service_selection_tokens')
        .update({ expires_at: newExpiresAt })
        .eq('id', tokenData.id)
        .select('*, contacts(*)')
        .single();

      if (!updateError && updatedToken) {
        tokenData = updatedToken;
        refreshed = true;
      } else if (updateError) {
        console.error('Error refreshing token expiration:', updateError);
      }
    }

    // ------------------------------------------------------------------
    // Ensure contact metadata stays in sync (sent flags, token)
    // ------------------------------------------------------------------
    const contactId = contact?.id || tokenData.contact_id;

    if (contactId) {
      await supabase
        .from('contacts')
        .update({
          service_selection_token: tokenData.token,
          service_selection_sent: true,
          service_selection_sent_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', contactId);
    }

    // ------------------------------------------------------------------
    // If already submitted, keep existing messaging but never error
    // ------------------------------------------------------------------
    if (tokenData.is_used) {
      return res.status(200).json({
        valid: true,
        already_used: true,
        refreshed,
        created,
        used_at: tokenData.used_at,
        contact: contact
          ? {
              first_name: contact.first_name,
              event_type: contact.event_type
            }
          : null,
        message: 'You have already submitted your selections. We\'ll be in touch soon!'
      });
    }

    if (!contact) {
      return res.status(500).json({
        valid: false,
        error: 'Contact details unavailable for token'
      });
    }

    return res.status(200).json({
      valid: true,
      already_used: false,
      refreshed,
      created,
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

