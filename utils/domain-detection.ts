/**
 * Domain Detection and Product Configuration
 * 
 * Detects which product/domain the user is accessing and provides
 * appropriate configuration for feature gating and SEO.
 */

export type ProductType = 'tipjar' | 'djdash' | 'platform';

export interface ProductConfig {
  product: ProductType;
  domain: string;
  features: string[] | 'all';
  canonicalDomain: string;
}

/**
 * Get product configuration based on hostname
 */
export function getProductConfig(hostname: string | null | undefined): ProductConfig {
  // Default to platform if hostname is not available
  if (!hostname) {
    return {
      product: 'platform',
      domain: 'm10djcompany.com',
      features: 'all',
      canonicalDomain: 'https://m10djcompany.com',
    };
  }

  const hostnameLower = hostname.toLowerCase();

  // TipJar product
  if (hostnameLower.includes('tipjar.live')) {
    return {
      product: 'tipjar',
      domain: 'tipjar.live',
      features: ['requests', 'payments', 'basic_analytics'],
      canonicalDomain: 'https://tipjar.live',
    };
  }

  // DJ Dash product
  if (hostnameLower.includes('djdash.net')) {
    return {
      product: 'djdash',
      domain: 'djdash.net',
      features: 'all',
      canonicalDomain: 'https://djdash.net',
    };
  }

  // Platform (default)
  return {
    product: 'platform',
    domain: 'm10djcompany.com',
    features: 'all',
    canonicalDomain: 'https://m10djcompany.com',
  };
}

/**
 * Get canonical URL for current domain
 * Prevents duplicate content issues across domains
 */
export function getCanonicalUrl(
  path: string,
  hostname?: string | null
): string {
  const config = getProductConfig(hostname);
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.canonicalDomain}${cleanPath}`;
}

/**
 * Check if a feature is available for the current product
 */
export function canAccessFeature(
  feature: string,
  hostname?: string | null
): boolean {
  const config = getProductConfig(hostname);
  
  if (config.features === 'all') {
    return true;
  }
  
  return config.features.includes(feature);
}

/**
 * Get available features for current product
 */
export function getAvailableFeatures(hostname?: string | null): string[] {
  const config = getProductConfig(hostname);
  
  if (config.features === 'all') {
    return [
      'requests',
      'payments',
      'contacts',
      'contracts',
      'invoices',
      'analytics',
      'chat',
      'sms',
      'projects',
      'team',
    ];
  }
  
  return config.features;
}

/**
 * Get product name for display
 */
export function getProductName(hostname?: string | null): string {
  const config = getProductConfig(hostname);
  
  const names = {
    tipjar: 'TipJar',
    djdash: 'DJ Dash',
    platform: 'M10 DJ Company',
  };
  
  return names[config.product];
}

