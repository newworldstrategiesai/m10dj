/**
 * Organization Context Utilities
 * 
 * These utilities help manage organization context in a multi-tenant application.
 * All queries should filter by organization_id to ensure data isolation.
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  subscription_tier: 'starter' | 'professional' | 'enterprise' | 'white_label';
  subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due';
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  trial_ends_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's organization (client-side)
 */
export async function getCurrentOrganization(
  supabase: SupabaseClient
): Promise<Organization | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    if (orgError || !org) {
      return null;
    }

    return org as Organization;
  } catch (error) {
    console.error('Error getting current organization:', error);
    return null;
  }
}

/**
 * Get the current user's organization (server-side)
 * 
 * Note: For server-side usage in API routes, use getCurrentOrganization with
 * a Supabase client created via createServerSupabaseClient in the API route.
 * This function is kept for backwards compatibility but may not work in all contexts.
 */
export async function getCurrentOrganizationServer(
  supabase: SupabaseClient
): Promise<Organization | null> {
  // Delegate to the client-side function since it works the same way
  return getCurrentOrganization(supabase);
}

/**
 * Require an active organization (throws error if not found or inactive)
 */
export async function requireActiveOrganization(
  supabase: SupabaseClient
): Promise<Organization> {
  const org = await getCurrentOrganization(supabase);
  
  if (!org) {
    throw new Error('No organization found. Please complete onboarding.');
  }

  if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
    throw new Error(`Organization subscription is ${org.subscription_status}. Please update your subscription.`);
  }

  // Check if trial has expired
  if (org.subscription_status === 'trial' && org.trial_ends_at) {
    const trialEnd = new Date(org.trial_ends_at);
    if (trialEnd < new Date()) {
      throw new Error('Trial period has expired. Please upgrade your subscription.');
    }
  }

  return org;
}

/**
 * Check if organization has access to a feature based on subscription tier
 */
export function hasFeatureAccess(
  org: Organization,
  feature: 'unlimited_events' | 'all_payment_methods' | 'white_label' | 'api_access' | 'multi_user'
): boolean {
  switch (feature) {
    case 'unlimited_events':
      return org.subscription_tier === 'professional' || org.subscription_tier === 'enterprise';
    
    case 'all_payment_methods':
      return org.subscription_tier === 'professional' || org.subscription_tier === 'enterprise';
    
    case 'white_label':
    case 'api_access':
    case 'multi_user':
      return org.subscription_tier === 'enterprise';
    
    default:
      return false;
  }
}

/**
 * Get organization by slug (for subdomain routing)
 */
export async function getOrganizationBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Organization | null> {
  try {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !org) {
      return null;
    }

    return org as Organization;
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    return null;
  }
}

/**
 * Create a new organization for a user
 */
export async function createOrganization(
  supabase: SupabaseClient,
  name: string,
  ownerId: string
): Promise<Organization | null> {
  try {
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existing = await getOrganizationBySlug(supabase, slug);
    if (existing) {
      // Append random string if slug exists
      const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
      return await createOrganizationWithSlug(supabase, name, uniqueSlug, ownerId);
    }

    return await createOrganizationWithSlug(supabase, name, slug, ownerId);
  } catch (error) {
    console.error('Error creating organization:', error);
    return null;
  }
}

/**
 * Create organization with specific slug
 */
async function createOrganizationWithSlug(
  supabase: SupabaseClient,
  name: string,
  slug: string,
  ownerId: string
): Promise<Organization | null> {
  try {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        owner_id: ownerId,
        subscription_tier: 'starter',
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select()
      .single();

    if (error || !org) {
      console.error('Error creating organization:', error);
      return null;
    }

    return org as Organization;
  } catch (error) {
    console.error('Error creating organization:', error);
    return null;
  }
}

/**
 * Check subscription limits (e.g., events per month for starter tier)
 */
export async function checkSubscriptionLimits(
  supabase: SupabaseClient,
  org: Organization,
  limitType: 'events_per_month'
): Promise<{ allowed: boolean; limit: number; current: number; message?: string }> {
  if (org.subscription_tier === 'professional' || org.subscription_tier === 'enterprise') {
    return { allowed: true, limit: -1, current: 0 }; // Unlimited
  }

  if (limitType === 'events_per_month') {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count } = await supabase
      .from('crowd_requests')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .gte('created_at', startOfMonth.toISOString());

    const current = count || 0;
    const limit = 5; // Starter tier: 5 events/month

    if (current >= limit) {
      return {
        allowed: false,
        limit,
        current,
        message: `You've reached your monthly event limit (${limit}). Upgrade to Professional for unlimited events.`,
      };
    }

    return { allowed: true, limit, current };
  }

  return { allowed: true, limit: -1, current: 0 };
}

