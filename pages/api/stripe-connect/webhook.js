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

  // Get organization to check previous status
  const { data: organization } = await supabaseAdmin
    .from('organizations')
    .select('id, name, owner_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, product_context')
    .eq('stripe_connect_account_id', accountId)
    .single();

  if (!organization) {
    console.error(`Organization not found for Stripe account ${accountId}`);
    return;
  }

  // Check if account just became active (wasn't complete before, but is now)
  const wasComplete = organization.stripe_connect_charges_enabled && organization.stripe_connect_payouts_enabled;
  const isNowComplete = accountStatus.chargesEnabled && accountStatus.payoutsEnabled;
  const justActivated = !wasComplete && isNowComplete;

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

  // If Connect was just activated, transfer any accumulated funds from platform account
  if (justActivated) {
    try {
      const { transferAccumulatedFunds } = await import('@/utils/stripe/manual-payouts');
      console.log(`🔄 Transferring accumulated funds for organization ${organization.id}...`);
      
      const transferResult = await transferAccumulatedFunds(
        organization.id,
        accountId,
        organization.platform_fee_percentage,
        organization.platform_fee_fixed
      );

      if (transferResult.success && transferResult.totalPayments > 0) {
        console.log(`✅ Transferred $${(transferResult.transferredAmount / 100).toFixed(2)} for ${transferResult.totalPayments} payments`);
      } else if (transferResult.totalPayments === 0) {
        console.log(`ℹ️ No accumulated funds to transfer for organization ${organization.id}`);
      } else {
        console.error(`❌ Failed to transfer accumulated funds:`, transferResult.error);
      }
    } catch (error) {
      console.error('Error transferring accumulated funds in webhook:', error);
      // Don't fail the webhook if transfer fails - user can still proceed
    }
  }

  // Send email notification if account just became active
  if (justActivated) {
    try {
      // Get owner email
      const { data: owner, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(organization.owner_id);
      
      if (!ownerError && owner?.user?.email) {
        await sendActivationEmail(owner.user.email, organization.name, organization.product_context);
      }
    } catch (emailError) {
      console.error('Error sending activation email:', emailError);
      // Don't throw - email failure shouldn't break webhook
    }
  }
}

/**
 * Send email notification when Stripe Connect account is activated
 */
async function sendActivationEmail(userEmail, organizationName, productContext) {
  try {
    // Determine correct domain and dashboard URL based on product context
    let baseUrl = 'https://m10djcompany.com';
    let dashboardUrl = '/admin/dashboard';
    
    if (productContext === 'tipjar') {
      baseUrl = 'https://tipjar.live';
      dashboardUrl = '/admin/crowd-requests';
    } else if (productContext === 'djdash') {
      baseUrl = 'https://djdash.net';
      dashboardUrl = '/djdash/dashboard';
    }

    const dashboardLink = `${baseUrl}${dashboardUrl}`;

    // Check if Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn('Resend API key not configured, skipping activation email');
      return;
    }

    const { Resend } = await import('resend');
    const resend = new Resend(resendApiKey);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Payment Setup Complete!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Stripe account is now active</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
            Great news! Your Stripe Connect account for <strong>${organizationName}</strong> has been activated and is ready to receive payments.
          </p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #065f46;">✅ What's Active:</p>
            <ul style="margin: 0; padding-left: 20px; color: #047857;">
              <li>Payment processing enabled</li>
              <li>Automatic payouts to your bank account</li>
              <li>All future payments will be deposited automatically</li>
            </ul>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <a href="${dashboardLink}" 
               style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Go to Dashboard →
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0;">Questions? Contact support at <a href="mailto:support@tipjar.live" style="color: #10b981;">support@tipjar.live</a></p>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'TipJar <payments@tipjar.live>',
      to: userEmail,
      subject: '🎉 Your Payment Account is Now Active!',
      html: emailHtml,
    });

    console.log(`✅ Activation email sent to: ${userEmail}`);
  } catch (error) {
    console.error('Error sending activation email:', error);
    throw error;
  }
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

