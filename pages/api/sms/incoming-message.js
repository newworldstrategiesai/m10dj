// Simplified SMS webhook - based on working debug version
export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    console.log(`📱 Incoming SMS from ${From}: ${Body}`);
    
    // 1. FIRST: Send admin notification (most important)
    try {
      const adminPhone = process.env.ADMIN_PHONE_NUMBER;
      
      if (adminPhone) {
        console.log('📤 Sending admin notification...');
        
        // Format admin message
        const timestamp = new Date().toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        const displayFrom = From.startsWith('+1') ? From.substring(2) : From;
        const formattedFrom = `(${displayFrom.substring(0,3)}) ${displayFrom.substring(3,6)}-${displayFrom.substring(6)}`;

        let adminMessage = `📱 NEW TEXT MESSAGE\n\n`;
        adminMessage += `👤 From: ${formattedFrom}\n`;
        adminMessage += `⏰ Time: ${timestamp}\n\n`;
        adminMessage += `💬 Message:\n"${Body}"\n\n`;
        
        if (NumMedia && parseInt(NumMedia) > 0) {
          adminMessage += `📎 Media: ${NumMedia} attachment(s)\n\n`;
        }
        
        adminMessage += `💡 Reply directly to respond to customer`;

        // Send admin SMS
        const twilio = require('twilio');
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const smsResult = await twilioClient.messages.create({
          body: adminMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: adminPhone
        });
        
        console.log('✅ Admin SMS sent successfully:', smsResult.sid);
      } else {
        console.error('❌ No admin phone configured');
      }
    } catch (adminError) {
      console.error('❌ Admin SMS failed:', adminError);
    }
    
    // 2. SECOND: Send auto-reply to customer
    const currentHour = new Date().getHours();
    const isBusinessHours = currentHour >= 9 && currentHour < 17;

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
    console.error('❌ SMS webhook error:', error);
    
    const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(errorResponse);
  }
}
