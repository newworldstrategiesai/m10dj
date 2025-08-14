// Simple delayed AI response - works reliably in serverless
import { 
  getCustomerContext, 
  generateAIResponse, 
  saveConversationMessage, 
  updateContactLastCommunication,
  extractLeadInfo 
} from '../../../utils/chatgpt-sms-assistant.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, message, messageId } = req.query;
    
    if (!phone || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const phoneNumber = decodeURIComponent(phone);
    const originalMessage = decodeURIComponent(message);

    console.log(`🤖 Processing delayed AI response for ${phoneNumber}: ${originalMessage}`);

    // Check if admin has already responded
    const adminAlreadyResponded = await checkForAdminResponse(phoneNumber);
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
      
      // Send completion notification to admin
      await sendAICompletionNotification(phoneNumber, originalMessage, aiResponse, customerContext, extractedInfo);
      
      // Update contact communication info
      await updateContactLastCommunication(phoneNumber, 'ai_chat');
      
      console.log('✅ AI response sent successfully');
      
      res.status(200).json({
        success: true,
        message: 'AI response sent',
        aiResponse: aiResponse
      });
    } else {
      console.error('❌ Failed to send AI response:', twilioResponse.error);
      res.status(500).json({
        success: false,
        error: 'Failed to send AI response'
      });
    }

  } catch (error) {
    console.error('❌ AI processing error:', error);
    res.status(500).json({
      success: false,
      error: 'AI processing failed'
    });
  }
}

// Helper functions
async function checkForAdminResponse(phoneNumber) {
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
    
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('Twilio send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendAICompletionNotification(phoneNumber, customerMessage, aiResponse, context, extractedInfo) {
  try {
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    if (!adminPhone) return;

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const displayFrom = phoneNumber.startsWith('+1') ? phoneNumber.substring(2) : phoneNumber;
    const formattedFrom = `(${displayFrom.substring(0,3)}) ${displayFrom.substring(3,6)}-${displayFrom.substring(6)}`;

    let adminMessage = `✅ AI RESPONSE SENT (${timestamp})\n\n`;
    
    if (context.isExistingCustomer) {
      adminMessage += `👤 ${context.customerName}\n`;
    } else {
      adminMessage += `👤 ${formattedFrom}\n`;
    }
    
    adminMessage += `💬 "${customerMessage}"\n`;
    adminMessage += `🤖 "${aiResponse}"\n\n`;
    adminMessage += `💡 Reply anytime to take over`;

    const twilio = require('twilio');
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await twilioClient.messages.create({
      body: adminMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: adminPhone
    });
    
  } catch (error) {
    console.error('❌ Failed to send completion notification:', error);
  }
}
