/**
 * Stripe Connect Express Helper Functions
 * 
 * Handles platform payments where we collect payments and automatically
 * payout to SaaS users via Stripe Connect Express accounts.
 */

import Stripe from 'stripe';
import { stripe } from './config';

const PLATFORM_FEE_PERCENTAGE = 3.50; // 3.5%
const PLATFORM_FEE_FIXED = 0.30; // $0.30

// Validate Stripe is configured
if (!stripe) {
  throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_LIVE in your environment variables.');
}

/**
 * Check if the platform account can create connected accounts
 * This helps provide better error messages before attempting account creation
 */
export async function canCreateConnectedAccounts(): Promise<{
  canCreate: boolean;
  reason?: string;
  error?: string;
}> {
  if (!stripe) {
    return {
      canCreate: false,
      reason: 'Stripe is not configured',
    };
  }

  try {
    // Try to retrieve the platform account to check Connect status
    // If this fails or Connect isn't enabled, we'll get an error
    const account = await stripe.accounts.retrieve();
    
    // Check if account has Connect enabled by attempting a minimal account creation test
    // Note: We don't actually create an account, but we check if the API would allow it
    return {
      canCreate: true,
    };
  } catch (error: any) {
    // If we get a specific error about not being able to create accounts, return that
    if (error.message?.toLowerCase().includes('cannot currently create connected accounts') ||
        error.message?.toLowerCase().includes('cannot create connected accounts')) {
      return {
        canCreate: false,
        reason: 'Platform account cannot create connected accounts',
        error: error.message,
      };
    }
    
    // For other errors, assume we can try (might be a different issue)
    return {
      canCreate: true,
    };
  }
}

/**
 * Create a Stripe Connect account using Accounts v2 API
 * 
 * Creates a connected account with merchant and customer configurations:
 * - Merchant: Allows account to accept direct payments from their customers
 * - Customer: Allows account to pay subscription fees to the platform
 * - Dashboard: Full access for account management
 */
export async function createConnectAccount(
  email: string,
  organizationName: string,
  organizationSlug: string,
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }
): Promise<Stripe.Account> {
  // Build business profile URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com';
  const businessProfileUrl = `${baseUrl}/${organizationSlug}/requests`;

  // Accounts v2 API structure
  const accountData: any = {
    contact_email: email,
    display_name: organizationName,
    dashboard: 'full', // Full dashboard access for connected accounts
    identity: {
      business_details: {
        registered_name: organizationName,
      },
      country: 'us',
      entity_type: 'individual', // Most DJs are individuals
    },
    configuration: {
      merchant: {
        capabilities: {
          card_payments: {
            requested: true,
          },
        },
      },
      customer: {
        capabilities: {
          automatic_indirect_tax: {
            requested: true,
          },
        },
      },
    },
    defaults: {
      currency: 'usd',
      responsibilities: {
        fees_collector: 'stripe', // Stripe collects fees directly
        losses_collector: 'stripe', // Stripe manages risk
      },
      locales: ['en-US'],
    },
    business_profile: {
      url: businessProfileUrl,
    },
    metadata: {
      organization_name: organizationName,
      organization_slug: organizationSlug,
    },
    include: [
      'configuration.customer',
      'configuration.merchant',
      'identity',
      'requirements',
    ],
  };

  // Add branding if provided
  if (branding && (branding.primaryColor || branding.secondaryColor || branding.logo)) {
    const brandingSettings: any = {};
    
    // Only include logo if it's an absolute URL (Stripe requirement)
    if (branding.logo && (branding.logo.startsWith('http://') || branding.logo.startsWith('https://'))) {
      brandingSettings.logo = branding.logo;
    }
    
    if (branding.primaryColor) {
      brandingSettings.primary_color = branding.primaryColor;
    }
    
    if (branding.secondaryColor) {
      brandingSettings.secondary_color = branding.secondaryColor;
    }
    
    // Only add settings if we have at least one branding property
    if (Object.keys(brandingSettings).length > 0) {
      accountData.settings = {
        branding: brandingSettings,
      };
    }
  }

  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    // Try using Stripe SDK's request method for v2 API
    // If that doesn't work, fall back to v1 API with compatible structure
    try {
      // Attempt v2 API via SDK request method (using type assertion since request method may not be in types)
      const account = await (stripe as any).request({
        method: 'POST',
        path: '/v2/core/accounts',
        body: accountData,
      });
      return account as any;
    } catch (v2Error: any) {
      // If v2 API fails, fall back to v1 API with Express account type
      // This maintains compatibility while we wait for full v2 SDK support
      console.warn('v2 API not available, falling back to v1 Express accounts:', v2Error.message);
      
      // Use v1 Express accounts API (most stable and widely supported)
      // Reference: https://docs.stripe.com/api/accounts/create
      const v1AccountData: Stripe.AccountCreateParams = {
        type: 'express',
        country: 'US',
        email: email,
        // Request capabilities explicitly
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        // Business type - most DJs are individuals
        business_type: 'individual',
        // Metadata for tracking
        metadata: {
          organization_name: organizationName,
          organization_slug: organizationSlug,
          created_via: 'm10dj_platform',
        },
        // Business profile for better onboarding
        business_profile: {
          url: businessProfileUrl,
          name: organizationName,
        },
        // Settings for better UX
        settings: {
          payouts: {
            schedule: {
              interval: 'daily', // Daily payouts by default
            },
          },
        },
      };

      // Add branding if provided (merge with existing settings)
      if (branding && (branding.primaryColor || branding.secondaryColor || branding.logo)) {
        const brandingSettings: any = {};
        if (branding.logo && (branding.logo.startsWith('http://') || branding.logo.startsWith('https://'))) {
          brandingSettings.logo = branding.logo;
        }
        if (branding.primaryColor) {
          brandingSettings.primary_color = branding.primaryColor;
        }
        if (branding.secondaryColor) {
          brandingSettings.secondary_color = branding.secondaryColor;
        }
        if (Object.keys(brandingSettings).length > 0) {
          // Merge branding with existing settings
          v1AccountData.settings = {
            ...v1AccountData.settings,
            branding: brandingSettings,
          };
        }
      }

      const account = await stripe.accounts.create(v1AccountData);
      return account;
    }
  } catch (stripeError: any) {
    console.error('Stripe API error creating Connect account:', stripeError);
    console.error('Stripe error type:', stripeError.type);
    console.error('Stripe error code:', stripeError.code);
    console.error('Stripe error message:', stripeError.message);
    
    // Preserve the original error message and type for better error handling
    const errorMessage = stripeError.message || stripeError.type || 'Unknown Stripe error';
    const error = new Error(`Stripe error: ${errorMessage}`);
    
    // Preserve error details for API endpoint to detect verification errors
    (error as any).stripeError = stripeError;
    (error as any).stripeType = stripeError.type;
    (error as any).stripeCode = stripeError.code;
    (error as any).originalMessage = stripeError.message || errorMessage;
    
    throw error;
  }
}

