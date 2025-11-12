import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch lead data from contacts table
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, email, phone, event_type, event_date, location, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Return sanitized lead data
    res.status(200).json({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      eventType: data.event_type,
      eventDate: data.event_date,
      location: data.location,
      createdAt: data.created_at
    });
  } catch (error) {
    console.error('Error in lead API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

