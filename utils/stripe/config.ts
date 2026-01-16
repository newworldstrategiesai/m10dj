import Stripe from 'stripe';

/**
 * Create a Stripe instance with proper configuration
 */
const createStripeInstance = (
  apiKey: string,
  appName: string,
  appUrl: string
): Stripe | null => {
  if (!apiKey) return null;
  
  return new Stripe(apiKey, {
    // https://github.com/stripe/stripe-node#configuration
    // https://stripe.com/docs/api/versioning
    // Using preview API version to support Accounts v2 API
    apiVersion: '2025-07-30.preview' as any, // Supports Accounts v2 API - using 'as any' to bypass strict type checking
    // Register this as an official Stripe plugin.
    // https://stripe.com/docs/building-plugins#setappinfo
    appInfo: {
      name: appName,
      version: '1.0.0',
      url: appUrl
    }
  });
};

// Product-specific Stripe keys
const m10djStripeKey = process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '';
const tipjarStripeKey = process.env.STRIPE_SECRET_KEY_TIPJAR_LIVE ?? process.env.STRIPE_SECRET_KEY_TIPJAR ?? '';
const djdashStripeKey = process.env.STRIPE_SECRET_KEY_DJDASH_LIVE ?? process.env.STRIPE_SECRET_KEY_DJDASH ?? '';

// Create Stripe instances per product
export const stripeM10DJ = createStripeInstance(m10djStripeKey, 'M10 DJ Platform', 'https://m10djcompany.com');
export const stripeTipJar = createStripeInstance(tipjarStripeKey, 'TipJar Platform', 'https://tipjar.live');
// DJ Dash can share M10 DJ account if not configured separately
export const stripeDJDash = createStripeInstance(djdashStripeKey, 'DJ Dash Platform', 'https://djdash.net') ?? stripeM10DJ;

// Validate at least one Stripe key exists
if (!m10djStripeKey && !tipjarStripeKey && !djdashStripeKey) {
  console.warn('⚠️  WARNING: No Stripe secret keys found in environment variables');
  console.warn('   Set at least one of:');
  console.warn('   - STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_LIVE (M10 DJ)');
  console.warn('   - STRIPE_SECRET_KEY_TIPJAR or STRIPE_SECRET_KEY_TIPJAR_LIVE (TipJar)');
  console.warn('   - STRIPE_SECRET_KEY_DJDASH or STRIPE_SECRET_KEY_DJDASH_LIVE (DJ Dash)');
}

/**
 * Get the appropriate Stripe instance based on product context
 * Falls back to M10 DJ account if product-specific account is not configured
 */
export function getStripeInstance(productContext?: 'tipjar' | 'djdash' | 'm10dj' | null): Stripe | null {
  switch (productContext) {
    case 'tipjar':
      // Use TipJar account if configured, otherwise fall back to M10 DJ
      return stripeTipJar ?? stripeM10DJ;
    case 'djdash':
      // Use DJ Dash account if configured, otherwise fall back to M10 DJ
      return stripeDJDash ?? stripeM10DJ;
    case 'm10dj':
    default:
      // Default to M10 DJ account
      return stripeM10DJ;
  }
}

/**
 * Get Stripe instance by account ID (for webhooks and account lookups)
 * This attempts to determine which Stripe account owns the given account ID
 */
export async function getStripeInstanceByAccountId(accountId: string): Promise<Stripe | null> {
  // Try TipJar first
  if (stripeTipJar) {
    try {
      await stripeTipJar.accounts.retrieve(accountId);
      return stripeTipJar;
    } catch {
      // Account not found in TipJar, continue
    }
  }
  
  // Try DJ Dash
  if (stripeDJDash && stripeDJDash !== stripeM10DJ) {
    try {
      await stripeDJDash.accounts.retrieve(accountId);
      return stripeDJDash;
    } catch {
      // Account not found in DJ Dash, continue
    }
  }
  
  // Default to M10 DJ (or try it)
  if (stripeM10DJ) {
    try {
      await stripeM10DJ.accounts.retrieve(accountId);
      return stripeM10DJ;
    } catch {
      // Account not found anywhere
    }
  }
  
  // Fallback to M10 DJ as default
  return stripeM10DJ;
}

// Default export for backward compatibility (M10 DJ)
// All existing code using `stripe` will continue to work
export const stripe = stripeM10DJ;
