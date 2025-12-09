import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/utils/stripe/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Attach a bank account token to a Stripe Connect account
 * This is called after the user successfully links their bank account
 * via Financial Connections
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Bank account token is required' });
    }

    // Get authenticated user from cookies
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = session.user;

    // Get user's organization and Stripe Connect account
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, stripe_connect_account_id')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !organization) {
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

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    // Create an external account (bank account) for the Connect account
    // The token from Financial Connections can be used directly
    const externalAccount = await stripe.accounts.createExternalAccount(
      organization.stripe_connect_account_id,
      {
        external_account: token, // The bank account token from Financial Connections
      }
    );

    // Check if this is the default payout account
    // If the account doesn't have a default payout account yet, set this one
    const account = await stripe.accounts.retrieve(organization.stripe_connect_account_id);
    if (!account.external_accounts?.data?.some((ea) => ea.default_for_currency)) {
      // Set this as the default payout account
      await stripe.accounts.updateExternalAccount(
        organization.stripe_connect_account_id,
        externalAccount.id,
        {
          default_for_currency: true,
        }
      );
    }

    // Refresh account status to check if payouts are now enabled
    const updatedAccount = await stripe.accounts.retrieve(organization.stripe_connect_account_id, {
      expand: ['requirements', 'capabilities'],
    });

    const accountStatus = {
      chargesEnabled: updatedAccount.charges_enabled === true || 
        updatedAccount.capabilities?.card_payments === 'active',
      payoutsEnabled: updatedAccount.payouts_enabled === true,
      detailsSubmitted: updatedAccount.details_submitted === true,
    };

    // Update organization with current status
    await supabaseAdmin
      .from('organizations')
      .update({
        stripe_connect_charges_enabled: accountStatus.chargesEnabled,
        stripe_connect_payouts_enabled: accountStatus.payoutsEnabled,
        stripe_connect_details_submitted: accountStatus.detailsSubmitted,
        stripe_connect_onboarding_complete: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
      })
      .eq('id', organization.id);

    return res.status(200).json({
      success: true,
      accountStatus,
      externalAccountId: externalAccount.id,
      message: 'Bank account successfully linked',
    });
  } catch (error) {
    console.error('Error attaching bank account:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

