// API endpoint to check if invoices exist (bypasses RLS using service role)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check total invoices
    const { count: totalCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    // Check invoices with organization_id
    const { count: withOrgCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .not('organization_id', 'is', null);

    // Check invoices without organization_id
    const { count: withoutOrgCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .is('organization_id', null);

    // Get sample invoices
    const { data: sampleInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, invoice_status, organization_id, contact_id, invoice_date')
      .order('invoice_date', { ascending: false })
      .limit(5);

    return res.status(200).json({
      total: totalCount || 0,
      with_organization_id: withOrgCount || 0,
      without_organization_id: withoutOrgCount || 0,
      sample: sampleInvoices || []
    });
  } catch (error) {
    console.error('Error checking invoices:', error);
    return res.status(500).json({ 
      error: 'Failed to check invoices',
      details: error.message 
    });
  }
}

