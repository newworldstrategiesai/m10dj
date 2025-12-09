/**
 * Get payout history for a Stripe Connect account
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/utils/stripe/config';
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
      .select('id, stripe_connect_account_id, stripe_connect_payouts_enabled')
      .eq('id', orgId)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!organization.stripe_connect_account_id) {
      return res.status(400).json({ 
        error: 'Stripe Connect account not set up'
      });
    }

    if (!organization.stripe_connect_payouts_enabled) {
      return res.status(400).json({ 
        error: 'Stripe Connect account not fully activated'
      });
    }

    // Get payout history from Stripe
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    const payouts = await stripe.payouts.list(
      {
        limit: 50, // Get last 50 payouts
      },
      {
        stripeAccount: organization.stripe_connect_account_id,
      }
    );

    // Format payouts for frontend
    const formattedPayouts = payouts.data.map((payout) => ({
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      arrivalDate: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
      created: payout.created,
      method: payout.method,
    }));

    return res.status(200).json({
      payouts: formattedPayouts,
    });
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return res.status(500).json({
      error: 'Failed to fetch payouts',
      details: error.message,
    });
  }
}

