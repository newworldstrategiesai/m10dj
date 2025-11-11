import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

/**
 * API route to fetch received emails
 * GET /api/emails?folder=unified&account=hello@m10djcompany.com&limit=50&offset=0
 * 
 * Parameters:
 * - folder: 'unified' (default), 'unread', 'flagged', 'archived', 'snoozed'
 * - account: specific email address to filter by (optional)
 * - limit: number of emails per page (default 50)
 * - offset: pagination offset (default 0)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get query parameters
    const { folder = 'unified', account, limit = 50, offset = 0 } = req.query;

    // Build query
    let query = supabase
      .from('received_emails')
      .select('*', { count: 'exact' })
      .eq('deleted', false)
      .order('received_at', { ascending: false });

    // Filter by specific account if provided
    if (account && typeof account === 'string') {
      query = query.contains('to_emails', [account]);
    }

    // Apply filters based on folder
    if (folder === 'unread') {
      query = query.eq('read', false).eq('archived', false).eq('snoozed', false);
    } else if (folder === 'flagged') {
      query = query.eq('flagged', true).eq('archived', false).eq('snoozed', false);
    } else if (folder === 'archived') {
      query = query.eq('archived', true);
    } else if (folder === 'snoozed') {
      query = query.eq('snoozed', true);
    } else if (folder === 'unified') {
      query = query.eq('archived', false).eq('snoozed', false);
    }

    // Apply pagination
    query = query.range(
      Number(offset),
      Number(offset) + Number(limit) - 1
    );

    const { data: emails, error, count } = await query;

    if (error) {
      console.error('[API] Error fetching emails:', error);
      throw error;
    }

    return res.status(200).json({
      emails: emails || [],
      count: count || 0,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      totalPages: Math.ceil((count || 0) / Number(limit)),
    });

  } catch (error: any) {
    console.error('[API] Error in emails endpoint:', error);
    return res.status(500).json({
      error: 'Failed to fetch emails',
      details: error.message,
    });
  }
}

