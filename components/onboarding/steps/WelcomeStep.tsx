/**
 * Welcome Step - First step of onboarding
 */

import { useState } from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { OnboardingStepProps } from '../OnboardingWizard';

export default function WelcomeStep({
  organization,
  onComplete,
  onNext
}: OnboardingStepProps) {
  const [businessName, setBusinessName] = useState(organization?.name || '');

  const handleContinue = () => {
    // Update organization name if changed
    if (businessName && businessName !== organization?.name) {
      // TODO: Update organization name via API
    }
    onNext();
  };

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
        <Sparkles className="w-8 h-8 text-white" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to {organization?.name || 'Your DJ Business'}! 🎉
      </h2>

      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        Let's get you set up in just a few minutes. We'll help you create your request page, 
        set up payments, and create your first event.
      </p>

      {/* Business Name Confirmation */}
      <div className="max-w-md mx-auto mb-8 w-full">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">
          Confirm Your Business Name
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="w-full min-w-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Your DJ Business Name"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-left">
          This will appear on your request page and in your URLs
        </p>
      </div>

      {/* What You'll Get */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          What you'll get:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Your Request Page</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A custom URL to share with your audience
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">QR Codes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate codes for easy sharing at events
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Payment Processing</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Accept payments securely with Stripe
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Embed Codes</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add to your website in minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all"
      >
        Let's Get Started
      </button>
    </div>
  );
}

