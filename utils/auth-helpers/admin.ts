import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminEmail, getAdminRole, updateAdminLastLogin, type AdminRole } from './admin-roles';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'manager' | 'editor';
  is_active: boolean;
  last_login: string | null;
}

/**
 * Get admin user from database
 * Uses centralized admin roles system instead of hardcoded emails
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createClient();

  try {
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !user.email) {
      return null;
    }

    // Check admin role from database
    const adminRole = await getAdminRole(user.email);
    
    if (!adminRole) {
      return null;
    }

    // Update last login
    await updateAdminLastLogin(user.email);

    // Return admin user
    return {
      id: adminRole.id,
      user_id: adminRole.user_id,
      email: adminRole.email,
      full_name: adminRole.full_name,
      role: adminRole.role,
      is_active: adminRole.is_active,
      last_login: adminRole.last_login
    };
  } catch (error) {
    console.error('Error checking admin user:', error);
    return null;
  }
}

export async function requireAdmin() {
  const adminUser = await getAdminUser();
  
  if (!adminUser) {
    redirect('/signin?redirect=/admin/dashboard');
  }
  
  return adminUser;
}

/**
 * Check if user email is admin
 * Uses centralized admin roles system
 */
export async function isAdmin(userEmail: string): Promise<boolean> {
  return await isAdminEmail(userEmail);
} 