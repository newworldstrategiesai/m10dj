import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getViewAsOrgIdFromRequest } from '@/utils/auth-helpers/view-as';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
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

    // Use service role for queries
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find contacts - filter by organization_id instead of just user_id
    let contactsQuery = adminSupabase
      .from('contacts')
      .select('id')
      .is('deleted_at', null);

    // For SaaS users, filter by organization_id. Platform admins see all contacts.
    if (!isAdmin && orgId) {
      contactsQuery = contactsQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(200).json({ payments: [] });
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(200).json({ payments: [] });
    }

    const contactIds = contacts.map(c => c.id);

    // Fetch payments for these contacts
    let paymentsQuery = adminSupabase
      .from('payments')
      .select('*')
      .in('contact_id', contactIds);

    // Filter by organization_id for SaaS users
    if (!isAdmin && orgId) {
      paymentsQuery = paymentsQuery.eq('organization_id', orgId);
    }

    const { data: payments, error: paymentsError } = await paymentsQuery
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }

    res.status(200).json({ payments: payments || [] });
  } catch (error) {
    console.error('Error in /api/client/payments:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

