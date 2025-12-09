/**
 * Subscription Access Helpers
 * 
 * Utilities to check if a user has access to features based on their subscription tier
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Organization } from './organization-context';
import { isPlatformAdmin } from './auth-helpers/platform-admin';

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  supabase: SupabaseClient,
  userEmail: string | null | undefined,
  feature: 'crm' | 'projects' | 'invoices' | 'financial' | 'analytics' | 'team' | 'white_label'
): Promise<{ hasAccess: boolean; requiredTier: string; currentTier?: string }> {
  // Platform admins always have access
  if (isPlatformAdmin(userEmail)) {
    return { hasAccess: true, requiredTier: 'platform_admin' };
  }

  // Get user's organization
  const { getCurrentOrganization } = await import('./organization-context');
  const org = await getCurrentOrganization(supabase);

  if (!org) {
    return { hasAccess: false, requiredTier: 'professional' };
  }

  // Platform owners (M10 DJ Company) always have access
  if (org.is_platform_owner) {
    return { hasAccess: true, requiredTier: 'platform_owner', currentTier: 'platform_owner' };
  }

  const currentTier = org.subscription_tier;

  // Feature access rules
  switch (feature) {
    case 'crm':
    case 'projects':
    case 'invoices':
    case 'financial':
    case 'analytics':
      // These require Professional or higher
      return {
        hasAccess: currentTier === 'professional' || currentTier === 'enterprise' || currentTier === 'white_label',
        requiredTier: 'professional',
        currentTier
      };
    
    case 'team':
    case 'white_label':
      // These require Enterprise
      return {
        hasAccess: currentTier === 'enterprise' || currentTier === 'white_label',
        requiredTier: 'enterprise',
        currentTier
      };
    
    default:
      return { hasAccess: false, requiredTier: 'professional', currentTier };
  }
}

/**
 * Check if user can access a specific admin page
 */
export async function canAccessAdminPage(
  supabase: SupabaseClient,
  userEmail: string | null | undefined,
  page: 'contacts' | 'projects' | 'invoices' | 'financial' | 'analytics' | 'team' | 'settings'
): Promise<{ canAccess: boolean; reason?: string; requiredTier?: string }> {
  // Platform admins can access everything
  if (isPlatformAdmin(userEmail)) {
    return { canAccess: true };
  }

  const { getCurrentOrganization } = await import('./organization-context');
  const org = await getCurrentOrganization(supabase);

  if (!org) {
    return { 
      canAccess: false, 
      reason: 'No organization found. Please complete onboarding.',
      requiredTier: 'professional'
    };
  }

  // Platform owners (M10 DJ Company) always have access
  if (org.is_platform_owner) {
    return { canAccess: true };
  }

  // Map pages to features
  const pageFeatureMap: Record<string, 'crm' | 'projects' | 'invoices' | 'financial' | 'analytics' | 'team'> = {
    'contacts': 'crm',
    'projects': 'projects',
    'invoices': 'invoices',
    'financial': 'financial',
    'analytics': 'analytics',
    'team': 'team',
    'settings': 'crm' // Settings available to all, but some settings require higher tiers
  };

  const feature = pageFeatureMap[page] || 'crm';
  const access = await hasFeatureAccess(supabase, userEmail, feature);

  if (!access.hasAccess) {
    return {
      canAccess: false,
      reason: `This feature requires a ${access.requiredTier} subscription.`,
      requiredTier: access.requiredTier
    };
  }

  return { canAccess: true };
}

