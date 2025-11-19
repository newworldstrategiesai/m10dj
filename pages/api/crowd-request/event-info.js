const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Event code is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to find event info from contacts table based on QR code
    // This assumes you might link event codes to contact records
    // For now, return basic info - you can extend this later
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, event_name, event_date, venue_name')
      .or(`event_name.ilike.%${code}%,venue_name.ilike.%${code}%`)
      .limit(1)
      .single();

    if (contact) {
      return res.status(200).json({
        event_id: contact.id,
        event_name: contact.event_name || `${contact.first_name} ${contact.last_name}'s Event`,
        event_date: contact.event_date,
        venue_name: contact.venue_name,
      });
    }

    // Return default info if no specific event found
    return res.status(200).json({
      event_name: null,
      event_date: null,
      venue_name: null,
    });
  } catch (error) {
    console.error('Error fetching event info:', error);
    // Return empty data on error rather than failing
    return res.status(200).json({
      event_name: null,
      event_date: null,
      venue_name: null,
    });
  }
}

