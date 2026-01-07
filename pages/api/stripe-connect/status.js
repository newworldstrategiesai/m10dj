import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { getAccountStatus } from '@/utils/stripe/connect';
import { getCurrentOrganization } from '@/utils/organization-context';
import { transferAccumulatedFunds, markPaymentsAsTransferred } from '@/utils/stripe/manual-payouts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user from cookies (like other API routes)
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = session.user;

    // Get user's organization using the helper function
    // This handles both owner and team member cases (venue hierarchy support)
    let organization = await getCurrentOrganization(supabase);
    
    // If not found via helper (which uses RLS), try with admin client as fallback
    if (!organization) {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, stripe_connect_account_id, stripe_connect_onboarding_url, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted, stripe_connect_onboarding_complete, platform_fee_percentage, platform_fee_fixed')
      .eq('owner_id', user.id)
      .single();

      if (!orgError && orgData) {
        organization = orgData;
      }
    }

    // Ensure we have platform fee fields (fetch if missing)
    if (organization && (!organization.platform_fee_percentage || !organization.platform_fee_fixed)) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: orgData } = await supabaseAdmin
        .from('organizations')
        .select('platform_fee_percentage, platform_fee_fixed')
        .eq('id', organization.id)
        .single();
      
      if (orgData) {
        organization.platform_fee_percentage = orgData.platform_fee_percentage || 3.50;
        organization.platform_fee_fixed = orgData.platform_fee_fixed || 0.30;
      }
    }

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!organization.stripe_connect_account_id) {
      return res.status(200).json({
        accountId: null,
        isComplete: false,
      });
    }

    // Get current account status from Stripe
    const accountStatus = await getAccountStatus(organization.stripe_connect_account_id);

    // Check if this is a newly completed setup (wasn't complete before, but is now)
    const wasCompleteBefore = organization.stripe_connect_onboarding_complete;
    const isComplete = accountStatus.chargesEnabled && accountStatus.payoutsEnabled;
    const isNewlyComplete = !wasCompleteBefore && isComplete;

    // Update organization with latest status
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    await supabaseAdmin
      .from('organizations')
      .update({
        stripe_connect_charges_enabled: accountStatus.chargesEnabled,
        stripe_connect_payouts_enabled: accountStatus.payoutsEnabled,
        stripe_connect_details_submitted: accountStatus.detailsSubmitted,
        stripe_connect_onboarding_complete: isComplete,
      })
      .eq('id', organization.id);

    // If Connect was just completed, transfer any accumulated funds from platform account
    if (isNewlyComplete && organization.stripe_connect_account_id) {
      try {
        console.log(`🔄 Transferring accumulated funds for organization ${organization.id}...`);
        const transferResult = await transferAccumulatedFunds(
          organization.id,
          organization.stripe_connect_account_id,
          organization.platform_fee_percentage || 3.50,
          organization.platform_fee_fixed || 0.30
        );

        if (transferResult.success && transferResult.totalPayments > 0) {
          console.log(`✅ Transferred $${(transferResult.transferredAmount / 100).toFixed(2)} for ${transferResult.totalPayments} payments`);
          
          // Mark payments as transferred (we'll need to get payment IDs from the transfer function)
          // This will be handled in the transfer function itself
        } else if (transferResult.totalPayments === 0) {
          console.log(`ℹ️ No accumulated funds to transfer for organization ${organization.id}`);
        } else {
          console.error(`❌ Failed to transfer accumulated funds:`, transferResult.error);
        }
      } catch (error) {
        console.error('Error transferring accumulated funds:', error);
        // Don't fail the status check if transfer fails - user can still proceed
      }
    }

    return res.status(200).json({
      accountId: organization.stripe_connect_account_id,
      onboardingUrl: organization.stripe_connect_onboarding_url,
      accountStatus: accountStatus,
      isComplete: isComplete,
    });
  } catch (error) {
    console.error('Error in status API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

