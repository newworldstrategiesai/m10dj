/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription management:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_failed
 * - invoice.payment_succeeded
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const organizationId = subscription.metadata?.organization_id;

        if (!organizationId) {
          console.error('No organization_id in subscription metadata');
          break;
        }

        // Determine tier from price
        const priceId = subscription.items.data[0]?.price?.id;
        const priceIdToTier = {
          [process.env.STRIPE_STARTER_PRICE_ID]: 'starter',
          [process.env.STRIPE_PROFESSIONAL_PRICE_ID]: 'professional',
          [process.env.STRIPE_ENTERPRISE_PRICE_ID]: 'enterprise',
        };

        const tier = priceIdToTier[priceId] || 'starter';
        const status = subscription.status === 'active' || subscription.status === 'trialing' 
          ? 'active' 
          : subscription.status;

        // Update organization
        await supabase
          .from('organizations')
          .update({
            subscription_tier: tier,
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            trial_ends_at: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
          .eq('id', organizationId);

        console.log(`✅ Updated organization ${organizationId}: tier=${tier}, status=${status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const organizationId = subscription.metadata?.organization_id;

        if (organizationId) {
          await supabase
            .from('organizations')
            .update({
              subscription_status: 'cancelled',
            })
            .eq('id', organizationId);

          console.log(`✅ Cancelled subscription for organization ${organizationId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const organizationId = subscription.metadata?.organization_id;

          if (organizationId) {
            await supabase
              .from('organizations')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', organizationId);

            console.log(`⚠️ Payment failed for organization ${organizationId}`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const organizationId = subscription.metadata?.organization_id;

          if (organizationId) {
            await supabase
              .from('organizations')
              .update({
                subscription_status: 'active',
              })
              .eq('id', organizationId);

            console.log(`✅ Payment succeeded for organization ${organizationId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

