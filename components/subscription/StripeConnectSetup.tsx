/**
 * Stripe Connect Setup Component
 * 
 * Prompts DJs to set up Stripe Connect to receive payments
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization, Organization } from '@/utils/organization-context';
import { CreditCard, CheckCircle, AlertCircle, ArrowRight, Loader2, ExternalLink, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BankAccountCollection from './BankAccountCollection';

interface ConnectStatus {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  isComplete: boolean;
  accountId?: string;
}

export default function StripeConnectSetup() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    // Check if user has dismissed this notification
    if (organization?.id) {
      const dismissedKey = `stripe_setup_complete_dismissed_${organization.id}`;
      const dismissed = localStorage.getItem(dismissedKey) === 'true';
      setIsDismissed(dismissed);
    }
  }, [organization?.id]);

  useEffect(() => {
    // Auto-refresh status every 30 seconds if account exists but not complete
    if (!connectStatus?.hasAccount || connectStatus.isComplete) {
      return; // Don't set up interval if no account or already complete
    }

    const interval = setInterval(() => {
      loadStatus();
    }, 30000); // 30 seconds
    
    // Also refresh when page becomes visible (user returns from Stripe)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectStatus?.hasAccount, connectStatus?.isComplete]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const org = await getCurrentOrganization(supabase);
      if (!org) {
        setLoading(false);
        return;
      }

      setOrganization(org);

      // Check if organization has Stripe Connect account
      const orgData = org as any;
      const hasAccount = !!orgData.stripe_connect_account_id;

      if (hasAccount) {
        // Fetch fresh status from Stripe API (this also updates the database)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const statusResponse = await fetch('/api/stripe-connect/status', {
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              // Use fresh data from Stripe API
              setConnectStatus({
                hasAccount: true,
                chargesEnabled: statusData.accountStatus?.chargesEnabled || false,
                payoutsEnabled: statusData.accountStatus?.payoutsEnabled || false,
                detailsSubmitted: statusData.accountStatus?.detailsSubmitted || false,
                isComplete: statusData.isComplete || false,
                accountId: statusData.accountId || org.stripe_connect_account_id,
              });

              // If not complete, get onboarding URL
              if (!statusData.isComplete) {
                await fetchOnboardingUrl();
              }
              
              setLoading(false);
              return;
            }
          }
        } catch (statusError) {
          console.error('Error fetching status from API:', statusError);
          // Fall through to use org data
        }
      }

      // Fallback: Use organization data if API call fails
      const chargesEnabled = orgData.stripe_connect_charges_enabled || false;
      const payoutsEnabled = orgData.stripe_connect_payouts_enabled || false;
      const detailsSubmitted = orgData.stripe_connect_details_submitted || false;

      setConnectStatus({
        hasAccount,
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
        isComplete: chargesEnabled && payoutsEnabled,
        accountId: org.stripe_connect_account_id || undefined,
      });

      // If account exists but not complete, get onboarding URL
      if (hasAccount && !(chargesEnabled && payoutsEnabled)) {
        await fetchOnboardingUrl();
      }
    } catch (error) {
      console.error('Error loading Stripe Connect status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingUrl = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/stripe-connect/onboarding-link');
      if (response.ok) {
        const data = await response.json();
        setOnboardingUrl(data.onboardingUrl);
      }
    } catch (error) {
      console.error('Error fetching onboarding URL:', error);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    isPlatformProfileError?: boolean;
    cannotCreateAccounts?: boolean;
    helpUrl?: string;
    isTestMode?: boolean;
  } | null>(null);

  const handleSetup = async () => {
    try {
      setSettingUp(true);
      setError(null);
      setErrorDetails(null);

      // First, create the account if it doesn't exist
      if (!connectStatus?.hasAccount) {
        const createResponse = await fetch('/api/stripe-connect/create-account', {
          method: 'POST',
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          const errorMessage = errorData.details || errorData.error || 'Failed to create Stripe account';
          
          // Check if it's a "cannot create accounts" error (most critical)
          const cannotCreateAccounts = errorData.cannotCreateAccounts || 
            errorMessage.toLowerCase().includes('cannot currently create connected accounts') ||
            errorMessage.toLowerCase().includes('cannot create connected accounts');
          
          // Check if it's a platform verification error
          const isPlatformProfileError = errorData.isPlatformProfileError || 
            errorMessage.includes('verify your identity') ||
            errorMessage.includes('platform profile') ||
            errorMessage.includes('complete verification');
          
          if (cannotCreateAccounts || isPlatformProfileError) {
            setError(errorMessage);
            setErrorDetails({
              isPlatformProfileError: isPlatformProfileError,
              cannotCreateAccounts: cannotCreateAccounts,
              helpUrl: errorData.helpUrl || 'https://support.stripe.com/contact',
              isTestMode: errorData.isTestMode || false,
            });
            setSettingUp(false);
            return;
          }
          
          throw new Error(errorMessage);
        }
      }

      // Then get the onboarding link
      const linkResponse = await fetch('/api/stripe-connect/onboarding-link');
      if (!linkResponse.ok) {
        const errorData = await linkResponse.json();
        throw new Error(errorData.error || 'Failed to get onboarding link');
      }

      const data = await linkResponse.json();
      
      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (error: any) {
      console.error('Error setting up Stripe Connect:', error);
      setError(error.message || 'Failed to start setup. Please try again.');
    } finally {
      setSettingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!organization || !connectStatus) {
    return null;
  }

  // If setup is complete, show success status
  if (connectStatus.isComplete) {
    // Don't show if dismissed
    if (isDismissed) {
      return null;
    }

    const handleDismiss = () => {
      if (organization?.id) {
        const dismissedKey = `stripe_setup_complete_dismissed_${organization.id}`;
        localStorage.setItem(dismissedKey, 'true');
        setIsDismissed(true);
      }
    };

    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-start gap-4">
          <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-3 flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
              Payment Setup Complete
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Your Stripe account is connected and ready to receive payments. All payments from requests will automatically be deposited to your account.
            </p>
            <Link href="/admin/payouts">
              <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                View Payouts <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If account exists but not complete, show completion prompt
  if (connectStatus.hasAccount && !connectStatus.isComplete) {
    // If charges are enabled but payouts aren't, offer Financial Connections for bank account
    const needsBankAccount = connectStatus.chargesEnabled && !connectStatus.payoutsEnabled;
    
    // Show refresh button to manually check status
    const handleRefresh = () => {
      loadStatus();
    };
    
    return (
      <div className="space-y-4">
        {needsBankAccount ? (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Link Your Bank Account
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your payment account is ready! Link your bank account to start receiving automatic payouts.
                  </p>
                </div>
              </div>
            </div>
            <BankAccountCollection
              onSuccess={() => {
                // Reload status after successful bank account linking
                loadStatus();
              }}
              onError={(errorMessage) => {
                setError(errorMessage);
              }}
            />
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                <strong>Alternative:</strong> You can also complete the full Stripe onboarding process if you prefer.
              </p>
              <Button
                onClick={handleSetup}
                disabled={settingUp}
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-700"
              >
                {settingUp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Complete Full Onboarding <ExternalLink className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/50 rounded-lg p-3 flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Complete Payment Setup
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  Your Stripe account is created but needs to be activated. Complete the onboarding process to start receiving payments.
                  {connectStatus.detailsSubmitted && (
                    <span className="block mt-2 text-xs">
                      Status: Details submitted - waiting for Stripe approval. This usually takes just a few moments.
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSetup}
                    disabled={settingUp}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {settingUp ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Complete Setup <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    disabled={loading}
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    title="Refresh status from Stripe"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If there's an error (especially platform verification or cannot create accounts), show it
  if (error && errorDetails && (errorDetails.isPlatformProfileError || errorDetails.cannotCreateAccounts)) {
    const isCannotCreateError = errorDetails.cannotCreateAccounts;
    
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 dark:bg-red-900/50 rounded-lg p-3 flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
              {isCannotCreateError ? 'Stripe Connect Not Enabled' : 'Stripe Setup Required'}
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              {error}
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              {isCannotCreateError ? (
                <>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    <strong>Critical Action Required:</strong> Your Stripe account needs to be enabled for Connect before DJs can set up automatic payouts. This is a one-time setup that requires contacting Stripe support.
                  </p>
                  <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2 list-decimal list-inside mb-3">
                    <li>Click the button below to contact Stripe support</li>
                    <li>Request to enable Stripe Connect for your account</li>
                    <li>Complete any required verification or compliance steps</li>
                    <li>Once enabled, return here and DJs can set up their accounts</li>
                  </ol>
                  {errorDetails.helpUrl && (
                    <a
                      href={errorDetails.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors mb-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Contact Stripe Support
                    </a>
                  )}
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    💡 <strong>Note:</strong> Your request pages will continue to accept payments during this time. Payments will go to your platform account until Connect is enabled.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    <strong>Platform Verification Required:</strong> The TipJar platform needs to complete Stripe's one-time platform verification before individual accounts can be set up. This is a platform-level requirement, not something you need to do.
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    The platform owner will complete this verification. Once done, you'll be able to set up your payment account automatically through this interface - no manual Stripe Dashboard login required.
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                    💡 <strong>Note:</strong> Your request page will continue to work and accept payments. Payment setup can be completed later once platform verification is done.
                  </p>
                  {errorDetails.helpUrl && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-yellow-300 dark:border-yellow-700">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                        <strong>For Platform Administrators:</strong> If you're setting up the platform, you can complete verification at:
                      </p>
                      <a
                        href={errorDetails.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Stripe Connect Dashboard {errorDetails.isTestMode ? '(Test Mode)' : '(Live Mode)'}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <Button
              onClick={handleSetup}
              disabled={settingUp}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {settingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting Up...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If no account, show setup prompt
  return (
    <div data-stripe-setup className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 flex-shrink-0">
          <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Set Up Payments to Receive Money
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your Stripe account to automatically receive payments from song requests and shoutouts. 
            Payments are deposited directly to your bank account with a small platform fee (3.5% + $0.30).
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSetup}
              disabled={settingUp}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {settingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting Up...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Set Up Stripe Payments
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://stripe.com/docs/connect', '_blank')}
              className="border-gray-300"
            >
              Learn More <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Secure payment processing powered by Stripe. You'll need a bank account to receive payouts.
          </p>
        </div>
      </div>
    </div>
  );
}

