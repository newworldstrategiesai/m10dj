// API to get new form submissions since admin's last login
import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here

    // Get lastLogin from query params (timestamp when admin last logged in)
    const { lastLogin } = req.query;
    
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    // If lastLogin is provided, get submissions since then
    if (lastLogin) {
      query = query.gt('created_at', lastLogin);
    } else {
      // If no lastLogin provided, get submissions from last 24 hours as fallback
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      query = query.gt('created_at', yesterday.toISOString());
    }

    const { data: submissions, error } = await query;

    if (error) {
      const { logger } = await import('@/utils/logger');
      logger.error('Error fetching new submissions:', error);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    // Update admin's last login time in localStorage/session
    // This will be handled on the client side
    
    res.status(200).json({
      submissions: submissions || [],
      count: submissions ? submissions.length : 0,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    const { logger } = await import('@/utils/logger');
    logger.error('Error in new-submissions API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
