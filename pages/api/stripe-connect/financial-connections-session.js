import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/utils/stripe/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Create a Financial Connections Session for bank account collection
 * This allows users to link their bank account in an on-page modal
 * instead of redirecting to Stripe's hosted onboarding page
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Create a Financial Connections Session for Connect payouts
    // For Connect accounts, we use account_holder.type: 'account' with the Connect account ID
    // This allows collecting bank account tokens that can be attached to the Connect account
    const financialConnectionsSession = await stripe.financialConnections.sessions.create({
      account_holder: {
        type: 'account',
        account: organization.stripe_connect_account_id,
      },
      permissions: ['payment_method'], // Required for creating bank account tokens for payouts
      filters: {
        countries: ['US'], // Only US accounts for now
      },
    });

    return res.status(200).json({
      clientSecret: financialConnectionsSession.client_secret,
      sessionId: financialConnectionsSession.id,
    });
  } catch (error) {
    console.error('Error creating Financial Connections Session:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

