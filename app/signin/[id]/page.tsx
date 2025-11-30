import Logo from '@/components/icons/Logo';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getAuthTypes,
  getViewTypes,
  getDefaultSignInView,
  getRedirectMethod
} from '@/utils/auth-helpers/settings';
import { Card } from '@/components/ui/card';
import PasswordSignIn from '@/components/ui/AuthForms/PasswordSignIn';
import EmailSignIn from '@/components/ui/AuthForms/EmailSignIn';
import Separator from '@/components/ui/AuthForms/Separator';
import OauthSignIn from '@/components/ui/AuthForms/OauthSignIn';
import ForgotPassword from '@/components/ui/AuthForms/ForgotPassword';
import UpdatePassword from '@/components/ui/AuthForms/UpdatePassword';
import SignUp from '@/components/ui/AuthForms/Signup';
import { getRoleBasedRedirectUrl } from '@/utils/auth-helpers/role-redirect';

export default async function SignIn({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { disable_button: boolean; redirect?: string };
}) {
  const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
  const viewTypes = getViewTypes();
  const redirectMethod = getRedirectMethod();

  // Declare 'viewProp' and initialize with the default value
  let viewProp: string;

  // Assign url id to 'viewProp' if it's a valid string and ViewTypes includes it
  if (typeof params.id === 'string' && viewTypes.includes(params.id)) {
    viewProp = params.id;
  } else {
    const preferredSignInView =
      cookies().get('preferredSignInView')?.value || null;
    viewProp = getDefaultSignInView(preferredSignInView);
    // Preserve redirect query parameter when redirecting to view-specific page
    const redirectParam = searchParams?.redirect 
      ? `?redirect=${encodeURIComponent(searchParams.redirect)}` 
      : '';
    return redirect(`/signin/${viewProp}${redirectParam}`);
  }

  // Check if the user is already logged in and redirect to the account page if so
  const supabase = createClient();

  let user = null;
  try {
    const {
      data: { user: authUser },
      error
    } = await supabase.auth.getUser();
    
    // If we get a refresh token error, ignore it and continue to sign in page
    if (error && (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token'))) {
      // Clear invalid session and continue to sign in
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Ignore sign out errors
      }
      user = null;
    } else {
      user = authUser;
    }
  } catch (error) {
    // If there's any other error, just continue to sign in page
    user = null;
  }

  if (user && viewProp !== 'update_password') {
    // User is already logged in, use redirect param or role-appropriate dashboard
    const redirectUrl = searchParams?.redirect 
      ? decodeURIComponent(searchParams.redirect) 
      : await getRoleBasedRedirectUrl();
    return redirect(redirectUrl);
  } else if (!user && viewProp === 'update_password') {
    return redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <div className="inline-block mb-4">
              <Logo width="80px" height="80px" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {viewProp === 'signup' ? 'DJ Request Pro' : 'M10 DJ Company'}
            </h1>
            <p className="text-gray-400 text-sm">
              {viewProp === 'signup' 
                ? 'Start accepting song requests at your events' 
                : 'Admin Portal'}
            </p>
          </div>
        </div>
        
        {/* Sign In Card */}
        <Card className="bg-white dark:bg-gray-900 border-0 shadow-2xl">
          <div className="p-8">
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
        </Card>
        
        {/* Footer Links */}
        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-gray-400 hover:text-brand text-sm transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
