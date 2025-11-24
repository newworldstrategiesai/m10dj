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
    const { event_qr_code, requester_email, requester_phone, organizationId, organizationSlug } = req.query;

    // Get organization if provided (for public requests)
    let organization = null;
    if (organizationId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .single();
      organization = org;
    } else if (organizationSlug) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', organizationSlug)
        .single();
      organization = org;
    }

    // Get user's own request count (personal data, no admin required)
    // Filter by organization if provided
    let userRequestCount = 0;
    if (requester_email || requester_phone) {
      let userQuery = supabase
        .from('crowd_requests')
        .select('id', { count: 'exact', head: true })
        .eq('payment_status', 'paid');

      // Filter by organization if provided
      if (organization) {
        userQuery = userQuery.eq('organization_id', organization.id);
      }

      if (event_qr_code) {
        userQuery = userQuery.eq('event_qr_code', event_qr_code);
      }

      if (requester_email) {
        userQuery = userQuery.eq('requester_email', requester_email);
      } else if (requester_phone) {
        userQuery = userQuery.eq('requester_phone', requester_phone);
      }

      const { count } = await userQuery;
      userRequestCount = count || 0;
    }

    res.status(200).json({
      userRequestCount,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user stats',
      userRequestCount: 0,
    });
  }
}

