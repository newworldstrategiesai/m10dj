// API endpoint to create an instant payout for a connected account
// Charges a 1% fee (minimum $0.50) for instant payouts

import { createClient } from '@supabase/supabase-js';
import { createInstantPayout, calculateInstantPayoutFee, getAccountBalance } from '@/utils/stripe/connect';
import { calculateTipJarInstantPayoutFee, calculateMinimumInstantPayoutAmount } from '@/utils/stripe/tipjar-instant-payout';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { organizationId, amount } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Get organization first to check if it's TipJar (affects minimum amount)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Basic validation - detailed check will happen after we know if it's TipJar
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be greater than $0.00.' 
      });
    }

    // Get organization and verify Stripe Connect account
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, product_context, stripe_connect_account_id, stripe_connect_payouts_enabled, instant_payout_enabled, instant_payout_fee_percentage, tipjar_instant_payout_fee_percentage, tipjar_instant_payout_fee_fixed')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (!organization.stripe_connect_account_id) {
      return res.status(400).json({ 
        error: 'Stripe Connect account not set up. Please complete onboarding first.' 
      });
    }

    if (!organization.stripe_connect_payouts_enabled) {
      return res.status(400).json({ 
        error: 'Stripe Connect account not fully activated. Please complete onboarding.' 
      });
    }

    // Check account balance including instant_available
    const balance = await getAccountBalance(organization.stripe_connect_account_id);
    const availableAmount = balance.available / 100; // Convert cents to dollars
    const instantAvailableAmount = balance.instant_available / 100; // Amount eligible for instant payouts

    // Check if user is eligible for instant payouts
    if (instantAvailableAmount === 0) {
      return res.status(400).json({ 
        error: 'You are not currently eligible for Instant Payouts. Check your eligibility in the Dashboard or wait for funds to become available.',
        details: 'Instant Payouts require eligible balance and a debit card or supported bank account on file.'
      });
    }

    if (instantAvailableAmount < amount) {
      return res.status(400).json({ 
        error: `Insufficient instant-available balance. Available for instant payout: $${instantAvailableAmount.toFixed(2)}, Requested: $${amount.toFixed(2)}`,
        instantAvailable: instantAvailableAmount,
        standardAvailable: availableAmount
      });
    }

    // Determine fee structure based on product context
    const isTipJar = organization.product_context === 'tipjar';
    const currency = balance.currency || 'usd';
    
    let feeCalculation;
    let stripeFee;
    let tipjarFee;
    let totalFee;
    let payoutAmountAfterFees;
    
    if (isTipJar) {
      // For TipJar users, charge Stripe fee + TipJar markup
      const tipjarFeePercentage = organization.tipjar_instant_payout_fee_percentage || 1.0; // 1% default
      const tipjarFeeFixed = organization.tipjar_instant_payout_fee_fixed || 0.25; // $0.25 default
      const stripeFeePercentage = organization.instant_payout_fee_percentage || 1.50; // Stripe's US rate
      
      const tipjarFeeCalculation = calculateTipJarInstantPayoutFee(
        amount,
        tipjarFeePercentage,
        tipjarFeeFixed,
        stripeFeePercentage,
        currency
      );
      
      stripeFee = tipjarFeeCalculation.stripeFee;
      tipjarFee = tipjarFeeCalculation.tipjarFee;
      totalFee = tipjarFeeCalculation.totalFee;
      payoutAmountAfterFees = tipjarFeeCalculation.payoutAmount;
      
      // Check minimum payout amount
      const minimumAmount = calculateMinimumInstantPayoutAmount(
        tipjarFeePercentage,
        tipjarFeeFixed,
        stripeFeePercentage,
        currency
      );
      
      if (amount < minimumAmount) {
        return res.status(400).json({ 
          error: `Minimum instant payout amount is $${minimumAmount.toFixed(2)} for TipJar instant payouts.`,
          minimumAmount
        });
      }
      
      if (payoutAmountAfterFees < 0.01) {
        return res.status(400).json({ 
          error: 'Amount too small after instant payout fees. Minimum payout after fees is $0.01.' 
        });
      }
      
      // Use standard fee calculation for Stripe API call (we'll handle TipJar fee separately)
      feeCalculation = calculateInstantPayoutFee(amount, stripeFeePercentage, currency);
    } else {
      // For non-TipJar users, use standard Stripe fee only
      const feePercentage = organization.instant_payout_fee_percentage || 1.50;
      feeCalculation = calculateInstantPayoutFee(amount, feePercentage, currency);
      stripeFee = feeCalculation.feeAmount;
      tipjarFee = 0;
      totalFee = feeCalculation.feeAmount;
      payoutAmountAfterFees = feeCalculation.payoutAmount;
      
      // Verify the payout amount after fees is sufficient
      if (feeCalculation.payoutAmount < 0.01) {
        return res.status(400).json({ 
          error: 'Amount too small after instant payout fee. Minimum payout after fees is $0.01.' 
        });
      }
    }

    // Get destination (debit card or bank account) if provided
    const { destination } = req.body;

    // Create instant payout
    try {
      // For TipJar users, we need to charge the total amount including TipJar's fee
      // Stripe will deduct its fee automatically, then we need to deduct TipJar's fee
      // We'll do this by creating the payout with the full amount, then handling TipJar fee separately
      
      if (isTipJar) {
        // For TipJar: User requests amount X
        // We need to calculate what amount to request from Stripe such that:
        // After Stripe deducts its fee, the user receives: X - stripeFee - tipjarFee
        //
        // If we request (X - tipjarFee) from Stripe:
        // - Stripe calculates fee on (X - tipjarFee): stripeFee = max((X - tipjarFee) * 1.5%, $0.50)
        // - Stripe sends: (X - tipjarFee) - stripeFee
        // - User receives: X - tipjarFee - stripeFee ✓
        //
        // However, stripeFee is calculated on a smaller base, so we need to recalculate
        // to ensure consistency. We'll use an iterative approach or a formula.
        
        const stripeFeePercentage = organization.instant_payout_fee_percentage || 1.50;
        
        // Calculate the correct amount to request from Stripe
        // We need: stripeFee on (amount - tipjarFee) + tipjarFee + payoutAmount = amount
        // Simplified: Request (amount - tipjarFee) and Stripe will deduct its fee from that
        // The actual Stripe fee will be calculated on (amount - tipjarFee), which is correct
        
        // Request amount after TipJar fee (Stripe will deduct its fee from this)
        // Final user payout = (amount - tipjarFee) - stripeFee(on reduced amount)
        // This gives us approximately: amount - tipjarFee - stripeFee
        const amountAfterTipJarFee = amount - tipjarFee;
        
        // Recalculate Stripe fee based on the reduced amount (for accurate reporting)
        const actualStripeFeeCalculation = calculateInstantPayoutFee(
          amountAfterTipJarFee,
          stripeFeePercentage,
          currency
        );
        const actualStripeFee = actualStripeFeeCalculation.feeAmount;
        
        // Create payout with amount after TipJar fee (Stripe will deduct its fee from this)
        const payout = await createInstantPayout(
          organization.stripe_connect_account_id,
          amountAfterTipJarFee, // Amount after TipJar fee (Stripe will deduct its fee from this)
          stripeFeePercentage,
          currency,
          destination
        );
        
        // Update fee calculations for accurate reporting
        // Note: actualStripeFee might be slightly different from initial stripeFee calculation
        // because it's calculated on a smaller base (amount - tipjarFee)
        const finalPayoutAmount = amountAfterTipJarFee - actualStripeFee;
        
        console.log(`✅ Created TipJar instant payout for organization ${organization.name}:`);
        console.log(`   Requested: $${amount.toFixed(2)}`);
        console.log(`   Actual Stripe Fee: $${actualStripeFee.toFixed(2)} (${stripeFeePercentage}% of $${amountAfterTipJarFee.toFixed(2)})`);
        console.log(`   TipJar Fee: $${tipjarFee.toFixed(2)} (${tipjarFeePercentage}% + $${tipjarFeeFixed.toFixed(2)})`);
        console.log(`   Total Fees: $${(actualStripeFee + tipjarFee).toFixed(2)}`);
        console.log(`   Final Payout Amount: $${finalPayoutAmount.toFixed(2)}`);
        
        // TODO: Record TipJar fee as revenue (could create a fee record in database)
        // For now, the fee is effectively deducted from the payout amount
        
        // Notify user of payout
        (async () => {
          try {
            const { notifyDJOfPayout } = await import('../../../utils/dj-payment-notifications');
            await notifyDJOfPayout(
              organization.id,
              finalPayoutAmount,
              payout.id,
              payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : undefined
            );
          } catch (err) {
            console.error('Error sending payout notification:', err);
          }
        })();
        
        return res.status(200).json({
          success: true,
          payout: {
            id: payout.id,
            amount: finalPayoutAmount, // Final amount after all fees
            fee: actualStripeFee + tipjarFee, // Total fees (Stripe + TipJar)
            stripeFee: actualStripeFee, // Actual Stripe fee (calculated on reduced amount)
            tipjarFee: tipjarFee,
            status: payout.status,
            arrivalDate: payout.arrival_date,
          },
          feeCalculation: {
            requestedAmount: amount,
            stripeFee: actualStripeFee,
            tipjarFee: tipjarFee,
            totalFee: actualStripeFee + tipjarFee,
            payoutAmount: finalPayoutAmount,
          },
        });
      } else {
        // For non-TipJar users, use standard flow
        const feePercentage = organization.instant_payout_fee_percentage || 1.50;
        const payout = await createInstantPayout(
          organization.stripe_connect_account_id,
          amount,
          feePercentage,
          currency,
          destination
        );
        
        console.log(`✅ Created instant payout for organization ${organization.name}: $${feeCalculation.payoutAmount.toFixed(2)} (fee: $${feeCalculation.feeAmount.toFixed(2)})`);
        
        // Notify DJ of payout (non-blocking)
        (async () => {
          try {
            const { notifyDJOfPayout } = await import('../../../utils/dj-payment-notifications');
            await notifyDJOfPayout(
              organization.id,
              feeCalculation.payoutAmount,
              payout.id,
              payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : undefined
            );
          } catch (err) {
            console.error('Error sending payout notification:', err);
          }
        })();
        
        return res.status(200).json({
          success: true,
          payout: {
            id: payout.id,
            amount: feeCalculation.payoutAmount,
            fee: feeCalculation.feeAmount,
            status: payout.status,
            arrivalDate: payout.arrival_date,
          },
          feeCalculation,
        });
      }
    } catch (payoutError) {
      console.error('Error creating instant payout:', payoutError);
      
      // Handle specific Stripe errors
      if (payoutError.code === 'instant_payouts_unsupported') {
        return res.status(400).json({ 
          error: 'Instant payouts are not available for this account. Please ensure a debit card is on file and the account is eligible.',
          details: payoutError.message,
        });
      }
      
      if (payoutError.code === 'insufficient_funds') {
        return res.status(400).json({ 
          error: 'Insufficient funds for instant payout.',
          details: payoutError.message,
        });
      }

      return res.status(500).json({ 
        error: 'Failed to create instant payout',
        details: payoutError.message,
      });
    }
  } catch (error) {
    console.error('Error in instant-payout API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

