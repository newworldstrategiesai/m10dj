import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

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

    // Build query for quote selections
    let query = supabaseAdmin
      .from('quote_selections')
      .select('*')
      .eq('lead_id', id);

    // For SaaS users, filter by organization_id. Platform admins see all quotes.
    if (!isAdmin && orgId) {
      query = query.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      // SaaS user without organization - deny access
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching quote:', error);
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Additional check: Verify organization ownership for SaaS users
    if (!isAdmin && data.organization_id !== orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return quote data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

