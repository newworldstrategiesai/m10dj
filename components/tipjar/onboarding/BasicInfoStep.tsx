'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';
import { triggerQuickConfetti } from '@/utils/confetti';

interface BasicInfoStepProps {
  data: OnboardingData;
  onDataUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  progress: number;
  currentStep: number;
  totalSteps: number;
  organization?: any;
}

export default function BasicInfoStep({
  data,
  onDataUpdate,
  onNext,
  onBack,
  progress,
  currentStep,
  totalSteps,
  organization
}: BasicInfoStepProps) {
  const [displayName, setDisplayName] = useState(data.displayName || '');
  const [location, setLocation] = useState(data.location || '');
  const [slug, setSlug] = useState(data.slug || '');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; slug?: string }>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const confettiTriggered = useRef(false);

  // Check if fields were pre-filled from organization
  const hasPreFilledData = organization && (
    organization.requests_header_artist_name || 
    organization.name || 
    organization.slug ||
    organization.requests_header_location
  );

  // Generate slug from display name (only if slug hasn't been manually edited)
  useEffect(() => {
    if (displayName && !slugManuallyEdited) {
      const generated = generateSlugFromName(displayName);
      // Only update if the generated slug is different from current
      if (generated !== slug) {
        setSlug(generated);
        onDataUpdate({ slug: generated });
      }
    }
  }, [displayName, slugManuallyEdited]);

  // Check slug availability
  useEffect(() => {
    if (slug && slug.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkSlugAvailability(slug);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (slug) {
      setSlugAvailable(null);
    }
  }, [slug]);

  function generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  async function checkSlugAvailability(slugToCheck: string) {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugAvailable(null);
      return;
    }

    // Don't check if it's the current organization's slug
    if (organization?.slug === slugToCheck) {
      setSlugAvailable(true);
      return;
    }

    setCheckingSlug(true);
    try {
      const response = await fetch(`/api/organizations/check-slug?slug=${encodeURIComponent(slugToCheck)}`);
      const data = await response.json();
      setSlugAvailable(!data.exists);
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  }

  function validate(): boolean {
    const newErrors: { displayName?: string; slug?: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (displayName.trim().length > 50) {
      newErrors.displayName = 'Display name must be less than 50 characters';
    }

    if (!slug.trim()) {
      newErrors.slug = 'URL slug is required';
    } else if (slug.trim().length < 3) {
      newErrors.slug = 'URL slug must be at least 3 characters';
    } else if (slugAvailable === false) {
      newErrors.slug = 'This URL is already taken. Please choose another.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleNext() {
    if (validate()) {
      // Trigger confetti celebration for completing basic info
      if (!confettiTriggered.current) {
        triggerQuickConfetti({
          colors: ['#9333ea', '#ec4899', '#3b82f6', '#10b981']
        });
        confettiTriggered.current = true;
      }

      // Save organization data IMMEDIATELY so the slug is available for later steps
      if (organization?.id) {
        try {
          const response = await fetch('/api/organizations/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: displayName.trim(),
              slug: slug.trim(),
              requests_header_artist_name: displayName.trim(),
              requests_header_location: location.trim() || null
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to save organization data:', error);
            // Still continue, but log the error
          }
        } catch (error) {
          console.error('Error saving organization data:', error);
          // Non-critical, continue anyway
        }
      }

      // Track step completion
      try {
        await fetch('/api/organizations/update-onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepId: 'basic_info',
            completed: true
          })
        });
      } catch (error) {
        console.error('Failed to track step completion:', error);
        // Non-critical, continue anyway
      }

      onDataUpdate({
        displayName: displayName.trim(),
        location: location.trim(),
        slug: slug.trim()
      });
      onNext();
    }
  }

  const pageUrl = slug ? `tipjar.live/${slug}` : 'tipjar.live/...';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            {hasPreFilledData ? 'Review and update your information' : 'Tell us about yourself'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps} • This takes about 30 seconds
          </p>
          {hasPreFilledData && (
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
              We've pre-filled your information from your page. You can edit any field below.
            </p>
          )}
        </div>

        {/* Display Name Field */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            What should we call you? <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setErrors({ ...errors, displayName: undefined });
            }}
            placeholder="DJ Name or Artist Name"
            className={`w-full px-4 py-3 rounded-lg border ${
              errors.displayName
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500'
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
            maxLength={50}
          />
          {errors.displayName && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.displayName}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This appears on your public requests page
          </p>
        </div>

        {/* URL Slug Preview */}
        {displayName && slug && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Your Page URL
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    const newSlug = generateSlugFromName(e.target.value);
                    setSlug(newSlug);
                    setSlugManuallyEdited(true); // Mark as manually edited
                    onDataUpdate({ slug: newSlug });
                    setErrors({ ...errors, slug: undefined });
                  }}
                  className={`flex-1 min-w-0 px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base ${
                    errors.slug
                      ? 'border-red-500 focus:ring-red-500'
                      : slugAvailable === false
                      ? 'border-red-500 focus:ring-red-500'
                      : slugAvailable === true
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500'
                  } bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2`}
                  placeholder="yourname"
                />
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                  .tipjar.live
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
                {checkingSlug && (
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                )}
                {!checkingSlug && slugAvailable === true && slug.length >= 3 && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
                {!checkingSlug && slugAvailable === false && (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </div>
            </div>
            {errors.slug && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.slug}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Your page will be available at: <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">{pageUrl}</span>
            </p>
          </div>
        )}

        {/* Location Field (Optional) */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Where do you perform? <span className="text-gray-500 text-xs font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              onDataUpdate({ location: e.target.value });
            }}
            placeholder="Memphis, TN"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Helps customers find you locally
          </p>
        </div>

        {/* Navigation - No back button on step 2 to prevent exiting */}
        <div className="flex gap-3 sm:gap-4 justify-end">
          <button
            onClick={handleNext}
            disabled={!displayName.trim() || checkingSlug || slugAvailable === false}
            className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

