import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
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

    const { phoneNumber, page = 1, pageSize = 50 } = req.query;

    // Get Twilio credentials
    let twilioSid = process.env.TWILIO_ACCOUNT_SID;
    let twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    let twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // Try to get user-specific credentials if available
    try {
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('twilio_sid, twilio_auth_token')
        .eq('user_id', session.user.id)
        .single();

      if (apiKeys?.twilio_sid && apiKeys?.twilio_auth_token) {
        twilioSid = apiKeys.twilio_sid;
        twilioAuthToken = apiKeys.twilio_auth_token;
      }
    } catch (err) {
      console.log('No user-specific Twilio credentials found, using environment variables');
    }

    if (!twilioSid || !twilioAuthToken || !twilioPhone) {
      return res.status(400).json({ error: 'Twilio credentials not configured' });
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
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id);

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
    
    // Provide more specific error messages
    if (error.code === 20003) {
      return res.status(401).json({ error: 'Invalid Twilio credentials' });
    } else if (error.code === 20404) {
      return res.status(404).json({ error: 'Twilio phone number not found' });
    } else if (error.status === 429) {
      return res.status(429).json({ error: 'Twilio API rate limit exceeded' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch SMS messages from Twilio',
      details: error.message 
    });
  }
}