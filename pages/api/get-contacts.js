import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { search, eventType, leadStatus, limit = 100 } = req.query;

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .is('deleted_at', null) // Only get non-deleted contacts
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Add search functionality
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email_address.ilike.%${search}%,phone.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    // Filter by event type
    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType);
    }

    // Filter by lead status
    if (leadStatus && leadStatus !== 'all') {
      query = query.eq('lead_status', leadStatus);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    // Get summary statistics
    const { data: summary } = await supabase
      .from('contacts_summary')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    res.status(200).json({
      contacts: contacts || [],
      summary: summary || {
        total_contacts: contacts?.length || 0,
        new_leads: contacts?.filter(c => c.lead_status === 'New').length || 0,
        booked_events: contacts?.filter(c => c.lead_status === 'Booked').length || 0,
        upcoming_events: 0,
        follow_ups_due: 0
      }
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}