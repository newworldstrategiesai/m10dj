import { createClient } from '@/utils/supabase/server';
import { getRoleBasedRedirectUrl } from './role-redirect';
import { getCurrentOrganization } from '@/utils/organization-context';

/**
 * Gets the appropriate redirect URL based on product context
 * Checks user metadata for product_context, then falls back to role-based redirect
 */
export async function getProductBasedRedirectUrl(baseUrl: string = ''): Promise<string> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      // No user - redirect to signin
      // Use full path to avoid middleware rewrite loops
      if (baseUrl.includes('tipjar.live') || baseUrl === '') {
        return '/tipjar/signin/password_signin';
      }
      return `${baseUrl}/signin`;
    }
    
    // Check product context from user metadata
    const productContext = user.user_metadata?.product_context;
    
    switch (productContext) {
      case 'tipjar':
        // TipJar users go to crowd requests admin page
        // Check if organization exists, if not redirect to onboarding
        const tipjarOrg = await getCurrentOrganization(supabase);
        if (!tipjarOrg) {
          // Organization being created or missing - redirect to onboarding
          return `${baseUrl}/tipjar/onboarding`;
        }
        return `${baseUrl}/admin/crowd-requests`;
      
      case 'djdash':
        // DJ Dash users go to DJ Dash dashboard
        // Check if organization exists, if not redirect to onboarding
        const djdashOrg = await getCurrentOrganization(supabase);
        if (!djdashOrg) {
          // Organization being created or missing - redirect to onboarding
          return `${baseUrl}/djdash/onboarding`;
        }
        return `${baseUrl}/djdash/dashboard`;
      
      case 'm10dj':
      default:
        // M10 DJ Company users use existing role-based redirect
        // This handles admin vs client vs onboarding flows
        return await getRoleBasedRedirectUrl(baseUrl);
    }
  } catch (error) {
    console.error('Error in getProductBasedRedirectUrl:', error);
    // Fallback to role-based redirect on error
    return await getRoleBasedRedirectUrl(baseUrl);
  }
}

