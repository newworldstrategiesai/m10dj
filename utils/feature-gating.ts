/**
 * Feature Gating Utilities
 * 
 * Handles feature access based on subscription tier and usage limits.
 * Supports multiple products (TipJar, DJDash) with different pricing.
 */

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise' | 'white_label';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'past_due';

export interface FeatureAccess {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: SubscriptionTier;
}

/**
 * Feature definitions for TipJar.live
 */
export const TIPJAR_FEATURES = {
  // Request limits
  SONG_REQUESTS: {
    starter: { limit: 10, unit: 'per_month' },
    professional: { limit: -1 }, // -1 = unlimited
    enterprise: { limit: -1 },
    white_label: { limit: -1 }, // Unlimited
  },
  
  // Payment processing
  PAYMENT_PROCESSING: {
    starter: false,
    professional: true,
    enterprise: true,
    white_label: true,
  },
  
  // Custom branding
  CUSTOM_BRANDING: {
    starter: false,
    professional: true,
    enterprise: true,
    white_label: true,
  },
  
  // Analytics
  ANALYTICS: {
    starter: false,
    professional: true, // Basic analytics
    enterprise: true, // Advanced analytics
    white_label: true, // Advanced analytics
  },
  
  // Embed widget
  EMBED_WIDGET: {
    starter: false,
    professional: false,
    enterprise: true,
    white_label: true,
  },
  
  // White-label (remove "Powered by TipJar")
  WHITE_LABEL: {
    starter: false,
    professional: false,
    enterprise: true,
    white_label: true,
  },
  
  // API access
  API_ACCESS: {
    starter: false,
    professional: false,
    enterprise: true,
    white_label: true,
  },
} as const;

/**
 * Check if a subscription tier has access to a feature
 */
export function hasFeatureAccess(
  tier: SubscriptionTier,
  feature: keyof typeof TIPJAR_FEATURES
): boolean {
  const featureConfig = TIPJAR_FEATURES[feature];
  const tierAccess = featureConfig[tier];
  
  if (typeof tierAccess === 'boolean') {
    return tierAccess;
  }
  
  // For limit-based features, check if limit exists (not false)
  return tierAccess !== undefined;
}

/**
 * Get the minimum tier required for a feature
 */
export function getRequiredTierForFeature(
  feature: keyof typeof TIPJAR_FEATURES
): SubscriptionTier {
  if (TIPJAR_FEATURES[feature].starter) return 'starter';
  if (TIPJAR_FEATURES[feature].professional) return 'professional';
  if (TIPJAR_FEATURES[feature].enterprise) return 'enterprise';
  return 'enterprise'; // Default fallback
}

/**
 * Check if subscription status allows feature access
 * Only active and trial subscriptions can access features
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trial';
}

/**
 * Check if user can create song requests (with usage limits)
 */
export async function canCreateSongRequest(
  currentUsage: number,
  tier: SubscriptionTier,
  status: SubscriptionStatus
): Promise<FeatureAccess> {
  // Check subscription status
  if (!isSubscriptionActive(status)) {
    return {
      allowed: false,
      reason: `Subscription is ${status}. Please update your subscription.`,
      upgradeRequired: 'professional',
    };
  }
  
  // Check tier limit
  const limit = TIPJAR_FEATURES.SONG_REQUESTS[tier]?.limit;
  
  // Unlimited (Pro+)
  if (limit === -1) {
    return { allowed: true };
  }
  
  // Limited (Free tier: 10/month)
  if (limit && currentUsage >= limit) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limit} requests this month. Upgrade to Pro for unlimited requests.`,
      upgradeRequired: 'professional',
    };
  }
  
  return { allowed: true };
}

/**
 * Check if user can process payments
 */
export function canProcessPayments(
  tier: SubscriptionTier,
  status: SubscriptionStatus
): FeatureAccess {
  // Check subscription status
  if (!isSubscriptionActive(status)) {
    return {
      allowed: false,
      reason: `Subscription is ${status}. Please update your subscription.`,
      upgradeRequired: 'professional',
    };
  }
  
  // Check tier access
  const hasAccess = hasFeatureAccess(tier, 'PAYMENT_PROCESSING');
  
  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'Payment processing is only available on Pro plans. Upgrade to accept tips and payments.',
      upgradeRequired: 'professional',
    };
  }
  
  return { allowed: true };
}

/**
 * Check if user can use custom branding
 */
export function canUseCustomBranding(
  tier: SubscriptionTier,
  status: SubscriptionStatus
): FeatureAccess {
  if (!isSubscriptionActive(status)) {
    return {
      allowed: false,
      reason: `Subscription is ${status}. Please update your subscription.`,
      upgradeRequired: 'professional',
    };
  }
  
  const hasAccess = hasFeatureAccess(tier, 'CUSTOM_BRANDING');
  
  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'Custom branding is only available on Pro plans. Upgrade to customize your branding.',
      upgradeRequired: 'professional',
    };
  }
  
  return { allowed: true };
}

/**
 * Check if user can use embed widget
 */
export function canUseEmbedWidget(
  tier: SubscriptionTier,
  status: SubscriptionStatus
): FeatureAccess {
  if (!isSubscriptionActive(status)) {
    return {
      allowed: false,
      reason: `Subscription is ${status}. Please update your subscription.`,
      upgradeRequired: 'enterprise',
    };
  }
  
  const hasAccess = hasFeatureAccess(tier, 'EMBED_WIDGET');
  
  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'Embed widget is only available on Embed Pro plans. Upgrade to embed TipJar on your website.',
      upgradeRequired: 'enterprise',
    };
  }
  
  return { allowed: true };
}

/**
 * Check if user can use white-label features
 */
export function canUseWhiteLabel(
  tier: SubscriptionTier,
  status: SubscriptionStatus
): FeatureAccess {
  if (!isSubscriptionActive(status)) {
    return {
      allowed: false,
      reason: `Subscription is ${status}. Please update your subscription.`,
      upgradeRequired: 'enterprise',
    };
  }
  
  const hasAccess = hasFeatureAccess(tier, 'WHITE_LABEL');
  
  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'White-label features are only available on Embed Pro plans. Upgrade to remove "Powered by TipJar".',
      upgradeRequired: 'enterprise',
    };
  }
  
  return { allowed: true };
}

/**
 * Check if user can access analytics
 */
export function canAccessAnalytics(
  tier: SubscriptionTier,
  status: SubscriptionStatus
): FeatureAccess {
  if (!isSubscriptionActive(status)) {
    return {
      allowed: false,
      reason: `Subscription is ${status}. Please update your subscription.`,
      upgradeRequired: 'professional',
    };
  }
  
  const hasAccess = hasFeatureAccess(tier, 'ANALYTICS');
  
  if (!hasAccess) {
    return {
      allowed: false,
      reason: 'Analytics is only available on Pro plans. Upgrade to view detailed analytics.',
      upgradeRequired: 'professional',
    };
  }
  
  return { allowed: true };
}

/**
 * Get request limit for a tier
 */
export function getRequestLimit(tier: SubscriptionTier): number {
  const limit = TIPJAR_FEATURES.SONG_REQUESTS[tier]?.limit;
  return limit === -1 ? Infinity : (limit || 0);
}

/**
 * Get remaining requests for the month
 */
export function getRemainingRequests(
  currentUsage: number,
  tier: SubscriptionTier
): number {
  const limit = getRequestLimit(tier);
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - currentUsage);
}

