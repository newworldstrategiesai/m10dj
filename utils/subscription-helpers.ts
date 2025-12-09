/**
 * Subscription Enforcement Utilities
 * 
 * These utilities enforce subscription limits and feature access
 * for multi-tenant SaaS. All checks should happen before allowing
 * resource creation or feature access.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Organization } from './organization-context';
import { hasFeatureAccess } from './organization-context';

export interface SubscriptionLimit {
  allowed: boolean;
  limit: number; // -1 for unlimited
  current: number;
  message?: string;
}

export interface FeatureGateResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  upgradeTier?: string;
}

/**
 * Check if organization can create a new event
 * Starter: 5 events/month
 * Professional/Enterprise: Unlimited
 */
export async function canCreateEvent(
  supabase: SupabaseClient,
  org: Organization
): Promise<SubscriptionLimit> {
  // Check subscription status
  if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
    return {
      allowed: false,
      limit: 0,
      current: 0,
      message: `Your subscription is ${org.subscription_status}. Please update your subscription to create events.`,
    };
  }

  // Check if trial expired
  if (org.subscription_status === 'trial' && org.trial_ends_at) {
    const trialEnd = new Date(org.trial_ends_at);
    if (trialEnd < new Date()) {
      return {
        allowed: false,
        limit: 0,
        current: 0,
        message: 'Your trial has expired. Please upgrade to continue creating events.',
      };
    }
  }

  // Professional and Enterprise have unlimited events
  if (hasFeatureAccess(org, 'unlimited_events')) {
    return {
      allowed: true,
      limit: -1, // Unlimited
      current: 0,
    };
  }

  // Starter tier: 5 events per month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { count, error } = await supabase
    .from('crowd_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('request_type', 'event') // Only count actual events, not song requests
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    console.error('Error checking event limit:', error);
    // FAIL CLOSED - Deny access if we can't verify limits (security first)
    return {
      allowed: false,
      limit: 5,
      current: 0,
      message: 'Unable to verify subscription limits. Please try again or contact support.',
    };
  }

  const current = count || 0;
  const limit = 5; // Starter tier limit

  if (current >= limit) {
    return {
      allowed: false,
      limit,
      current,
      message: `You've reached your monthly event limit (${limit}). Upgrade to Professional for unlimited events.`,
    };
  }

  return {
    allowed: true,
    limit,
    current,
  };
}

/**
 * Check if organization can send SMS messages
 * Starter: No SMS
 * Professional/Enterprise: Unlimited SMS
 */
export async function canSendSMS(
  supabase: SupabaseClient,
  org: Organization
): Promise<FeatureGateResult> {
  // Check subscription status
  if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
    return {
      allowed: false,
      reason: `Your subscription is ${org.subscription_status}. Please update your subscription.`,
      upgradeRequired: true,
    };
  }

  // Check if trial expired
  if (org.subscription_status === 'trial' && org.trial_ends_at) {
    const trialEnd = new Date(org.trial_ends_at);
    if (trialEnd < new Date()) {
      return {
        allowed: false,
        reason: 'Your trial has expired. Please upgrade to continue using SMS features.',
        upgradeRequired: true,
        upgradeTier: 'professional',
      };
    }
  }

  // SMS is only available on Professional and Enterprise
  if (org.subscription_tier === 'professional' || org.subscription_tier === 'enterprise') {
    return {
      allowed: true,
    };
  }

  return {
    allowed: false,
    reason: 'SMS messaging is only available on Professional and Enterprise plans.',
    upgradeRequired: true,
    upgradeTier: 'professional',
  };
}

/**
 * Check if organization can use white-label features
 * Only available on Enterprise tier
 */
export function canUseWhiteLabel(org: Organization): FeatureGateResult {
  if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
    return {
      allowed: false,
      reason: `Your subscription is ${org.subscription_status}. Please update your subscription.`,
      upgradeRequired: true,
    };
  }

  if (hasFeatureAccess(org, 'white_label')) {
    return {
      allowed: true,
    };
  }

  return {
    allowed: false,
    reason: 'White-label features are only available on Enterprise plans.',
    upgradeRequired: true,
    upgradeTier: 'enterprise',
  };
}

/**
 * Check if organization can add team members
 * Only available on Enterprise tier
 */
export function canAddTeamMembers(org: Organization): FeatureGateResult {
  if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
    return {
      allowed: false,
      reason: `Your subscription is ${org.subscription_status}. Please update your subscription.`,
      upgradeRequired: true,
    };
  }

  if (hasFeatureAccess(org, 'multi_user')) {
    return {
      allowed: true,
    };
  }

  return {
    allowed: false,
    reason: 'Team members are only available on Enterprise plans.',
    upgradeRequired: true,
    upgradeTier: 'enterprise',
  };
}

/**
 * Check if organization can use API access
 * Only available on Enterprise tier
 */
export function canUseAPI(org: Organization): FeatureGateResult {
  if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
    return {
      allowed: false,
      reason: `Your subscription is ${org.subscription_status}. Please update your subscription.`,
      upgradeRequired: true,
    };
  }

  if (hasFeatureAccess(org, 'api_access')) {
    return {
      allowed: true,
    };
  }

  return {
    allowed: false,
    reason: 'API access is only available on Enterprise plans.',
    upgradeRequired: true,
    upgradeTier: 'enterprise',
  };
}

/**
 * Get current usage statistics for an organization
 */
export async function getUsageStats(
  supabase: SupabaseClient,
  org: Organization
): Promise<{
  eventsThisMonth: number;
  eventsLimit: number; // -1 for unlimited
  smsSentThisMonth?: number;
  teamMembersCount?: number;
  teamMembersLimit?: number; // -1 for unlimited
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Count events this month
  const { count: eventsCount } = await supabase
    .from('crowd_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .eq('request_type', 'event')
    .gte('created_at', startOfMonth.toISOString());

  // Determine limits based on tier
  const eventsLimit = hasFeatureAccess(org, 'unlimited_events') ? -1 : 5;

  // Count team members if on Enterprise
  let teamMembersCount: number | undefined;
  let teamMembersLimit: number | undefined;
  if (hasFeatureAccess(org, 'multi_user')) {
    const { count: membersCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('is_active', true);

    teamMembersCount = membersCount || 0;
    teamMembersLimit = -1; // Unlimited for Enterprise
  }

  // TODO: Count SMS messages sent this month
  // This would require tracking SMS usage in a separate table

  return {
    eventsThisMonth: eventsCount || 0,
    eventsLimit,
    teamMembersCount,
    teamMembersLimit,
  };
}

/**
 * Format subscription limit message for UI
 */
export function formatLimitMessage(limit: SubscriptionLimit): string {
  if (limit.allowed) {
    if (limit.limit === -1) {
      return 'Unlimited';
    }
    return `${limit.current} / ${limit.limit}`;
  }
  return limit.message || 'Limit reached';
}

/**
 * Get organization from phone number (for SMS routes)
 * Returns organization if contact exists and has organization_id
 */
export async function getOrganizationFromPhone(
  supabase: SupabaseClient,
  phoneNumber: string
): Promise<Organization | null> {
  try {
    // Clean phone number for matching
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Find contact by phone number
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('organization_id')
      .or(`phone.ilike.%${cleanPhone}%,phone.eq.${phoneNumber}`)
      .limit(1)
      .single();
    
    if (error || !contact || !contact.organization_id) {
      return null;
    }
    
    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', contact.organization_id)
      .single();
    
    if (orgError || !org) {
      return null;
    }
    
    return org as Organization;
  } catch (error) {
    console.error('Error getting organization from phone:', error);
    return null;
  }
}

