/**
 * Stripe Connect Setup Component
 * 
 * Handles Stripe Connect Express account creation and onboarding
 * for platform payments with automatic payouts.
 */

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CheckCircle, AlertCircle, Loader2, CreditCard, ArrowRight } from 'lucide-react';

interface StripeConnectSetupProps {
  organizationId: string;
  onComplete?: () => void;
}

export default function StripeConnectSetup({ organizationId, onComplete }: StripeConnectSetupProps) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'not_started' | 'creating' | 'onboarding' | 'complete' | 'error'>('not_started');
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    isPlatformProfileError?: boolean;
    helpUrl?: string;
    isTestMode?: boolean;
  } | null>(null);
  const [accountStatus, setAccountStatus] = useState<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  } | null>(null);

  useEffect(() => {
    checkAccountStatus();
  }, [organizationId]);

  async function checkAccountStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // API routes use cookie-based auth, no need for Authorization header
      const response = await fetch('/api/stripe-connect/status');

      if (response.ok) {
        const data = await response.json();
        if (data.accountId) {
          if (data.isComplete) {
            setStatus('complete');
            setAccountStatus(data.accountStatus);
            onComplete?.();
          } else {
            setStatus('onboarding');
            setOnboardingUrl(data.onboardingUrl);
            setAccountStatus(data.accountStatus);
          }
        }
      }
    } catch (err) {
      console.error('Error checking account status:', err);
    }
  }

  async function createAccount() {
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      // Create Stripe Connect account (uses cookie-based auth)
      const createResponse = await fetch('/api/stripe-connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!createResponse.ok) {
        let errorData;
        try {
          errorData = await createResponse.json();
        } catch (e) {
          errorData = { error: `HTTP ${createResponse.status}: ${createResponse.statusText}` };
        }
        console.error('Create account error response:', errorData);
        
        // Handle platform profile/verification errors with helpful message
        const errorMessage = errorData.details || errorData.error || 'Stripe setup required';
        
        // Check if it's a platform verification error (multiple variations)
        const isVerificationError = errorMessage.includes('verify your identity') || 
            errorMessage.includes('verify identity') ||
            errorMessage.includes('complete verification') ||
            errorMessage.includes('complete your platform profile') ||
            errorMessage.includes('platform profile') ||
            errorData.isPlatformProfileError;
        
        if (isVerificationError) {
          const error = new Error(errorMessage);
          (error as any).helpUrl = errorData.helpUrl || 'https://dashboard.stripe.com/connect/accounts/overview';
          (error as any).isPlatformProfileError = true;
          (error as any).isTestMode = errorData.isTestMode;
          throw error;
        }
        
        throw new Error(errorMessage);
      }

      // Get onboarding link (uses cookie-based auth)
      const linkResponse = await fetch('/api/stripe-connect/onboarding-link');

      if (!linkResponse.ok) {
        const errorData = await linkResponse.json();
        throw new Error(errorData.error || 'Failed to get onboarding link');
      }

      const linkData = await linkResponse.json();
      setOnboardingUrl(linkData.onboardingUrl);
      setStatus('onboarding');
      setAccountStatus(linkData.accountStatus);
    } catch (err: any) {
      console.error('Error creating Stripe account:', err);
      setError(err.message || 'Failed to set up payment processing');
      // Store additional error details for UI display
      setErrorDetails({
        isPlatformProfileError: err.isPlatformProfileError || false,
        helpUrl: err.helpUrl || null,
        isTestMode: err.isTestMode || false,
      });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }

  function handleStartOnboarding() {
    if (onboardingUrl) {
      window.location.href = onboardingUrl;
    }
  }

  if (status === 'complete') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
            Payment Processing Ready!
          </h3>
        </div>
        <p className="text-sm text-green-800 dark:text-green-200 mb-2">
          Your Stripe Connect account is fully set up. You can now accept payments from your customers.
        </p>
        {accountStatus && (
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              <span>Charges enabled: {accountStatus.chargesEnabled ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              <span>Payouts enabled: {accountStatus.payoutsEnabled ? 'Yes' : 'No'}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'onboarding') {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            Complete Payment Setup
          </h3>
        </div>
        <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
          Your Stripe Connect account has been created. Complete the quick onboarding process to start accepting payments.
        </p>
        {accountStatus && (
          <div className="mb-4 space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${accountStatus.chargesEnabled ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {accountStatus.chargesEnabled ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>Charges: {accountStatus.chargesEnabled ? 'Enabled' : 'Pending'}</span>
            </div>
            <div className={`flex items-center gap-2 ${accountStatus.payoutsEnabled ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {accountStatus.payoutsEnabled ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>Payouts: {accountStatus.payoutsEnabled ? 'Enabled' : 'Pending'}</span>
            </div>
          </div>
        )}
        <button
          onClick={handleStartOnboarding}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Complete Stripe Setup
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 text-center">
          This will open Stripe's secure onboarding page
        </p>
      </div>
    );
  }

  if (status === 'error') {
    // Check if this is a platform profile error
    const isPlatformProfileError = errorDetails?.isPlatformProfileError || false;
    const helpUrl = errorDetails?.helpUrl;
    const isTestMode = errorDetails?.isTestMode || false;
    
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
            {isPlatformProfileError ? 'Stripe Setup Required' : 'Setup Error'}
          </h3>
        </div>
        <p className="text-sm text-red-800 dark:text-red-200 mb-4">
          {error || 'An error occurred while setting up payment processing.'}
        </p>
        
        {isPlatformProfileError && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              <strong>Action Required:</strong> Before creating Connect accounts, you need to complete Stripe's platform verification. This is a one-time setup that takes 2-3 minutes.
            </p>
            <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-2 list-decimal list-inside mb-3">
              <li>Click the button below to open your Stripe Dashboard</li>
              <li>Complete the platform profile questionnaire and identity verification</li>
              <li>Return here and click "Try Again"</li>
            </ol>
            {helpUrl && (
              <a
                href={helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors mb-3"
              >
                <ArrowRight className="w-4 h-4" />
                Open Stripe Dashboard {isTestMode ? '(Test Mode)' : '(Live Mode)'}
              </a>
            )}
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              💡 <strong>Note:</strong> You can skip this step for now and set up payments later. Your request page will still work without payment processing.
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={createAccount}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                Setting up...
              </>
            ) : (
              'Try Again'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Set Up Payment Processing
        </h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Accept payments from your customers instantly. No Stripe account setup required - we handle everything for you.
      </p>
      
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How it works:</h4>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <span>We create a Stripe account for you automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <span>Complete a quick 2-minute onboarding (bank account, tax info)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <span>Start accepting payments immediately</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-6 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <span>Money is automatically deposited to your bank account</span>
          </li>
        </ul>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <strong>Platform Fee:</strong> 3.5% + $0.30 per transaction
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Example: $100 payment → You receive $96.20 (we keep $3.80 for platform fees)
        </p>
      </div>

      <button
        onClick={createAccount}
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Setting up...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Set Up Payment Processing
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        Secure payment processing powered by Stripe
      </p>
    </div>
  );
}

