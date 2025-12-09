/**
 * Quick test endpoint to verify questionnaire submission log table exists
 * GET /api/test-questionnaire-log
 * Blocked in production for security
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test 1: Check if table exists
    const { data, error, count } = await supabase
      .from('questionnaire_submission_log')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        return res.status(404).json({
          success: false,
          error: 'Table does not exist',
          message: 'The questionnaire_submission_log table was not found. Please run the migration.',
          details: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Error accessing table',
        details: error.message
      });
    }

    // Test 2: Get count of existing logs
    const { count: totalCount } = await supabase
      .from('questionnaire_submission_log')
      .select('*', { count: 'exact', head: true });

    // Test 3: Check for failed submissions
    const { count: failedCount } = await supabase
      .from('questionnaire_submission_log')
      .select('*', { count: 'exact', head: true })
      .eq('submission_status', 'failed');

    // Test 4: Get recent activity
    const { data: recentLogs } = await supabase
      .from('questionnaire_submission_log')
      .select('id, lead_id, submission_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return res.status(200).json({
      success: true,
      message: 'Questionnaire submission log table is working!',
      stats: {
        totalLogs: totalCount || 0,
        failedSubmissions: failedCount || 0,
        recentActivity: recentLogs?.length || 0
      },
      recentLogs: recentLogs || [],
      nextSteps: [
        'Submit a test questionnaire to verify logging works',
        'Check /api/admin/questionnaire-submissions?status=failed for failed submissions',
        'Monitor the audit log for any issues'
      ]
    });
  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

