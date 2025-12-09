// API endpoint to create an instant payout for a connected account
// Charges a 1% fee (minimum $0.50) for instant payouts

import { createClient } from '@supabase/supabase-js';
import { createInstantPayout, calculateInstantPayoutFee, getAccountBalance } from '@/utils/stripe/connect';

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

    if (!amount || amount < 0.50) {
      return res.status(400).json({ 
        error: 'Amount must be at least $0.50. Instant payouts require a minimum fee of $0.50.' 
      });
    }

    // Get organization and verify Stripe Connect account
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, stripe_connect_account_id, stripe_connect_payouts_enabled, instant_payout_enabled, instant_payout_fee_percentage')
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

    // Determine fee percentage based on country (default to US rate of 1.5%)
    // US, AU, NZ, AE: 1.5%
    // CA, EU, UK, SG, NO, MY: 1%
    const feePercentage = organization.instant_payout_fee_percentage || 1.50;
    const currency = balance.currency || 'usd';
    const feeCalculation = calculateInstantPayoutFee(amount, feePercentage, currency);

    // Verify the payout amount after fees is sufficient
    if (feeCalculation.payoutAmount < 0.01) {
      return res.status(400).json({ 
        error: 'Amount too small after instant payout fee. Minimum payout after fees is $0.01.' 
      });
    }

    // Get destination (debit card or bank account) if provided
    const { destination } = req.body;

    // Create instant payout
    try {
      const payout = await createInstantPayout(
        organization.stripe_connect_account_id,
        amount,
        feePercentage,
        currency,
        destination // Optional: specific payout destination
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

