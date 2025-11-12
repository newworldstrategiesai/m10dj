/**
 * API: Generate Service Selection Link
 * Creates a secure token record and returns a personalized service selection URL
 */

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_EXPIRATION_DAYS = 30;
const INFINITE_EXPIRATION_DAYS = 365 * 100; // ~100 years

const normalizeBaseUrl = (url) => {
  if (!url) return 'http://localhost:3000';
  return url.replace(/\/+$/, '');
};

const generateToken = () => {
  return crypto
    .randomBytes(24)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const resolveExpirationDays = (override) => {
  const parse = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };

  const envValue = parse(process.env.SERVICE_SELECTION_TOKEN_EXPIRATION_DAYS);
  const overrideValue = parse(override);

  let days = overrideValue ?? envValue ?? DEFAULT_EXPIRATION_DAYS;

  if (!Number.isFinite(days)) {
    days = DEFAULT_EXPIRATION_DAYS;
  }

  if (days <= 0) {
    return INFINITE_EXPIRATION_DAYS;
  }

  return days;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Missing Supabase configuration' });
  }

  const {
    contactId,
    email,
    name,
    eventType,
    eventDate,
    expiresInDays,
    forceNewToken = false,
    isResendingLink = false  // Set to true when resending to a contact who already submitted
  } = req.body;

  if (!contactId && !email) {
    return res.status(400).json({ error: 'contactId or email is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const nowIso = now.toISOString();

    // ------------------------------------------------------------------
    // Fetch or create contact
    // ------------------------------------------------------------------
    let contact = null;

    if (contactId) {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .is('deleted_at', null)
        .single();

      if (error) {
        console.error('Error fetching contact by ID:', error);
        return res.status(404).json({ error: 'Contact not found' });
      }

      contact = data;
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('email_address', email)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching contact by email:', error);
        return res.status(500).json({ error: 'Failed to look up contact' });
      }

      if (data && data.length > 0) {
        contact = data[0];
      }
    }

    if (!contact) {
      if (!email) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const nameParts = (name || 'Guest').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email_address: email,
          event_type: eventType || null,
          event_date: eventDate || null,
          lead_status: 'Service Selection Sent',
          lead_source: 'Service Selection',
          created_at: nowIso,
          updated_at: nowIso
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating contact:', createError);
        return res.status(500).json({ error: 'Failed to create contact' });
      }

      contact = newContact;
    }

    // ------------------------------------------------------------------
    // If there's an existing active token, reuse it unless forcing new
    // For resends to contacts who already submitted, always force new token
    // ------------------------------------------------------------------
    let tokenRecord = null;
    const shouldForceNew = forceNewToken || isResendingLink;

    if (!shouldForceNew) {
      console.log(`🔍 Checking for existing active tokens for contact ${contact.id}`);
      const { data: existingTokens, error: existingError } = await supabase
        .from('service_selection_tokens')
        .select('*')
        .eq('contact_id', contact.id)
        .eq('is_used', false)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingError) {
        console.error('Error checking existing tokens:', existingError);
      } else if (existingTokens && existingTokens.length > 0) {
        tokenRecord = existingTokens[0];
        console.log(`✅ Found existing active token, expires at: ${tokenRecord.expires_at}`);
      } else {
        // Check if there are any used tokens (contact has submitted before)
        const { data: usedTokens, error: usedError } = await supabase
          .from('service_selection_tokens')
          .select('*')
          .eq('contact_id', contact.id)
          .eq('is_used', true)
          .limit(1);
        
        if (usedTokens && usedTokens.length > 0) {
          console.log(`⚠️  Contact has previously submitted (${usedTokens.length} used token(s)), creating fresh token for re-submission`);
        } else {
          console.log(`ℹ️  No active tokens found, will create new one`);
        }
      }
    } else if (isResendingLink) {
      console.log(`🔄 Force creating new token for resend to contact ${contact.id} who previously submitted`);
    }

    // ------------------------------------------------------------------
    // Otherwise create a brand-new token
    // ------------------------------------------------------------------
    if (!tokenRecord) {
      const token = generateToken();
      const expiresAt = new Date(now);
      const expirationDays = resolveExpirationDays(expiresInDays);
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      console.log(`🔐 Creating new token for contact ${contact.id}`, {
        tokenPreview: token.substring(0, 10) + '...',
        expiresAt: expiresAt.toISOString(),
        expirationDays
      });

      const { data: insertedToken, error: insertError } = await supabase
        .from('service_selection_tokens')
        .insert({
          contact_id: contact.id,
          token,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error inserting service selection token:', {
          error: insertError,
          contact_id: contact.id,
          token: token.substring(0, 10) + '...'
        });
        return res.status(500).json({ error: 'Failed to create service selection token' });
      }

      console.log(`✅ Token created successfully, expires at: ${insertedToken.expires_at}`);
      tokenRecord = insertedToken;
    }

    // ------------------------------------------------------------------
    // Update contact metadata
    // ------------------------------------------------------------------
    const contactUpdates = {
      service_selection_token: tokenRecord.token,
      service_selection_sent: true,
      service_selection_sent_at: nowIso,
      updated_at: nowIso
    };

    if (eventType) {
      contactUpdates.event_type = eventType;
    }
    if (eventDate) {
      contactUpdates.event_date = eventDate;
    }

    const { error: contactUpdateError } = await supabase
      .from('contacts')
      .update(contactUpdates)
      .eq('id', contact.id);

    if (contactUpdateError) {
      console.error('Error updating contact with token metadata:', contactUpdateError);
    }

    const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
    const link = `${baseUrl}/select-services/${tokenRecord.token}`;

    return res.status(200).json({
      success: true,
      link,
      contactId: contact.id,
      tokenId: tokenRecord.id,
      token: tokenRecord.token,
      expiresAt: tokenRecord.expires_at
    });
  } catch (error) {
    console.error('Error generating service selection link:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
