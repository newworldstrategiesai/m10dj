/**
 * Get Stripe Connect account balance and payout information
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { getAccountBalance, getPayoutSchedule } from '@/utils/stripe/connect';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = isPlatformAdmin(user.email);
    const orgId = await getOrganizationContext(supabase, user.id, user.email);

    if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'No organization found' });
    }

    // Get organization with Connect account info
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, stripe_connect_account_id, stripe_connect_payouts_enabled')
      .eq('id', orgId)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!organization.stripe_connect_account_id) {
      return res.status(400).json({ 
        error: 'Stripe Connect account not set up',
        message: 'Please complete Stripe Connect onboarding to view balance'
      });
    }

    if (!organization.stripe_connect_payouts_enabled) {
      return res.status(400).json({ 
        error: 'Stripe Connect account not fully activated',
        message: 'Please complete onboarding to enable payouts'
      });
    }

    // Get account balance with instant_available for Instant Payouts eligibility
    const balance = await getAccountBalance(organization.stripe_connect_account_id);
    
    // Get payout schedule
    const payoutSchedule = await getPayoutSchedule(organization.stripe_connect_account_id);

    // Calculate next payout date based on schedule
    let nextPayoutDate: string | undefined;
    if (payoutSchedule.interval !== 'manual') {
      const now = new Date();
      if (payoutSchedule.interval === 'daily') {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        nextPayoutDate = next.toISOString();
      } else if (payoutSchedule.interval === 'weekly' && payoutSchedule.weeklyAnchor) {
        const next = new Date(now);
        // Convert day name to day number (0 = Sunday, 1 = Monday, etc.)
        const dayMap: Record<string, number> = {
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6,
          'sunday': 0,
        };
        const targetDay = dayMap[payoutSchedule.weeklyAnchor.toLowerCase()] ?? 1;
        const currentDay = now.getDay();
        let daysUntilNext = (targetDay - currentDay + 7) % 7;
        if (daysUntilNext === 0) daysUntilNext = 7; // If same day, go to next week
        next.setDate(next.getDate() + daysUntilNext);
        nextPayoutDate = next.toISOString();
      } else if (payoutSchedule.interval === 'monthly' && payoutSchedule.monthlyAnchor) {
        const next = new Date(now.getFullYear(), now.getMonth() + 1, payoutSchedule.monthlyAnchor);
        nextPayoutDate = next.toISOString();
      }
    }

    return res.status(200).json({
      balance: {
        available: balance.available,
        instant_available: balance.instant_available || 0, // Amount available for instant payouts
        pending: balance.pending,
        currency: balance.currency,
      },
      payoutInfo: {
        payoutSchedule: payoutSchedule.interval,
        nextPayoutDate,
        delayDays: payoutSchedule.delayDays,
      },
    });
  } catch (error: any) {
    console.error('Error fetching Stripe Connect balance:', error);
    return res.status(500).json({
      error: 'Failed to fetch balance',
      details: error.message,
    });
  }
}

