import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Quote ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch quote selections from quote_selections table
    const { data, error } = await supabase
      .from('quote_selections')
      .select('*')
      .eq('lead_id', id)
      .single();

    if (error) {
      console.error('Error fetching quote:', error);
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Return quote data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

