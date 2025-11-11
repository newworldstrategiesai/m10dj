// Intelligent SMS webhook with ChatGPT assistant
import { 
  getCustomerContext, 
  generateAIResponse, 
  saveConversationMessage, 
  updateContactLastCommunication,
  extractLeadInfo,
  updateContactName
} from '../../../utils/chatgpt-sms-assistant.js';

export default async function handler(req, res) {
  try {
    const { From, To, Body, MessageSid, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    console.log(`🤖 AI SMS from ${From}: ${Body}`);
    
    // 1. Get customer context from database
    const customerContext = await getCustomerContext(From);
    console.log('Customer context:', {
      isExisting: customerContext.isExistingCustomer,
      name: customerContext.customerName,
      eventType: customerContext.eventType,
      leadStatus: customerContext.leadStatus
    });
    
    // 2. Save incoming message to conversation history
    await saveConversationMessage(From, Body, 'inbound', 'customer');
    
    // 3. Extract any new lead information from the message
    const extractedInfo = extractLeadInfo(Body, customerContext);
    console.log('Extracted info:', extractedInfo);
    
    // 3.5. Update contact name if detected in message
    if (extractedInfo.nameDetected && extractedInfo.firstName) {
      console.log(`🏷️ Name detected: ${extractedInfo.firstName} ${extractedInfo.lastName || ''}`);
      const nameUpdateResult = await updateContactName(
        From, 
        extractedInfo.firstName, 
        extractedInfo.lastName
      );
      if (nameUpdateResult.updated) {
        console.log('✅ Contact name automatically updated from SMS introduction');
      } else if (nameUpdateResult.skipped) {
        console.log('ℹ️ Contact already has a name, skipped update');
      }
    }
    
    // 4. Generate AI response with full context
    const aiResponse = await generateAIResponse(Body, customerContext);
    console.log('AI Response:', aiResponse);
    
    // 5. Send AI response to customer
    let twilioResponse = null;
    try {
      const twilio = require('twilio');
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      twilioResponse = await twilioClient.messages.create({
        body: aiResponse,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: From
      });
      
      console.log('✅ AI response sent:', twilioResponse.sid);
      
      // Save AI response to conversation history
      await saveConversationMessage(From, aiResponse, 'outbound', 'ai_assistant');
      
    } catch (smsError) {
      console.error('❌ Failed to send AI response:', smsError);
      
      // Send fallback response
      const fallbackMessage = `Thank you for contacting M10 DJ Company! 🎵 We're experiencing a brief technical issue, but Ben will personally respond within 30 minutes. For immediate assistance: (901) 497-7001`;
      
      try {
        const twilio = require('twilio');
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        
        await twilioClient.messages.create({
          body: fallbackMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: From
        });
        
        await saveConversationMessage(From, fallbackMessage, 'outbound', 'auto_reply');
      } catch (fallbackError) {
        console.error('❌ Fallback message also failed:', fallbackError);
      }
    }
    
    // 6. Send enhanced admin notification with AI context
    await sendEnhancedAdminNotification(From, Body, customerContext, aiResponse, extractedInfo);
    
    // 7. Update contact's last communication info
    await updateContactLastCommunication(From, 'ai_chat');
    
    // 8. Return TwiML response (empty since we handle responses manually)
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
</Response>`;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twimlResponse);
    
  } catch (error) {
    console.error('❌ AI SMS webhook error:', error);
    
    // Send basic fallback response on complete failure
    try {
      const fallbackMessage = `Thank you for contacting M10 DJ Company! Ben will respond personally within 30 minutes. For immediate assistance: (901) 497-7001`;
      
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${fallbackMessage}</Message>
</Response>`;

      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(twimlResponse);
    } catch (finalError) {
      console.error('❌ Final fallback failed:', finalError);
      res.status(500).json({ error: 'SMS processing failed' });
    }
  }
}

/**
 * Send enhanced admin notification with AI context
 */
