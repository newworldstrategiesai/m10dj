/**
 * Admin Settings - Safe landing for /admin/settings
 * TipJar Live: redirects to Request Page Settings (/admin/requests-page).
 * Other products: redirect to requests-page or dashboard.
 * Handles new users (no org) without throwing - shows friendly message or redirect.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { getCurrentOrganization } from '@/utils/organization-helpers';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Settings, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasOrg, setHasOrg] = useState(false);
  const [isTipJar, setIsTipJar] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveRedirect() {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (cancelled) return;
        if (userError || !user) {
          router.replace(`/signin?redirect=${encodeURIComponent('/admin/settings')}`);
          return;
        }

        const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
        const tipjarDomain = hostname.includes('tipjar.live') || hostname.includes('tipjar.com');
        const productContext = user?.user_metadata?.product_context || (tipjarDomain ? 'tipjar' : null);
        const tipjar = tipjarDomain || productContext === 'tipjar';
        setIsTipJar(!!tipjar);

        const org = await getCurrentOrganization(supabase);
        if (cancelled) return;

        if (org) {
          setHasOrg(true);
          // Redirect to the main settings surface for this product
          if (tipjar) {
            router.replace('/admin/requests-page');
            return;
          }
          router.replace('/admin/requests-page');
          return;
        }

        // No org yet (e.g. new TipJar user right after signup)
        setHasOrg(false);
      } catch (err) {
        if (cancelled) return;
        console.error('[admin/settings] Error:', err);
        setHasOrg(false);
      } finally {
        if (!cancelled) {
          setAuthChecked(true);
          setLoading(false);
        }
      }
    }

    resolveRedirect();
    return () => { cancelled = true; };
  }, [router]);

  if (loading && !authChecked) {
    return (
      <AdminLayout title="Settings" description="Account settings">
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6">
          <Loader2 className="w-10 h-10 animate-spin text-gray-500 dark:text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!hasOrg && authChecked) {
    return (
      <AdminLayout title="Settings" description="Account settings">
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isTipJar ? 'Finish setting up your tip page' : 'Organization needed'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isTipJar
                ? 'Complete your TipJar setup to unlock Settings. If you just created your account, refresh the page or go to your dashboard first.'
                : 'You need an organization to manage settings. Create one or wait for an invite.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isTipJar && (
                <Link
                  href="/admin/crowd-requests"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium hover:opacity-90 transition-opacity"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                href="/signin"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Sign in again
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings" description="Account settings">
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-6">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 dark:text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Redirecting to settings...</p>
      </div>
    </AdminLayout>
  );
}
