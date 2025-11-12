// Enhanced SMS webhook with instant auto-reply + delayed AI response using OpenAI Agents
import { processSMSWithAgent, extractLeadInfo, updateContactName } from '../../../utils/sms-agent.js';

export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    console.log(`📱 Incoming SMS from ${From}: ${Body}`);
    
    // 0. Extract lead info and update contact name if introduced
    try {
      const extractedInfo = extractLeadInfo(Body, {});
      if (extractedInfo.nameDetected && extractedInfo.firstName) {
        console.log(`🏷️ Name detected: ${extractedInfo.firstName} ${extractedInfo.lastName || ''}`);
        const nameUpdateResult = await updateContactName(
          From, 
          extractedInfo.firstName, 
          extractedInfo.lastName
        );
        if (nameUpdateResult.updated) {
          console.log('✅ Contact name automatically updated from SMS introduction');
        }
      }
    } catch (nameError) {
      console.error('❌ Error extracting/updating name:', nameError);
      // Non-critical, continue processing
    }
    
    // 1. FIRST: Generate AI preview and send enhanced admin notification
    let aiPreview = null;
    let aiGenerationSuccess = false;
    
    try {
      console.log('🤖 Generating AI preview for admin using OpenAI Agents...');
      console.log('📋 Processing SMS with agent...');

      // Use the new SMS agent to generate response
      aiPreview = await processSMSWithAgent(From, Body);

      // Validate the AI response
      if (aiPreview && aiPreview.trim().length > 0) {
        aiGenerationSuccess = true;
        console.log('✅ AI preview generated successfully with OpenAI Agents');
        console.log(`📝 AI Response Preview: "${aiPreview.substring(0, 100)}..."`);
      } else {
        console.warn('⚠️ AI response was empty or invalid');
        aiPreview = null;
      }
    } catch (aiError) {
      console.error('❌ AI preview generation failed:', aiError);
      aiPreview = null;
      aiGenerationSuccess = false;
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
        if (aiGenerationSuccess && aiPreview) {
          adminMessage += `🤖 AI Suggests:\n"${aiPreview}"\n\n`;
          adminMessage += `💡 Reply within 60s to override AI\n`;
          adminMessage += `📋 Or copy/paste AI response above`;
        } else if (aiGenerationSuccess === false) {
          adminMessage += `❌ AI generation failed - no auto-response will be sent\n`;
          adminMessage += `💡 Please reply manually`;
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
    if (aiGenerationSuccess && aiPreview) {
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
          console.log(`📋 Auto-reply sent: "${autoReplyMessage.substring(0, 50)}..."`);
          console.log(`🤖 AI response queued: "${aiPreview.substring(0, 50)}..."`);
          console.log('🔄 These are two DIFFERENT messages - auto-reply is immediate, AI response is delayed');
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
