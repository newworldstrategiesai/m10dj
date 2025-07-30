import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'manager' | 'editor';
  is_active: boolean;
  last_login: string | null;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createClient();

  try {
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // For now, we'll check if the user email is in our admin list
    // This is a simple approach until the admin_users table is properly set up
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com',  // Ben Murray - Owner
      // Add your admin emails here
    ];

    if (!adminEmails.includes(user.email || '')) {
      return null;
    }

    // Return a mock admin user for now
    return {
      id: user.id,
      user_id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
      role: 'admin',
      is_active: true,
      last_login: new Date().toISOString()
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

export async function isAdmin(userEmail: string): Promise<boolean> {
  const adminEmails = [
    'admin@m10djcompany.com',
    'manager@m10djcompany.com',
    // Add your admin emails here
  ];

  return adminEmails.includes(userEmail);
} 