/**
 * Create an Account Link for Stripe Connect onboarding using v2 API
 * 
 * Supports up-front onboarding (collects eventually_due requirements)
 * or incremental onboarding (collects currently_due requirements)
 */
export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string,
  options?: {
    onboardingType?: 'upfront' | 'incremental'; // Default: upfront
  }
): Promise<Stripe.AccountLink> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const onboardingType = options?.onboardingType || 'upfront';
  
  // Accounts v2 API structure for Account Links
  const accountLinkData: any = {
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        collection_options: {
          fields: onboardingType === 'upfront' ? 'eventually_due' : 'currently_due',
        },
        configurations: ['merchant'], // Collect merchant configuration requirements
        return_url: returnUrl,
        refresh_url: refreshUrl,
      },
    },
  };

  try {
    // Try v2 API first, fall back to v1 if not available
    try {
      const accountLink = await (stripe as any).request({
        method: 'POST',
        path: '/v2/core/account_links',
        body: accountLinkData,
      });
      return accountLink as any;
    } catch (v2Error: any) {
      // Fall back to v1 API Account Links (most stable)
      // Reference: https://docs.stripe.com/api/account_links/create
      console.warn('v2 Account Links API not available, using v1:', v2Error.message);
      
      const v1LinkData: Stripe.AccountLinkCreateParams = {
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
        // Optional: Collect all required information upfront
        collect: 'currently_due', // or 'eventually_due' for upfront collection
      };

      const accountLink = await stripe.accountLinks.create(v1LinkData);
      return accountLink;
    }
  } catch (error: any) {
    console.error('Error creating Account Link:', error);
    throw error;
  }
}

/**
 * Get the current onboarding status of a Connect account
 * Reference: https://docs.stripe.com/api/accounts/retrieve
 */
