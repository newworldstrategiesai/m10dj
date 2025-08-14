// API to get new form submissions since admin's last login
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'
    ];

    if (!adminEmails.includes(user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get lastLogin from query params (timestamp when admin last logged in)
    const { lastLogin } = req.query;
    
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
      console.error('Error fetching new submissions:', error);
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
    console.error('Error in new-submissions API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
