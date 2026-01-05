/**
 * Stripe Connect Onboarding Complete Page
 * 
 * Shown after user completes Stripe Connect onboarding
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getCurrentOrganization } from '@/utils/organization-context';

export default function StripeCompletePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'checking' | 'complete' | 'pending' | 'error'>('checking');
  const [dashboardUrl, setDashboardUrl] = useState<string>('/onboarding/welcome');

  useEffect(() => {
    // Check if TipJar user is on wrong domain and redirect IMMEDIATELY
    // This must run first before any other logic
    checkAndRedirectDomain();
  }, []);

  useEffect(() => {
    // Only run these after domain check (or if no redirect needed)
    if (typeof window !== 'undefined' && !window.location.hostname.includes('m10djcompany.com')) {
      checkStatus();
      determineDashboardUrl();
    }
  }, []);

  async function checkAndRedirectDomain() {
    // Only redirect if we're in the browser (client-side)
    if (typeof window === 'undefined') return;
    
    // If we're on m10djcompany.com, check if we should redirect
    if (!window.location.hostname.includes('m10djcompany.com')) {
      return; // Already on correct domain
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const productContext = user.user_metadata?.product_context;
        
        // If TipJar user is on m10djcompany.com, redirect to tipjar.live IMMEDIATELY
        if (productContext === 'tipjar') {
          const currentPath = window.location.pathname;
          const searchParams = window.location.search;
          window.location.replace(`https://tipjar.live${currentPath}${searchParams}`);
          return;
        }
        
        // If DJ Dash user is on m10djcompany.com, redirect to djdash.net
        if (productContext === 'djdash') {
          const currentPath = window.location.pathname;
          const searchParams = window.location.search;
          window.location.replace(`https://djdash.net${currentPath}${searchParams}`);
          return;
        }
      }
      
      // Also check organization product_context as fallback (even if user metadata doesn't have it)
      try {
        const org = await getCurrentOrganization(supabase);
        if (org?.product_context === 'tipjar') {
          const currentPath = window.location.pathname;
          const searchParams = window.location.search;
          window.location.replace(`https://tipjar.live${currentPath}${searchParams}`);
          return;
        }
        
        if (org?.product_context === 'djdash') {
          const currentPath = window.location.pathname;
          const searchParams = window.location.search;
          window.location.replace(`https://djdash.net${currentPath}${searchParams}`);
          return;
        }
      } catch (orgError) {
        // If we can't get org, continue (might be a new user)
        console.error('Error getting organization for domain redirect:', orgError);
      }
    } catch (error) {
      console.error('Error checking domain redirect:', error);
    }
  }

  async function determineDashboardUrl() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check product context from user metadata
        const productContext = user.user_metadata?.product_context;
        
        if (productContext === 'tipjar') {
          setDashboardUrl('/admin/crowd-requests');
          return;
        }
        
        if (productContext === 'djdash') {
          setDashboardUrl('/djdash/dashboard');
          return;
        }
        
        // Check organization product_context as fallback
        const org = await getCurrentOrganization(supabase);
        if (org?.product_context === 'tipjar') {
          setDashboardUrl('/admin/crowd-requests');
          return;
        }
        
        if (org?.product_context === 'djdash') {
          setDashboardUrl('/djdash/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Error determining dashboard URL:', error);
    }
  }

  async function checkStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Check if TipJar user before redirecting
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.user_metadata?.product_context === 'tipjar') {
            router.push('/tipjar/signin/password_signin');
            return;
          }
        } catch (e) {
          // Fall through to default
        }
        router.push('/signin');
        return;
      }

      // Check account status (uses cookie-based auth, no Authorization header needed)
      const response = await fetch('/api/stripe-connect/status', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // According to Stripe docs, check charges_enabled and details_submitted
        // A return_url doesn't mean onboarding is complete - we need to verify
        if (data.isComplete && data.accountStatus?.chargesEnabled && data.accountStatus?.payoutsEnabled) {
          setStatus('complete');
        } else if (data.accountStatus?.detailsSubmitted) {
          // Details submitted but not fully enabled yet
          setStatus('pending');
        } else {
          // Not fully onboarded - might need to continue
          setStatus('pending');
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  if (loading || status === 'checking') {
    return (
      <>
        <Head>
          <title>Completing Setup...</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Verifying your payment setup...</p>
          </div>
        </div>
      </>
    );
  }

  if (status === 'complete') {
    return (
      <>
        <Head>
          <title>Payment Setup Complete!</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Setup Complete! 🎉
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Your Stripe Connect account is fully activated. You can now accept payments from your customers and receive automatic payouts to your bank account.
            </p>
            <div className="space-y-4">
              <Link
                href={dashboardUrl}
                className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Continue to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/admin/crowd-requests"
                className="block w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                View Requests
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Setup In Progress</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900">
        <div className="max-w-md mx-auto px-4 text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Setup In Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your payment setup is being processed. This usually takes just a few moments. You'll receive an email when it's complete.
          </p>
          <Link
            href={dashboardUrl}
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

