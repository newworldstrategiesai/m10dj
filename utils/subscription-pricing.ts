/**
 * Subscription Pricing Utilities
 * 
 * Helper functions to get Stripe price IDs based on product context.
 * This allows multiple SaaS products (TipJar, DJDash) to have different pricing.
 */

/**
 * Get Stripe price IDs for a specific product
 * @param productContext - The product context ('tipjar', 'djdash', etc.)
 * @returns Object with price IDs for starter, professional, and enterprise tiers
 */
export function getPriceIdsForProduct(productContext: string | null | undefined): {
  starter: string;
  professional: string;
  enterprise: string;
} {
  // Default to TipJar if no product context specified
  const product = productContext || 'tipjar';

  switch (product) {
    case 'tipjar':
      return {
        starter: process.env.TIPJAR_STARTER_PRICE_ID || process.env.NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID || '',
        professional: process.env.TIPJAR_PROFESSIONAL_PRICE_ID || process.env.NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID || '',
        enterprise: process.env.TIPJAR_ENTERPRISE_PRICE_ID || process.env.NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID || '',
      };
    
    case 'djdash':
      return {
        starter: process.env.DJDASH_STARTER_PRICE_ID || process.env.NEXT_PUBLIC_DJDASH_STARTER_PRICE_ID || '',
        professional: process.env.DJDASH_PROFESSIONAL_PRICE_ID || process.env.NEXT_PUBLIC_DJDASH_PROFESSIONAL_PRICE_ID || '',
        enterprise: process.env.DJDASH_ENTERPRISE_PRICE_ID || process.env.NEXT_PUBLIC_DJDASH_ENTERPRISE_PRICE_ID || '',
      };
    
    default:
      // Default to TipJar pricing
      return {
        starter: process.env.TIPJAR_STARTER_PRICE_ID || process.env.NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID || '',
        professional: process.env.TIPJAR_PROFESSIONAL_PRICE_ID || process.env.NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID || '',
        enterprise: process.env.TIPJAR_ENTERPRISE_PRICE_ID || process.env.NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID || '',
      };
  }
}

/**
 * Get client-side price IDs for a specific product (uses NEXT_PUBLIC_ prefix)
 * @param productContext - The product context ('tipjar', 'djdash', etc.)
 * @returns Object with price IDs for starter, professional, and enterprise tiers
 */
export function getClientPriceIdsForProduct(productContext: string | null | undefined): {
  starter: string;
  professional: string;
  enterprise: string;
} {
  const product = productContext || 'tipjar';

  switch (product) {
    case 'tipjar':
      return {
        starter: process.env.NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID || '',
        professional: process.env.NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID || '',
        enterprise: process.env.NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID || '',
      };
    
    case 'djdash':
      return {
        starter: process.env.NEXT_PUBLIC_DJDASH_STARTER_PRICE_ID || '',
        professional: process.env.NEXT_PUBLIC_DJDASH_PROFESSIONAL_PRICE_ID || '',
        enterprise: process.env.NEXT_PUBLIC_DJDASH_ENTERPRISE_PRICE_ID || '',
      };
    
    default:
      return {
        starter: process.env.NEXT_PUBLIC_TIPJAR_STARTER_PRICE_ID || '',
        professional: process.env.NEXT_PUBLIC_TIPJAR_PROFESSIONAL_PRICE_ID || '',
        enterprise: process.env.NEXT_PUBLIC_TIPJAR_ENTERPRISE_PRICE_ID || '',
      };
  }
}

/**
 * Map a price ID to a subscription tier for a specific product
 * @param priceId - The Stripe price ID
 * @param productContext - The product context ('tipjar', 'djdash', etc.)
 * @returns The subscription tier ('starter', 'professional', 'enterprise') or 'starter' as default
 */
export function getTierFromPriceId(priceId: string, productContext: string | null | undefined): 'starter' | 'professional' | 'enterprise' {
  const priceIds = getPriceIdsForProduct(productContext);
  
  if (priceId === priceIds.starter) return 'starter';
  if (priceId === priceIds.professional) return 'professional';
  if (priceId === priceIds.enterprise) return 'enterprise';
  
  // Fallback: check against all known price IDs
  const tipjarPrices = getPriceIdsForProduct('tipjar');
  const djdashPrices = getPriceIdsForProduct('djdash');
  
  if (priceId === tipjarPrices.starter || priceId === djdashPrices.starter) return 'starter';
  if (priceId === tipjarPrices.professional || priceId === djdashPrices.professional) return 'professional';
  if (priceId === tipjarPrices.enterprise || priceId === djdashPrices.enterprise) return 'enterprise';
  
  return 'starter'; // Default fallback
}

