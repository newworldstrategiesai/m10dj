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

  // For non-admin users, check if they have an organization (SaaS customers)
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Check if user has an organization (SaaS customer)
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (organization) {
      // User has an organization - they're a SaaS customer
      // Send them to onboarding (which will show their dashboard if org exists)
      return `${baseUrl}/onboarding/welcome`;
    }
    
    // No organization - could be:
    // 1. New signup (organization being created) - send to onboarding
    // 2. Event client (not a SaaS customer) - send to client portal
    // For now, send to onboarding to let the trigger create the org
    return `${baseUrl}/onboarding/welcome`;
  }

  // Fallback: if somehow we get here without a user, this shouldn't happen
  // but send to signin just in case
  return `${baseUrl}/signin`;

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