import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user from session
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user_id = session.user.id;

    // Use service role for admin queries
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find contacts associated with this user
    const { data: contacts, error: contactsError } = await adminSupabase
      .from('contacts')
      .select('*')
      .eq('user_id', user_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(200).json({ 
        contacts: [],
        contracts: [],
        invoices: [],
        payments: [],
        summary: {
          totalInvoiced: 0,
          totalPaid: 0,
          totalOutstanding: 0,
          signedContracts: 0,
          pendingContracts: 0,
          totalContracts: 0,
          totalInvoices: 0,
          totalPayments: 0
        }
      });
    }

    const contactIds = contacts.map(c => c.id);

    // Fetch all data in parallel
    const [contractsResult, invoicesResult, paymentsResult] = await Promise.all([
      adminSupabase
        .from('contracts')
        .select('*')
        .in('contact_id', contactIds)
        .order('created_at', { ascending: false }),
      adminSupabase
        .from('invoices')
        .select('*')
        .in('contact_id', contactIds)
        .order('created_at', { ascending: false }),
      adminSupabase
        .from('payments')
        .select('*')
        .in('contact_id', contactIds)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
    ]);

    // Calculate summary statistics
    const totalInvoiced = invoicesResult.data?.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0) || 0;
    const totalPaid = paymentsResult.data?.reduce((sum, p) => {
      if (p.payment_status === 'Paid') {
        return sum + (parseFloat(p.total_amount) || 0);
      }
      return sum;
    }, 0) || 0;
    const totalOutstanding = totalInvoiced - totalPaid;

    const signedContracts = contractsResult.data?.filter(c => c.status === 'signed').length || 0;
    const pendingContracts = contractsResult.data?.filter(c => c.status === 'sent' || c.status === 'viewed').length || 0;

    res.status(200).json({ 
      contacts: contacts || [],
      contracts: contractsResult.data || [],
      invoices: invoicesResult.data || [],
      payments: paymentsResult.data || [],
      summary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        signedContracts,
        pendingContracts,
        totalContracts: contractsResult.data?.length || 0,
        totalInvoices: invoicesResult.data?.length || 0,
        totalPayments: paymentsResult.data?.length || 0
      }
    });
  } catch (error) {
    console.error('Error in /api/client/data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

