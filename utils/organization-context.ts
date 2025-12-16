/**
 * Organization Context Utilities
 * 
 * These utilities help manage organization context in a multi-tenant application.
 * All queries should filter by organization_id to ensure data isolation.
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types_db';

// Generic type for Supabase client that accepts any schema
// This allows both client-side and server-side Supabase clients
type AnySupabaseClient = 
  | SupabaseClient<any, any, any, any, any>
  | SupabaseClient<Database, any, any, any, any>;

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
  stripe_connect_account_id?: string | null;
  stripe_connect_charges_enabled?: boolean | null;
  stripe_connect_payouts_enabled?: boolean | null;
  stripe_connect_onboarding_complete?: boolean | null;
  stripe_connect_details_submitted?: boolean | null;
  platform_fee_percentage?: number | null;
  platform_fee_fixed?: number | null;
  is_platform_owner?: boolean | null; // Platform owner (M10 DJ Company) bypasses restrictions
  requests_header_artist_name?: string | null;
  requests_header_location?: string | null;
  requests_header_date?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's organization (client-side)
 * Now supports team members - checks both owner_id and organization_members table
 */
export async function getCurrentOrganization(
  supabase: AnySupabaseClient
): Promise<Organization | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    // First try: user is owner
    let { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .single();

    // Second try: user is a team member
    if (orgError || !org) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (membership?.organization_id) {
        const { data: memberOrg, error: memberOrgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membership.organization_id)
          .single();

        if (!memberOrgError && memberOrg) {
          org = memberOrg;
          orgError = null;
        }
      }
    }

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
  supabase: AnySupabaseClient
): Promise<Organization | null> {
  // Delegate to the client-side function since it works the same way
  return getCurrentOrganization(supabase);
}

/**
 * Require an active organization (throws error if not found or inactive)
 * Platform owners (M10 DJ Company) bypass subscription restrictions
 */
export async function requireActiveOrganization(
  supabase: AnySupabaseClient
): Promise<Organization> {
  const org = await getCurrentOrganization(supabase);
  
  if (!org) {
    throw new Error('No organization found. Please complete onboarding.');
  }

  // PLATFORM OWNER BYPASS - M10 DJ Company never blocked
  // This ensures your business operations are never disrupted
  if (org.is_platform_owner) {
    return org; // Always allow platform owner, no subscription checks
  }

  // Regular subscription checks for other DJs
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
  supabase: AnySupabaseClient,
  slug: string
): Promise<Organization | null> {
  try {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid throwing on not found

    // If there's an error (other than "not found"), log it
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error getting organization by slug:', error);
      return null;
    }

    // If no org found, return null (this is expected and not an error)
    if (!org) {
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
  supabase: AnySupabaseClient,
  name: string,
  ownerId: string
): Promise<Organization | null> {
  try {
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      console.error('Error: Generated slug is empty for name:', name);
      return null;
    }

    // Check if slug already exists for a DIFFERENT owner
    // Users should be able to reuse their own slugs if they delete and recreate
    const existing = await getOrganizationBySlug(supabase, slug);
    if (existing) {
      // Only add suffix if the existing org belongs to a different owner
      if (existing.owner_id !== ownerId) {
        console.log(`Slug "${slug}" already taken by another user, generating unique slug`);
        // Append random string if slug exists for another user
        const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
        return await createOrganizationWithSlug(supabase, name, uniqueSlug, ownerId);
      } else {
        // Same owner already has this slug - this shouldn't happen for new signups
        // But if it does, we'll still create a unique one to avoid database conflicts
        console.warn(`User ${ownerId} already has organization with slug "${slug}", creating with unique suffix`);
        const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
        return await createOrganizationWithSlug(supabase, name, uniqueSlug, ownerId);
      }
    }

    console.log(`Slug "${slug}" is available, using it`);
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
  supabase: AnySupabaseClient,
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
        // Set requests_header_artist_name to the organization name so it displays in the requests page header
        requests_header_artist_name: name,
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
  supabase: AnySupabaseClient,
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

