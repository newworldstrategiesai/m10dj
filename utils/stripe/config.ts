import Stripe from 'stripe';

// Validate Stripe key exists
const stripeKey = process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '';

if (!stripeKey) {
  console.warn('⚠️  WARNING: Stripe secret key not found in environment variables');
  console.warn('   Set STRIPE_SECRET_KEY or STRIPE_SECRET_KEY_LIVE in your .env.local file');
}

export const stripe = stripeKey ? new Stripe(stripeKey, {
  // https://github.com/stripe/stripe-node#configuration
  // https://stripe.com/docs/api/versioning
  // Using preview API version to support Accounts v2 API
  apiVersion: '2025-07-30.preview' as any, // Supports Accounts v2 API - using 'as any' to bypass strict type checking
  // Register this as an official Stripe plugin.
  // https://stripe.com/docs/building-plugins#setappinfo
  appInfo: {
    name: 'M10 DJ Platform',
    version: '1.0.0',
    url: 'https://m10djcompany.com'
  }
}) : null;
