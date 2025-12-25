/**
 * Search tickets by name
 * POST /api/events/tickets/search
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, searchTerm } = req.body;

    if (!eventId || !searchTerm) {
      return res.status(400).json({ error: 'Event ID and search term required' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Search by purchaser name (case-insensitive, partial match)
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .ilike('purchaser_name', `%${searchTerm}%`)
      .in('payment_status', ['paid', 'cash', 'card_at_door'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      tickets: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Error searching tickets:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search tickets',
      message: error.message
    });
  }
}

