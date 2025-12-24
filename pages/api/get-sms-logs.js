import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context (null for admins, org_id for SaaS users)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    const { phoneNumber, page = 1, pageSize = 50 } = req.query;

    // Get Twilio credentials - trim whitespace which is a common issue
    let twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    let twilioAuthToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    let twilioPhone = process.env.TWILIO_PHONE_NUMBER?.trim();
    let apiKeys = null; // Track if we're using database credentials

    // Try to get user-specific credentials if available
    try {
      const { data: dbApiKeys, error: apiKeysError } = await supabase
        .from('api_keys')
        .select('twilio_sid, twilio_auth_token')
        .eq('user_id', session.user.id)
        .single();

      if (apiKeysError) {
        console.log('API keys query error:', apiKeysError.message);
      }

      if (dbApiKeys?.twilio_sid && dbApiKeys?.twilio_auth_token) {
        // Trim whitespace from database values too
        twilioSid = dbApiKeys.twilio_sid.trim();
        twilioAuthToken = dbApiKeys.twilio_auth_token.trim();
        apiKeys = dbApiKeys; // Store for error logging
        console.log('Using database-stored Twilio credentials');
      } else {
        console.log('No database credentials, using environment variables');
      }
    } catch (err) {
      console.log('Error fetching user-specific Twilio credentials:', err.message);
      console.log('Falling back to environment variables');
    }

    // Log credential status (without exposing actual values)
    console.log('Twilio credential check:', {
      hasSid: !!twilioSid,
      sidLength: twilioSid?.length || 0,
      hasToken: !!twilioAuthToken,
      tokenLength: twilioAuthToken?.length || 0,
      hasPhone: !!twilioPhone,
      phone: twilioPhone
    });

    if (!twilioSid || !twilioAuthToken || !twilioPhone) {
      return res.status(400).json({ 
        error: 'Twilio credentials not configured',
        details: {
          missingSid: !twilioSid,
          missingToken: !twilioAuthToken,
          missingPhone: !twilioPhone
        }
      });
    }

    // Initialize Twilio client
    const client = twilio(twilioSid, twilioAuthToken);

    // Fetch messages from Twilio
    const messageOptions = {
      limit: parseInt(pageSize),
      pageSize: parseInt(pageSize)
    };

    // Filter by specific phone number if provided
    if (phoneNumber) {
      // Fetch messages to/from specific number
      const [sentMessages, receivedMessages] = await Promise.all([
        client.messages.list({ 
          ...messageOptions,
          from: twilioPhone,
          to: phoneNumber 
        }),
        client.messages.list({ 
          ...messageOptions,
          from: phoneNumber,
          to: twilioPhone 
        })
      ]);
      
      const allMessages = [...sentMessages, ...receivedMessages]
        .sort((a, b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime())
        .slice(0, parseInt(pageSize));

      return res.status(200).json({
        messages: allMessages.map(msg => ({
          id: msg.sid,
          from: msg.from,
          to: msg.to,
          body: msg.body,
          dateSent: msg.dateSent,
          direction: msg.from === twilioPhone ? 'outbound' : 'inbound',
          status: msg.status,
          messagingServiceSid: msg.messagingServiceSid,
          accountSid: msg.accountSid
        })),
        total: allMessages.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    }

    // Fetch all recent messages from Twilio phone number
    const [sentMessages, receivedMessages] = await Promise.all([
      client.messages.list({ 
        ...messageOptions,
        from: twilioPhone
      }),
      client.messages.list({ 
        ...messageOptions,
        to: twilioPhone
      })
    ]);

    // Combine and sort all messages
    const allMessages = [...sentMessages, ...receivedMessages]
      .sort((a, b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime())
      .slice(0, parseInt(pageSize));

    // Get local contacts for matching names
    // For SaaS users, filter by organization_id. Platform admins see all contacts.
    let contactsQuery = supabase
      .from('contacts')
      .select('*')
      .is('deleted_at', null);

    if (!isAdmin && orgId) {
      contactsQuery = contactsQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      // SaaS user without organization - return empty contacts
      contactsQuery = contactsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible match
    }

    const { data: contacts } = await contactsQuery;

    // Transform messages and match with contacts
    const transformedMessages = allMessages.map(msg => {
      const otherPartyPhone = msg.from === twilioPhone ? msg.to : msg.from;
      const normalizedPhone = otherPartyPhone.replace(/\D/g, '');
      
      // Find matching contact
      const contact = contacts?.find(c => {
        const normalizedContactPhone = c.phone?.replace(/\D/g, '');
        return normalizedContactPhone === normalizedPhone;
      });

      return {
        id: msg.sid,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        dateSent: msg.dateSent,
        direction: msg.from === twilioPhone ? 'outbound' : 'inbound',
        status: msg.status,
        messagingServiceSid: msg.messagingServiceSid,
        accountSid: msg.accountSid,
        contact: contact ? {
          first_name: contact.first_name,
          last_name: contact.last_name,
          phone: contact.phone,
          email_address: contact.email_address,
          company: contact.company,
          lead_status: contact.lead_status,
          lead_source: contact.lead_source,
          opt_in_status: contact.opt_in_status,
          notes: contact.notes
        } : null
      };
    });

    res.status(200).json({
      messages: transformedMessages,
      total: transformedMessages.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      twilioPhone: twilioPhone
    });

  } catch (error) {
    console.error('Twilio API error:', error);
    
    // Log credential info when authentication fails (without exposing actual values)
    // Note: twilioSid, twilioAuthToken, and apiKeys might not be defined if error occurred early
    const hasTwilioSid = typeof twilioSid !== 'undefined';
    const hasTwilioAuthToken = typeof twilioAuthToken !== 'undefined';
    const hasApiKeys = typeof apiKeys !== 'undefined';
    
    if (error.code === 20003) {
      console.error('Twilio Authentication Failed - Debug Info:', {
        hasSid: hasTwilioSid && !!twilioSid,
        sidLength: hasTwilioSid && twilioSid ? twilioSid.length : 0,
        sidStartsWith: hasTwilioSid && twilioSid ? twilioSid.substring(0, 3) : 'N/A',
        hasToken: hasTwilioAuthToken && !!twilioAuthToken,
        tokenLength: hasTwilioAuthToken && twilioAuthToken ? twilioAuthToken.length : 0,
        usingDatabaseCredentials: hasApiKeys && apiKeys?.twilio_sid ? true : false,
        errorCode: error.code,
        errorMessage: error.message
      });
      
      // Check if we're using database credentials - suggest checking them
      const credentialSource = apiKeys?.twilio_sid ? 'database (api_keys table)' : 'environment variables';
      
      return res.status(401).json({ 
        error: 'Invalid Twilio credentials',
        details: `Authentication failed with credentials from ${credentialSource}. Please verify your Account SID and Auth Token are correct.`,
        hint: 'Check if credentials in database/api_keys table are overriding correct environment variables',
        code: error.code
      });
    } else if (error.code === 20404) {
      return res.status(404).json({ error: 'Twilio phone number not found' });
    } else if (error.status === 429) {
      return res.status(429).json({ error: 'Twilio API rate limit exceeded' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch SMS messages from Twilio',
      details: error.message,
      code: error.code
    });
  }
}