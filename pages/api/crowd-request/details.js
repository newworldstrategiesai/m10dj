const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: request, error } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    return res.status(200).json(request);
  } catch (error) {
    console.error('Error fetching request details:', error);
    return res.status(500).json({
      error: 'Failed to fetch request details',
      message: error.message,
    });
  }
}

