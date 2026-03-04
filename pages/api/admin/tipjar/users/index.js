/**
 * List all TipJar registered users (organizations) for super admin.
 * Returns org id, slug, name, owner email, username, profile URL.
 */

import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSuperAdmin(req, res);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: orgs, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, slug, name, owner_id, created_at, is_claimed, claimed_at, subscription_tier, subscription_status')
      .eq('product_context', 'tipjar')
      .order('created_at', { ascending: false });

    if (orgError) {
      console.error('[tipjar/users] Error fetching organizations:', orgError);
      return res.status(500).json({ error: 'Failed to fetch organizations', details: orgError.message });
    }

    const ownerIds = [...new Set((orgs || []).map((o) => o.owner_id).filter(Boolean))];
    const userMap = new Map();

    if (ownerIds.length > 0) {
      const { data: userList, error: userError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (!userError && userList?.users) {
        userList.users.forEach((u) => {
          const name = u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : '—');
          userMap.set(u.id, {
            email: u.email || '—',
            username: name,
            emailConfirmed: !!u.email_confirmed_at,
          });
        });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://www.tipjar.live';
    const users = (orgs || []).map((org) => {
      const owner = userMap.get(org.owner_id) || { email: '—', username: '—', emailConfirmed: false };
      return {
        organizationId: org.id,
        slug: org.slug,
        orgName: org.name,
        ownerId: org.owner_id,
        email: owner.email,
        username: owner.username,
        emailConfirmed: owner.emailConfirmed,
        profileUrl: `${baseUrl.replace(/\/$/, '')}/${org.slug}`,
        createdAt: org.created_at,
        isClaimed: org.is_claimed ?? false,
        claimedAt: org.claimed_at ?? null,
        subscriptionTier: org.subscription_tier ?? null,
        subscriptionStatus: org.subscription_status ?? null,
      };
    });

    return res.status(200).json({ users });
  } catch (err) {
    if (err.message?.includes('Super admin') || err.message?.includes('Unauthorized')) {
      return;
    }
    console.error('[tipjar/users] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch users', message: err.message });
  }
}
