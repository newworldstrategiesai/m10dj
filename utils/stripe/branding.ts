/**
 * Stripe Branding Configuration
 * 
 * Centralized branding configuration for Stripe Connect Express
 * to minimize Stripe branding and maximize your platform branding.
 */

export interface PlatformBranding {
  logo?: string; // URL to your logo
  primaryColor?: string; // Hex color for primary actions
  secondaryColor?: string; // Hex color for secondary elements
  backgroundColor?: string; // Background color
  textColor?: string; // Text color
  fontFamily?: string; // Font family
  companyName?: string; // Your company name
}

/**
 * Default branding configuration
 * Update these values to match your brand
 */
export const defaultBranding: PlatformBranding = {
  logo: '/logo-static.jpg', // Your logo URL
  primaryColor: '#6366f1', // Purple (update to your brand color)
  secondaryColor: '#ec4899', // Pink (update to your brand color)
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  fontFamily: 'system-ui, sans-serif',
  companyName: 'M10 DJ Company', // Update to your platform name
};

/**
 * Product-specific branding configurations
 * Each product has its own branding for Stripe Connect onboarding
 */
export const productBranding: Record<'tipjar' | 'djdash' | 'm10dj', PlatformBranding> = {
  tipjar: {
    logo: 'https://tipjar.live/tipjar-logo.svg', // Use absolute URL for Stripe
    primaryColor: '#8b5cf6', // Purple
    secondaryColor: '#ec4899', // Pink
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'system-ui, sans-serif',
    companyName: 'TipJar.Live',
  },
  djdash: {
    logo: 'https://djdash.net/djdash-logo.svg', // Use absolute URL for Stripe
    primaryColor: '#3b82f6', // Blue
    secondaryColor: '#6366f1', // Indigo
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'system-ui, sans-serif',
    companyName: 'DJ Dash',
  },
  m10dj: {
    logo: 'https://m10djcompany.com/logo-static.jpg', // Use absolute URL for Stripe
    primaryColor: '#000000', // Black
    secondaryColor: '#fbbf24', // Gold/Yellow
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'system-ui, sans-serif',
    companyName: 'M10 DJ Company',
  },
};

/**
 * Get branding for Stripe Connect Express account creation
 * Supports product-specific branding based on product context
 */
export function getConnectAccountBranding(
  customBranding?: Partial<PlatformBranding>,
  productContext?: 'tipjar' | 'djdash' | 'm10dj' | null
): {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
} {
  // Use product-specific branding if product context is provided
  const baseBranding = productContext && productBranding[productContext]
    ? productBranding[productContext]
    : defaultBranding;

  const branding = { ...baseBranding, ...customBranding };

  return {
    logo: branding.logo,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
  };
}

/**
 * Get branding for Stripe Elements (payment forms)
 */
export function getElementsBranding(
  customBranding?: Partial<PlatformBranding>
): {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
} {
  const branding = { ...defaultBranding, ...customBranding };

  return {
    primaryColor: branding.primaryColor,
    backgroundColor: branding.backgroundColor,
    textColor: branding.textColor,
    fontFamily: branding.fontFamily,
  };
}

/**
 * Instructions for customizing Express Dashboard in Stripe
 */
export const EXPRESS_DASHBOARD_CUSTOMIZATION = {
  steps: [
    'Go to Stripe Dashboard → Settings → Connect',
    'Click on "Express accounts"',
    'Upload your logo',
    'Set brand colors (primary and secondary)',
    'Customize dashboard features',
    'Set custom transaction descriptions',
    'Save changes',
  ],
  notes: [
    'Changes apply to all new Express accounts',
    'Existing accounts may need to be updated',
    'Logo should be at least 128x128px',
    'Use your brand colors for consistency',
  ],
};

