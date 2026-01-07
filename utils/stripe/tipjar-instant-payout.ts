/**
 * TipJar Instant Payout Utilities
 * 
 * Calculates fees for TipJar instant payouts including:
 * - Stripe's instant payout fee (1.5% for US, min $0.50)
 * - TipJar's markup fee (configurable, e.g., 1% + $0.25)
 */

import { calculateInstantPayoutFee } from './connect';

/**
 * TipJar instant payout fee configuration
 * These can be customized per organization or set as defaults
 */
export const TIPJAR_INSTANT_PAYOUT_FEE_PERCENTAGE = 1.0; // 1% additional on top of Stripe's fee
export const TIPJAR_INSTANT_PAYOUT_FEE_FIXED = 0.25; // $0.25 fixed fee

/**
 * Calculate total instant payout fees for TipJar users
 * Includes both Stripe's fee and TipJar's markup
 * 
 * @param amount Requested payout amount in dollars
 * @param tipjarFeePercentage TipJar's fee percentage (default: 1.0%)
 * @param tipjarFeeFixed TipJar's fixed fee in dollars (default: $0.25)
 * @param stripeFeePercentage Stripe's fee percentage (default: 1.5% for US)
 * @param currency Currency code (default: 'usd')
 * @returns Fee breakdown with total fees and payout amount
 */
export function calculateTipJarInstantPayoutFee(
  amount: number,
  tipjarFeePercentage: number = TIPJAR_INSTANT_PAYOUT_FEE_PERCENTAGE,
  tipjarFeeFixed: number = TIPJAR_INSTANT_PAYOUT_FEE_FIXED,
  stripeFeePercentage: number = 1.50, // Stripe's default US rate
  currency: string = 'usd'
): {
  stripeFee: number;
  tipjarFee: number;
  totalFee: number;
  payoutAmount: number;
  stripeFeePercentage: number;
  tipjarFeePercentage: number;
  tipjarFeeFixed: number;
  minimumFee: number;
} {
  // Calculate Stripe's fee first
  const stripeFeeCalculation = calculateInstantPayoutFee(amount, stripeFeePercentage, currency);
  const stripeFee = stripeFeeCalculation.feeAmount;
  const minimumFee = stripeFeeCalculation.minimumFee;

  // Calculate TipJar's fee on the requested amount (before Stripe's fee)
  // This gives TipJar revenue on top of Stripe's fee
  const tipjarPercentageFee = (amount * tipjarFeePercentage) / 100;
  const tipjarFee = tipjarPercentageFee + tipjarFeeFixed;

  // Total fee is Stripe fee + TipJar fee
  const totalFee = stripeFee + tipjarFee;

  // Payout amount is requested amount minus total fees
  const payoutAmount = amount - totalFee;

  return {
    stripeFee: Math.round(stripeFee * 100) / 100, // Round to 2 decimals
    tipjarFee: Math.round(tipjarFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    payoutAmount: Math.round(payoutAmount * 100) / 100,
    stripeFeePercentage,
    tipjarFeePercentage,
    tipjarFeeFixed,
    minimumFee,
  };
}

/**
 * Calculate minimum amount needed for instant payout after all fees
 * Ensures payout amount is at least $0.01 after all fees
 */
export function calculateMinimumInstantPayoutAmount(
  tipjarFeePercentage: number = TIPJAR_INSTANT_PAYOUT_FEE_PERCENTAGE,
  tipjarFeeFixed: number = TIPJAR_INSTANT_PAYOUT_FEE_FIXED,
  stripeFeePercentage: number = 1.50,
  currency: string = 'usd'
): number {
  // Minimum fees
  const minimumFees: Record<string, number> = {
    'usd': 0.50,
    'cad': 0.60,
    'sgd': 0.50,
    'gbp': 0.40,
    'aud': 0.50,
    'eur': 0.40,
  };
  const stripeMinimumFee = minimumFees[currency.toLowerCase()] || 0.50;
  
  // Minimum total fee: Stripe minimum + TipJar fixed fee
  // (TipJar percentage fee on minimum amount is negligible)
  const minimumTotalFee = stripeMinimumFee + tipjarFeeFixed + 0.01; // +$0.01 to ensure payout > $0.01
  
  // Minimum amount needs to cover fees + $0.01 payout
  // amount = totalFee + 0.01
  // For small amounts, approximate with: amount ≈ minimumTotalFee / (1 - totalFeeRate)
  // But simpler: just ensure minimumTotalFee + 0.01 <= amount
  // Actually, let's solve: amount - (stripeFee + tipjarFee) >= 0.01
  // For minimum case: amount - (0.50 + tipjarFeeFixed + amount * tipjarFeePercentage/100) >= 0.01
  // amount * (1 - tipjarFeePercentage/100) >= 0.51 + tipjarFeeFixed
  // amount >= (0.51 + tipjarFeeFixed) / (1 - tipjarFeePercentage/100)
  
  const minimumAmount = Math.ceil(((0.51 + tipjarFeeFixed) / (1 - tipjarFeePercentage / 100)) * 100) / 100;
  
  // Ensure at least $0.75 to cover Stripe's minimum + TipJar fees + minimum payout
  return Math.max(minimumAmount, 0.75);
}

