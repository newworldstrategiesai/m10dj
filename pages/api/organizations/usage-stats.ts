/**
 * Get Usage Statistics API
 * 
 * Returns current usage vs limits for the authenticated user's organization
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { getUsageStats } from '@/utils/subscription-helpers';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    if (!orgId && !isAdmin) {
      return res.status(403).json({ error: 'No organization found' });
    }

    // Get organization
    let orgQuery = supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId);

    if (isAdmin && req.query.organizationId) {
      // Admins can view any organization's stats
      orgQuery = supabase
        .from('organizations')
        .select('*')
        .eq('id', req.query.organizationId);
    }

    const { data: org, error: orgError } = await orgQuery.single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get usage stats
    const usageStats = await getUsageStats(supabase, org);

    return res.status(200).json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        subscription_tier: org.subscription_tier,
        subscription_status: org.subscription_status,
        trial_ends_at: org.trial_ends_at,
      },
      usage: usageStats,
    });
  } catch (error: any) {
    console.error('Error fetching usage stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch usage statistics',
      details: error.message,
    });
  }
}

