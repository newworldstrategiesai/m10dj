import { createClient } from '@/utils/supabase/server';

export interface UserRole {
  isAdmin: boolean;
  isClient: boolean; 
  email: string;
}

/**
 * Helper function to add timeout to a promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs))
  ]);
}

/**
 * Determines user role based on email and returns role information
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = createClient();
  
  try {
    // Add timeout to prevent hanging on getUser()
    const getUserResult = await withTimeout(
      supabase.auth.getUser(),
      3000,
      { data: { user: null }, error: { 
        message: 'Timeout',
        name: 'AuthTimeoutError',
        status: 408,
        __isAuthError: true
      } as any }
    );
    
    const { data: { user }, error } = getUserResult;
    
    if (error || !user || !user.email) {
      return null;
    }

    // Check admin status using centralized admin roles system
    // Add timeout to prevent hanging on admin check
    const { isAdminEmail } = await import('./admin-roles');
    const isAdmin = await withTimeout(
      isAdminEmail(user.email),
      3000,
      false // Default to non-admin on timeout
    );
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
 * IMPORTANT: This function should use product-based redirects for TipJar/DJ Dash users
 */
export async function getRoleBasedRedirectUrl(baseUrl: string = ''): Promise<string> {
  // First, check product context - TipJar/DJ Dash users should use product-based redirects
  try {
    const supabase = createClient();
    const getUserResult = await withTimeout(
      supabase.auth.getUser(),
      3000,
      { data: { user: null }, error: { 
        message: 'Timeout',
        name: 'AuthTimeoutError',
        status: 408,
        __isAuthError: true
      } as any }
    );
    
    const { data: { user } } = getUserResult;
    
    if (user?.user_metadata?.product_context) {
      // User has product context - use product-based redirect
      const { getProductBasedRedirectUrl } = await import('./product-redirect');
      return await getProductBasedRedirectUrl(baseUrl);
    }
  } catch (error) {
    console.error('Error checking product context:', error);
    // Fall through to role-based logic
  }

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
  try {
    const supabase = createClient();
    const getUserResult = await withTimeout(
      supabase.auth.getUser(),
      3000,
      { data: { user: null }, error: { 
        message: 'Timeout',
        name: 'AuthTimeoutError',
        status: 408,
        __isAuthError: true
      } as any }
    );
    
    const { data: { user } } = getUserResult;
    
      if (user) {
      // Check if user has an organization (SaaS customer)
      // Use maybeSingle() instead of single() to avoid errors when no row exists
      type OrganizationResult = { 
        data: { id: string; product_context?: string | null } | null; 
        error: any;
      };
      
      let organizationResult: OrganizationResult | null = null;
      try {
        const timeoutPromise = new Promise<OrganizationResult>((resolve) => 
          setTimeout(() => resolve({ data: null, error: null }), 3000)
        );
        const queryPromise = supabase
          .from('organizations')
          .select('id, product_context')
          .eq('owner_id', user.id)
          .maybeSingle();
        organizationResult = await Promise.race([queryPromise, timeoutPromise]) as OrganizationResult;
      } catch (error) {
        organizationResult = { data: null, error: null };
      }

      if (organizationResult?.data) {
        // User has an organization - check product context
        const productContext = organizationResult.data.product_context;
        
        // TipJar users should go to TipJar dashboard, not onboarding
        if (productContext === 'tipjar') {
          return `${baseUrl}/tipjar/dashboard`;
        }
        
        // DJ Dash users should go to DJ Dash dashboard
        if (productContext === 'djdash') {
          return `${baseUrl}/djdash/dashboard`;
        }
        
        // M10 DJ Company users go to onboarding
        return `${baseUrl}/onboarding/welcome`;
      }
      
      // No organization - could be:
      // 1. New signup (organization being created) - send to onboarding
      // 2. Event client (not a SaaS customer) - send to client portal
      // For now, send to onboarding to let the trigger create the org
      // BUT check user metadata for product context first
      const productContext = user.user_metadata?.product_context;
      if (productContext === 'tipjar') {
        return `${baseUrl}/tipjar/onboarding`;
      }
      if (productContext === 'djdash') {
        return `${baseUrl}/djdash/onboarding`;
      }
      
      return `${baseUrl}/onboarding/welcome`;
    }
  } catch (error) {
    console.error('Error checking organization:', error);
    // Fall through to default redirect
  }

  // Fallback: if somehow we get here without a user, this shouldn't happen
  // but send to signin just in case
  return `${baseUrl}/signin`;
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