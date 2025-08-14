// Enhanced SMS webhook with instant auto-reply + delayed AI response
import { getCustomerContext, generateAIResponse } from '../../../utils/chatgpt-sms-assistant.js';

export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    console.log(`📱 Incoming SMS from ${From}: ${Body}`);
    
    // 1. FIRST: Generate AI preview and send enhanced admin notification
    let aiPreview = null;
    try {
      console.log('🤖 Generating AI preview for admin...');
      const customerContext = await getCustomerContext(From);
      aiPreview = await generateAIResponse(Body, customerContext);
      console.log('✅ AI preview generated');
    } catch (aiError) {
      console.error('❌ AI preview generation failed:', aiError);
    }

    try {
      const adminPhone = process.env.ADMIN_PHONE_NUMBER;
      
      if (adminPhone) {
        console.log('📤 Sending enhanced admin notification...');
        
        // Format admin message with AI preview
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

        // Add AI suggested response
        if (aiPreview) {
          adminMessage += `🤖 AI Suggests:\n"${aiPreview}"\n\n`;
          adminMessage += `💡 Reply within 60s to override AI\n`;
          adminMessage += `📋 Or copy/paste AI response above`;
        } else {
          adminMessage += `💡 Reply within 60 seconds to prevent AI response`;
        }

        // Send admin SMS
        const twilio = require('twilio');
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        const smsResult = await twilioClient.messages.create({
          body: adminMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: adminPhone
        });
        
        console.log('✅ Enhanced admin SMS sent successfully:', smsResult.sid);
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

    // 3. THIRD: Schedule delayed AI response using simple URL approach
    try {
      console.log('📅 Scheduling delayed AI response...');
      
      // Create a delayed URL that can be triggered manually or via external service
      const delayedUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/sms/simple-delayed-ai?phone=${encodeURIComponent(From)}&message=${encodeURIComponent(Body)}&messageId=${MessageSid}`;
      
      console.log('🔗 Delayed AI URL created:', delayedUrl);
      
      // Store the delay request in database for manual triggering if needed
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabase
          .from('pending_ai_responses')
          .insert([{
            phone_number: From,
            original_message: Body,
            original_message_id: MessageSid,
            scheduled_for: new Date(Date.now() + 60000).toISOString(),
            status: 'pending'
          }]);
        
        console.log('✅ AI delay request stored in database');
      } catch (dbError) {
        console.error('❌ Failed to store delay request:', dbError);
      }
      
      // Use external delay service (you can replace this with any delay service)
      // For testing, we'll use setTimeout with a fallback
      setTimeout(async () => {
        try {
          const response = await fetch(delayedUrl);
          console.log('✅ Delayed AI triggered:', response.ok ? 'success' : 'failed');
        } catch (error) {
          console.error('❌ Delayed AI trigger failed:', error);
        }
      }, 60000); // 60 seconds
      
      console.log('✅ AI response scheduled for 60 seconds');
    } catch (scheduleError) {
      console.error('❌ Failed to schedule AI response:', scheduleError);
    }

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
