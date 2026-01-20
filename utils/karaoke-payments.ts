/**
 * Secure payment processing for karaoke priority signups
 * Handles Stripe integration, validation, and fraud prevention
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Payment validation result
 */
export interface PaymentValidation {
  isValid: boolean;
  error?: string;
  details?: any;
}

/**
 * Refund processing result
 */
export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
  amountRefunded?: number;
}

/**
 * Validate payment intent before processing
 */
export async function validatePaymentIntent(
  paymentIntentId: string,
  expectedAmount: number,
  organizationId: string
): Promise<PaymentValidation> {
  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Validate payment intent status
    if (paymentIntent.status !== 'succeeded') {
      return {
        isValid: false,
        error: `Payment not completed. Status: ${paymentIntent.status}`,
        details: { status: paymentIntent.status }
      };
    }

    // Validate amount matches expected
    if (paymentIntent.amount !== expectedAmount) {
      return {
        isValid: false,
        error: 'Payment amount mismatch',
        details: {
          expected: expectedAmount,
          received: paymentIntent.amount
        }
      };
    }

    // Validate currency (should be USD cents)
    if (paymentIntent.currency !== 'usd') {
      return {
        isValid: false,
        error: 'Invalid currency',
        details: { currency: paymentIntent.currency }
      };
    }

    // Check if payment intent is already used
    const { data: existingUsage } = await supabase
      .from('karaoke_signups')
      .select('id, singer_name, song_title')
      .eq('payment_intent_id', paymentIntentId)
      .limit(1);

    if (existingUsage && existingUsage.length > 0) {
      return {
        isValid: false,
        error: 'Payment intent already used',
        details: {
          existing_signup: existingUsage[0].id,
          existing_song: existingUsage[0].song_title
        }
      };
    }

    // Validate metadata contains organization ID
    const metadataOrgId = paymentIntent.metadata?.organization_id;
    if (!metadataOrgId || metadataOrgId !== organizationId) {
      return {
        isValid: false,
        error: 'Organization mismatch in payment metadata',
        details: {
          expected_org: organizationId,
          metadata_org: metadataOrgId
        }
      };
    }

    return { isValid: true };

  } catch (error: any) {
    console.error('Payment intent validation error:', error);
    return {
      isValid: false,
      error: 'Payment validation failed',
      details: { stripe_error: error.message }
    };
  }
}

/**
 * Process priority payment completion
 */
