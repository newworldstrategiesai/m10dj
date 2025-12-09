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
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { Music } from 'lucide-react';

export default async function TipJarSignIn({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { disable_button?: boolean; redirect?: string };
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
      setTimeout(() => resolve({ data: { user: null }, error: { message: 'Timeout' } }), 2000)
    );
    
    const result = await Promise.race([getUserPromise, timeoutPromise]);
    
    const {
      data: { user: authUser },
      error
    } = result || { data: { user: null }, error: null };
    
    // If we get a refresh token error, ignore it and continue to sign in page
    if (error && (error?.message?.includes('refresh_token_not_found') || 
                  error?.message?.includes('Invalid Refresh Token') || 
                  error?.message === 'Timeout' ||
                  !error)) {
      // Clear invalid session and continue to sign in (only if not timeout)
      if (error?.message && error.message !== 'Timeout') {
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          // Ignore sign out errors
        }
      }
      user = null;
    } else {
      user = authUser;
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
        const redirectPromise = getRoleBasedRedirectUrl().catch((error) => {
          console.error('Error getting role-based redirect URL:', error);
          return '/account'; // Fallback to account page
        });
        
        const timeoutPromise = new Promise<string>((resolve) => 
          setTimeout(() => resolve('/account'), 3000)
        );
        
        redirectUrl = await Promise.race([redirectPromise, timeoutPromise]);
      }
      
      redirect(redirectUrl);
    } catch (error) {
      // If redirect URL fails, just go to account page
      console.error('Error in redirect logic:', error);
      redirect('/account');
    }
  } else if (!user && viewProp === 'update_password') {
    redirect('/tipjar/signin');
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

