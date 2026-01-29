import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Quote ID is required' });
  }

  try {
    // Use service role for queries - allow public access since quote links are shared with clients
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find the contact_id from the quote/lead_id
    // The id parameter is the lead_id, which can be either:
    // 1. A contact_submissions.id (then we need to get contact_id from contact_submissions)
    // 2. A contacts.id directly
    let contactId = null;
    
    // Resolve lead_id to contact_id: may be contact_submissions.id or contacts.id (UUID)
    const { data: submission } = await supabaseAdmin
      .from('contact_submissions')
      .select('contact_id')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (submission?.contact_id) {
      contactId = submission.contact_id;
    } else {
      const { data: contactList } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('id', id)
        .limit(1);
      if (contactList?.[0]) {
        contactId = id;
      }
    }

    if (!contactId) {
      // No contact found - return empty payments array
      console.warn('No contact_id found for lead_id:', id);
      return res.status(200).json({ payments: [] });
    }

    // Fetch payments for this contact
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('contact_id', contactId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }

    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({ payments: payments || [] });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

