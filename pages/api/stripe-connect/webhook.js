import { createClient } from '@supabase/supabase-js';
import { getAccountStatus } from '@/utils/stripe/connect';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Webhook handler for Stripe Connect events
 * 
 * Handles:
 * - account.updated - When Connect account onboarding status changes
 * - payment_intent.succeeded - When payments are completed
 * - transfer.created - When payouts are initiated
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Missing Stripe webhook secret');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object, supabaseAdmin);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object, supabaseAdmin);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object, supabaseAdmin);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // CRITICAL: Always return 200 to Stripe, even on errors
    // Stripe requires 200-299 status codes. Returning 500 causes Stripe to retry and eventually disable the webhook
    // Log the error but acknowledge receipt to prevent webhook disable
    return res.status(200).json({ 
      received: true,
      error: 'Webhook processing encountered an error but event was received',
      error_message: error.message 
    });
  }
}

/**
 * Handle account.updated event
 * Updates organization's Stripe Connect status when account is updated
 */
async function handleAccountUpdated(account, supabaseAdmin) {
  const accountId = account.id;

  // Get account status
  const accountStatus = await getAccountStatus(accountId);

  // Update organization
  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      stripe_connect_charges_enabled: accountStatus.chargesEnabled,
      stripe_connect_payouts_enabled: accountStatus.payoutsEnabled,
      stripe_connect_details_submitted: accountStatus.detailsSubmitted,
      stripe_connect_onboarding_complete: accountStatus.chargesEnabled && accountStatus.payoutsEnabled,
    })
    .eq('stripe_connect_account_id', accountId);

  if (error) {
    console.error('Error updating organization from account.updated:', error);
    throw error;
  }

  console.log(`Updated organization for Stripe account ${accountId}`);
}

/**
 * Handle payment_intent.succeeded event
 * Logs successful payments (optional - for analytics)
 */
async function handlePaymentSucceeded(paymentIntent, supabaseAdmin) {
  const organizationId = paymentIntent.metadata?.organization_id;
  
  if (organizationId) {
    // You can log this payment or update analytics here
    console.log(`Payment succeeded for organization ${organizationId}: ${paymentIntent.amount / 100}`);
  }
}

/**
 * Handle transfer.created event
 * Logs when payouts are initiated to Connect accounts
 */
async function handleTransferCreated(transfer, supabaseAdmin) {
  const destination = transfer.destination;
  
  // Find organization by Stripe account ID
  const { data: organization } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .eq('stripe_connect_account_id', destination)
    .single();

  if (organization) {
    console.log(`Transfer created for organization ${organization.name}: ${transfer.amount / 100}`);
  }
}