export async function processPriorityPayment(
  signupId: string,
  paymentIntentId: string,
  stripeSessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate payment intent first
    const { data: signup } = await supabase
      .from('karaoke_signups')
      .select('organization_id, priority_fee, payment_status')
      .eq('id', signupId)
      .single();

    if (!signup) {
      return { success: false, error: 'Signup not found' };
    }

    // Only process if payment is still pending
    if (signup.payment_status !== 'pending') {
      return { success: false, error: `Payment already ${signup.payment_status}` };
    }

    const validation = await validatePaymentIntent(
      paymentIntentId,
      signup.priority_fee,
      signup.organization_id
    );

    if (!validation.isValid) {
      // Update signup with failed payment status
      await supabase
        .from('karaoke_signups')
        .update({
          payment_status: 'failed',
          payment_intent_id: paymentIntentId,
          stripe_session_id: stripeSessionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', signupId);

      return { success: false, error: validation.error };
    }

    // Update signup with successful payment
    const { error: updateError } = await supabase
      .from('karaoke_signups')
      .update({
        payment_status: 'paid',
        payment_intent_id: paymentIntentId,
        stripe_session_id: stripeSessionId,
        updated_at: new Date().toISOString()
      })
      .eq('id', signupId);

    if (updateError) {
      console.error('Failed to update payment status:', updateError);
      return { success: false, error: 'Database update failed' };
    }

    // Log successful payment
    await supabase.from('karaoke_audit_log').insert({
      organization_id: signup.organization_id,
      signup_id: signupId,
      action: 'payment_completed',
      new_value: {
        payment_status: 'paid',
        payment_intent_id: paymentIntentId,
        stripe_session_id: stripeSessionId
      },
      performed_by_email: 'stripe_webhook',
      created_at: new Date().toISOString()
    });

    return { success: true };

  } catch (error: any) {
    console.error('Payment processing error:', error);
    return { success: false, error: 'Payment processing failed' };
  }
}

/**
 * Process refund for priority signup
 */
export async function processRefund(
  signupId: string,
  refundReason: string = 'customer_request',
  performedBy?: string
): Promise<RefundResult> {
  try {
    // Get signup details
    const { data: signup, error: fetchError } = await supabase
      .from('karaoke_signups')
      .select('*')
      .eq('id', signupId)
      .single();

    if (fetchError || !signup) {
      return { success: false, error: 'Signup not found' };
    }

    // Validate refund eligibility
    if (signup.payment_status !== 'paid') {
      return { success: false, error: 'No paid payment to refund' };
    }

    if (!signup.payment_intent_id) {
      return { success: false, error: 'No payment intent found' };
    }

    // Check if already refunded
    const { data: existingRefunds } = await supabase
      .from('karaoke_audit_log')
      .select('new_value')
      .eq('signup_id', signupId)
      .eq('action', 'refund_processed')
      .limit(1);

    if (existingRefunds && existingRefunds.length > 0) {
      return { success: false, error: 'Already refunded' };
    }

    // Check signup status - can only refund if not completed or cancelled
    if (signup.status === 'completed' || signup.status === 'cancelled') {
      return { success: false, error: 'Cannot refund completed or cancelled signup' };
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: signup.payment_intent_id,
      reason: refundReason as Stripe.RefundCreateParams.Reason,
      metadata: {
        signup_id: signupId,
        organization_id: signup.organization_id,
        performed_by: performedBy || 'system'
      }
    });

    // Update signup status
    await supabase
      .from('karaoke_signups')
      .update({
        payment_status: 'cancelled',
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', signupId);

    // Log refund
    await supabase.from('karaoke_audit_log').insert({
      organization_id: signup.organization_id,
      signup_id: signupId,
      action: 'refund_processed',
      old_value: { payment_status: 'paid' },
      new_value: {
        payment_status: 'cancelled',
        refund_id: refund.id,
        refund_amount: refund.amount,
        refund_reason: refundReason
      },
      performed_by_email: performedBy,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      refundId: refund.id,
      amountRefunded: refund.amount
    };

  } catch (error: any) {
    console.error('Refund processing error:', error);

    // Log failed refund attempt
    await supabase.from('karaoke_audit_log').insert({
      organization_id: null, // Will be set properly in calling function
      signup_id: signupId,
      action: 'refund_failed',
      new_value: { error: error.message, reason: refundReason },
      performed_by_email: performedBy,
      created_at: new Date().toISOString()
    });

    return { success: false, error: error.message };
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const stripe = require('stripe');
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return !!event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Processing Stripe webhook:', event.type, event.id);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const signupId = paymentIntent.metadata?.signup_id;

        if (!signupId) {
          console.error('No signup_id in payment_intent metadata');
          return { success: false, error: 'Missing signup_id in metadata' };
        }

        const result = await processPriorityPayment(
          signupId,
          paymentIntent.id,
          paymentIntent.metadata?.session_id
        );

        return result;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const signupId = paymentIntent.metadata?.signup_id;

        if (signupId) {
          // Update signup with failed payment status
          await supabase
            .from('karaoke_signups')
            .update({
              payment_status: 'failed',
              payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', signupId);
        }

        return { success: true }; // Payment failure is expected behavior
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        console.warn('Charge disputed:', dispute.id, dispute.reason);

        // Find signup by payment intent
        const { data: signup } = await supabase
          .from('karaoke_signups')
          .select('id, organization_id, singer_name, song_title')
          .eq('payment_intent_id', dispute.payment_intent)
          .single();

        if (signup) {
          // Log dispute
          await supabase.from('karaoke_audit_log').insert({
            organization_id: signup.organization_id,
            signup_id: signup.id,
            action: 'payment_disputed',
            new_value: {
              dispute_id: dispute.id,
              dispute_reason: dispute.reason,
              dispute_amount: dispute.amount
            },
            performed_by_email: 'stripe_webhook',
            created_at: new Date().toISOString()
          });
        }

        return { success: true };
      }

      default:
        // Ignore other webhook events
        return { success: true };
    }

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create secure checkout session for priority signup
 */
export async function createPriorityCheckout(
  signupData: {
    signupId: string;
    singerName: string;
    songTitle: string;
    organizationId: string;
    amount: number; // in cents
  },
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | { error: string }> {
  try {
    // Validate amount
    if (signupData.amount <= 0 || signupData.amount > 10000) { // Max $100
      return { error: 'Invalid amount' };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Karaoke Priority: ${signupData.songTitle}`,
              description: `Priority placement for ${signupData.singerName}`,
            },
            unit_amount: signupData.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        signup_id: signupData.signupId,
        organization_id: signupData.organizationId,
        singer_name: signupData.singerName,
        song_title: signupData.songTitle,
        amount: signupData.amount.toString()
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // Expire in 30 minutes
    });

    // Update signup with session ID
    await supabase
      .from('karaoke_signups')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', signupData.signupId);

    return {
      sessionId: session.id,
      url: session.url!
    };

  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return { error: error.message };
  }
}

/**
 * Get payment analytics for organization
 */
export async function getPaymentAnalytics(organizationId: string, dateRange: { start: string; end: string }) {
  const { data: payments } = await supabase
    .from('karaoke_signups')
    .select('priority_fee, payment_status, created_at, status')
    .eq('organization_id', organizationId)
    .eq('payment_status', 'paid')
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  if (!payments) return { totalRevenue: 0, transactionCount: 0, averageAmount: 0 };

  const totalRevenue = payments.reduce((sum, p) => sum + (p.priority_fee || 0), 0);
  const transactionCount = payments.length;
  const averageAmount = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  return {
    totalRevenue,
    transactionCount,
    averageAmount,
    payments
  };
}