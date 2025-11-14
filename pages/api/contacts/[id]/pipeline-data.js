import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

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

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Use service role for admin queries
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all related data in parallel
    const [contractsResult, invoicesResult, paymentsResult, quoteSelectionsResult] = await Promise.all([
      adminSupabase
        .from('contracts')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false }),
      adminSupabase
        .from('invoices')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false }),
      adminSupabase
        .from('payments')
        .select('*')
        .eq('contact_id', id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      adminSupabase
        .from('quote_selections')
        .select('*')
        .eq('contact_id', id)
        .order('created_at', { ascending: false })
    ]);

    res.status(200).json({
      contracts: contractsResult.data || [],
      invoices: invoicesResult.data || [],
      payments: paymentsResult.data || [],
      quoteSelections: quoteSelectionsResult.data || []
    });
  } catch (error) {
    console.error('Error in /api/contacts/[id]/pipeline-data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

