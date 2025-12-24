import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Unified Communications API for Lead/Submission
 * Fetches all communications (email, SMS, notes, calls) for a contact_submission
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Submission ID is required' });
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

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // Use service role for queries
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    // First, verify the submission exists
    let submissionQuery = adminSupabase
      .from('contact_submissions')
      .select('id, email, phone, organization_id')
      .eq('id', id);

    // For SaaS users, filter by organization_id
    if (!isAdmin && orgId) {
      submissionQuery = submissionQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: submission, error: submissionError } = await submissionQuery.single();

    if (submissionError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const allCommunications = [];

    // 1. Fetch communication_log entries for this submission (excluding drafts from timeline)
    let commLogsQuery = adminSupabase
      .from('communication_log')
      .select('*')
      .eq('contact_submission_id', id)
      .neq('status', 'draft'); // Exclude drafts from timeline

    // Filter by organization_id for SaaS users
    if (!isAdmin && orgId) {
      commLogsQuery = commLogsQuery.eq('organization_id', orgId);
    }

    const { data: commLogs } = await commLogsQuery.order('created_at', { ascending: false });

    // 1b. Fetch draft email separately (most recent draft)
    // Drafts are stored with status='pending' and metadata->is_draft=true
    let draftQuery = adminSupabase
      .from('communication_log')
      .select('*')
      .eq('contact_submission_id', id)
      .eq('status', 'pending')
      .eq('communication_type', 'email')
      .eq('metadata->>is_draft', 'true');

    // Filter by organization_id for SaaS users
    if (!isAdmin && orgId) {
      draftQuery = draftQuery.eq('organization_id', orgId);
    }

    const { data: draftLogs } = await draftQuery
      .order('created_at', { ascending: false })
      .limit(1);
    
    const latestDraft = draftLogs && draftLogs.length > 0 ? draftLogs[0] : null;

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

    // 2. Fetch SMS conversations by phone number (if available)
    if (submission.phone) {
      let smsQuery = adminSupabase
        .from('sms_conversations')
        .select('*')
        .eq('phone_number', submission.phone);

      // Filter by organization_id for SaaS users
      if (!isAdmin && orgId) {
        smsQuery = smsQuery.eq('organization_id', orgId);
      }

      const { data: smsConversations } = await smsQuery.order('created_at', { ascending: false });

      if (smsConversations) {
        smsConversations.forEach(msg => {
          // Avoid duplicates if already in communication_log
          if (!allCommunications.find(c => c.id === msg.id && c.type === 'sms')) {
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
    }

    // 3. Fetch email tracking by email (if available)
    if (submission.email) {
      let emailTrackingQuery = adminSupabase
        .from('email_tracking')
        .select('*')
        .eq('recipient_email', submission.email);

      // Filter by organization_id for SaaS users
      if (!isAdmin && orgId) {
        emailTrackingQuery = emailTrackingQuery.eq('organization_id', orgId);
      }

      const { data: emailTracking } = await emailTrackingQuery.order('created_at', { ascending: false });

      if (emailTracking) {
        emailTracking.forEach(email => {
          // Avoid duplicates if already in communication_log
          if (!allCommunications.find(c => c.id === email.id && c.type === 'email')) {
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
          }
        });
      }
    }

    // 4. Fetch notes from contact_submissions table
    const { data: submissionNotes } = await adminSupabase
      .from('contact_submissions')
      .select('notes, updated_at')
      .eq('id', id)
      .single();

    if (submissionNotes?.notes) {
      allCommunications.push({
        id: `note-${id}`,
        type: 'note',
        direction: 'outbound',
        content: submissionNotes.notes,
        subject: 'Submission Notes',
        status: 'active',
        sent_by: 'Admin',
        sent_to: null,
        created_at: submissionNotes.updated_at || new Date().toISOString(),
        metadata: {}
      });
    }

    // 5. Add initial submission as a communication entry
    const { data: initialSubmission } = await adminSupabase
      .from('contact_submissions')
      .select('created_at, message, status')
      .eq('id', id)
      .single();

    if (initialSubmission) {
      allCommunications.push({
        id: `submission-${id}`,
        type: 'note',
        direction: 'inbound',
        content: initialSubmission.message || 'Initial contact form submission',
        subject: 'Initial Submission',
        status: 'delivered',
        sent_by: 'Client',
        sent_to: null,
        created_at: initialSubmission.created_at,
        metadata: {
          status: initialSubmission.status
        }
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
      total: allCommunications.length,
      draft: latestDraft ? {
        id: latestDraft.id,
        subject: latestDraft.subject,
        content: latestDraft.content,
        created_at: latestDraft.created_at
      } : null
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

  communications.forEach((comm) => {
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
    analytics.averageResponseTime = Math.round(totalResponseTime / responseCount * 10) / 10;
  }

  return analytics;
}

