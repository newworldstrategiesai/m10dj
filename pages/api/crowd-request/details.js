const { createServerSupabaseClient } = require('@supabase/auth-helpers-nextjs');
const { createClient } = require('@supabase/supabase-js');
const { isPlatformAdmin } = require('@/utils/auth-helpers/platform-admin');
const { getOrganizationContext } = require('@/utils/organization-helpers');

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
    // Get authenticated user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context (null for admins, org_id for SaaS users)
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // Use service role for queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch request with organization filtering
    let requestQuery = supabaseAdmin
      .from('crowd_requests')
      .select('*')
      .eq('id', id);

    // For SaaS users, filter by organization_id. Platform admins see all requests.
    if (!isAdmin && orgId) {
      requestQuery = requestQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: request, error } = await requestQuery.single();

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

