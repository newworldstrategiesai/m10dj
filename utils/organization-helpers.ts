import { SupabaseClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from './auth-helpers/platform-admin';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  subscription_status?: string;
  subscription_tier?: string;
  trial_ends_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get the current user's organization
 * Supports view-as mode for super admins (checks cookie on client-side)
 * Now supports team members - checks both owner_id and organization_members table
 */
export async function getCurrentOrganization(
  supabase: SupabaseClient,
  viewAsOrgId?: string | null
): Promise<Organization | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    // If in view-as mode and user is admin, return the viewed organization
    if (viewAsOrgId && isPlatformAdmin(user.email || '')) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', viewAsOrgId)
        .single();

      if (!orgError && org) {
        return org as Organization;
      }
    }

    // First try: user is owner
    let { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();

    // Second try: user is a team member
    if (orgError || !org) {
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      // Only proceed if we found a membership (no error and data exists)
      if (!membershipError && membership?.organization_id) {
        const { data: memberOrg, error: memberOrgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membership.organization_id)
          .maybeSingle();

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
 * Normalize slug by removing hyphens (for flexible matching)
 * This allows "ben-spins" and "benspins" to match the same organization
 */
export function normalizeSlug(slug: string): string {
  return slug.toLowerCase().replace(/-/g, '');
}

/**
 * Get organization by slug (public access)
 * Supports flexible matching: "ben-spins" and "benspins" will match the same organization
 */
export async function getOrganizationBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Organization | null> {
  try {
    // First try exact match (for performance)
    const { data: exactOrg, error: exactError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!exactError && exactOrg) {
      return exactOrg as Organization;
    }

    // If exact match fails, try normalized match using RPC function
    const { data: normalizedOrgs, error: rpcError } = await supabase
      .rpc('get_organization_by_normalized_slug', { input_slug: slug });

    if (rpcError || !normalizedOrgs || normalizedOrgs.length === 0) {
      return null;
    }

    return normalizedOrgs[0] as Organization;
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    return null;
  }
}

/**
 * Require organization context - throws if user doesn't have an organization
 * Now supports team members - checks both owner_id and organization_members table
 */
export async function requireOrganization(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // First try: user is owner
  let { data: org, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  // Second try: user is a team member
  if (error || !org) {
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    // Only return if we found a membership (no error and data exists)
    if (!membershipError && membership?.organization_id) {
      return membership.organization_id;
    }
  }

  if (error || !org) {
    throw new Error('User does not have an organization');
  }

  return org.id;
}

/**
 * Get organization context for API routes
 * Returns organization_id for SaaS users, null for platform admins
 * Supports view-as mode for super admins (checks cookie)
 */
export async function getOrganizationContext(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  viewAsOrgId?: string | null
): Promise<string | null> {
  // Check if admin is in view-as mode
  if (isPlatformAdmin(userEmail) && viewAsOrgId) {
    // Verify the organization exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', viewAsOrgId)
      .single();
    
    if (org) {
      return viewAsOrgId;
    }
  }

  // Platform admins don't have organization context (they see all data)
  if (isPlatformAdmin(userEmail)) {
    return null;
  }

  // SaaS users must have an organization
  try {
    return await requireOrganization(supabase, userId);
  } catch (error) {
    console.error('Error getting organization context:', error);
    return null;
  }
}

/**
 * Create organization for a user
 */
export async function createOrganizationForUser(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<Organization | null> {
  try {
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        slug,
        owner_id: userId,
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
 * Get default organization ID (for backfilling data)
 * This should only be used during migrations
 */
export async function getDefaultOrganizationId(
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (error || !org) {
      return null;
    }

    return org.id;
  } catch (error) {
    console.error('Error getting default organization:', error);
    return null;
  }
}
