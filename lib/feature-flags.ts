/**
 * Simple Feature Flag System
 * 
 * Supports zero-downtime refactoring by allowing instant rollback.
 * 
 * Usage:
 *   const useNewVersion = useFeatureFlag('USE_NEW_REQUESTS_PAGE');
 *   if (useNewVersion) {
 *     return <NewComponent />;
 *   }
 *   return <OldComponent />;
 */

export const FEATURE_FLAGS = {
  USE_NEW_REQUESTS_PAGE: 'USE_NEW_REQUESTS_PAGE',
  USE_NEW_CROWD_REQUESTS: 'USE_NEW_CROWD_REQUESTS',
  USE_NEW_ADMIN_REQUESTS: 'USE_NEW_ADMIN_REQUESTS',
} as const;

type FeatureFlagName = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

/**
 * Client-side feature flag check
 * Uses environment variables for simple implementation
 * 
 * For gradual rollout, set NEXT_PUBLIC_USE_NEW_REQUESTS_PAGE_ROLLOUT=10 (for 10%)
 */
export function useFeatureFlag(flagName: FeatureFlagName): boolean {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable
    return getFeatureFlag(flagName);
  }
  
  // Client-side: check environment variable
  const envKey = `NEXT_PUBLIC_${flagName}`;
  const enabled = process.env[envKey] === 'true';
  const rolloutKey = `NEXT_PUBLIC_${flagName}_ROLLOUT`;
  const rollout = parseInt(process.env[rolloutKey] || '0', 10);
  
  if (!enabled) return false;
  if (rollout === 100) return true;
  if (rollout === 0) return false;
  
  // For gradual rollout, use session storage to ensure consistent experience
  const sessionKey = `feature_flag_${flagName}`;
  const cached = sessionStorage.getItem(sessionKey);
  
  if (cached !== null) {
    return cached === 'true';
  }
  
  // Random assignment for this session
  const shouldEnable = Math.random() * 100 < rollout;
  sessionStorage.setItem(sessionKey, shouldEnable.toString());
  
  return shouldEnable;
}

/**
 * Server-side feature flag check
 * For use in API routes, getServerSideProps, etc.
 */
export function getFeatureFlag(flagName: FeatureFlagName): boolean {
  const envKey = `NEXT_PUBLIC_${flagName}`;
  return process.env[envKey] === 'true';
}

/**
 * Get rollout percentage for a flag
 */
export function getFeatureFlagRollout(flagName: FeatureFlagName): number {
  const rolloutKey = `NEXT_PUBLIC_${flagName}_ROLLOUT`;
  return parseInt(process.env[rolloutKey] || '0', 10);
}

/**
 * Check if feature flag is enabled (ignoring rollout percentage)
 */
export function isFeatureFlagEnabled(flagName: FeatureFlagName): boolean {
  const envKey = `NEXT_PUBLIC_${flagName}`;
  return process.env[envKey] === 'true';
}
