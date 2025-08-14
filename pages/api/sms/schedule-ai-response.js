// Endpoint to schedule AI responses using external service or immediate processing
import { 
  getCustomerContext, 
  generateAIResponse, 
  saveConversationMessage, 
  updateContactLastCommunication,
  extractLeadInfo 
} from '../../../utils/chatgpt-sms-assistant.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, originalMessage, messageId, delaySeconds = 60 } = req.body;
    
    if (!phoneNumber || !originalMessage) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`🕐 Processing AI response with ${delaySeconds}s delay for ${phoneNumber}`);

    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

    console.log(`🤖 Delay complete, processing AI response for ${phoneNumber}`);

    // Check if admin has already responded
    const adminAlreadyResponded = await checkForAdminResponse(phoneNumber, messageId);
    if (adminAlreadyResponded) {
      console.log('⏭️ Admin already responded, skipping AI response');
      return res.status(200).json({ 
        success: true, 
        message: 'Admin already responded, AI skipped' 
      });
    }

    // Check if AI is disabled for this customer
    const aiDisabled = await isAIDisabledForCustomer(phoneNumber);
    if (aiDisabled) {
      console.log('🚫 AI disabled for this customer');
      return res.status(200).json({ 
        success: true, 
        message: 'AI disabled for customer' 
      });
    }

    // Get customer context
    const customerContext = await getCustomerContext(phoneNumber);
    
    // Save the original message to conversation history
    await saveConversationMessage(phoneNumber, originalMessage, 'inbound', 'customer');

    // Extract lead information
    const extractedInfo = extractLeadInfo(originalMessage, customerContext);

    // Generate AI response
    const aiResponse = await generateAIResponse(originalMessage, customerContext);
    console.log('AI Response generated:', aiResponse);

    // Send AI response to customer
    const twilioResponse = await sendAIResponseToCustomer(phoneNumber, aiResponse);
    
    if (twilioResponse.success) {
      // Save AI response to conversation history
      await saveConversationMessage(phoneNumber, aiResponse, 'outbound', 'ai_assistant');
      
      // Send enhanced admin notification
      await sendAINotificationToAdmin(phoneNumber, originalMessage, aiResponse, customerContext, extractedInfo);
      
      // Update contact communication info
      await updateContactLastCommunication(phoneNumber, 'ai_chat');
      
      console.log('✅ AI response sent successfully');
      
      res.status(200).json({
        success: true,
        message: 'AI response sent',
        aiResponse: aiResponse,
        twilioSid: twilioResponse.messageSid
      });
    } else {
      console.error('❌ Failed to send AI response:', twilioResponse.error);
      res.status(500).json({
        success: false,
        error: 'Failed to send AI response',
        details: twilioResponse.error
      });
    }

  } catch (error) {
    console.error('❌ AI processing error:', error);
    res.status(500).json({
      success: false,
      error: 'AI processing failed',
      details: error.message
    });
  }
}

// Helper functions (same as in process-ai-response.js)
async function checkForAdminResponse(phoneNumber, originalMessageId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('sms_conversations')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('direction', 'outbound')
      .in('message_type', ['admin', 'manual'])
      .gte('created_at', twoMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking admin response:', error);
    return false;
  }
}

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

async function sendAIResponseToCustomer(phoneNumber, message) {
  try {
    const twilio = require('twilio');
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    
    return {
      success: true,
      messageSid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Twilio send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function sendAINotificationToAdmin(phoneNumber, customerMessage, aiResponse, context, extractedInfo) {
  try {
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    if (!adminPhone) return;

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const displayFrom = phoneNumber.startsWith('+1') ? phoneNumber.substring(2) : phoneNumber;
    const formattedFrom = `(${displayFrom.substring(0,3)}) ${displayFrom.substring(3,6)}-${displayFrom.substring(6)}`;

    let adminMessage = `🤖 AI ASSISTANT RESPONSE\n\n`;
    
    if (context.isExistingCustomer) {
      adminMessage += `👤 ${context.customerName}\n`;
      adminMessage += `🎉 ${context.eventType || 'TBD'} • ${context.eventDate || 'TBD'}\n`;
    } else {
      adminMessage += `👤 New Customer: ${formattedFrom}\n`;
    }
    
    adminMessage += `⏰ ${timestamp}\n\n`;
    adminMessage += `💬 Customer: "${customerMessage}"\n\n`;
    adminMessage += `🤖 AI replied: "${aiResponse}"\n\n`;
    
    if (Object.keys(extractedInfo).length > 0) {
      adminMessage += `📋 Detected: `;
      if (extractedInfo.eventType) adminMessage += `${extractedInfo.eventType} `;
      if (extractedInfo.possibleDate) adminMessage += `${extractedInfo.possibleDate} `;
      if (extractedInfo.guestCount) adminMessage += `${extractedInfo.guestCount} guests`;
      adminMessage += `\n\n`;
    }
    
    adminMessage += `💡 Reply to take over conversation`;

    const twilio = require('twilio');
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await twilioClient.messages.create({
      body: adminMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: adminPhone
    });
    
    console.log('✅ AI notification sent to admin');
  } catch (error) {
    console.error('❌ Failed to send AI notification:', error);
  }
}
