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
    const { contact_id, quote_id } = req.query;

    if (!contact_id && !quote_id) {
      return res.status(400).json({ error: 'contact_id or quote_id is required' });
    }

    let query = supabase
      .from('payments')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (contact_id) {
      query = query.eq('contact_id', contact_id);
    }

    if (quote_id) {
      // If quote_id is provided, we might need to find payments via quote_selections
      // For now, we'll use contact_id primarily
      query = query.eq('contact_id', quote_id);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }

    res.status(200).json({ payments: payments || [] });
  } catch (error) {
    console.error('Error in /api/payments:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

