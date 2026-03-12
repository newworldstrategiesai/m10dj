/**
 * List all TipJar users for super admin.
 * Includes every auth user with product_context=tipjar (confirmed or not, with or without org).
 * Returns org id, slug, name, owner email, username, profile URL.
 */

import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PER_PAGE = 1000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSuperAdmin(req, res);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Fetch all TipJar organizations
    const { data: orgs, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, slug, name, owner_id, created_at, is_claimed, claimed_at, subscription_tier, subscription_status')
      .eq('product_context', 'tipjar')
      .order('created_at', { ascending: false });

    if (orgError) {
      console.error('[tipjar/users] Error fetching organizations:', orgError);
      return res.status(500).json({ error: 'Failed to fetch organizations', details: orgError.message });
    }

    // 2) Paginate through ALL auth users and keep only TipJar (by metadata)
    const tipjarAuthUsers = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data: userList, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: PER_PAGE,
      });
      if (userError) {
        console.error('[tipjar/users] Error listing auth users:', userError);
        break;
      }
      const list = userList?.users ?? [];
      list.forEach((u) => {
        const ctx = u.user_metadata?.product_context ?? u.app_metadata?.product_context;
        if (ctx === 'tipjar') {
          tipjarAuthUsers.push(u);
        }
      });
      hasMore = list.length >= PER_PAGE;
      if (hasMore) page += 1;
    }

    const userMap = new Map();
    tipjarAuthUsers.forEach((u) => {
      const name = u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : '—');
      userMap.set(u.id, {
        email: u.email || '—',
        username: name,
        emailConfirmed: !!u.email_confirmed_at,
        createdAt: u.created_at,
      });
    });

    const baseUrl = (process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://www.tipjar.live').replace(/\/$/, '');
    const ownerIdsFromOrgs = new Set((orgs || []).map((o) => o.owner_id).filter(Boolean));

    // 3) Rows from organizations (one per org)
    const rowsFromOrgs = (orgs || []).map((org) => {
      const owner = userMap.get(org.owner_id) || { email: '—', username: '—', emailConfirmed: false };
      return {
        organizationId: org.id,
        slug: org.slug,
        orgName: org.name,
        ownerId: org.owner_id,
        email: owner.email,
        username: owner.username,
        emailConfirmed: owner.emailConfirmed,
        profileUrl: `${baseUrl}/${org.slug}`,
        createdAt: org.created_at,
        isClaimed: org.is_claimed ?? false,
        claimedAt: org.claimed_at ?? null,
        subscriptionTier: org.subscription_tier ?? null,
        subscriptionStatus: org.subscription_status ?? null,
      };
    });

    // 4) Rows for TipJar auth users who have no org (e.g. not yet confirmed, trigger failed)
    const usersWithoutOrg = tipjarAuthUsers.filter((u) => !ownerIdsFromOrgs.has(u.id));
    const rowsFromUsersOnly = usersWithoutOrg.map((u) => {
      const info = userMap.get(u.id);
      return {
        organizationId: null,
        slug: null,
        orgName: (u.user_metadata?.organization_name || u.user_metadata?.full_name || u.user_metadata?.name || null),
        ownerId: u.id,
        email: info?.email ?? u.email ?? '—',
        username: info?.username ?? '—',
        emailConfirmed: !!u.email_confirmed_at,
        profileUrl: null,
        createdAt: u.created_at ?? new Date().toISOString(),
        isClaimed: false,
        claimedAt: null,
        subscriptionTier: null,
        subscriptionStatus: null,
      };
    });

    const users = [...rowsFromOrgs, ...rowsFromUsersOnly].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return res.status(200).json({ users });
  } catch (err) {
    if (err.message?.includes('Super admin') || err.message?.includes('Unauthorized')) {
      return;
    }
    console.error('[tipjar/users] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch users', message: err.message });
  }
}
