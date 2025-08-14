// Cron job to process pending AI responses (runs every minute)
export default async function handler(req, res) {
  // Verify this is a legitimate cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔄 Processing pending AI responses...');

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get all pending AI responses that are ready to be sent
    const now = new Date().toISOString();
    const { data: pendingResponses, error: fetchError } = await supabase
      .from('pending_ai_responses')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now) // Ready to be sent
      .order('scheduled_for', { ascending: true })
      .limit(10); // Process up to 10 at a time

    if (fetchError) {
      console.error('❌ Error fetching pending responses:', fetchError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!pendingResponses || pendingResponses.length === 0) {
      console.log('✅ No pending AI responses to process');
      return res.status(200).json({ 
        success: true, 
        message: 'No pending responses',
        processed: 0 
      });
    }

    console.log(`📤 Processing ${pendingResponses.length} pending AI responses`);

    let processed = 0;
    let errors = 0;

    // Process each pending response
    for (const pendingResponse of pendingResponses) {
      try {
        const result = await processPendingResponse(pendingResponse, supabase);
        if (result.success) {
          processed++;
          console.log(`✅ Processed AI response for ${pendingResponse.phone_number}`);
        } else {
          errors++;
          console.error(`❌ Failed to process AI response for ${pendingResponse.phone_number}:`, result.error);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error processing response ID ${pendingResponse.id}:`, error);
      }
    }

    console.log(`🎯 Cron job completed: ${processed} processed, ${errors} errors`);

    res.status(200).json({
      success: true,
      processed,
      errors,
      total: pendingResponses.length
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    res.status(500).json({
      success: false,
      error: 'Cron job failed',
      details: error.message
    });
  }
}

/**
 * Process a single pending AI response
 */
async function processPendingResponse(pendingResponse, supabase) {
  const { id, phone_number, original_message, ai_response } = pendingResponse;

  try {
    // Check if admin has already responded
    const adminAlreadyResponded = await checkForAdminResponse(phone_number, supabase);
    if (adminAlreadyResponded) {
      console.log(`⏭️ Admin already responded to ${phone_number}, cancelling AI`);
      
      await supabase
        .from('pending_ai_responses')
        .update({ 
          status: 'cancelled',
          processed_at: new Date().toISOString(),
          error_message: 'Admin responded - AI cancelled'
        })
        .eq('id', id);

      return { success: true, message: 'Admin override - cancelled' };
    }

    // Check if AI is disabled for this customer
    const aiDisabled = await isAIDisabledForCustomer(phone_number, supabase);
    if (aiDisabled) {
      console.log(`🚫 AI disabled for ${phone_number}`);
      
      await supabase
        .from('pending_ai_responses')
        .update({ 
          status: 'cancelled',
          processed_at: new Date().toISOString(),
          error_message: 'AI disabled for customer'
        })
        .eq('id', id);

      return { success: true, message: 'AI disabled - cancelled' };
    }

    // Send the AI response to customer
    const twilioResponse = await sendAIResponseToCustomer(phone_number, ai_response);
    
    if (twilioResponse.success) {
      // Save messages to conversation history
      await saveConversationMessages(phone_number, original_message, ai_response, supabase);
      
      // Send completion notification to admin
      await sendCompletionNotification(phone_number, original_message, ai_response);
      
      // Update contact communication info
      await updateContactLastCommunication(phone_number);
      
      // Mark as processed
      await supabase
        .from('pending_ai_responses')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('id', id);
      
      return { success: true, messageSid: twilioResponse.messageSid };
    } else {
      // Mark as failed
      await supabase
        .from('pending_ai_responses')
        .update({ 
          status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: twilioResponse.error
        })
        .eq('id', id);
      
      return { success: false, error: twilioResponse.error };
    }

  } catch (error) {
    console.error(`❌ Error processing pending response ${id}:`, error);
    
    // Mark as failed
    await supabase
      .from('pending_ai_responses')
      .update({ 
        status: 'failed',
        processed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('id', id);
    
    return { success: false, error: error.message };
  }
}

// Helper functions
async function checkForAdminResponse(phoneNumber, supabase) {
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
}

async function isAIDisabledForCustomer(phoneNumber, supabase) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  const { data, error } = await supabase
    .from('contacts')
    .select('custom_fields')
    .ilike('phone', `%${cleanPhone}%`)
    .is('deleted_at', null)
    .single();
  
  if (error || !data) return false;
  
  return data.custom_fields?.ai_disabled === true;
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

async function saveConversationMessages(phoneNumber, originalMessage, aiResponse, supabase) {
  try {
    // Save both original and AI response to conversation history
    await supabase
      .from('sms_conversations')
      .insert([
        {
          phone_number: phoneNumber,
          message_content: originalMessage,
          direction: 'inbound',
          message_type: 'customer',
          created_at: new Date().toISOString()
        },
        {
          phone_number: phoneNumber,
          message_content: aiResponse,
          direction: 'outbound',
          message_type: 'ai_assistant',
          created_at: new Date().toISOString()
        }
      ]);
  } catch (error) {
    console.error('Error saving conversation messages:', error);
  }
}

async function sendCompletionNotification(phoneNumber, customerMessage, aiResponse) {
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

    let adminMessage = `✅ AI SENT (${timestamp})\n\n`;
    adminMessage += `👤 ${formattedFrom}\n`;
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

async function updateContactLastCommunication(phoneNumber) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    await supabase
      .from('contacts')
      .update({
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'ai_chat',
        messages_sent_count: supabase.raw('COALESCE(messages_sent_count, 0) + 1')
      })
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null);
  } catch (error) {
    console.error('Error updating contact communication:', error);
  }
}