export async function getAccountStatus(
  accountId: string
): Promise<{
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    // Retrieve account with expanded requirements
    // Reference: https://docs.stripe.com/api/accounts/retrieve
    const account = await stripe.accounts.retrieve(accountId, {
      expand: ['requirements', 'capabilities'],
    });

    // Check capabilities status (v1 API)
    const cardPaymentsCapability = account.capabilities?.card_payments;
    const chargesEnabled = cardPaymentsCapability === 'active' || account.charges_enabled === true;
    
    // Extract payout status
    const payoutsEnabled = account.payouts_enabled === true;
    const detailsSubmitted = account.details_submitted === true;

    // Extract requirements for detailed status
    const requirements = account.requirements ? {
      currentlyDue: Array.isArray(account.requirements.currently_due) 
        ? account.requirements.currently_due.map((r: any) => typeof r === 'string' ? r : r.toString())
        : [],
      eventuallyDue: Array.isArray(account.requirements.eventually_due)
        ? account.requirements.eventually_due.map((r: any) => typeof r === 'string' ? r : r.toString())
        : [],
      pastDue: Array.isArray(account.requirements.past_due)
        ? account.requirements.past_due.map((r: any) => typeof r === 'string' ? r : r.toString())
        : [],
    } : undefined;

    return {
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      requirements,
    };
  } catch (error: any) {
    console.error('Error retrieving account status:', error);
    // Enhanced error handling
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error(`Invalid account ID: ${error.message}`);
    }
    throw new Error(`Failed to retrieve account status: ${error?.message || String(error)}`);
  }
}

/**
 * Create a payment intent with platform fees using Stripe Connect
 * 
 * @param amount Amount in cents (e.g., 5000 for $50.00)
 * @param connectAccountId The Stripe Connect account ID to pay out to
 * @param platformFeePercentage Platform fee percentage (default: 3.5%)
 * @param platformFeeFixed Fixed platform fee in cents (default: 30 for $0.30)
 */
