/**
 * Onboarding Welcome Page
 * 
 * Multi-step onboarding wizard for new users
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-context';
import OnboardingWizard, { OnboardingStep } from '@/components/onboarding/OnboardingWizard';
import WelcomeStep from '@/components/onboarding/steps/WelcomeStep';
import RequestPageStep from '@/components/onboarding/steps/RequestPageStep';
import EmbedStep from '@/components/onboarding/steps/EmbedStep';
import PaymentStep from '@/components/onboarding/steps/PaymentStep';
import FirstEventStep from '@/components/onboarding/steps/FirstEventStep';
import CompletionStep from '@/components/onboarding/steps/CompletionStep';
import { AlertCircle } from 'lucide-react';

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const loadOrganization = useCallback(async () => {
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
  }, [supabase, router]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Define onboarding steps
  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      description: 'Get started with your DJ business',
      component: WelcomeStep,
      canSkip: false,
      required: true
    },
    {
      id: 'request-page',
      title: 'Request Page',
      description: 'Get your request page URL',
      component: RequestPageStep,
      canSkip: false,
      required: true
    },
    {
      id: 'embed',
      title: 'Embed Code',
      description: 'Add to your website',
      component: EmbedStep,
      canSkip: true,
      required: false
    },
    {
      id: 'payments',
      title: 'Payments',
      description: 'Set up payment processing',
      component: PaymentStep,
      canSkip: true,
      required: false
    },
    {
      id: 'first-event',
      title: 'First Event',
      description: 'Create your first event',
      component: FirstEventStep,
      canSkip: true,
      required: false
    },
    {
      id: 'complete',
      title: 'Complete',
      description: 'You\'re all set!',
      component: CompletionStep,
      canSkip: false,
      required: true
    }
  ];

  const handleOnboardingComplete = async () => {
    setOnboardingComplete(true);
    
    // Mark onboarding as complete in database
    try {
      await fetch('/api/organizations/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allStepsCompleted: true
        })
      });
    } catch (error) {
      console.error('Failed to mark onboarding as complete:', error);
    }
    
    // Also save to localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_complete', 'true');
      localStorage.setItem('onboarding_completed_at', new Date().toISOString());
    }
  };

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

  return (
    <>
      <Head>
        <title>Welcome! Get Started | {organization?.name || 'Your DJ Business'}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 overflow-x-hidden" style={{ overflowX: 'hidden' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
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

          {/* Onboarding Wizard */}
          {organization && (
            <OnboardingWizard
              organization={organization}
              steps={onboardingSteps}
              onComplete={handleOnboardingComplete}
              completedSteps={completedSteps}
            />
          )}
        </div>
      </div>
    </>
  );
}

