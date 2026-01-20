import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { withSecurity } from '@/utils/rate-limiting';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

/**
 * POST /api/karaoke/priority-checkout
 * Create Stripe checkout session for priority placement
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { signup_id, organization_id } = req.body;

    if (!signup_id || !organization_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['signup_id', 'organization_id']
      });
    }

    // Get the signup
    const { data: signup, error: signupError } = await supabase
      .from('karaoke_signups')
      .select('*')
      .eq('id', signup_id)
      .eq('organization_id', organization_id)
      .single();

    if (signupError || !signup) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    if (signup.payment_status === 'paid') {
      return res.status(400).json({ error: 'Priority already paid' });
    }

    // Get karaoke settings
    const { data: settings } = await supabase
      .from('karaoke_settings')
      .select('priority_fee_cents, priority_pricing_enabled')
      .eq('organization_id', organization_id)
      .single();

    if (!settings || !settings.priority_pricing_enabled) {
      return res.status(403).json({ error: 'Priority pricing not enabled' });
    }

    // Get organization Stripe account
    const { data: organization } = await supabase
      .from('organizations')
      .select('stripe_account_id, name')
      .eq('id', organization_id)
      .single();

    if (!organization?.stripe_account_id) {
      return res.status(400).json({
        error: 'Stripe account not connected',
        message: 'Organization must have Stripe connected to accept payments'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Karaoke Priority Placement',
              description: `Skip the line for ${signup.singer_name} - "${signup.song_title}"`
            },
            unit_amount: settings.priority_fee_cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL}/karaoke/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL}/karaoke/${signup.event_qr_code}`,
      metadata: {
        signup_id: signup_id,
        organization_id: organization_id,
        type: 'karaoke_priority'
      },
      payment_intent_data: {
        application_fee_amount: Math.round(settings.priority_fee_cents * 0.1), // 10% platform fee
        transfer_data: {
          destination: organization.stripe_account_id
        }
      }
    });

    // Update signup with Stripe session ID
    await supabase
      .from('karaoke_signups')
      .update({
        stripe_session_id: session.id,
        payment_status: 'pending'
      })
      .eq('id', signup_id);

    return res.status(200).json({
      checkout_url: session.url,
      session_id: session.id
    });

  } catch (error) {
    console.error('Error creating priority checkout:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

export default withSecurity(handler, 'payment', { requireOrgId: true });
