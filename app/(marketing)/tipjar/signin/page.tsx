import { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDefaultSignInView } from '@/utils/auth-helpers/settings';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { Music } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In | TipJar.Live',
  description: 'Sign in to your TipJar account to manage your tips, song requests, and earnings.',
};

export default async function TipJarSignIn({
  searchParams
}: {
  searchParams?: { redirect?: string };
}) {
  // Get preferred sign in view from cookies (server-side)
  let preferredSignInView: string | null = null;
  try {
    preferredSignInView = cookies().get('preferredSignInView')?.value || null;
  } catch (cookieError) {
    preferredSignInView = null;
  }
  
  const defaultView = getDefaultSignInView(preferredSignInView);
  
  // Preserve redirect query parameter when redirecting to view-specific page
  const redirectParam = searchParams?.redirect 
    ? `?redirect=${encodeURIComponent(searchParams.redirect)}` 
    : '';
  
  // Server-side redirect to the actual signin page
  redirect(`/signin/${defaultView}${redirectParam}`);
}

