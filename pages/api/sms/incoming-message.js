// Twilio webhook for incoming SMS messages
import { sendAdminSMS } from '../../../utils/sms-helper';

export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid } = req.body;
    
    // Format the forwarded message with sender info
    const forwardedMessage = `📱 NEW TEXT MESSAGE

From: ${From}
To: ${To}
Message: ${Body}

Message ID: ${MessageSid}

Reply directly to this number to respond.`;

    // Forward the SMS to admin
    await sendAdminSMS(forwardedMessage);
    
    console.log(`SMS forwarded from ${From}: ${Body}`);
    
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