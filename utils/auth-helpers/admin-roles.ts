/**
 * Centralized Admin Roles Management
 * Replaces hardcoded admin email arrays throughout the codebase
 */

import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';

export interface AdminRole {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'manager' | 'editor';
  is_active: boolean;
  full_name: string | null;
  last_login: string | null;
}

/**
 * Check if a user email is an admin
 * Uses database lookup instead of hardcoded array
 */
export async function isAdminEmail(userEmail: string | null | undefined): Promise<boolean> {
  if (!userEmail) {
    return false;
  }

  try {
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Use database function for fast lookup
    const { data, error } = await supabase.rpc('is_platform_admin', {
      user_email: userEmail
    });

    if (error) {
      console.error('Error checking admin role:', error);
      // Fallback to hardcoded list during migration period
      return isAdminEmailFallback(userEmail);
    }

    return data === true;
  } catch (error) {
    console.error('Error in isAdminEmail:', error);
    // Fallback during migration
    return isAdminEmailFallback(userEmail);
  }
}

/**
 * Fallback to hardcoded list during migration period
 * TODO: Remove this after migration is complete
 */
function isAdminEmailFallback(userEmail: string): boolean {
  const legacyAdminEmails = [
    'admin@m10djcompany.com',
    'manager@m10djcompany.com',
    'djbenmurray@gmail.com',
  ];
  return legacyAdminEmails.includes(userEmail);
}

/**
 * Get admin role details for a user email
 */
export async function getAdminRole(userEmail: string | null | undefined): Promise<AdminRole | null> {
  if (!userEmail) {
    return null;
  }

  try {
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.rpc('get_admin_role', {
      user_email: userEmail
    });

    if (error) {
      console.error('Error getting admin role:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0] as AdminRole;
  } catch (error) {
    console.error('Error in getAdminRole:', error);
    return null;
  }
}

/**
 * Get admin role from user ID
 */
export async function getAdminRoleByUserId(userId: string): Promise<AdminRole | null> {
  try {
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AdminRole;
  } catch (error) {
    console.error('Error in getAdminRoleByUserId:', error);
    return null;
  }
}

/**
 * Get all active admin emails (for migration/backward compatibility)
 */
export async function getAllAdminEmails(): Promise<string[]> {
  try {
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('admin_roles')
      .select('email')
      .eq('is_active', true);

    if (error || !data) {
      return [];
    }

    return data.map((row) => row.email);
  } catch (error) {
    console.error('Error in getAllAdminEmails:', error);
    return [];
  }
}

/**
 * Update admin last login timestamp
 */
export async function updateAdminLastLogin(userEmail: string): Promise<void> {
  try {
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase
      .from('admin_roles')
      .update({ last_login: new Date().toISOString() })
      .eq('email', userEmail);
  } catch (error) {
    console.error('Error updating admin last login:', error);
    // Non-critical, don't throw
  }
}

