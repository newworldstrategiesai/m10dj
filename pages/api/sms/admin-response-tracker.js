// Track admin responses to prevent AI interference
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, messageContent, twilioMessageSid } = req.body;

    if (!phoneNumber || !messageContent) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`👨‍💼 Admin response detected for ${phoneNumber}: ${messageContent}`);

    // Get organization_id from contact lookup
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let organizationId = null;
    
    const { data: contact } = await supabase
      .from('contacts')
      .select('organization_id')
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (contact?.organization_id) {
      organizationId = contact.organization_id;
    }

    // 1. Save admin response to conversation history
    const { error: saveError } = await supabase
      .from('sms_conversations')
      .insert([{
        phone_number: phoneNumber,
        message_content: messageContent,
        direction: 'outbound',
        message_type: 'admin',
        twilio_message_sid: twilioMessageSid,
        organization_id: organizationId, // Set organization_id for multi-tenant isolation
        created_at: new Date().toISOString()
      }]);

    if (saveError) {
      console.error('Error saving admin response:', saveError);
    }

    // 2. Cancel any pending AI responses for this phone number (filter by organization_id if available)
    let cancelQuery = supabase
      .from('pending_ai_responses')
      .update({ 
        status: 'cancelled',
        processed_at: new Date().toISOString(),
        error_message: 'Admin responded - AI cancelled'
      })
      .eq('phone_number', phoneNumber)
      .eq('status', 'pending');
    
    if (organizationId) {
      cancelQuery = cancelQuery.eq('organization_id', organizationId);
    }
    
    const { error: cancelError } = await cancelQuery;

    if (cancelError) {
      console.error('Error cancelling pending AI responses:', cancelError);
    }

    // 3. Update contact's last communication info
    await updateContactCommunication(phoneNumber);

    res.status(200).json({ 
      success: true, 
      message: 'Admin response tracked and AI responses cancelled' 
    });

  } catch (error) {
    console.error('Error tracking admin response:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track admin response' 
    });
  }
}

/**
 * Update contact's communication tracking
 */
async function updateContactCommunication(phoneNumber) {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    const { error } = await supabase
      .from('contacts')
      .update({
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'sms',
        messages_sent_count: supabase.raw('COALESCE(messages_sent_count, 0) + 1')
      })
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null);

    if (error) {
      console.error('Error updating contact communication:', error);
    }
  } catch (error) {
    console.error('Error in updateContactCommunication:', error);
  }
}
