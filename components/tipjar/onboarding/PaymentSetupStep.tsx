'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, CreditCard, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';
import { triggerConfetti } from '@/utils/confetti';

interface PaymentSetupStepProps {
  paymentSetup: OnboardingData['paymentSetup'];
  onPaymentUpdate: (status: OnboardingData['paymentSetup']) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  progress: number;
  currentStep: number;
  totalSteps: number;
  organization?: any;
}

export default function PaymentSetupStep({
  paymentSetup,
  onPaymentUpdate,
  onNext,
  onBack,
  onSkip,
  progress,
  currentStep,
  totalSteps,
  organization
}: PaymentSetupStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const confettiTriggered = useRef(false);

  // Check if Stripe account already exists
  useEffect(() => {
    checkAccountStatus();
  }, [organization]);

  async function checkAccountStatus() {
    if (!organization?.id) return;

    try {
      const response = await fetch('/api/stripe-connect/status');
      if (response.ok) {
        const data = await response.json();
        setAccountStatus(data);
        if (data.chargesEnabled && data.payoutsEnabled) {
          onPaymentUpdate('completed');
          
          // Trigger confetti when payment setup is completed
          if (!confettiTriggered.current) {
            triggerConfetti({
              duration: 2000,
              colors: ['#9333ea', '#ec4899', '#10b981', '#3b82f6']
            });
            confettiTriggered.current = true;
          }

          // Track payment setup completion
          try {
            await fetch('/api/organizations/update-onboarding', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stepId: 'payment_setup',
                completed: true
              })
            });
          } catch (error) {
            console.error('Failed to track payment setup completion:', error);
            // Non-critical, continue anyway
          }
        }
      }
    } catch (err) {
      console.error('Error checking account status:', err);
    }
  }

  async function handleSetupPayments() {
    setLoading(true);
    setError(null);

    try {
      // First, create the Stripe Connect account if it doesn't exist
      if (!organization?.stripe_connect_account_id) {
        const createResponse = await fetch('/api/stripe-connect/create-account', {
          method: 'POST'
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create Stripe account');
        }
      }

      // Get the onboarding link
      const linkResponse = await fetch('/api/stripe-connect/onboarding-link');

      if (!linkResponse.ok) {
        const errorData = await linkResponse.json();
        throw new Error(errorData.error || 'Failed to get onboarding link');
      }

      const linkData = await linkResponse.json();
      setOnboardingUrl(linkData.onboardingUrl);
      setAccountStatus(linkData.accountStatus);

      // Open Stripe onboarding in the same window
      window.location.href = linkData.onboardingUrl;
    } catch (err: any) {
      console.error('Error setting up payments:', err);
      setError(err.message || 'Failed to set up payment processing');
    } finally {
      setLoading(false);
    }
  }

  const canProceed = paymentSetup === 'completed';
  const showSkipOption = paymentSetup !== 'completed';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Set up payments
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps} • Takes about 2 minutes
          </p>
        </div>

        {/* Status Display */}
        {paymentSetup === 'completed' ? (
          <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-200 mb-1">
                  Payments Enabled! ✅
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You're all set to receive tips and payments. Customers can now pay you securely through TipJar.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            {/* Why Set Up Payments */}
            <div className="mb-6 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-4">
                <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Why set up payments?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Accept tips and song requests from customers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Secure payment processing powered by Stripe</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Direct deposits to your bank account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Used by thousands of performers worldwide</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Security Badges */}
            <div className="mb-6 flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Secured by Stripe</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Bank-level Security</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                      Setup Error
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation - Payment can be skipped, no back button */}
        <div className="flex flex-col sm:flex-row gap-4">
          {showSkipOption && (
            <button
              onClick={onSkip}
              className="flex-1 sm:flex-initial px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Skip for now
            </button>
          )}

          {paymentSetup === 'completed' ? (
            <button
              onClick={onNext}
              className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSetupPayments}
              disabled={loading}
              className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Set up payments now
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Skip Warning */}
        {showSkipOption && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> You won't be able to receive tips until payments are enabled. You can set this up later in your dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

