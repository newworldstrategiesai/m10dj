/**
 * Create Stripe Customer Portal Session
 * 
 * This endpoint creates a Stripe Customer Portal session for managing subscriptions,
 * payment methods, and billing history.
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
    const { customerId, returnUrl } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the customer ID belongs to the user's organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, stripe_customer_id')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (org.stripe_customer_id !== customerId) {
      return res.status(403).json({ error: 'Customer ID does not match your organization' });
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/billing`,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({
      error: 'Failed to create billing portal session',
      message: error.message,
    });
  }
}

