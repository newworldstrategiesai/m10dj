import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getViewAsOrgIdFromRequest } from '@/utils/auth-helpers/view-as';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get view-as organization ID from cookie (if admin is viewing as another org)
    const viewAsOrgId = getViewAsOrgIdFromRequest(req);

    // Get organization context (null for admins, org_id for SaaS users, or viewAsOrgId if in view-as mode)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email,
      viewAsOrgId
    );

    // Use service role for queries
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    // First, verify the contact exists and belongs to the user's organization
    let contactQuery = adminSupabase
      .from('contacts')
      .select('id, organization_id, phone, email_address')
      .eq('id', id)
      .is('deleted_at', null);

    // For SaaS users, filter by organization_id. Platform admins see all contacts.
    if (!isAdmin && orgId) {
      contactQuery = contactQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: contact, error: contactError } = await contactQuery.single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const allCommunications = [];
    const contactId = id;

    // 1. Fetch SMS conversations
    let smsQuery = adminSupabase
      .from('sms_conversations')
      .select('*')
      .or(`phone_number.eq.${contactId},contact_id.eq.${contactId}`);

    // Filter by organization_id for SaaS users
    if (!isAdmin && orgId) {
      smsQuery = smsQuery.eq('organization_id', orgId);
    }

    const { data: smsConversations } = await smsQuery.order('created_at', { ascending: false });

    if (smsConversations) {
      // Also try to match by phone number from contacts table
      const { data: contactData } = await supabase
        .from('contacts')
        .select('phone')
        .eq('id', contactId)
        .single();

      if (contact?.phone) {
        let phoneSMSQuery = adminSupabase
          .from('sms_conversations')
          .select('*')
          .eq('phone_number', contact.phone);

        // Filter by organization_id for SaaS users
        if (!isAdmin && orgId) {
          phoneSMSQuery = phoneSMSQuery.eq('organization_id', orgId);
        }

        const { data: phoneSMS } = await phoneSMSQuery.order('created_at', { ascending: false });

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
    let emailTrackingQuery = adminSupabase
      .from('email_tracking')
      .select('*')
      .eq('contact_id', contactId);

    // Filter by organization_id for SaaS users
    if (!isAdmin && orgId) {
      emailTrackingQuery = emailTrackingQuery.eq('organization_id', orgId);
    }

    const { data: emailTracking } = await emailTrackingQuery.order('created_at', { ascending: false });

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
    // Use contact data we already fetched
    if (contact) {
      // Try to find contact_submissions by email or phone
      let submissionIds = [];
      
      if (contact.email_address) {
        let submissionsQuery = adminSupabase
          .from('contact_submissions')
          .select('id')
          .eq('email', contact.email_address);

        // Filter by organization_id for SaaS users
        if (!isAdmin && orgId) {
          submissionsQuery = submissionsQuery.eq('organization_id', orgId);
        }

        const { data: submissionsByEmail } = await submissionsQuery;
        
        if (submissionsByEmail) {
          submissionIds = submissionsByEmail.map(s => s.id);
        }
      }

      if (contact.phone) {
        let submissionsQuery = adminSupabase
          .from('contact_submissions')
          .select('id')
          .eq('phone', contact.phone);

        // Filter by organization_id for SaaS users
        if (!isAdmin && orgId) {
          submissionsQuery = submissionsQuery.eq('organization_id', orgId);
        }

        const { data: submissionsByPhone } = await submissionsQuery;
        
        if (submissionsByPhone) {
          submissionIds = [...submissionIds, ...submissionsByPhone.map(s => s.id)];
        }
      }

      if (submissionIds.length > 0) {
        let commLogsQuery = adminSupabase
          .from('communication_log')
          .select('*')
          .in('contact_submission_id', submissionIds);

        // Filter by organization_id for SaaS users
        if (!isAdmin && orgId) {
          commLogsQuery = commLogsQuery.eq('organization_id', orgId);
        }

        const { data: commLogs } = await commLogsQuery.order('created_at', { ascending: false });

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

    // 4. Fetch notes from contacts table (already verified above)
    const { data: contactNotes } = await adminSupabase
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

