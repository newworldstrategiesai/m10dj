// Immediate trigger for delayed AI response (better for serverless)
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
    const { phoneNumber, originalMessage, messageId } = req.body;
    
    if (!phoneNumber || !originalMessage) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`🤖 Processing immediate AI response for ${phoneNumber}: ${originalMessage}`);

    // Check if admin has already responded in the last 2 minutes
    const adminAlreadyResponded = await checkForAdminResponse(phoneNumber, messageId);
    if (adminAlreadyResponded) {
      console.log('⏭️ Admin already responded, skipping AI response');
      return res.status(200).json({ 
        success: true, 
        message: 'Admin already responded, AI skipped',
        skipped: true 
      });
    }

    // Check if AI is disabled for this customer
    const aiDisabled = await isAIDisabledForCustomer(phoneNumber);
    if (aiDisabled) {
      console.log('🚫 AI disabled for this customer');
      return res.status(200).json({ 
        success: true, 
        message: 'AI disabled for customer',
        skipped: true 
      });
    }

    // Get customer context
    const customerContext = await getCustomerContext(phoneNumber);
    console.log('Customer context loaded:', {
      isExisting: customerContext.isExistingCustomer,
      name: customerContext.customerName,
      eventType: customerContext.eventType
    });

    // Save the original message to conversation history (if not already saved)
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
      
      // Send enhanced admin notification about AI response
      await sendAICompletionNotification(phoneNumber, originalMessage, aiResponse, customerContext, extractedInfo);
      
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

/**
 * Check if admin has responded since the original message
 */
async function checkForAdminResponse(phoneNumber, originalMessageId) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check for any outbound messages from admin in the last 2 minutes
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

    if (error) {
      console.error('Error checking admin response:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error in checkForAdminResponse:', error);
    return false;
  }
}

/**
 * Check if AI is disabled for this customer
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
 * Send AI response to customer via Twilio
 */
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

/**
 * Send completion notification to admin after AI responds
 */
async function sendAICompletionNotification(phoneNumber, customerMessage, aiResponse, context, extractedInfo) {
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
    const displayFrom = phoneNumber.startsWith('+1') ? phoneNumber.substring(2) : phoneNumber;
    const formattedFrom = `(${displayFrom.substring(0,3)}) ${displayFrom.substring(3,6)}-${displayFrom.substring(6)}`;

    let adminMessage = `✅ AI RESPONSE SENT\n\n`;
    
    // Customer info
    if (context.isExistingCustomer) {
      adminMessage += `👤 ${context.customerName}\n`;
      adminMessage += `🎉 ${context.eventType || 'TBD'} • ${context.eventDate || 'TBD'}\n`;
    } else {
      adminMessage += `👤 New Customer: ${formattedFrom}\n`;
    }
    
    adminMessage += `⏰ ${timestamp}\n\n`;
    adminMessage += `💬 Customer: "${customerMessage}"\n\n`;
    adminMessage += `🤖 AI sent: "${aiResponse}"\n\n`;
    
    // Extracted info
    if (Object.keys(extractedInfo).length > 0) {
      adminMessage += `📋 Detected: `;
      if (extractedInfo.eventType) adminMessage += `${extractedInfo.eventType} `;
      if (extractedInfo.possibleDate) adminMessage += `${extractedInfo.possibleDate} `;
      if (extractedInfo.guestCount) adminMessage += `${extractedInfo.guestCount} guests`;
      adminMessage += `\n\n`;
    }
    
    adminMessage += `💡 Reply anytime to take over conversation`;

    // Send notification
    const twilio = require('twilio');
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await twilioClient.messages.create({
      body: adminMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: adminPhone
    });
    
    console.log('✅ AI completion notification sent to admin');
  } catch (error) {
    console.error('❌ Failed to send AI completion notification:', error);
  }
}
