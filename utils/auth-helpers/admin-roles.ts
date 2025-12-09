/**
 * Centralized Admin Roles Management
 * Replaces hardcoded admin email arrays throughout the codebase
 */

import { createClient } from '@supabase/supabase-js';

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
 * Client-safe: uses anon key when service role key is not available
 */
export async function isAdminEmail(userEmail: string | null | undefined): Promise<boolean> {
  if (!userEmail) {
    return false;
  }

  try {
    // Check if we're on the client side (service role key not available)
    const isClient = typeof window !== 'undefined';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // If environment variables are missing, fallback immediately
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not available, using fallback admin check');
      return isAdminEmailFallback(userEmail);
    }

    let supabase;
    if (isClient) {
      // Client-side: use anon key (safe for public access)
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      // Server-side: try to use service role key for admin operations
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        supabase = createClient(supabaseUrl, serviceRoleKey);
      } else {
        // If service role key not available, fallback to anon key
        console.warn('Service role key not available, using anon key');
        supabase = createClient(supabaseUrl, supabaseAnonKey);
      }
    }

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
      console.warn('Supabase environment variables not available');
      return null;
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey || anonKey!
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
      console.warn('Supabase environment variables not available');
      return null;
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey || anonKey!
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
      console.warn('Supabase environment variables not available');
      return [];
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey || anonKey!
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
      console.warn('Supabase environment variables not available');
      return;
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey || anonKey!
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

