import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getViewAsOrgIdFromRequest } from '@/utils/auth-helpers/view-as';

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

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get view-as organization ID from cookie (if admin is viewing as another org)
    const viewAsOrgId = getViewAsOrgIdFromRequest(req);

    // Get organization context (null for admins, org_id for SaaS users, or viewAsOrgId if in view-as mode)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email,
      viewAsOrgId
    );

    // Use service role for admin queries
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // First, verify the contact exists and belongs to the user's organization
    let contactQuery = adminSupabase
      .from('contacts')
      .select('id, organization_id')
      .eq('id', id)
      .is('deleted_at', null);

    // For SaaS users, filter by organization_id. Platform admins see all contacts.
    if (!isAdmin && orgId) {
      contactQuery = contactQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: contact, error: contactError } = await contactQuery.single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Build queries with organization filtering
    let contractsQuery = adminSupabase
      .from('contracts')
      .select('*')
      .eq('contact_id', id);

    let invoicesQuery = adminSupabase
      .from('invoices')
      .select('*')
      .eq('contact_id', id);

    let paymentsQuery = adminSupabase
      .from('payments')
      .select('*')
      .eq('contact_id', id);

    let quoteSelectionsQuery = adminSupabase
      .from('quote_selections')
      .select('*')
      .eq('lead_id', id);

    // Filter by organization_id for SaaS users
    if (!isAdmin && orgId) {
      contractsQuery = contractsQuery.eq('organization_id', orgId);
      invoicesQuery = invoicesQuery.eq('organization_id', orgId);
      paymentsQuery = paymentsQuery.eq('organization_id', orgId);
      quoteSelectionsQuery = quoteSelectionsQuery.eq('organization_id', orgId);
    }

    // Fetch all related data in parallel
    const [contractsResult, invoicesResult, paymentsResult, quoteSelectionsResult] = await Promise.all([
      contractsQuery.order('created_at', { ascending: false }),
      invoicesQuery.order('created_at', { ascending: false }),
      paymentsQuery.order('transaction_date', { ascending: false }).order('created_at', { ascending: false }),
      quoteSelectionsQuery.order('created_at', { ascending: false })
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

