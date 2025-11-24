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
 * Get organization by slug (public access)
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
 * Require organization context - throws if user doesn't have an organization
 */
export async function requireOrganization(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)
    .single();

  if (error || !org) {
    throw new Error('User does not have an organization');
  }

  return org.id;
}

/**
 * Get organization context for API routes
 * Returns organization_id for SaaS users, null for platform admins
 */
export async function getOrganizationContext(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined
): Promise<string | null> {
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
