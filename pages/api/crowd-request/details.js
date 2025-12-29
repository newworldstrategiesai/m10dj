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
    // Use service role for queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get authenticated user (optional - allows public access for success page)
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Fetch request - public access allowed for success page viewing
    let requestQuery = supabaseAdmin
      .from('crowd_requests')
      .select('*')
      .eq('id', id);

    // If user is authenticated, apply organization filtering
    if (session && !sessionError) {
      // Check if user is platform admin
      const isAdmin = isPlatformAdmin(session.user.email);

      // Get organization context (null for admins, org_id for SaaS users)
      const orgId = await getOrganizationContext(
        supabase,
        session.user.id,
        session.user.email
      );

      // For SaaS users, filter by organization_id. Platform admins see all requests.
      // Public users (no session) can still access their own request via request_id
      if (!isAdmin && orgId) {
        requestQuery = requestQuery.eq('organization_id', orgId);
      } else if (!isAdmin && !orgId) {
        // For authenticated non-admin users without org, still allow access
        // (they might be viewing their own request)
      }
    }
    // If no session, allow public access (for success page)

    const { data: request, error } = await requestQuery.single();

    if (error || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Remove admin-only fields for non-admin users (public access)
    // Check if user is admin
    let isAdmin = false;
    if (session && !sessionError) {
      isAdmin = isPlatformAdmin(session.user.email);
    }

    // If not admin, remove sensitive fields
    if (!isAdmin) {
      const { requester_venmo_username, ...publicRequest } = request;
      return res.status(200).json(publicRequest);
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

