'use client';

import { createClient } from '@/utils/supabase/client';
import { type Provider } from '@supabase/supabase-js';
import { getURL } from '@/utils/helpers';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export async function handleRequest(
  e: React.FormEvent<HTMLFormElement>,
  requestFunc: (formData: FormData) => Promise<string>,
  router: AppRouterInstance | null = null
): Promise<boolean | void> {
  // Prevent default form submission refresh
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  let redirectUrl: string | undefined;
  try {
    redirectUrl = await requestFunc(formData);
  } catch (err) {
    console.error('Auth request failed:', err);
    redirectUrl = undefined;
  }

  const safeUrl =
    typeof redirectUrl === 'string' && redirectUrl.trim().length > 0
      ? redirectUrl.trim()
      : '/signin/password_signin';

  if (router) {
    return router.push(safeUrl);
  }
  // Server-side redirect path: use full navigation to avoid importing server
  // module in client bundle (prevents "reading 'call'" during page generation).
  if (typeof window !== 'undefined') {
    window.location.href = safeUrl;
  }
}

export async function signInWithOAuth(e: React.FormEvent<HTMLFormElement>) {
  // Prevent default form submission refresh
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const provider = String(formData.get('provider')).trim() as Provider;

  // Create client-side supabase client and call signInWithOAuth
  const supabase = createClient();
  const redirectURL = getURL('/auth/callback');
  await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: redirectURL
    }
  });
}
