// Twilio webhook for incoming SMS messages
import { sendAdminSMS } from '../../../utils/sms-helper.js';

export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid } = req.body;
    
    console.log(`Incoming SMS from ${From}: ${Body}`);
    console.log('Environment check:', {
      hasAdminPhone: !!process.env.ADMIN_PHONE_NUMBER,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER
    });
    
    // Format the forwarded message with sender info
    const forwardedMessage = `📱 NEW TEXT MESSAGE

From: ${From}
To: ${To}
Message: ${Body}

Message ID: ${MessageSid}

Reply directly to this number to respond.`;

    console.log('Attempting to forward SMS to admin...');
    
    // Forward the SMS to admin
    try {
      const smsResult = await sendAdminSMS(forwardedMessage);
      console.log('SMS forward result:', smsResult);
      
      if (smsResult.success) {
        console.log(`✅ SMS successfully forwarded from ${From}: ${Body}`);
      } else {
        console.error('❌ SMS forward failed:', smsResult.error);
      }
    } catch (smsError) {
      console.error('❌ SMS forward error:', smsError);
    }
    
    // Send auto-reply to sender
    const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Thank you for contacting M10 DJ Company! 🎵 We've received your message and will respond shortly. For immediate assistance, please call (901) 410-2020 or visit m10djcompany.com</Message>
</Response>`;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(response);
    
  } catch (error) {
    console.error('Error forwarding SMS:', error);
    
    // Still return valid TwiML even on error
    const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(errorResponse);
  }
}