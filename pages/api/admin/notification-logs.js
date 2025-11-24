// API endpoint for fetching notification logs
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context (null for admins, org_id for SaaS users)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // Use service role for queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Build query for notification logs
    let logsQuery = supabaseAdmin
      .from('notification_log')
      .select(`
        id,
        contact_submission_id,
        notification_type,
        sms_success,
        sms_attempts,
        sms_error,
        sms_phone_used,
        email_success,
        email_error,
        total_attempts,
        successful_methods,
        created_at
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // For SaaS users, filter by organization_id via contact_submissions
    // Note: notification_log may not have organization_id directly, so we filter via contact_submissions
    if (!isAdmin && orgId) {
      // Get contact_submission_ids for this organization
      const { data: orgSubmissions } = await supabaseAdmin
        .from('contact_submissions')
        .select('id')
        .eq('organization_id', orgId);
      
      const submissionIds = orgSubmissions?.map(s => s.id) || [];
      
      if (submissionIds.length > 0) {
        logsQuery = logsQuery.in('contact_submission_id', submissionIds);
      } else {
        // No submissions for this org, return empty
        logsQuery = logsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible match
      }
    }

    const { data: logs, error } = await logsQuery
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // If table doesn't exist, return empty data instead of error
      if (error.code === '42P01') {
        return res.status(200).json({
          logs: [],
          stats: {
            total: 0,
            successful: 0,
            failed: 0,
            smsFailures: 0,
            emailFailures: 0,
            successRate: 0
          },
          criticalIssues: [],
          timestamp: new Date().toISOString(),
          message: 'Notification logging table not set up yet. System will work without logging.'
        });
      }
      
      console.error('Error fetching notification logs:', error);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }

    // Calculate summary statistics
    const stats = {
      total: logs.length,
      successful: logs.filter(log => log.successful_methods > 0).length,
      failed: logs.filter(log => log.successful_methods === 0).length,
      smsFailures: logs.filter(log => !log.sms_success).length,
      emailFailures: logs.filter(log => !log.email_success).length,
      successRate: logs.length > 0 ? Math.round((logs.filter(log => log.successful_methods > 0).length / logs.length) * 100) : 0
    };

    // Identify critical issues
    const criticalIssues = [];
    
    // Check for recent total failures
    const recentTotalFailures = logs
      .filter(log => log.successful_methods === 0)
      .filter(log => new Date(log.created_at) > new Date(Date.now() - 60 * 60 * 1000)); // Last hour

    if (recentTotalFailures.length > 0) {
      criticalIssues.push({
        type: 'TOTAL_FAILURE',
        severity: 'CRITICAL',
        count: recentTotalFailures.length,
        message: `${recentTotalFailures.length} total notification failures in the last hour`
      });
    }

    // Check for SMS service issues
    const recentSMSFailures = logs
      .filter(log => !log.sms_success)
      .filter(log => new Date(log.created_at) > new Date(Date.now() - 60 * 60 * 1000));

    if (recentSMSFailures.length >= 3) {
      criticalIssues.push({
        type: 'SMS_SERVICE_DOWN',
        severity: 'HIGH',
        count: recentSMSFailures.length,
        message: `${recentSMSFailures.length} SMS failures in the last hour - service may be down`
      });
    }

    // Check for email service issues
    const recentEmailFailures = logs
      .filter(log => !log.email_success)
      .filter(log => new Date(log.created_at) > new Date(Date.now() - 60 * 60 * 1000));

    if (recentEmailFailures.length >= 3) {
      criticalIssues.push({
        type: 'EMAIL_SERVICE_DOWN',
        severity: 'HIGH',
        count: recentEmailFailures.length,
        message: `${recentEmailFailures.length} email failures in the last hour - service may be down`
      });
    }

    res.status(200).json({
      logs,
      stats,
      criticalIssues,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in notification logs API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
