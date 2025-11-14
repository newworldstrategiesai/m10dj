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
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Find contacts associated with this user
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', user_id)
      .is('deleted_at', null);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(200).json({ invoices: [] });
    }

    const contactIds = contacts.map(c => c.id);

    // Fetch invoices for these contacts
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .in('contact_id', contactIds)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return res.status(500).json({ error: 'Failed to fetch invoices' });
    }

    res.status(200).json({ invoices: invoices || [] });
  } catch (error) {
    console.error('Error in /api/client/invoices:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

