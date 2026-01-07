/**
 * Manual Payout Utilities
 * 
 * Handles transferring funds from platform account to user accounts
 * for payments received before Stripe Connect setup
 */

import Stripe from 'stripe';
import { stripe } from './config';
import { calculatePlatformFee } from './connect';

/**
 * Find all payments that need manual payout for an organization
 * These are payments that went to platform account before Connect was set up
 */
export async function findPendingManualPayouts(organizationId: string): Promise<{
  payments: Array<{
    paymentIntentId: string;
    amount: number; // in cents
    created: number; // timestamp
    metadata: Record<string, string>;
  }>;
  totalAmount: number; // in cents
  totalAfterFees: number; // in cents (amount minus platform fees)
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const payments: Array<{
    paymentIntentId: string;
    amount: number;
    created: number;
    metadata: Record<string, string>;
  }> = [];

  let hasMore = true;
  let startingAfter: string | null = null;
  const ninetyDaysAgo = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);

  // Search for payment intents with this organization_id and requires_manual_payout flag
  while (hasMore) {
    const params: Stripe.PaymentIntentListParams = {
      limit: 100,
      created: { gte: ninetyDaysAgo },
    };

    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const paymentIntents = await stripe.paymentIntents.list(params);
    
    for (const paymentIntent of paymentIntents.data) {
      // Only process succeeded payments
      if (paymentIntent.status !== 'succeeded') {
        continue;
      }

      // Check if this payment needs manual payout for this organization
      const metadata = paymentIntent.metadata || {};
      const paymentOrgId = metadata.organization_id;
      const requiresManualPayout = metadata.requires_manual_payout === 'true';
      const paymentRouting = metadata.payment_routing;

      // Must match organization and require manual payout
      if (
        paymentOrgId === organizationId &&
        requiresManualPayout &&
        paymentRouting === 'platform_account'
      ) {
        payments.push({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          created: paymentIntent.created,
          metadata: metadata,
        });
      }
    }

    hasMore = paymentIntents.has_more;
    if (hasMore && paymentIntents.data.length > 0) {
      startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  
  // Calculate platform fees for each payment and subtract
  let totalAfterFees = 0;
  for (const payment of payments) {
    const feeCalculation = calculatePlatformFee(
      payment.amount / 100, // Convert to dollars
      3.50, // Default platform fee percentage
      0.30  // Default platform fee fixed
    );
    totalAfterFees += payment.amount - Math.round(feeCalculation.feeAmount * 100);
  }

  return {
    payments,
    totalAmount,
    totalAfterFees,
  };
}

/**
 * Transfer accumulated funds from platform account to user's Connect account
 * This is called automatically when user completes Stripe Connect setup
 */
export async function transferAccumulatedFunds(
  organizationId: string,
  connectAccountId: string,
  platformFeePercentage?: number,
  platformFeeFixed?: number
): Promise<{
  success: boolean;
  transferredAmount: number; // in cents
  totalPayments: number;
  platformFees: number; // in cents
  transferId?: string;
  error?: string;
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    // Find all pending manual payouts for this organization
    const { payments, totalAmount, totalAfterFees } = await findPendingManualPayouts(organizationId);

    if (payments.length === 0) {
      return {
        success: true,
        transferredAmount: 0,
        totalPayments: 0,
        platformFees: 0,
      };
    }

    // Calculate total platform fees
    const platformFees = totalAmount - totalAfterFees;

    // Transfer the net amount (after platform fees) to the connected account
    // Use Stripe Transfer API to move funds from platform to connected account
    const transfer = await stripe.transfers.create({
      amount: totalAfterFees, // Amount in cents (after platform fees)
      currency: 'usd',
      destination: connectAccountId,
      metadata: {
        organization_id: organizationId,
        transfer_type: 'manual_payout_accumulated',
        total_payments: payments.length.toString(),
        total_amount: totalAmount.toString(),
        platform_fees: platformFees.toString(),
        payment_intent_ids: payments.map(p => p.paymentIntentId).join(','),
      },
    });

    // Mark payments as transferred to prevent duplicate transfers
    await markPaymentsAsTransferred(
      payments.map(p => p.paymentIntentId),
      transfer.id
    );

    return {
      success: true,
      transferredAmount: totalAfterFees,
      totalPayments: payments.length,
      platformFees: platformFees,
      transferId: transfer.id,
    };
  } catch (error: any) {
    console.error('Error transferring accumulated funds:', error);
    return {
      success: false,
      transferredAmount: 0,
      totalPayments: 0,
      platformFees: 0,
      error: error.message || 'Failed to transfer funds',
    };
  }
}

/**
 * Mark payments as transferred (update metadata to prevent duplicate transfers)
 */
export async function markPaymentsAsTransferred(
  paymentIntentIds: string[],
  transferId: string
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Update metadata on each payment intent to mark as transferred
  // Note: We need to preserve existing metadata, so we retrieve first, then update
  for (const paymentIntentId of paymentIntentIds) {
    try {
      // Retrieve current payment intent to preserve existing metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const existingMetadata = paymentIntent.metadata || {};

      // Update with new metadata while preserving existing
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          ...existingMetadata,
          requires_manual_payout: 'false',
          transferred_at: new Date().toISOString(),
          transfer_id: transferId,
        },
      });
    } catch (error) {
      console.error(`Error updating payment intent ${paymentIntentId}:`, error);
      // Continue with other payments even if one fails
    }
  }
}

