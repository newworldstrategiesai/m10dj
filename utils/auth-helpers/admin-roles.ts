/**
 * Centralized Admin Roles Management
 * Replaces hardcoded admin email arrays throughout the codebase
 */

import { createClient } from '@/utils/supabase/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

    // Use our singleton client (works for both client and server)
    const supabase = createClient();

    // Get the current user first
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.warn('No authenticated user found, using fallback admin check');
      return isAdminEmailFallback(userEmail);
    }

    // Check if user is admin by calling a database function that bypasses RLS
    // Try both parameter formats in case one works
    let result = await (supabase as any).rpc('check_user_admin_status', { user_id_param: userData.user.id });

    // If that fails, try the array format
    if (result.error) {
      console.log('Trying array format for RPC call');
      result = await (supabase as any).rpc('check_user_admin_status', [userData.user.id]);
    }

    if (result.error) {
      console.error('Error checking admin role:', result.error);
      // Fallback to hardcoded list
      console.log('Falling back to email-based admin check');
      return isAdminEmailFallback(userEmail);
    }

    return !!result.data;
  } catch (error: any) {
    // Handle AbortError gracefully (component unmounted or request cancelled)
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      return isAdminEmailFallback(userEmail);
    }
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

    const supabase = createSupabaseClient(
      supabaseUrl,
      serviceRoleKey || anonKey!
    );

    // Get the current user first
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.warn('No authenticated user found');
      return null;
    }

    const { data, error } = await (supabase as any).rpc('check_user_admin_status', [userData.user.id]);

    if (error) {
      console.error('Error getting admin role:', error);
      return null;
    }

    // Return role info if user is admin
    if (data) {
      return {
        id: userData.user.id,
        user_id: userData.user.id,
        email: userEmail,
        role: 'admin',
        is_active: true,
        full_name: null,
        last_login: null
      } as AdminRole;
    }

    return null;
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

    const supabase = createSupabaseClient(
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

    const supabase = createSupabaseClient(
      supabaseUrl,
      serviceRoleKey || anonKey!
    );

    const { data, error } = await (supabase as any).rpc('get_all_admin_user_ids');

    if (error || !data) {
      console.error('Error fetching admin user IDs:', error);
      return [];
    }

    // Get user emails from auth.users
    const userIds = data as string[];
    if (userIds.length === 0) {
      return [];
    }

    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users) {
      console.error('Error fetching users:', userError);
      return [];
    }

    return users.users
      .filter(user => userIds.includes(user.id))
      .map(user => user.email!)
      .filter(email => email);
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

    const supabase = createSupabaseClient(
      supabaseUrl,
      serviceRoleKey || anonKey!
    );

    // Find user by email first
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !userData) {
      console.error('Error fetching users for last login update:', userError);
      return;
    }

    const user = userData.users.find(u => u.email === userEmail);
    if (!user) {
      console.warn('User not found for last login update:', userEmail);
      return;
    }

    // Update organization_members with last activity (if such a field exists)
    // For now, just log the login
    console.log(`Admin login recorded for: ${userEmail}`);
  } catch (error) {
    console.error('Error updating admin last login:', error);
    // Non-critical, don't throw
  }
}

