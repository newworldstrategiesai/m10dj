import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';
import { getRoleBasedRedirectUrl } from '@/utils/auth-helpers/role-redirect';
import { getProductBasedRedirectUrl } from '@/utils/auth-helpers/product-redirect';

export async function GET(request: NextRequest) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the `@supabase/ssr` package. It exchanges an auth code for the user's session.
  // It also handles token_hash from custom email hooks.
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') || 'signup';
  const supabase = createClient();

  // Handle token_hash from custom email hooks (email confirmation, password reset, etc.)
  if (tokenHash && !code) {
    try {
      // Verify token_hash using Supabase's verifyOtp method
      // Note: verifyOtp requires email, but for token_hash we need to verify differently
      // For custom email hooks, we can verify by calling Supabase's API directly
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // Verify the token_hash by calling Supabase's verify endpoint
      const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          token_hash: tokenHash,
          type: type,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        console.error('[Auth Callback] Token verification error:', errorData);
        
        const isTipJar = requestUrl.hostname.includes('tipjar');
        let errorRedirectPath: string;
        
        switch (type) {
          case 'recovery':
            errorRedirectPath = isTipJar
              ? `${requestUrl.origin}/tipjar/signin/forgot_password`
              : `${requestUrl.origin}/signin/forgot_password`;
            break;
          default:
            errorRedirectPath = isTipJar
              ? `${requestUrl.origin}/tipjar/signin/password_signin`
              : `${requestUrl.origin}/signin/password_signin`;
            break;
        }
        
        return NextResponse.redirect(
          getErrorRedirect(
            errorRedirectPath,
            errorData.error || 'verification_failed',
            errorData.error_description || errorData.msg || 'Invalid or expired confirmation link. Please request a new one.'
          )
        );
      }

      // Token verified successfully - Supabase should have set the session via cookies
      // The verify endpoint returns a session, which should be set in cookies automatically
      
      // For signup confirmations, redirect to success page with "Go to Sign In" button
      if (type === 'signup') {
        const isTipJar = requestUrl.hostname.includes('tipjar');
        if (isTipJar) {
          const confirmedUrl = requestUrl.hostname.includes('m10djcompany.com')
            ? 'https://tipjar.live/tipjar/auth/confirmed'
            : `${requestUrl.origin}/tipjar/auth/confirmed`;
          return NextResponse.redirect(confirmedUrl);
        } else {
          // For other products, continue with normal flow
          // (could create similar success pages for djdash/m10dj if needed)
        }
      }
      
      // For other types (recovery, magiclink, etc.), continue with normal flow below
    } catch (error: any) {
      console.error('[Auth Callback] Token verification error:', error);
      
      const isTipJar = requestUrl.hostname.includes('tipjar');
      const errorRedirectPath = isTipJar
        ? `${requestUrl.origin}/tipjar/signin/password_signin`
        : `${requestUrl.origin}/signin/password_signin`;
      
      return NextResponse.redirect(
        getErrorRedirect(
          errorRedirectPath,
          'verification_error',
          'Something went wrong verifying your confirmation link. Please try again.'
        )
      );
    }
  }

  if (code) {

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Check if user is TipJar user and redirect to correct domain
      // Always use the full path to avoid redirect loops
      let signinUrl = `${requestUrl.origin}/tipjar/signin/password_signin`;
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
        } else {
          // Not a TipJar user, use regular signin
          signinUrl = `${requestUrl.origin}/signin/password_signin`;
        }
      } catch (e) {
        // If we're on tipjar.live, default to TipJar signin
        if (requestUrl.hostname.includes('tipjar.live')) {
          signinUrl = `${requestUrl.origin}/tipjar/signin/password_signin`;
        } else {
          signinUrl = `${requestUrl.origin}/signin/password_signin`;
        }
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

  // For TipJar users, check for unclaimed organizations and claim them
  // Also check if onboarding is complete
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.product_context === 'tipjar' && user?.email && user?.id) {
      // Check for unclaimed organization matching this email
      try {
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // Find unclaimed organization with matching prospect_email
        const { data: unclaimedOrg, error: unclaimedError } = await supabaseAdmin
          .from('organizations')
          .select('*')
          .eq('prospect_email', user.email.toLowerCase().trim())
          .eq('is_claimed', false)
          .eq('product_context', 'tipjar')
          .maybeSingle();

        if (!unclaimedError && unclaimedOrg) {
          // Found unclaimed organization - claim it
          const { error: claimError } = await supabaseAdmin
            .from('organizations')
            .update({
              owner_id: user.id,
              is_claimed: true,
              claimed_at: new Date().toISOString(),
              claim_token: null,
              claim_token_expires_at: null
            })
            .eq('id', unclaimedOrg.id);

          if (!claimError) {
            // Successfully claimed - delete any auto-created organization
            // (The trigger may have created one, but we want to use the claimed one)
            await supabaseAdmin
              .from('organizations')
              .delete()
              .eq('owner_id', user.id)
              .neq('id', unclaimedOrg.id);
          }
        }
      } catch (claimError) {
        // Log error but don't fail - user can still continue
        console.error('Error during auto-claim in callback:', claimError);
      }

      // Import getCurrentOrganization to check onboarding status
      const { getCurrentOrganization } = await import('@/utils/organization-context');
      const organization = await getCurrentOrganization(supabase);
      
      // If organization doesn't exist or doesn't have display name, send to onboarding wizard
      // This ensures new users go straight into the wizard after email confirmation
      if (!organization || !organization.requests_header_artist_name || !organization.requests_header_artist_name.trim()) {
        // Ensure we redirect to tipjar.live domain
        let onboardingUrl = `${requestUrl.origin}/tipjar/onboarding`;
        if (requestUrl.hostname.includes('m10djcompany.com')) {
          onboardingUrl = 'https://tipjar.live/tipjar/onboarding';
        }
        
        return NextResponse.redirect(
          getStatusRedirect(
            onboardingUrl,
            'Email confirmed! 🎉',
            'Let\'s finish setting up your TipJar page - this will only take 2 minutes!'
          )
        );
      }
    }
  } catch (error) {
    console.error('Error checking TipJar onboarding status:', error);
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
