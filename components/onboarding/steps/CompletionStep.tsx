/**
 * Completion Step - Final step showing success
 */

import { useRouter } from 'next/router';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { OnboardingStepProps } from '../OnboardingWizard';

export default function CompletionStep({
  organization
}: OnboardingStepProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push('/admin/crowd-requests');
  };

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-6">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        You're All Set! 🎉
      </h2>

      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
        Your DJ business is ready to go. Start accepting song requests and shoutouts at your events!
      </p>

      {/* What's Next */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          What's Next:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Share Your Request Page</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share the link or QR code with your audience
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Create Events</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add events to organize your requests
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Customize Settings</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure payment methods and pricing
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">View Requests</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage all song requests in your dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 w-full">
        <button
          onClick={handleGoToDashboard}
          className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => router.push(`/${organization.slug}/requests`)}
          className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          View Request Page
        </button>
      </div>

      {/* Help Resources */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-2">Need help? Check out our resources:</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
            Documentation
          </a>
          <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
            Video Tutorials
          </a>
          <a href="#" className="text-purple-600 dark:text-purple-400 hover:underline">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