async function sendEnhancedAdminNotification(customerPhone, customerMessage, context, aiResponse, extractedInfo) {
  try {
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    if (!adminPhone) return;
    
    // Format timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Format phone number for display
    const displayFrom = customerPhone.startsWith('+1') ? customerPhone.substring(2) : customerPhone;
    const formattedFrom = `(${displayFrom.substring(0,3)}) ${displayFrom.substring(3,6)}-${displayFrom.substring(6)}`;

    // Build enhanced admin message
    let adminMessage = `🤖 AI ASSISTANT CONVERSATION\n\n`;
    
    // Customer info
    if (context.isExistingCustomer) {
      adminMessage += `👤 Customer: ${context.customerName}\n`;
      adminMessage += `📞 Phone: ${formattedFrom}\n`;
      adminMessage += `🎉 Event: ${context.eventType || 'TBD'}\n`;
      adminMessage += `📅 Date: ${context.eventDate || 'TBD'}\n`;
      adminMessage += `🏢 Venue: ${context.venue || 'TBD'}\n`;
      adminMessage += `📊 Status: ${context.leadStatus}\n`;
    } else {
      adminMessage += `👤 New Customer: ${formattedFrom}\n`;
      adminMessage += `🆕 First interaction\n`;
    }
    
    adminMessage += `⏰ Time: ${timestamp}\n\n`;
    
    // Customer message
    adminMessage += `💬 Customer said:\n"${customerMessage}"\n\n`;
    
    // AI response
    adminMessage += `🤖 AI responded:\n"${aiResponse}"\n\n`;
    
    // Extracted information
    if (Object.keys(extractedInfo).length > 0) {
      adminMessage += `📋 Detected info:\n`;
      if (extractedInfo.nameDetected && extractedInfo.firstName) {
        adminMessage += `👤 Name: ${extractedInfo.firstName} ${extractedInfo.lastName || ''}\n`;
      }
      if (extractedInfo.eventType) adminMessage += `Event: ${extractedInfo.eventType}\n`;
      if (extractedInfo.possibleDate) adminMessage += `Date: ${extractedInfo.possibleDate}\n`;
      if (extractedInfo.guestCount) adminMessage += `Guests: ${extractedInfo.guestCount}\n`;
      adminMessage += `\n`;
    }
    
    // Action items
    adminMessage += `💡 Actions:\n`;
    adminMessage += `• Review conversation in admin dashboard\n`;
    adminMessage += `• Take over if booking discussion gets serious\n`;
    adminMessage += `• Reply "STOP AI" to disable AI for this customer\n\n`;
    
    adminMessage += `📱 Dashboard: m10djcompany.com/admin/contacts`;

    // Send admin notification
    const twilio = require('twilio');
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const adminSMS = await twilioClient.messages.create({
      body: adminMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: adminPhone
    });
    
    console.log('✅ Enhanced admin notification sent:', adminSMS.sid);
    
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
  }
}

/**
 * Check if AI should be disabled for this customer
 * @param {string} phoneNumber - Customer phone number
 * @returns {boolean} Whether AI is disabled
 */
async function isAIDisabledForCustomer(phoneNumber) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    const { data, error } = await supabase
      .from('contacts')
      .select('custom_fields')
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null)
      .single();
    
    if (error || !data) return false;
    
    return data.custom_fields?.ai_disabled === true;
  } catch (error) {
    console.error('Error checking AI status:', error);
    return false;
  }
}

/**
 * Disable AI for a specific customer
 * @param {string} phoneNumber - Customer phone number
 */
export async function disableAIForCustomer(phoneNumber) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    const { error } = await supabase
      .from('contacts')
      .update({
        custom_fields: { ai_disabled: true },
        notes: `AI assistant disabled on ${new Date().toLocaleDateString()}`
      })
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null);
    
    if (error) {
      console.error('Error disabling AI:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error disabling AI for customer:', error);
    return false;
  }
}
