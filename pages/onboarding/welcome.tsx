/**
 * Onboarding Welcome Page
 * 
 * Shown after user signs up and creates organization
 * Displays their URLs and embed codes
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-context';
import EmbedCodeGenerator from '@/components/onboarding/EmbedCodeGenerator';
import StripeConnectSetup from '@/components/onboarding/StripeConnectSetup';
import { CheckCircle, Copy, ExternalLink, QrCode, ArrowRight, Sparkles, Settings, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(true);

  const loadOrganization = async () => {
    try {
      // Check if user exists (even if email not confirmed)
      // We'll use a more permissive check to allow onboarding for unconfirmed users
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // If there's an error getting user, try to get from session
      let currentUser = user;
      if (userError || !user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          currentUser = session.user;
        } else {
          // No user at all - redirect to signup
          router.push('/signin/signup');
          return;
        }
      }
      
      if (!currentUser) {
        router.push('/signin/signup');
        return;
      }

      // Check if email is confirmed
      setEmailConfirmed(currentUser.email_confirmed_at !== null);

      // Try to get organization
      const org = await getCurrentOrganization(supabase);
      
      if (org) {
        setOrganization(org);
      } else {
        // User exists but no organization - try to create one via API
        // Use organization_name from user metadata if available
        const orgName = currentUser.user_metadata?.organization_name || 
                       currentUser.email?.split('@')[0] || 
                       'My DJ Business';
        
        try {
          const response = await fetch('/api/organizations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: orgName
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.organization) {
              setOrganization(data.organization);
            }
          }
        } catch (error) {
          console.error('Error creating organization:', error);
        }
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, router]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!organization && !loading) {
    // If still loading, show loading state
    // If not loading and no org, show error message
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900">
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Organization Setup Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn&apos;t find or create your organization. Please try signing out and back in, or contact support.
          </p>
          <button
            onClick={() => router.push('/signin/signup')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Sign Up
          </button>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  // Use the organization-specific routes
  const requestUrl = `${baseUrl}/${organization.slug}/requests`;
  const embedUrl = `${baseUrl}/${organization.slug}/embed/requests`;

  return (
    <>
      <Head>
        <title>Welcome! Get Started | {organization.name}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🎉 Welcome to {organization.name}!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              Your DJ business is ready to go. Here&apos;s everything you need to get started.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Start accepting song requests and shoutouts at your events in minutes.
            </p>
          </div>

          {/* Email Confirmation Warning */}
          {!emailConfirmed && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Email Not Confirmed:</strong> Please check your email and confirm your account to access all features.
                </p>
              </div>
            </div>
          )}

          {/* Trial Status */}
          {organization.subscription_status === 'trial' && organization.trial_ends_at && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Free Trial Active:</strong> You have {Math.max(0, Math.ceil(
                    (new Date(organization.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  ))} days remaining. No credit card required.
                </p>
              </div>
            </div>
          )}

          {/* Your Request Page URL */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <ExternalLink className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Your Request Page URL
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Share this link anywhere - social media, email, or print it on flyers. Anyone can use it to request songs or shoutouts at your events.
            </p>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white break-all">
                {requestUrl}
              </code>
              <button
                onClick={() => handleCopy(requestUrl, 'url')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
              >
                {copied === 'url' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <a
                href={requestUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Test
              </a>
            </div>
          </div>

          {/* Embed Code Generator */}
          <div className="mb-6">
            <EmbedCodeGenerator 
              organizationSlug={organization.slug}
              organizationName={organization.name}
            />
          </div>

          {/* Stripe Connect Setup */}
          <div className="mb-6">
            <StripeConnectSetup 
              organizationId={organization.id}
              onComplete={() => {
                // Refresh organization data after completion
                loadOrganization();
              }}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/admin/crowd-requests"
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors group"
              >
                <QrCode className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Generate QR Code
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create QR codes for your events
                </p>
              </Link>

              <Link
                href="/admin/crowd-requests"
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors group"
              >
                <Sparkles className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  View Requests
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage song requests and shoutouts
                </p>
              </Link>

              <Link
                href="/admin/crowd-requests"
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors group"
              >
                <Settings className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Customize Settings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure payment methods and pricing
                </p>
              </Link>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.push('/admin/crowd-requests')}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Go to SaaS Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

