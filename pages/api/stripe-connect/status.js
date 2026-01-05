import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { getAccountStatus } from '@/utils/stripe/connect';
import { getCurrentOrganization } from '@/utils/organization-context';

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
        .select('id, stripe_connect_account_id, stripe_connect_onboarding_url, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_details_submitted')
        .eq('owner_id', user.id)
        .single();
      
      if (!orgError && orgData) {
        organization = orgData;
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

    // Update organization with latest status
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    await supabaseAdmin
      .from('organizations')
      .update({
        stripe_connect_charges_enabled: accountStatus.chargesEnabled,
        stripe_connect_payouts_enabled: accountStatus.payoutsEnabled,
        stripe_connect_details_submitted: accountStatus.detailsSubmitted,
        stripe_connect_onboarding_complete: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
      })
      .eq('id', organization.id);

    const isComplete = accountStatus.chargesEnabled && accountStatus.payoutsEnabled;

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

