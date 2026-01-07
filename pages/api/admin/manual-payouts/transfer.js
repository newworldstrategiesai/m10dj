/**
 * Admin API: Manually transfer funds for an organization
 * 
 * Transfers accumulated funds from platform account to user's Connect account
 * or processes manual payout if Connect is not set up
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { transferAccumulatedFunds } from '@/utils/stripe/manual-payouts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require platform admin
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = isPlatformAdmin(session.user.email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Get organization
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, stripe_connect_account_id, stripe_connect_onboarding_complete, platform_fee_percentage, platform_fee_fixed')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Check if organization has Stripe Connect set up
    if (organization.stripe_connect_account_id && organization.stripe_connect_onboarding_complete) {
      // Transfer to Connect account
      const transferResult = await transferAccumulatedFunds(
        organization.id,
        organization.stripe_connect_account_id,
        organization.platform_fee_percentage || 3.50,
        organization.platform_fee_fixed || 0.30
      );

      if (!transferResult.success) {
        return res.status(500).json({ 
          error: 'Failed to transfer funds',
          details: transferResult.error 
        });
      }

      return res.status(200).json({
        success: true,
        message: `Transferred $${(transferResult.transferredAmount / 100).toFixed(2)} to Connect account`,
        transferResult,
      });
    } else {
      // Organization doesn't have Connect set up
      // For now, we can't transfer without Connect
      // In the future, we could implement external bank transfer or other methods
      return res.status(400).json({ 
        error: 'Organization does not have Stripe Connect set up',
        message: 'Please ask the user to set up Stripe Connect first, or process payout manually via Stripe Dashboard',
      });
    }
  } catch (error) {
    console.error('Error in manual payout transfer API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

