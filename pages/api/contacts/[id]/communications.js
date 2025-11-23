import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Unified Communications API
 * Fetches all communications (email, SMS, notes, calls) for a contact
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  try {
    const allCommunications = [];
    const contactId = id;

    // 1. Fetch SMS conversations
    const { data: smsConversations } = await supabase
      .from('sms_conversations')
      .select('*')
      .or(`phone_number.eq.${contactId},contact_id.eq.${contactId}`)
      .order('created_at', { ascending: false });

    if (smsConversations) {
      // Also try to match by phone number from contacts table
      const { data: contactData } = await supabase
        .from('contacts')
        .select('phone')
        .eq('id', contactId)
        .single();

      if (contactData?.phone) {
        const { data: phoneSMS } = await supabase
          .from('sms_conversations')
          .select('*')
          .eq('phone_number', contactData.phone)
          .order('created_at', { ascending: false });

        if (phoneSMS) {
          phoneSMS.forEach(msg => {
            allCommunications.push({
              id: msg.id || `sms-${msg.created_at}`,
              type: 'sms',
              direction: msg.direction || (msg.message_type === 'admin' ? 'outbound' : 'inbound'),
              content: msg.message_content,
              subject: null,
              status: msg.status || 'sent',
              sent_by: msg.message_type === 'admin' ? 'Admin' : 'Client',
              sent_to: msg.phone_number,
              created_at: msg.created_at,
              metadata: {
                twilio_message_sid: msg.twilio_message_sid,
                message_type: msg.message_type
              }
            });
          });
        }
      }

      // Add direct matches
      smsConversations.forEach(msg => {
        if (!allCommunications.find(c => c.id === msg.id)) {
          allCommunications.push({
            id: msg.id || `sms-${msg.created_at}`,
            type: 'sms',
            direction: msg.direction || (msg.message_type === 'admin' ? 'outbound' : 'inbound'),
            content: msg.message_content,
            subject: null,
            status: msg.status || 'sent',
            sent_by: msg.message_type === 'admin' ? 'Admin' : 'Client',
            sent_to: msg.phone_number,
            created_at: msg.created_at,
            metadata: {
              twilio_message_sid: msg.twilio_message_sid,
              message_type: msg.message_type
            }
          });
        }
      });
    }

    // 2. Fetch email tracking
    const { data: emailTracking } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (emailTracking) {
      emailTracking.forEach(email => {
        allCommunications.push({
          id: email.id || `email-${email.created_at}`,
          type: 'email',
          direction: 'outbound',
          content: email.subject || 'Email sent',
          subject: email.subject,
          status: email.opened_at ? 'read' : (email.event_type === 'sent' ? 'sent' : 'delivered'),
          sent_by: 'Admin',
          sent_to: email.recipient_email,
          created_at: email.created_at,
          metadata: {
            email_id: email.email_id,
            opened_at: email.opened_at,
            event_type: email.event_type
          }
        });
      });
    }

    // 3. Fetch communication_log entries
    // First, try to find contact_submission_id for this contact
    const { data: contactData } = await supabase
      .from('contacts')
      .select('email_address, phone')
      .eq('id', contactId)
      .single();

    if (contactData) {
      // Try to find contact_submissions by email or phone
      let submissionIds = [];
      
      if (contactData.email_address) {
        const { data: submissionsByEmail } = await supabase
          .from('contact_submissions')
          .select('id')
          .eq('email', contactData.email_address);
        
        if (submissionsByEmail) {
          submissionIds = submissionsByEmail.map(s => s.id);
        }
      }

      if (contactData.phone) {
        const { data: submissionsByPhone } = await supabase
          .from('contact_submissions')
          .select('id')
          .eq('phone', contactData.phone);
        
        if (submissionsByPhone) {
          submissionIds = [...submissionIds, ...submissionsByPhone.map(s => s.id)];
        }
      }

      if (submissionIds.length > 0) {
        const { data: commLogs } = await supabase
          .from('communication_log')
          .select('*')
          .in('contact_submission_id', submissionIds)
          .order('created_at', { ascending: false });

        if (commLogs) {
          commLogs.forEach(log => {
            allCommunications.push({
              id: log.id,
              type: log.communication_type,
              direction: log.direction,
              content: log.content,
              subject: log.subject,
              status: log.status,
              sent_by: log.sent_by || 'Admin',
              sent_to: log.sent_to,
              created_at: log.created_at,
              metadata: log.metadata || {}
            });
          });
        }
      }
    }

    // 4. Fetch notes from contacts table
    const { data: contactNotes } = await supabase
      .from('contacts')
      .select('notes, updated_at')
      .eq('id', contactId)
      .single();

    if (contactNotes?.notes) {
      // Split notes by newlines or create a single note entry
      allCommunications.push({
        id: `note-${contactId}`,
        type: 'note',
        direction: 'outbound',
        content: contactNotes.notes,
        subject: 'Contact Notes',
        status: 'active',
        sent_by: 'Admin',
        sent_to: null,
        created_at: contactNotes.updated_at || new Date().toISOString(),
        metadata: {}
      });
    }

    // Sort all communications by date (newest first)
    allCommunications.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Calculate communication analytics
    const analytics = calculateCommunicationAnalytics(allCommunications);

    return res.status(200).json({
      communications: allCommunications,
      analytics,
      total: allCommunications.length
    });

  } catch (error) {
    console.error('Error fetching communications:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch communications',
      details: error.message 
    });
  }
}

/**
 * Calculate communication analytics
 */
function calculateCommunicationAnalytics(communications) {
  const analytics = {
    total: communications.length,
    byType: {
      email: 0,
      sms: 0,
      call: 0,
      note: 0
    },
    byDirection: {
      inbound: 0,
      outbound: 0
    },
    averageResponseTime: null,
    lastContact: null,
    responseTimes: []
  };

  let lastInboundTime = null;
  let totalResponseTime = 0;
  let responseCount = 0;

  communications.forEach((comm, index) => {
    // Count by type
    if (analytics.byType[comm.type] !== undefined) {
      analytics.byType[comm.type]++;
    }

    // Count by direction
    if (analytics.byDirection[comm.direction] !== undefined) {
      analytics.byDirection[comm.direction]++;
    }

    // Calculate response times
    if (comm.direction === 'inbound') {
      lastInboundTime = new Date(comm.created_at);
    } else if (comm.direction === 'outbound' && lastInboundTime) {
      const responseTime = new Date(comm.created_at) - lastInboundTime;
      const hours = responseTime / (1000 * 60 * 60);
      analytics.responseTimes.push(hours);
      totalResponseTime += hours;
      responseCount++;
      lastInboundTime = null; // Reset after calculating
    }

    // Track last contact
    if (!analytics.lastContact || new Date(comm.created_at) > new Date(analytics.lastContact)) {
      analytics.lastContact = comm.created_at;
    }
  });

  // Calculate average response time
  if (responseCount > 0) {
    analytics.averageResponseTime = Math.round(totalResponseTime / responseCount * 10) / 10; // Round to 1 decimal
  }

  return analytics;
}

