import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import { cookies } from 'next/headers';

export default function SignIn() {
  const preferredSignInView =
    cookies().get('preferredSignInView')?.value || null;
  const defaultView = getDefaultSignInView(preferredSignInView);

  if (!defaultView) {
    // Fallback to password_signin if something goes wrong
    redirect('/signin/password_signin');
  }

  // Note: redirect() throws a NEXT_REDIRECT error which is expected behavior
  // Do not catch this error - let it propagate so Next.js can handle the redirect
  redirect(`/signin/${defaultView}`);
}
