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
  const [saving, setSaving] = useState(false);
  const [slugSaved, setSlugSaved] = useState(false);

  // Ensure we have the slug saved before showing the preview URL
  useEffect(() => {
    const slug = data.slug || organization?.slug;
    if (slug) {
      // If we have a slug in data but not in organization, we need to save it first
      if (data.slug && (!organization?.slug || organization.slug !== data.slug)) {
        // Slug hasn't been saved yet - save it now
        saveSlugIfNeeded();
      } else {
        // Slug is already saved, we can show the URL
        const url = `https://tipjar.live/${slug}/requests`;
        setPageUrl(url);
        setSlugSaved(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.slug, organization?.slug]);

  async function saveSlugIfNeeded() {
    if (!organization?.id || !data.slug) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/organizations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.displayName || organization.name,
          slug: data.slug,
          requests_header_artist_name: data.displayName || organization.requests_header_artist_name || organization.name,
          requests_header_location: data.location || organization.requests_header_location || null
        })
      });
      
      if (response.ok) {
        // Wait a moment for database to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        const url = `https://tipjar.live/${data.slug}/requests`;
        setPageUrl(url);
        setSlugSaved(true);
      } else {
        console.error('Failed to save organization slug');
      }
    } catch (error) {
      console.error('Error saving organization slug:', error);
    } finally {
      setSaving(false);
    }
  }

  function handleViewLive() {
    if (pageUrl && slugSaved) {
      window.open(pageUrl, '_blank');
    } else if (data.slug) {
      // Try to save first, then open
      saveSlugIfNeeded().then(() => {
        if (data.slug) {
          const url = `https://tipjar.live/${data.slug}/requests`;
          window.open(url, '_blank');
        }
      });
    }
  }

  async function handleComplete() {
    // No need to save here - OnboardingWizard.handleComplete already saves everything
    // Just call the parent's onComplete
    onComplete();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-200 dark:bg-purple-900 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-4 sm:p-6">
                <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            View Your Live Page
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps} • See how your page looks to customers
          </p>
        </div>

        {/* Full Page Preview */}
        {data.slug && (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Live Requests Page
              </h3>
              <button
                onClick={handleViewLive}
                disabled={saving || !slugSaved}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    {slugSaved ? 'Open in New Tab' : 'Preparing Your Page...'}
                  </>
                )}
              </button>
            </div>
            
            {!slugSaved && !saving && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⏳ Setting up your page... This will be ready in just a moment.
                </p>
              </div>
            )}
            
            {/* Preview iframe */}
            {slugSaved && pageUrl ? (
              <div className="relative w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800" style={{ aspectRatio: '9/16', minHeight: '400px', maxHeight: '70vh' }}>
                <iframe
                  src={pageUrl}
                  className="w-full h-full border-0"
                  title="Preview of your TipJar requests page"
                  allow="payment; camera; microphone"
                  style={{ minHeight: '400px' }}
                  onError={() => {
                    console.error('Failed to load preview iframe');
                  }}
                />
              </div>
            ) : (
              <div className="relative w-full border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 flex items-center justify-center" style={{ aspectRatio: '9/16', minHeight: '400px', maxHeight: '70vh' }}>
                <div className="text-center p-4 sm:p-8">
                  <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {saving ? 'Setting up your page...' : 'Preparing your live page...'}
                  </p>
                </div>
              </div>
            )}

            {/* URL Display */}
            {(slugSaved || data.slug) && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Page URL
                </p>
                <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                  {pageUrl || `https://tipjar.live/${data.slug}/requests`}
                </p>
              </div>
            )}
          </div>
        )}
        
        {!data.slug && (
          <div className="mb-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Please go back and complete the basic info step to set up your page URL.
            </p>
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onBack}
            disabled={loading || saving}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <a
              href="/admin/crowd-requests"
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Dashboard</span>
            </a>
            <button
              onClick={handleComplete}
              disabled={loading || saving}
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {(loading || saving) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{saving ? 'Saving...' : 'Completing...'}</span>
                </>
              ) : (
                <>
                  <span>Complete Setup</span>
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

