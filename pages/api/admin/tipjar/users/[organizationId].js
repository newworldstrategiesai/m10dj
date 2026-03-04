/**
 * TipJar user (organization) detail for super admin.
 * Returns org info, owner, and metrics: requests, revenue, platform fees, unclaimed balance, recent activity.
 */

import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function platformFeeCents(amountPaidCents, feePct = 3.5, feeFixedDollars = 0.3) {
  const dollars = amountPaidCents / 100;
  const feeDollars = dollars * (feePct / 100) + feeFixedDollars;
  return Math.round(feeDollars * 100);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId } = req.query;
  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId required' });
  }

  try {
    await requireSuperAdmin(req, res);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select(
        'id, slug, name, owner_id, created_at, is_claimed, claimed_at, subscription_tier, subscription_status, ' +
        'stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, ' +
        'platform_fee_percentage, platform_fee_fixed, trial_ends_at'
      )
      .eq('id', organizationId)
      .eq('product_context', 'tipjar')
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found or not TipJar' });
    }

    let owner = { email: '—', username: '—' };
    if (org.owner_id) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(org.owner_id);
      if (userData?.user) {
        const u = userData.user;
        owner = {
          email: u.email || '—',
          username: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : '—'),
        };
      }
    }

    const feePct = org.platform_fee_percentage ?? 3.5;
    const feeFixed = org.platform_fee_fixed ?? 0.3;

    const { data: requests, error: reqError } = await supabaseAdmin
      .from('crowd_requests')
      .select('id, amount_paid, payment_status, request_type, created_at, paid_at, requester_name, song_title, song_artist, status')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (reqError) {
      console.error('[tipjar/users/[id]] Error fetching crowd_requests:', reqError);
    }

    const allRequests = requests || [];
    const paidRequests = allRequests.filter((r) => r.payment_status === 'paid');
    const totalRequests = allRequests.length;
    const paidCount = paidRequests.length;
    const revenueCents = paidRequests.reduce((sum, r) => sum + (Number(r.amount_paid) || 0), 0);
    const platformFeesCents = paidRequests.reduce(
      (sum, r) => sum + platformFeeCents(Number(r.amount_paid) || 0, feePct, feeFixed),
      0
    );

    const { data: unclaimed } = await supabaseAdmin
      .from('unclaimed_tip_balance')
      .select('total_amount_cents, total_fees_cents, net_amount_cents, tip_count, first_tip_at, last_tip_at, is_transferred')
      .eq('organization_id', organizationId)
      .maybeSingle();

    const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://www.tipjar.live';
    const profileUrl = `${baseUrl.replace(/\/$/, '')}/${org.slug}`;

    const recentRequests = allRequests.slice(0, 15).map((r) => ({
      id: r.id,
      request_type: r.request_type,
      payment_status: r.payment_status,
      amount_paid_cents: r.amount_paid,
      requester_name: r.requester_name,
      song_title: r.song_title,
      song_artist: r.song_artist,
      status: r.status,
      created_at: r.created_at,
      paid_at: r.paid_at,
    }));

    const lastActivityAt =
      allRequests.length > 0
        ? allRequests.reduce((latest, r) => {
            const t = r.paid_at || r.created_at;
            return t && (!latest || new Date(t) > new Date(latest)) ? t : latest;
          }, null)
        : null;

    return res.status(200).json({
      organization: {
        id: org.id,
        slug: org.slug,
        name: org.name,
        profileUrl,
        created_at: org.created_at,
        is_claimed: org.is_claimed ?? false,
        claimed_at: org.claimed_at,
        subscription_tier: org.subscription_tier,
        subscription_status: org.subscription_status,
        trial_ends_at: org.trial_ends_at,
        stripe_connect_account_id: org.stripe_connect_account_id,
        stripe_connect_charges_enabled: org.stripe_connect_charges_enabled,
        stripe_connect_payouts_enabled: org.stripe_connect_payouts_enabled,
      },
      owner: { ...owner, id: org.owner_id },
      metrics: {
        total_requests: totalRequests,
        paid_requests: paidCount,
        pending_requests: totalRequests - paidCount,
        revenue_cents: revenueCents,
        revenue_dollars: (revenueCents / 100).toFixed(2),
        platform_fees_cents: platformFeesCents,
        platform_fees_dollars: (platformFeesCents / 100).toFixed(2),
        last_activity_at: lastActivityAt,
      },
      unclaimed_balance: unclaimed
        ? {
            total_amount_cents: unclaimed.total_amount_cents,
            total_fees_cents: unclaimed.total_fees_cents,
            net_amount_cents: unclaimed.net_amount_cents,
            tip_count: unclaimed.tip_count,
            first_tip_at: unclaimed.first_tip_at,
            last_tip_at: unclaimed.last_tip_at,
            is_transferred: unclaimed.is_transferred,
          }
        : null,
      recent_requests: recentRequests,
    });
  } catch (err) {
    if (err.message?.includes('Super admin') || err.message?.includes('Unauthorized')) {
      return;
    }
    console.error('[tipjar/users/[organizationId]] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch user detail', message: err.message });
  }
}
