import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, body, from } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, body' });
    }

    // Get Twilio credentials from environment or database - trim whitespace
    let twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    let twilioAuthToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    let twilioPhone = from?.trim() || process.env.TWILIO_PHONE_NUMBER?.trim();

    // Try to get user-specific credentials if available
    try {
      const { data: apiKeys, error: apiKeysError } = await supabase
        .from('api_keys')
        .select('twilio_sid, twilio_auth_token')
        .eq('user_id', session.user.id)
        .single();

      if (apiKeysError) {
        console.log('API keys query error:', apiKeysError.message);
      }

      if (apiKeys?.twilio_sid && apiKeys?.twilio_auth_token) {
        // Trim whitespace from database values
        twilioSid = apiKeys.twilio_sid.trim();
        twilioAuthToken = apiKeys.twilio_auth_token.trim();
        console.log('Using database-stored Twilio credentials for SMS send');
      }
    } catch (err) {
      console.log('Error fetching user-specific credentials:', err.message);
    }

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

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: body,
      from: twilioPhone,
      to: to
    });

    // Optionally store message in database for faster access
    let messageData = null;
    try {
      const { data, error: dbError } = await supabase
        .from('messages')
        .insert([
          {
            user_id: session.user.id,
            contact_id: to,
            content: body,
            direction: 'outbound',
            status: message.status,
            twilio_message_sid: message.sid,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (!dbError) {
        messageData = data;
      } else {
        console.warn('Failed to store message in database:', dbError.message);
        // Continue anyway since Twilio message was sent successfully
      }
    } catch (dbError) {
      console.warn('Database storage error (non-critical):', dbError.message);
      // Continue anyway since Twilio message was sent successfully
    }

    res.status(200).json({
      success: true,
      messageSid: message.sid,
      status: message.status,
      dateSent: message.dateCreated,
      from: message.from,
      to: message.to,
      body: message.body,
      message: messageData,
      twilioResponse: {
        sid: message.sid,
        status: message.status,
        direction: 'outbound-api',
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      }
    });

  } catch (error) {
    console.error('SMS send error:', error);
    res.status(500).json({ 
      error: 'Failed to send SMS',
      details: error.message 
    });
  }
}