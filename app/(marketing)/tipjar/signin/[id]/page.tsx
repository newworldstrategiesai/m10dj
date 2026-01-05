import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import PasswordSignIn from '@/components/ui/AuthForms/PasswordSignIn';
import EmailSignIn from '@/components/ui/AuthForms/EmailSignIn';
import Separator from '@/components/ui/AuthForms/Separator';
import OauthSignIn from '@/components/ui/AuthForms/OauthSignIn';
import ForgotPassword from '@/components/ui/AuthForms/ForgotPassword';
import UpdatePassword from '@/components/ui/AuthForms/UpdatePassword';
import SignUp from '@/components/ui/AuthForms/Signup';
import { getRoleBasedRedirectUrl } from '@/utils/auth-helpers/role-redirect';
import { getProductBasedRedirectUrl } from '@/utils/auth-helpers/product-redirect';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { Music } from 'lucide-react';

export default async function TipJarSignIn({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { disable_button?: boolean; redirect?: string; email?: string; message?: string };
}) {
  const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  // Declare 'viewProp' and initialize with the default value
  let viewProp: string;

  // Assign url id to 'viewProp' if it's a valid string and ViewTypes includes it
  if (params?.id && typeof params.id === 'string' && viewTypes.includes(params.id)) {
    viewProp = params.id;
  } else {
    // Safely get preferred sign in view from cookies
    let preferredSignInView: string | null = null;
    try {
      preferredSignInView = cookies().get('preferredSignInView')?.value || null;
    } catch (cookieError) {
      // If cookies() fails (e.g., in some browser contexts), use default
      console.warn('Could not read cookies, using default sign in view:', cookieError);
      preferredSignInView = null;
    }
    viewProp = getDefaultSignInView(preferredSignInView);
    // Preserve redirect query parameter when redirecting to view-specific page
    const redirectParam = searchParams?.redirect 
      ? `?redirect=${encodeURIComponent(searchParams.redirect)}` 
      : '';
    redirect(`/tipjar/signin/${viewProp}${redirectParam}`);
  }

  // Check if the user is already logged in and redirect to the account page if so
  // Use a more defensive approach - always default to showing sign in page on any error
  let user = null;
  try {
    const supabase = createClient();
    
    // Add timeout to prevent hanging on getUser() - reduced timeout for faster failure
    // This helps with browsers that may have different cookie/session handling
    const getUserPromise = supabase.auth.getUser().catch((err) => {
      // Catch any errors from getUser() and return them as part of the result
      return { data: { user: null }, error: err };
    });
    
    const timeoutPromise = new Promise<{ data: { user: null }, error: { message: string } }>((resolve) => 
      setTimeout(() => resolve({ data: { user: null }, error: { message: 'Timeout' } }), 1500)
    );
    
    const result = await Promise.race([getUserPromise, timeoutPromise]);
    
    const {
      data: { user: authUser },
      error
    } = result || { data: { user: null }, error: null };
    
    // Only set user if we have a valid user AND no error (or only timeout/refresh token errors)
    // Default to null (show sign in page) on any uncertainty
    if (authUser && (!error || 
        error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token') || 
        error?.message === 'Timeout')) {
      // If we get a refresh token error, clear session and show sign in
      if (error && error.message !== 'Timeout' && 
          (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token'))) {
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          // Ignore sign out errors
        }
        user = null;
      } else if (!error) {
        // Only set user if there's no error
        user = authUser;
      } else {
        // Timeout or other error - show sign in page
        user = null;
      }
    } else {
      // No user or error - show sign in page
      user = null;
    }
  } catch (error) {
    // If there's any other error, just continue to sign in page
    console.warn('Error checking user session (continuing to sign in page):', error);
    user = null;
  }

  if (user && viewProp !== 'update_password') {
    // User is already logged in, use redirect param or role-appropriate dashboard
    try {
      let redirectUrl: string;
      
      if (searchParams?.redirect) {
        redirectUrl = decodeURIComponent(searchParams.redirect);
      } else {
        // Add timeout and error handling to prevent hanging
        // Use product-based redirect for TipJar (will route to /tipjar/dashboard)
        // Use empty string for baseUrl to get relative paths (works for both local and production)
        const redirectPromise = getProductBasedRedirectUrl('').catch((error) => {
          console.error('Error getting product-based redirect URL:', error);
          return '/tipjar/dashboard'; // Fallback to TipJar dashboard
        });
        
        const timeoutPromise = new Promise<string>((resolve) => 
          setTimeout(() => resolve('/tipjar/dashboard'), 3000)
        );
        
        redirectUrl = await Promise.race([redirectPromise, timeoutPromise]);
      }
      
      redirect(redirectUrl);
    } catch (error) {
      // If redirect URL fails, redirect to TipJar dashboard
      console.error('Error in redirect logic:', error);
      redirect('/tipjar/dashboard');
    }
  } else if (!user && viewProp === 'update_password') {
    redirect('/tipjar/signin/password_signin');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo and Branding */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Music className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                TipJar<span className="text-purple-600">.Live</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {viewProp === 'signup' 
                  ? 'Start collecting tips and song requests' 
                  : 'Sign in to your account'}
              </p>
            </div>
          </div>
          
          {/* Sign In Form */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {viewProp === 'forgot_password'
                  ? 'Reset Password'
                  : viewProp === 'update_password'
                    ? 'Update Password'
                    : viewProp === 'signup'
                      ? 'Sign Up'
                      : 'Sign In'}
              </h2>
              {viewProp === 'password_signin' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your credentials to access your account
                </p>
              )}
            </div>
            
            {viewProp === 'password_signin' && (
              <PasswordSignIn
                allowEmail={allowEmail}
                redirectMethod={redirectMethod}
                redirectTo={searchParams?.redirect ? decodeURIComponent(searchParams.redirect) : ''}
                initialEmail={searchParams?.email || undefined}
                message={searchParams?.message || undefined}
              />
            )}
            {viewProp === 'email_signin' && (
              <EmailSignIn
                allowPassword={allowPassword}
                redirectMethod={redirectMethod}
                disableButton={searchParams.disable_button}
              />
            )}
            {viewProp === 'forgot_password' && (
              <ForgotPassword
                allowEmail={allowEmail}
                redirectMethod={redirectMethod}
                disableButton={searchParams.disable_button}
                productContext="tipjar"
              />
            )}
            {viewProp === 'update_password' && (
              <UpdatePassword redirectMethod={redirectMethod} />
            )}
            {viewProp === 'signup' && (
              <SignUp allowEmail={allowEmail} redirectMethod={redirectMethod} />
            )}
            
            {viewProp !== 'update_password' &&
              viewProp !== 'signup' &&
              allowOauth && (
                <>
                  <Separator text="Third-party sign-in" />
                  <OauthSignIn />
                </>
              )}
          </div>
          
          {/* Footer Links */}
          <div className="mt-6 text-center">
            <a 
              href="/tipjar" 
              className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 text-sm transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
      
      <TipJarFooter />
    </div>
  );
}

