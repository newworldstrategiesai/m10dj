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
 * Get branding for Stripe Connect Express account creation
 */
export function getConnectAccountBranding(
  customBranding?: Partial<PlatformBranding>
): {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
} {
  const branding = { ...defaultBranding, ...customBranding };

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

