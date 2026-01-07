'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface PreviewLaunchStepProps {
  data: OnboardingData;
  onComplete: () => void;
  onBack: () => void;
  loading: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
  organization?: any;
}

export default function PreviewLaunchStep({
  data,
  onComplete,
  onBack,
  loading,
  progress,
  currentStep,
  totalSteps,
  organization
}: PreviewLaunchStepProps) {
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (data.slug || organization?.slug) {
      const slug = data.slug || organization?.slug;
      const url = `https://tipjar.live/${slug}/requests`;
      setPageUrl(url);
    }
  }, [data.slug, organization?.slug]);

  function handleViewLive() {
    if (pageUrl) {
      window.open(pageUrl, '_blank');
    }
  }

  async function handleComplete() {
    // Save organization updates before completing
    if (data.displayName || data.location) {
      try {
        const response = await fetch('/api/organizations/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.displayName,
            slug: data.slug,
            requests_header_artist_name: data.displayName,
            requests_header_location: data.location || null
          })
        });
        if (!response.ok) {
          console.error('Failed to save organization data');
        }
      } catch (error) {
        console.error('Error saving organization data:', error);
      }
    }
    onComplete();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-200 dark:bg-purple-900 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-6">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            View Your Live Page
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps} • See how your page looks to customers
          </p>
        </div>

        {/* Full Page Preview */}
        {pageUrl && (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Live Requests Page
              </h3>
              <button
                onClick={handleViewLive}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </button>
            </div>
            
            {/* Preview iframe */}
            <div className="relative w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800" style={{ aspectRatio: '9/16', minHeight: '600px', maxHeight: '80vh' }}>
              <iframe
                src={pageUrl}
                className="w-full h-full border-0"
                title="Preview of your TipJar requests page"
                allow="payment; camera; microphone"
                style={{ minHeight: '600px' }}
              />
            </div>

            {/* URL Display */}
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                Page URL
              </p>
              <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                {pageUrl}
              </p>
            </div>
          </div>
        )}


        {/* Next Steps */}
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            What's next?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Share your page URL</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send your link to fans, post it on social media, or print QR codes for events
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Customize your page</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Change colors, add a header video, set up social media links, and more
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {data.paymentSetup === 'skipped' ? 'Set up payments' : 'Test your page'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {data.paymentSetup === 'skipped'
                    ? 'Enable payment processing so you can start receiving tips'
                    : 'Send yourself a test tip to make sure everything works'}
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 sm:flex-initial px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <a
              href="/admin/crowd-requests"
              className="flex-1 px-6 py-3 border border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Dashboard
            </a>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

