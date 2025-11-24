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
      
      const v1AccountData: Stripe.AccountCreateParams = {
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          organization_name: organizationName,
          organization_slug: organizationSlug,
        },
        business_profile: {
          url: businessProfileUrl,
        },
      };

      // Add branding if provided
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
          v1AccountData.settings = {
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
    throw new Error(`Stripe error: ${stripeError.message || stripeError.type || 'Unknown Stripe error'}`);
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
      // Fall back to v1 API Account Links
      console.warn('v2 Account Links API not available, using v1:', v2Error.message);
      
      const v1LinkData: Stripe.AccountLinkCreateParams = {
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
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
 * Get the current onboarding status of a Connect account using v2 API
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
    // Try v2 API structure for retrieving account
    // Use the standard SDK method with expand parameter
    const account: any = await stripe.accounts.retrieve(accountId, {
      expand: ['requirements'],
    });

    // Extract merchant configuration status
    const merchantConfig = account.configuration?.merchant;
    const chargesEnabled = merchantConfig?.capabilities?.card_payments?.status === 'active';
    
    // Extract payout status from account
    const payoutsEnabled = account.payouts_enabled || false;
    const detailsSubmitted = account.requirements?.details_submitted || false;

    // Extract requirements for detailed status
    const requirements = account.requirements ? {
      currentlyDue: account.requirements.currently_due || [],
      eventuallyDue: account.requirements.eventually_due || [],
      pastDue: account.requirements.past_due || [],
    } : undefined;

    return {
      chargesEnabled: chargesEnabled || false,
      payoutsEnabled,
      detailsSubmitted,
      requirements,
    };
  } catch (error: any) {
    console.error('Error retrieving account status:', error);
    // Fallback to v1 API if v2 fails
    try {
      const account = await stripe.accounts.retrieve(accountId);
      return {
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        detailsSubmitted: account.details_submitted || false,
      };
    } catch (fallbackError: any) {
      throw new Error(`Failed to retrieve account status: ${fallbackError?.message || String(fallbackError)}`);
    }
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
 */
export async function getAccountBalance(accountId: string): Promise<{
  available: number;
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
    pending: balance.pending[0]?.amount || 0,
    currency: balance.available[0]?.currency || 'usd',
  };
}

