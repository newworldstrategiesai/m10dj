/**
 * Subscription Success Page
 * 
 * Shown after successful Stripe checkout
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-context';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrganization() {
      const org = await getCurrentOrganization(supabase);
      if (org) {
        setOrganization(org);
      }
      setLoading(false);
    }
    loadOrganization();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Subscription Activated! | {organization?.name || 'Success'}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🎉 Subscription Activated!
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Your subscription is now active. You have full access to all features.
          </p>

          {organization && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {organization.name}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Plan: <span className="font-semibold capitalize">{organization.subscription_tier}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status: <span className="font-semibold text-green-600 dark:text-green-400 capitalize">{organization.subscription_status}</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href="/admin/crowd-requests"
              className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/onboarding/welcome"
              className="block w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              View Your URLs & Embed Codes
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

