/**
 * Admin API endpoint to view questionnaire submission logs
 * GET /api/admin/questionnaire-submissions?status=failed&limit=10
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, leadId, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('questionnaire_submission_log')
      .select(`
        id,
        lead_id,
        questionnaire_id,
        submission_status,
        is_complete,
        error_type,
        error_message,
        verification_status,
        created_at,
        updated_at,
        contacts:lead_id (
          id,
          first_name,
          last_name,
          email_address,
          event_type,
          event_date
        )
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('submission_status', status);
    }

    // Filter by lead ID if provided
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching submission logs:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch submission logs',
        details: error.message 
      });
    }

    // Get total count for pagination
    let totalCount = 0;
    if (status || leadId) {
      let countQuery = supabase
        .from('questionnaire_submission_log')
        .select('*', { count: 'exact', head: true });
      
      if (status) {
        countQuery = countQuery.eq('submission_status', status);
      }
      if (leadId) {
        countQuery = countQuery.eq('lead_id', leadId);
      }
      
      const { count: total } = await countQuery;
      totalCount = total || 0;
    } else {
      const { count: total } = await supabase
        .from('questionnaire_submission_log')
        .select('*', { count: 'exact', head: true });
      totalCount = total || 0;
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });
  } catch (error) {
    console.error('Error in questionnaire submissions API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

