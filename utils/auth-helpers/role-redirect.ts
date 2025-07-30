import { createClient } from '@/utils/supabase/server';

export interface UserRole {
  isAdmin: boolean;
  isClient: boolean; 
  email: string;
}

/**
 * Determines user role based on email and returns role information
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user || !user.email) {
      return null;
    }

    // Admin email list - matches the one in admin.ts
    const adminEmails = [
      'admin@m10djcompany.com',
      'manager@m10djcompany.com', 
      'djbenmurray@gmail.com'  // Ben Murray - Owner
    ];

    const isAdmin = adminEmails.includes(user.email);
    const isClient = !isAdmin; // For now, non-admins are clients

    return {
      isAdmin,
      isClient,
      email: user.email
    };
  } catch (error) {
    console.error('Error determining user role:', error);
    return null;
  }
}

/**
 * Gets the appropriate redirect URL based on user role
 */
export async function getRoleBasedRedirectUrl(baseUrl: string = ''): Promise<string> {
  const userRole = await getUserRole();
  
  if (!userRole) {
    // No user or error - redirect to signin
    return `${baseUrl}/signin`;
  }

  if (userRole.isAdmin) {
    // Admin users go to admin dashboard
    return `${baseUrl}/admin/dashboard`;
  }

  if (userRole.isClient) {
    // Client users go to client dashboard (placeholder for now)
    return `${baseUrl}/client/dashboard`;
  }

  // Fallback to home page
  return `${baseUrl}/`;
}

/**
 * Determines if a user should have access to admin routes
 */
export async function canAccessAdmin(): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole?.isAdmin || false;
}

/**
 * Determines if a user should have access to client routes
 */
export async function canAccessClient(): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole?.isClient || false;
}