import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';

export default async function SignIn({
  searchParams
}: {
  searchParams?: { redirect?: string };
}) {
  // Get preferred sign in view from cookies (server-side)
  let preferredSignInView: string | null = null;
  try {
    preferredSignInView = cookies().get('preferredSignInView')?.value || null;
  } catch (cookieError) {
    // If cookies() fails, use default
    preferredSignInView = null;
  }
  
  const defaultView = getDefaultSignInView(preferredSignInView);
  
  // Preserve redirect query parameter when redirecting to view-specific page
  const redirectParam = searchParams?.redirect 
    ? `?redirect=${encodeURIComponent(searchParams.redirect)}` 
    : '';
  
  // Server-side redirect (immediate, no loading state needed)
  redirect(`/signin/${defaultView}${redirectParam}`);
}
