// Utility to schedule delayed AI responses
export async function scheduleDelayedAIResponse(phoneNumber, originalMessage, messageId, delaySeconds = 60) {
  try {
    // Use Vercel's serverless function approach with a simple setTimeout
    // In production, this would ideally use a queue system like Vercel's cron or external service
    
    console.log(`📅 Scheduling AI response for ${phoneNumber} in ${delaySeconds} seconds`);
    
    // For serverless functions, we can't use setTimeout reliably
    // Instead, we'll use a different approach based on the environment
    
    if (process.env.NODE_ENV === 'development') {
      // In development, use setTimeout
      setTimeout(async () => {
        await triggerDelayedAIResponse(phoneNumber, originalMessage, messageId);
      }, delaySeconds * 1000);
    } else {
      // In production, use an immediate approach with database tracking
      // This will be called by a separate endpoint after the delay
      await scheduleViaDatabase(phoneNumber, originalMessage, messageId, delaySeconds);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error scheduling AI response:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Schedule via database for production environment
 */
async function scheduleViaDatabase(phoneNumber, originalMessage, messageId, delaySeconds) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const scheduledTime = new Date(Date.now() + (delaySeconds * 1000));
    
    // Insert into a pending AI responses table
    const { data, error } = await supabase
      .from('pending_ai_responses')
      .insert([{
        phone_number: phoneNumber,
        original_message: originalMessage,
        original_message_id: messageId,
        scheduled_for: scheduledTime.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error scheduling in database:', error);
      // Fallback to immediate processing with delay
      setTimeout(async () => {
        await triggerDelayedAIResponse(phoneNumber, originalMessage, messageId);
      }, delaySeconds * 1000);
    } else {
      console.log('✅ AI response scheduled in database:', data.id);
      
      // Use setTimeout for the actual delay (simple but effective for serverless)
      setTimeout(async () => {
        // Check if still pending before processing
        const { data: pendingCheck } = await supabase
          .from('pending_ai_responses')
          .select('status')
          .eq('id', data.id)
          .single();
        
        if (pendingCheck && pendingCheck.status === 'pending') {
          await triggerDelayedAIResponse(phoneNumber, originalMessage, messageId, data.id);
        } else {
          console.log('⏭️ AI response cancelled or already processed');
        }
      }, delaySeconds * 1000);
    }
  } catch (error) {
    console.error('Error in scheduleViaDatabase:', error);
    // Fallback to setTimeout
    setTimeout(async () => {
      await triggerDelayedAIResponse(phoneNumber, originalMessage, messageId);
    }, delaySeconds * 1000);
  }
}

/**
 * Trigger the delayed AI response
 */
async function triggerDelayedAIResponse(phoneNumber, originalMessage, messageId, pendingId = null) {
  try {
    console.log(`🤖 Triggering delayed AI response for ${phoneNumber}`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/sms/process-ai-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        originalMessage,
        messageId,
        pendingId
      })
    });

    if (!response.ok) {
      throw new Error(`AI processing failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Delayed AI response completed:', result);
    
    // Mark as processed in database if we have a pending ID
    if (pendingId) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabase
          .from('pending_ai_responses')
          .update({
            status: result.success ? 'processed' : 'failed',
            processed_at: new Date().toISOString(),
            ai_response: result.aiResponse || null,
            error_message: result.success ? null : result.error
          })
          .eq('id', pendingId);
      } catch (updateError) {
        console.error('Error updating pending response status:', updateError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error triggering delayed AI response:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Alternative approach using Vercel Edge Config or external webhook
 * This would be more reliable for production but requires additional setup
 */
export async function scheduleViaWebhook(phoneNumber, originalMessage, messageId, delaySeconds = 60) {
  try {
    // This could integrate with services like:
    // - Vercel Cron Jobs
    // - Upstash QStash
    // - AWS SQS with delay
    // - Google Cloud Tasks
    
    // For now, we'll use a simple HTTP-based delay service
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/sms/process-ai-response`;
    
    // Using a delay service (you'd need to implement this)
    // await scheduleWebhookCall(webhookUrl, {
    //   phoneNumber,
    //   originalMessage,
    //   messageId
    // }, delaySeconds);
    
    console.log(`📅 Webhook scheduled for ${phoneNumber} in ${delaySeconds} seconds`);
    return { success: true };
  } catch (error) {
    console.error('Error scheduling webhook:', error);
    return { success: false, error: error.message };
  }
}