export async function createPaymentWithPlatformFee(
  amount: number,
  connectAccountId: string,
  platformFeePercentage: number = PLATFORM_FEE_PERCENTAGE,
  platformFeeFixed: number = PLATFORM_FEE_FIXED
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  // Calculate platform fee
  // Fee = (amount * percentage / 100) + fixed_fee
  const percentageFee = Math.round((amount * platformFeePercentage) / 100);
  const applicationFeeAmount = percentageFee + Math.round(platformFeeFixed * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    application_fee_amount: applicationFeeAmount,
    transfer_data: {
      destination: connectAccountId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

/**
 * Create a checkout session with platform fees using Stripe Connect
 * 
 * Uses Accounts v2 API structure with customer_account parameter
 * This is better for one-time payments from customers
 */
export async function createCheckoutSessionWithPlatformFee(
  amount: number,
  connectAccountId: string,
  successUrl: string,
  cancelUrl: string,
  metadata: Record<string, string> = {},
  platformFeePercentage: number = PLATFORM_FEE_PERCENTAGE,
  platformFeeFixed: number = PLATFORM_FEE_FIXED,
  branding?: {
    logo?: string;
    companyName?: string;
  }
): Promise<Stripe.Checkout.Session> {
  // Calculate platform fee
  const percentageFee = Math.round((amount * platformFeePercentage) / 100);
  const applicationFeeAmount = percentageFee + Math.round(platformFeeFixed * 100);

  // Use customer_account parameter (Accounts v2 API) instead of Stripe-Account header
  const sessionParams: any = {
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Song Request / Shoutout',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: connectAccountId,
      },
    },
    metadata: metadata,
    customer_account: connectAccountId, // Accounts v2 API: identifies connected account as merchant
    // Customize branding (minimizes Stripe branding)
    ...(branding && {
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    }),
  };

  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get Stripe Elements configuration for white-labeled payment forms
 * Use this instead of Checkout for maximum branding control
 */
export function getStripeElementsConfig(branding?: {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}): any {
  return {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: branding?.primaryColor || '#6366f1',
        colorBackground: branding?.backgroundColor || '#ffffff',
        colorText: branding?.textColor || '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: branding?.fontFamily || 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1px solid #e5e7eb',
          boxShadow: 'none',
        },
        '.Input:focus': {
          border: '1px solid #6366f1',
          boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
        },
      },
    },
    // Hide Stripe branding
    fonts: branding?.fontFamily ? [{
      cssSrc: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(branding.fontFamily)}`,
    }] : undefined,
  };
}

/**
 * Calculate platform fee for a given amount
 */
export function calculatePlatformFee(
  amount: number,
  platformFeePercentage: number = PLATFORM_FEE_PERCENTAGE,
  platformFeeFixed: number = PLATFORM_FEE_FIXED
): {
  feeAmount: number;
  payoutAmount: number;
  feePercentage: number;
  feeFixed: number;
} {
  const percentageFee = (amount * platformFeePercentage) / 100;
  const fixedFee = platformFeeFixed;
  const totalFee = percentageFee + fixedFee;
  const payoutAmount = amount - totalFee;

  return {
    feeAmount: Math.round(totalFee * 100) / 100, // Round to 2 decimals
    payoutAmount: Math.round(payoutAmount * 100) / 100,
    feePercentage: platformFeePercentage,
    feeFixed: platformFeeFixed,
  };
}

/**
 * Get account balance and payout information
 * Includes instant_available for Instant Payouts eligibility
 */
export async function getAccountBalance(accountId: string): Promise<{
  available: number;
  instant_available: number;
  pending: number;
  currency: string;
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  });

  return {
    available: balance.available[0]?.amount || 0,
    instant_available: balance.instant_available?.[0]?.amount || 0, // Amount eligible for instant payouts
    pending: balance.pending[0]?.amount || 0,
    currency: balance.available[0]?.currency || 'usd',
  };
}

/**
 * Calculate instant payout fee
 * Stripe charges different fees by country:
 * - US, AU, NZ, AE: 1.5% with minimum $0.50
 * - CA, EU, UK, SG, NO, MY: 1% with minimum varies by currency
 */
export function calculateInstantPayoutFee(
  amount: number,
  feePercentage: number = 1.50, // Default to US rate (1.5%)
  currency: string = 'usd'
): {
  feeAmount: number;
  payoutAmount: number;
  feePercentage: number;
  minimumFee: number;
} {
  // Minimum fees by currency (from Stripe docs)
  const minimumFees: Record<string, number> = {
    'usd': 0.50,
    'cad': 0.60,
    'sgd': 0.50,
    'gbp': 0.40,
    'aud': 0.50,
    'eur': 0.40,
    'czk': 10.00,
    'dkk': 5.00,
    'huf': 200.00,
    'nok': 5.00,
    'pln': 2.00,
    'ron': 2.00,
    'sek': 5.00,
    'nzd': 0.50,
    'myr': 2.00,
    'aed': 2.00,
  };

  const minimumFee = minimumFees[currency.toLowerCase()] || 0.50;
  const percentageFee = (amount * feePercentage) / 100;
  const feeAmount = Math.max(percentageFee, minimumFee);
  const payoutAmount = amount - feeAmount;

  return {
    feeAmount: Math.round(feeAmount * 100) / 100, // Round to 2 decimals
    payoutAmount: Math.round(payoutAmount * 100) / 100,
    feePercentage,
    minimumFee,
  };
}

/**
 * Create an instant payout to a connected account
 * 
 * @param accountId The Stripe Connect account ID
 * @param amount Amount in dollars (will be converted to cents)
 * @param feePercentage Instant payout fee percentage (default: 1.50 for US)
 * @param currency Currency code (default: 'usd')
 * @param destination Optional: debit card ID or bank account ID for payout destination
 * @returns The payout object
 */
export async function createInstantPayout(
  accountId: string,
  amount: number,
  feePercentage: number = 1.50, // Default to US rate
  currency: string = 'usd',
  destination?: string
): Promise<Stripe.Payout> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Calculate instant payout fee
  const feeCalculation = calculateInstantPayoutFee(amount, feePercentage, currency);
  const payoutAmountCents = Math.round(feeCalculation.payoutAmount * 100);

  // Create instant payout
  // Note: Instant payouts require the account to have a debit card or eligible bank account on file
  // and sufficient instant_available balance
  const payoutParams: Stripe.PayoutCreateParams = {
    amount: payoutAmountCents,
    currency: currency.toLowerCase(),
    method: 'instant', // Use 'instant' for instant payouts, 'standard' for 2-7 day payouts
  };

  // Add destination if provided (debit card or bank account ID)
  if (destination) {
    payoutParams.destination = destination;
  }

  const payout = await stripe.payouts.create(
    payoutParams,
    {
      stripeAccount: accountId,
    }
  );

  return payout;
}

/**
 * Get payout schedule information for a connected account
 */
export async function getPayoutSchedule(accountId: string): Promise<{
  interval: string;
  delayDays: number;
  monthlyAnchor?: number;
  weeklyAnchor?: string;
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const account = await stripe.accounts.retrieve(accountId);
  const settings = account.settings?.payouts;

  return {
    interval: settings?.schedule?.interval || 'manual',
    delayDays: settings?.schedule?.delay_days || 0,
    monthlyAnchor: settings?.schedule?.monthly_anchor,
    weeklyAnchor: settings?.schedule?.weekly_anchor,
  };
}

