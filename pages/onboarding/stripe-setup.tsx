/**
 * Stripe Connect Setup Refresh Page
 * 
 * Handles refresh_url redirects from Stripe Connect onboarding.
 * According to Stripe docs, we should automatically create a new account link
 * and redirect the user back to onboarding.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle } from 'lucide-react';

export default function StripeSetupRefreshPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleRefresh();
  }, []);

  async function handleRefresh() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }

      // Get a new onboarding link (this will automatically create a fresh link)
      const response = await fetch('/api/stripe-connect/onboarding-link', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.onboardingUrl) {
          // Redirect to the new onboarding link
          window.location.href = data.onboardingUrl;
          return;
        }
      }

      // If we can't get a new link, show error
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      setError(errorData.error || 'Failed to refresh onboarding link');
    } catch (err: any) {
      console.error('Error refreshing onboarding link:', err);
      setError(err.message || 'An error occurred while refreshing the onboarding link');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Refreshing Setup...</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Refreshing your onboarding link...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Setup Error</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Setup Error
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error}
            </p>
            <button
              onClick={() => router.push('/onboarding/welcome')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return null; // Should redirect before this renders
}

