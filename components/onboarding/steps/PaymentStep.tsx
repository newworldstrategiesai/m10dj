/**
 * Payment Step - Stripe Connect setup
 */

import { OnboardingStepProps } from '../OnboardingWizard';
import StripeConnectSetup from '../StripeConnectSetup';

export default function PaymentStep({
  organization,
  onComplete,
  onSkip,
  onNext
}: OnboardingStepProps) {
  const handleStripeComplete = () => {
    onComplete();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext();
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Processing Options
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You can accept payments immediately! Choose how you want to receive money.
        </p>
      </div>

      {/* Payment Options */}
      <div className="space-y-4 mb-6">
        {/* Option 1: Platform Payments (Works Immediately) */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
              ✓
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Platform Payments (Available Now)
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Accept credit cards and Cash App Pay immediately through our platform. Payments are processed instantly - no setup required!
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Works right away - no additional setup</li>
                <li>Accept credit/debit cards and Cash App Pay</li>
                <li>Payments processed securely</li>
                <li>You'll receive payouts manually (we'll contact you)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Option 2: Stripe Connect (Automatic Payouts) */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                Automatic Payouts (Optional)
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                Set up Stripe Connect to receive automatic payouts directly to your bank account. Takes 2-3 minutes.
              </p>
              <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
                <li>Automatic deposits to your bank account</li>
                <li>Standard payouts: Money arrives in 2-7 business days (free)</li>
                <li>Instant payouts: Money arrives in minutes (1% fee, min $0.50)</li>
                <li>Full control over your payments</li>
                <li>Requires Stripe account verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Option 3: Instant Payouts (Premium) */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
              ⚡
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Instant Payouts (Premium Feature)
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                Get your money in minutes instead of days. Perfect for when you need funds immediately.
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                <li>Money arrives in your account within minutes</li>
                <li>1% fee (minimum $0.50 per payout)</li>
                <li>Requires Stripe Connect setup + debit card on file</li>
                <li>Available 24/7 - request instant payouts anytime</li>
              </ul>
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                💡 You can enable this after setting up Stripe Connect
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>💡 Good news:</strong> Your request page already accepts payments! Customers can pay with credit cards or Cash App Pay right now. 
          Stripe Connect is optional and only needed if you want automatic payouts to your bank account.
        </p>
      </div>

      {/* Stripe Connect Setup (Optional) */}
      <div className="mb-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Set Up Automatic Payouts (Optional)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete Stripe Connect setup to receive automatic payouts. You can skip this and set it up later.
          </p>
        </div>
        <StripeConnectSetup
          organizationId={organization.id}
          onComplete={handleStripeComplete}
        />
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
        >
          Skip - I'll set up automatic payouts later
        </button>
      </div>
    </div>
  );
}

