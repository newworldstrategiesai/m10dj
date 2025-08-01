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

    // Get Twilio credentials
    let twilioSid = process.env.TWILIO_ACCOUNT_SID;
    let twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    let twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // Check environment variables
    const envStatus = {
      TWILIO_ACCOUNT_SID: !!twilioSid,
      TWILIO_AUTH_TOKEN: !!twilioAuthToken,
      TWILIO_PHONE_NUMBER: !!twilioPhone,
      maskedSid: twilioSid ? `${twilioSid.substring(0, 8)}...` : 'Not set',
      maskedPhone: twilioPhone ? `${twilioPhone.substring(0, 6)}...` : 'Not set'
    };

    if (!twilioSid || !twilioAuthToken || !twilioPhone) {
      return res.status(400).json({ 
        error: 'Twilio credentials not configured',
        envStatus
      });
    }

    // Test Twilio connection
    const client = twilio(twilioSid, twilioAuthToken);

    try {
      // Test 1: Get account info
      const account = await client.api.accounts(twilioSid).fetch();
      
      // Test 2: List recent messages (just to test API access)
      const recentMessages = await client.messages.list({ 
        limit: 5,
        from: twilioPhone
      });

      // Test 3: Get phone number info
      let phoneNumberInfo = null;
      try {
        const phoneNumbers = await client.incomingPhoneNumbers.list({ phoneNumber: twilioPhone });
        phoneNumberInfo = phoneNumbers.length > 0 ? {
          friendlyName: phoneNumbers[0].friendlyName,
          capabilities: phoneNumbers[0].capabilities,
          status: phoneNumbers[0].status
        } : 'Phone number not found in account';
      } catch (phoneError) {
        phoneNumberInfo = `Error fetching phone info: ${phoneError.message}`;
      }

      return res.status(200).json({
        success: true,
        message: 'Twilio connection successful',
        envStatus,
        account: {
          friendlyName: account.friendlyName,
          status: account.status,
          type: account.type
        },
        phoneNumber: {
          number: twilioPhone,
          info: phoneNumberInfo
        },
        recentMessages: {
          count: recentMessages.length,
          sample: recentMessages.slice(0, 2).map(msg => ({
            sid: msg.sid,
            from: msg.from,
            to: msg.to,
            body: msg.body?.substring(0, 50) + (msg.body?.length > 50 ? '...' : ''),
            dateSent: msg.dateSent,
            status: msg.status
          }))
        }
      });

    } catch (twilioError) {
      console.error('Twilio API error:', twilioError);
      
      return res.status(400).json({
        success: false,
        error: 'Twilio API connection failed',
        envStatus,
        details: {
          code: twilioError.code,
          message: twilioError.message,
          moreInfo: twilioError.moreInfo
        }
      });
    }

  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({ 
      error: 'Failed to test Twilio connection',
      details: error.message 
    });
  }
}