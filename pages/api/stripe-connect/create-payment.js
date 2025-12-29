import { createClient } from '@supabase/supabase-js';
import { createPaymentWithPlatformFee, calculatePlatformFee } from '@/utils/stripe/connect';
import { optionalAuth } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Create a payment with platform fees
 * 
 * This endpoint processes payments for SaaS users (DJs) and automatically
 * handles payouts via Stripe Connect with platform fees deducted.
 * 
 * SECURITY: This endpoint is used for public payment flows (tips, invoices)
 * so full auth is not required, but we validate organization and amount.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Optional auth - track if authenticated for audit purposes
    const user = await optionalAuth(req, res);
    
    const { amount, organizationId, invoiceId, metadata = {} } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Amount must be at least $0.50 (50 cents)' });
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Get organization and verify Stripe Connect account
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, platform_fee_percentage, platform_fee_fixed')
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

    if (!organization.stripe_connect_charges_enabled || !organization.stripe_connect_payouts_enabled) {
      return res.status(400).json({ 
        error: 'Stripe Connect account not fully activated. Please complete onboarding.' 
      });
    }

    // SECURITY: If invoiceId provided, validate amount against database
    if (invoiceId) {
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .select('total_amount, balance_due, status, organization_id')
        .eq('id', invoiceId)
        .single();
      
      if (invoiceError || !invoice) {
        console.error('Invoice validation failed:', invoiceId);
        return res.status(400).json({ error: 'Invalid invoice' });
      }
      
      // Verify invoice belongs to this organization
      if (invoice.organization_id !== organizationId) {
        console.error('Invoice org mismatch:', { invoice: invoice.organization_id, request: organizationId });
        return res.status(403).json({ error: 'Invoice does not belong to this organization' });
      }
      
      // Verify amount matches
      const expectedAmount = invoice.balance_due || invoice.total_amount;
      if (Math.abs(amount - expectedAmount) > 0.01) {
        console.error('Amount mismatch:', { provided: amount, expected: expectedAmount });
        return res.status(400).json({ error: 'Amount does not match invoice balance' });
      }
      
      if (invoice.status === 'paid') {
        return res.status(400).json({ error: 'Invoice already paid' });
      }
    }

    // Calculate platform fee
    const platformFeePercentage = organization.platform_fee_percentage || 3.50;
    const platformFeeFixed = organization.platform_fee_fixed || 0.30;
    const feeCalculation = calculatePlatformFee(amount, platformFeePercentage, platformFeeFixed);

    // Create payment intent with platform fee
    const paymentIntent = await createPaymentWithPlatformFee(
      Math.round(amount * 100), // Convert dollars to cents
      organization.stripe_connect_account_id,
      platformFeePercentage,
      platformFeeFixed
    );

    // Add organization metadata
    const paymentMetadata = {
      ...metadata,
      organization_id: organization.id,
      organization_name: organization.name,
      platform_fee_percentage: platformFeePercentage.toString(),
      platform_fee_fixed: platformFeeFixed.toString(),
      payout_amount: feeCalculation.payoutAmount.toString(),
    };

    // Update payment intent with metadata
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: paymentMetadata,
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      feeCalculation: {
        totalAmount: amount,
        platformFee: feeCalculation.feeAmount,
        payoutAmount: feeCalculation.payoutAmount,
        feePercentage: feeCalculation.feePercentage,
        feeFixed: feeCalculation.feeFixed,
      },
    });
  } catch (error) {
    console.error('Error in create-payment API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

