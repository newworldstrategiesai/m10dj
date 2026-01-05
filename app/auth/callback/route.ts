import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';
import { getRoleBasedRedirectUrl } from '@/utils/auth-helpers/role-redirect';
import { getProductBasedRedirectUrl } from '@/utils/auth-helpers/product-redirect';

export async function GET(request: NextRequest) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the `@supabase/ssr` package. It exchanges an auth code for the user's session.
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const supabase = createClient();

  if (code) {

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Check if user is TipJar user and redirect to correct domain
      let signinUrl = `${requestUrl.origin}/signin`;
      try {
        // Try to get user to check product context (even if auth failed)
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.product_context === 'tipjar') {
          if (requestUrl.hostname.includes('m10djcompany.com')) {
            // Redirect to tipjar.live signin page
            signinUrl = 'https://tipjar.live/tipjar/signin/password_signin';
          } else {
            // Already on tipjar.live, use correct path
            signinUrl = `${requestUrl.origin}/tipjar/signin/password_signin`;
          }
        }
      } catch (e) {
        // Ignore errors when checking user
      }
      
      return NextResponse.redirect(
        getErrorRedirect(
          signinUrl,
          error.name,
          "Sorry, we weren't able to log you in. Please try again."
        )
      );
    }

    // After successful authentication, link existing contacts to this user
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        // Use service role to update contacts
        const { createClient: createServiceClient } = await import('@supabase/supabase-js');
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find contacts with this email that don't have a user_id yet
        const { data: contacts, error: contactsError } = await serviceSupabase
          .from('contacts')
          .select('id')
          .eq('email_address', user.email.toLowerCase().trim())
          .is('user_id', null)
          .is('deleted_at', null);

        if (!contactsError && contacts && contacts.length > 0) {
          // Link these contacts to the new user
          const { error: updateError } = await serviceSupabase
            .from('contacts')
            .update({ user_id: user.id })
            .in('id', contacts.map(c => c.id));

          if (updateError) {
            console.error('Error linking contacts to user:', updateError);
          } else {
            console.log(`Linked ${contacts.length} contact(s) to user ${user.id}`);
          }
        }
      }
    } catch (linkError) {
      // Don't fail the auth flow if linking fails
      console.error('Error linking contacts during auth callback:', linkError);
    }
  }

  // Check if user has organization slug in metadata (from onboarding)
  // If so, redirect to their requests page after email confirmation
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.user_metadata?.organization_slug) {
      const orgSlug = user.user_metadata.organization_slug;
      const requestsUrl = `${requestUrl.origin}/organizations/${orgSlug}/requests`;
      return NextResponse.redirect(
        getStatusRedirect(
          requestsUrl,
          'Email confirmed!',
          'Welcome back! Here\'s your requests page.'
        )
      );
    }
  } catch (error) {
    console.error('Error checking user metadata for organization slug:', error);
    // Fall through to default redirect
  }

  // Get product-based redirect URL (checks product context, falls back to role-based)
  let redirectUrl = await getProductBasedRedirectUrl(requestUrl.origin);
  
  // Ensure TipJar users are redirected to tipjar.live domain, not m10djcompany.com
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.product_context === 'tipjar') {
      // Check if we're on the wrong domain (m10djcompany.com instead of tipjar.live)
      if (requestUrl.hostname.includes('m10djcompany.com')) {
        // Extract the path from redirectUrl (it might be a full URL or just a path)
        const urlPath = redirectUrl.includes('http') 
          ? new URL(redirectUrl).pathname 
          : redirectUrl.startsWith('/') 
            ? redirectUrl 
            : `/${redirectUrl}`;
        // Redirect to tipjar.live with the correct path
        redirectUrl = `https://tipjar.live${urlPath}`;
      }
      // If already on tipjar.live, redirectUrl should already be correct
    }
  } catch (error) {
    console.error('Error checking product context for redirect:', error);
    // Fall through with original redirectUrl
  }
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(
    getStatusRedirect(
      redirectUrl,
      'Success!',
      'You are now signed in.'
    )
  );
}
