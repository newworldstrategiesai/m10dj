// Send pre-generated AI response that was stored in database
import { 
  saveConversationMessage, 
  updateContactLastCommunication,
  extractLeadInfo,
  getCustomerContext 
} from '../../../utils/chatgpt-sms-assistant.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing pending response ID' });
    }

    console.log(`📤 Processing stored AI response ID: ${id}`);

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the stored AI response
    const { data: pendingResponse, error: fetchError } = await supabase
      .from('pending_ai_responses')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !pendingResponse) {
      console.log('⏭️ No pending response found or already processed');
      return res.status(200).json({ 
        success: true, 
        message: 'No pending response found' 
      });
    }

    const { phone_number, original_message, ai_response, original_message_id } = pendingResponse;

    console.log(`🤖 Sending stored AI response to ${phone_number}: ${ai_response}`);

    // Check if admin has already responded
    const adminAlreadyResponded = await checkForAdminResponse(phone_number);
    if (adminAlreadyResponded) {
      console.log('⏭️ Admin already responded, cancelling AI response');
      
      // Mark as cancelled
      await supabase
        .from('pending_ai_responses')
        .update({ 
          status: 'cancelled',
          processed_at: new Date().toISOString(),
          error_message: 'Admin responded - AI cancelled'
        })
        .eq('id', id);

      return res.status(200).json({ 
        success: true, 
        message: 'Admin already responded, AI cancelled' 
      });
    }

    // Check if AI is disabled for this customer
    const aiDisabled = await isAIDisabledForCustomer(phone_number);
    if (aiDisabled) {
      console.log('🚫 AI disabled for this customer');
      
      // Mark as cancelled
      await supabase
        .from('pending_ai_responses')
        .update({ 
          status: 'cancelled',
          processed_at: new Date().toISOString(),
          error_message: 'AI disabled for customer'
        })
        .eq('id', id);

      return res.status(200).json({ 
        success: true, 
        message: 'AI disabled for customer' 
      });
    }

    // Send the stored AI response to customer
    const twilioResponse = await sendAIResponseToCustomer(phone_number, ai_response);
    
    if (twilioResponse.success) {
      // Save original message to conversation history (if not already saved)
      await saveConversationMessage(phone_number, original_message, 'inbound', 'customer');
      
      // Save AI response to conversation history
      await saveConversationMessage(phone_number, ai_response, 'outbound', 'ai_assistant');
      
      // Get customer context for completion notification
      const customerContext = await getCustomerContext(phone_number);
      const extractedInfo = extractLeadInfo(original_message, customerContext);
      
      // Send completion notification to admin
      await sendAICompletionNotification(phone_number, original_message, ai_response, customerContext, extractedInfo);
      
      // Update contact communication info
      await updateContactLastCommunication(phone_number, 'ai_chat');
      
      // Mark as processed
      await supabase
        .from('pending_ai_responses')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', id);
      
      console.log('✅ Stored AI response sent successfully');
      
      res.status(200).json({
        success: true,
        message: 'Stored AI response sent',
        aiResponse: ai_response,
        twilioSid: twilioResponse.messageSid
      });
    } else {
      console.error('❌ Failed to send stored AI response:', twilioResponse.error);
      
      // Mark as failed
      await supabase
        .from('pending_ai_responses')
        .update({ 
          status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: twilioResponse.error
        })
        .eq('id', id);
      
      res.status(500).json({
        success: false,
        error: 'Failed to send stored AI response',
        details: twilioResponse.error
      });
    }

  } catch (error) {
    console.error('❌ Error processing stored AI response:', error);
    res.status(500).json({
      success: false,
      error: 'Processing failed',
      details: error.message
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
      if (context.eventType) {
        adminMessage += `🎉 ${context.eventType}`;
        if (context.eventDate) adminMessage += ` • ${context.eventDate}`;
        adminMessage += `\n`;
      }
    } else {
      adminMessage += `👤 New Customer: ${formattedFrom}\n`;
    }
    
    adminMessage += `💬 "${customerMessage}"\n`;
    adminMessage += `🤖 "${aiResponse}"\n\n`;
    
    if (Object.keys(extractedInfo).length > 0) {
      adminMessage += `📋 Detected: `;
      if (extractedInfo.eventType) adminMessage += `${extractedInfo.eventType} `;
      if (extractedInfo.possibleDate) adminMessage += `${extractedInfo.possibleDate} `;
      if (extractedInfo.guestCount) adminMessage += `${extractedInfo.guestCount} guests`;
      adminMessage += `\n\n`;
    }
    
    adminMessage += `💡 Reply anytime to take over conversation`;

    const twilio = require('twilio');
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await twilioClient.messages.create({
      body: adminMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: adminPhone
    });
    
    console.log('✅ AI completion notification sent to admin');
  } catch (error) {
    console.error('❌ Failed to send completion notification:', error);
  }
}
