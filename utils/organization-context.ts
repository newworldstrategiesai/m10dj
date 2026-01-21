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
  product_context?: 'tipjar' | 'djdash' | 'm10dj' | null; // Product context for multi-tenant isolation
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
  organization_type?: 'individual' | 'venue' | 'performer' | null; // Type of organization for venue hierarchy
  parent_organization_id?: string | null; // For performer organizations, references the parent venue
  performer_slug?: string | null; // Unique slug for performer within their parent venue
  is_active?: boolean | null; // Whether the organization is active

  // Artist page fields
  artist_page_enabled?: boolean | null;
  artist_page_headline?: string | null;
  artist_page_bio?: string | null;
  artist_page_profile_image_url?: string | null;
  artist_page_cover_image_url?: string | null;
  artist_page_gallery_images?: string[] | null;
  artist_page_video_urls?: string[] | null;
  artist_page_links?: any[] | null; // JSONB array of link objects
  artist_page_contact_email?: string | null;
  artist_page_contact_phone?: string | null;
  artist_page_booking_url?: string | null;
  artist_page_custom_css?: string | null;

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

    // Handle AbortError gracefully (component unmounted or request cancelled)
    if (userError && (userError.name === 'AbortError' || userError.message?.includes('aborted'))) {
      return null;
    }

    if (userError || !user) {
      return null;
    }

    // SPECIAL CASE: Check if user is a super admin first
    // Super admins get access to the platform owner organization
    try {
      // Check if user is admin using our admin roles system
      const { isAdminEmail } = await import('@/utils/auth-helpers/admin-roles');
      const isAdmin = await isAdminEmail(user.email);

      if (isAdmin) {
        console.log('User is super admin, looking for platform owner organization');

        // Look for platform owner organization
        const { data: platformOrg, error: platformError } = await supabase
          .from('organizations')
          .select('*')
          .eq('is_platform_owner', true)
          .maybeSingle();

        if (!platformError && platformOrg) {
          console.log('Found platform owner organization for super admin:', platformOrg.id);
          return platformOrg as Organization;
        } else {
          console.log('No platform owner organization found, creating fallback for super admin');

          // If no platform owner org exists, create a virtual one for super admins
          // This allows super admins to access admin features even without a real organization
          const virtualPlatformOrg: Organization = {
            id: 'platform-admin',
            name: 'M10 DJ Company Platform',
            slug: 'm10dj-platform',
            owner_id: user.id,
            subscription_tier: 'enterprise',
            subscription_status: 'active',
            is_platform_owner: true,
            product_context: 'm10dj',
            stripe_customer_id: null,
            stripe_subscription_id: null,
            trial_ends_at: null,
            stripe_connect_account_id: null,
            stripe_connect_charges_enabled: null,
            stripe_connect_payouts_enabled: null,
            stripe_connect_onboarding_complete: null,
            stripe_connect_details_submitted: null,
            platform_fee_percentage: null,
            platform_fee_fixed: null,
            requests_header_artist_name: 'M10 DJ Company',
            requests_header_location: 'Memphis, TN',
            requests_header_date: null,
            organization_type: null,
            parent_organization_id: null,
            performer_slug: null,
            is_active: true,
            artist_page_enabled: null,
            artist_page_headline: null,
            artist_page_bio: null,
            artist_page_profile_image_url: null,
            artist_page_cover_image_url: null,
            artist_page_gallery_images: null,
            artist_page_video_urls: null,
            artist_page_links: null,
            artist_page_contact_email: null,
            artist_page_contact_phone: null,
            artist_page_booking_url: null,
            artist_page_custom_css: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          return virtualPlatformOrg;
        }
      }
    } catch (adminCheckError) {
      console.warn('Error checking admin status:', adminCheckError);
      // Continue with normal organization lookup
    }

    // First try: user is owner
    let { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    // Log RLS policy errors for debugging (but don't throw - these are expected if user has no org)
    // Skip AbortError logging as it's expected during component unmount
    if (orgError && orgError.code !== 'PGRST116' && orgError.name !== 'AbortError' && !orgError.message?.includes('aborted')) {
      // PGRST116 is "not found" which is expected, but other errors might indicate RLS issues
      console.warn('Error querying organizations by owner_id:', orgError);
    }

    // Second try: user is a team member
    if (orgError || !org) {
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      // Log membership query errors for debugging
      // Skip AbortError logging as it's expected during component unmount
      if (membershipError && membershipError.code !== 'PGRST116' && membershipError.name !== 'AbortError' && !membershipError.message?.includes('aborted')) {
        console.warn('Error querying organization_members:', membershipError);
      }

      // Only proceed if we found a membership (no error and data exists)
      if (!membershipError && membership?.organization_id) {
        const { data: memberOrg, error: memberOrgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membership.organization_id)
          .maybeSingle();

        // Skip AbortError logging as it's expected during component unmount
        if (memberOrgError && memberOrgError.code !== 'PGRST116' && memberOrgError.name !== 'AbortError' && !memberOrgError.message?.includes('aborted')) {
          console.warn('Error querying organization by membership:', memberOrgError);
        }

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
  } catch (error: any) {
    // Handle AbortError gracefully (component unmounted or request cancelled)
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return null;
    }
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
 * Normalize slug by removing hyphens (for flexible matching)
 * This allows "ben-spins" and "benspins" to match the same organization
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/-/g, '');
}

/**
 * Get organization by slug (for subdomain routing)
 * Supports flexible matching: "ben-spins" and "benspins" will match the same organization
 */
export async function getOrganizationBySlug(
  supabase: AnySupabaseClient,
  slug: string
): Promise<Organization | null> {
  try {
    // First try exact match (for performance)
    const { data: exactOrg, error: exactError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid throwing on not found

    // If there's an error (other than "not found"), log it
    if (exactError && exactError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error getting organization by slug (exact match):', exactError);
    }

    // If exact match found, return it
    if (exactOrg) {
      return exactOrg as Organization;
    }

    // If exact match fails, try normalized match using RPC function
    const { data: normalizedOrgs, error: rpcError } = await supabase
      .rpc('get_organization_by_normalized_slug', { input_slug: slug });

    if (rpcError) {
      console.error('Error getting organization by normalized slug:', rpcError);
      return null;
    }

    // If no org found, return null (this is expected and not an error)
    if (!normalizedOrgs || normalizedOrgs.length === 0) {
      return null;
    }

    return normalizedOrgs[0] as Organization;
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
        requests_show_audio_upload: false, // Disabled by default during onboarding
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

