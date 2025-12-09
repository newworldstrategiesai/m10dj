/**
 * Create Stripe Checkout Session for Subscription
 * 
 * This endpoint creates a Stripe checkout session for a subscription
 * based on the selected pricing tier.
 */

import Stripe from 'stripe';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, organizationId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get organization
    let organization;
    if (organizationId) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .eq('owner_id', user.id)
        .single();

      if (orgError || !org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      organization = org;
    } else {
      // Get user's organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (orgError || !org) {
        return res.status(404).json({ error: 'Organization not found. Please complete onboarding.' });
      }
      organization = org;
    }

    // Create or get Stripe customer
    let customerId = organization.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          organization_id: organization.id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organization.id);
    }

    // Determine subscription tier from price ID
    const priceIdToTier = {
      [process.env.STRIPE_STARTER_PRICE_ID]: 'starter',
      [process.env.STRIPE_PROFESSIONAL_PRICE_ID]: 'professional',
      [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise',
    };

    const subscriptionTier = priceIdToTier[priceId] || 'starter';

    // Handle Starter plan ($0) - skip Stripe checkout and activate directly
    if (subscriptionTier === 'starter') {
      // Update organization to Starter tier with active status
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          subscription_tier: 'starter',
          subscription_status: 'active', // Starter is free, so activate immediately
          trial_ends_at: null, // No trial needed for free plan
        })
        .eq('id', organization.id);

      if (updateError) {
        console.error('Error updating organization for Starter plan:', updateError);
        return res.status(500).json({
          error: 'Failed to activate Starter plan',
          message: updateError.message,
        });
      }

      // Return success without Stripe checkout URL
      return res.status(200).json({
        success: true,
        subscriptionTier: 'starter',
        message: 'Starter plan activated successfully',
        // No URL - frontend should redirect to dashboard
      });
    }

    // For paid plans, create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: organization.subscription_status === 'trial' ? 
          Math.max(0, Math.ceil((new Date(organization.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 
          14, // 14-day free trial
        metadata: {
          organization_id: organization.id,
        },
      },
      metadata: {
        organization_id: organization.id,
        subscription_tier: subscriptionTier,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/onboarding/select-plan?canceled=true`,
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}

