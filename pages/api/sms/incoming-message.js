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

    // 3. THIRD: Schedule delayed AI response using pre-generated response
    if (aiPreview) {
      try {
        console.log('📅 Scheduling delayed AI response with pre-generated content...');
        
        // Store the pre-generated AI response in database
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: pendingResponse, error: insertError } = await supabase
          .from('pending_ai_responses')
          .insert([{
            phone_number: From,
            original_message: Body,
            original_message_id: MessageSid,
            ai_response: aiPreview, // Store the pre-generated response
            scheduled_for: new Date(Date.now() + 60000).toISOString(),
            status: 'pending'
          }])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Failed to store AI response:', insertError);
        } else {
          console.log('✅ Pre-generated AI response stored in database');
          console.log(`🕐 AI response will be sent by cron job at: ${new Date(Date.now() + 60000).toLocaleTimeString()}`);
          console.log('✅ AI response scheduled for cron job processing');
        }
      } catch (scheduleError) {
        console.error('❌ Failed to schedule pre-generated AI response:', scheduleError);
      }
    } else {
      console.log('⏭️ No AI preview generated, skipping delayed response');
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
