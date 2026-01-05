import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { createAccountLink, getAccountStatus } from '@/utils/stripe/connect';

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

    // Get user's organization (include product_context to determine correct domain)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    let { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, stripe_connect_account_id, product_context')
      .eq('owner_id', user.id)
      .single();

    // If organization doesn't exist, return error (shouldn't happen if create-account was called first)
    if (orgError || !organization) {
      console.error('Organization not found for onboarding link:', {
        userId: user.id,
        email: user.email,
        error: orgError?.message
      });
      return res.status(404).json({ 
        error: 'Organization not found',
        details: 'Please set up your Stripe Connect account first.'
      });
    }

    if (!organization.stripe_connect_account_id) {
      return res.status(400).json({ 
        error: 'Stripe Connect account not created. Please create account first.' 
      });
    }

    // Determine correct base URL based on product context
    // This ensures TipJar users always return to tipjar.live, not m10djcompany.com
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.origin || 'http://localhost:3000';
    
    // Override based on product context to ensure correct domain
    if (organization.product_context === 'tipjar') {
      baseUrl = 'https://tipjar.live';
    } else if (organization.product_context === 'djdash') {
      baseUrl = 'https://djdash.net';
    } else if (!baseUrl.includes('tipjar.live') && !baseUrl.includes('djdash.net')) {
      // Default to m10djcompany.com if not already set and not a product-specific domain
      baseUrl = 'https://m10djcompany.com';
    }

    // Create account onboarding link
    // According to Stripe docs:
    // - return_url: Where user goes after completing onboarding
    // - refresh_url: Where user goes if link expires or needs to restart
    //   (we should automatically create a new link and redirect)
    const accountLink = await createAccountLink(
      organization.stripe_connect_account_id,
      `${baseUrl}/onboarding/stripe-complete`, // return_url
      `${baseUrl}/onboarding/stripe-setup`     // refresh_url - auto-refreshes link
    );

    // Check current account status
    const accountStatus = await getAccountStatus(organization.stripe_connect_account_id);

    // Update organization with current status
    await supabaseAdmin
      .from('organizations')
      .update({
        stripe_connect_onboarding_url: accountLink.url,
        stripe_connect_charges_enabled: accountStatus.chargesEnabled,
        stripe_connect_payouts_enabled: accountStatus.payoutsEnabled,
        stripe_connect_details_submitted: accountStatus.detailsSubmitted,
        stripe_connect_onboarding_complete: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
      })
      .eq('id', organization.id);

    return res.status(200).json({
      onboardingUrl: accountLink.url,
      accountStatus: accountStatus,
      isComplete: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
    });
  } catch (error) {
    console.error('Error in onboarding-link API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

