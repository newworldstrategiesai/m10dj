// Twilio webhook for incoming SMS messages - Simple & Reliable Version
import { sendAdminSMS } from '../../../utils/sms-helper.js';

export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    console.log(`📱 Incoming SMS from ${From}: ${Body}`);
    console.log('Environment check:', {
      hasAdminPhone: !!process.env.ADMIN_PHONE_NUMBER,
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER
    });
    
    // Enhanced message formatting with better context
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Format phone number for display (remove +1 for US numbers)
    const displayFrom = From.startsWith('+1') ? From.substring(2) : From;
    const formattedFrom = `(${displayFrom.substring(0,3)}) ${displayFrom.substring(3,6)}-${displayFrom.substring(6)}`;

    let forwardedMessage = `📱 NEW TEXT MESSAGE\n\n`;
    forwardedMessage += `👤 From: ${formattedFrom}\n`;
    forwardedMessage += `📞 To: M10 DJ Business Line\n`;
    forwardedMessage += `⏰ Time: ${timestamp}\n\n`;
    forwardedMessage += `💬 Message:\n"${Body}"\n\n`;
    
    // Add media notification if present
    if (NumMedia && parseInt(NumMedia) > 0) {
      forwardedMessage += `📎 Media: ${NumMedia} attachment(s)\n`;
      if (MediaContentType0) {
        forwardedMessage += `📄 Type: ${MediaContentType0}\n`;
      }
      forwardedMessage += `\n`;
    }
    
    forwardedMessage += `🆔 Message ID: ${MessageSid}\n\n`;
    forwardedMessage += `💡 Reply directly to respond to customer\n`;
    forwardedMessage += `📱 View details: m10djcompany.com/admin/dashboard`;

    console.log('🔄 Attempting to forward SMS to admin...');
    
    // Forward the SMS to admin - SIMPLE & RELIABLE
    try {
      const smsResult = await sendAdminSMS(forwardedMessage);
      console.log('📱 SMS forward result:', smsResult);
      
      if (smsResult.success) {
        console.log(`✅ SMS successfully forwarded from ${From}: ${Body}`);
      } else {
        console.error('❌ SMS forward failed:', smsResult.error);
        
        // Try backup admin numbers if available
        if (process.env.BACKUP_ADMIN_PHONE) {
          console.log('🔄 Trying backup admin phone...');
          try {
            const backupResult = await sendAdminSMS(forwardedMessage, process.env.BACKUP_ADMIN_PHONE);
            console.log('📱 Backup SMS result:', backupResult);
          } catch (backupError) {
            console.error('❌ Backup SMS also failed:', backupError);
          }
        }
      }
    } catch (smsError) {
      console.error('❌ SMS forward error:', smsError);
    }
    
    // Enhanced auto-reply to sender
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 9 && currentHour < 17; // 9 AM to 5 PM
    
    let autoReplyMessage = `Thank you for contacting M10 DJ Company! 🎵\n\n`;
    autoReplyMessage += `We've received your message and `;
    
    if (isBusinessHours) {
      autoReplyMessage += `will respond within 30 minutes during business hours.\n\n`;
    } else {
      autoReplyMessage += `will respond first thing during business hours (9 AM - 5 PM CST).\n\n`;
    }
    
    autoReplyMessage += `For immediate assistance:\n`;
    autoReplyMessage += `📞 Call Ben: (901) 497-7001\n`;
    autoReplyMessage += `💻 Visit: m10djcompany.com\n`;
    autoReplyMessage += `📧 Email: djbenmurray@gmail.com\n\n`;
    autoReplyMessage += `We're excited to help make your event unforgettable!`;

    const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${autoReplyMessage}</Message>
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
