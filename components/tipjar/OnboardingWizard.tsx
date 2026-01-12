'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import WelcomeStep from './onboarding/WelcomeStep';
import BasicInfoStep from './onboarding/BasicInfoStep';
import PaymentSetupStep from './onboarding/PaymentSetupStep';
import CustomizationStep from './onboarding/CustomizationStep';
import QRCodeScreenshotStep from './onboarding/QRCodeScreenshotStep';
import PreviewLaunchStep from './onboarding/PreviewLaunchStep';

export interface OnboardingData {
  displayName: string;
  location: string;
  slug: string;
  paymentSetup: 'completed' | 'skipped' | 'pending';
  logoUrl?: string;
  accentColor?: string;
  minimumBid?: number; // In cents
  showFastTrack?: boolean;
  fastTrackFee?: number; // In cents
  showNextSong?: boolean;
  nextFee?: number; // In cents
}

interface TipJarOnboardingWizardProps {
  organization?: any;
  user?: any;
}

export default function TipJarOnboardingWizard({
  organization,
  user
}: TipJarOnboardingWizardProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    displayName: '',
    location: '',
    slug: '',
    paymentSetup: 'pending'
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Load existing organization data if available
  useEffect(() => {
    if (organization) {
      setOnboardingData(prev => ({
        ...prev,
        displayName: organization.requests_header_artist_name || organization.name || '',
        location: organization.requests_header_location || '',
        slug: organization.slug || '',
        logoUrl: organization.requests_header_logo_url || undefined,
        paymentSetup: organization.stripe_connect_account_id ? 'completed' : 'pending'
      }));
    } else if (user?.email && !onboardingData.displayName) {
      // Auto-suggest display name from email ONLY if display name is not already set
      // Don't set slug here - let BasicInfoStep generate it from display name
      const emailPrefix = user.email.split('@')[0];
      setOnboardingData(prev => ({
        ...prev,
        displayName: emailPrefix || ''
        // Don't set slug - it will be generated from display name in BasicInfoStep
      }));
    }
  }, [organization, user]);

  function generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDataUpdate = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save organization data
      if (organization?.id) {
        const updateData: any = {
          name: onboardingData.displayName || organization.name,
          slug: onboardingData.slug || organization.slug,
          requests_header_artist_name: onboardingData.displayName || organization.requests_header_artist_name || organization.name,
          requests_header_location: onboardingData.location || organization.requests_header_location || null,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Add logo if provided
        if (onboardingData.logoUrl !== undefined) {
          updateData.requests_header_logo_url = onboardingData.logoUrl || null;
        }
        
        // Add customization settings if provided
        if (onboardingData.accentColor) {
          updateData.requests_accent_color = onboardingData.accentColor;
        }
        if (onboardingData.minimumBid !== undefined) {
          updateData.requests_bidding_minimum_bid = onboardingData.minimumBid;
          // Also set as minimum amount for regular requests/tips
          updateData.requests_minimum_amount = onboardingData.minimumBid;
        }
        if (onboardingData.showFastTrack !== undefined) {
          updateData.requests_show_fast_track = onboardingData.showFastTrack;
        }
        if (onboardingData.fastTrackFee !== undefined) {
          updateData.requests_fast_track_fee = onboardingData.fastTrackFee;
        }
        if (onboardingData.showNextSong !== undefined) {
          updateData.requests_show_next_song = onboardingData.showNextSong;
        }
        if (onboardingData.nextFee !== undefined) {
          updateData.requests_next_fee = onboardingData.nextFee;
        }

        // Use the API endpoint to save, which handles validation and user metadata
        const response = await fetch('/api/organizations/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save organization data');
        }

        // Wait a moment for database propagation before redirecting
        await new Promise(resolve => setTimeout(resolve, 500));

        // Also save display name to user metadata (backup, API also does this)
        if (onboardingData.displayName && user?.id) {
          try {
            const { error: userUpdateError } = await supabase.auth.updateUser({
              data: {
                display_name: onboardingData.displayName,
                full_name: onboardingData.displayName
              }
            });
            if (userUpdateError) {
              console.error('Failed to update user metadata with display name:', userUpdateError);
              // Non-critical, continue anyway
            }
          } catch (error) {
            console.error('Error updating user metadata:', error);
            // Non-critical, continue anyway
          }
        }

        // Mark onboarding steps as complete
        try {
          await fetch('/api/organizations/update-onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              allStepsCompleted: true,
              stepId: 'display_name',
              completed: true
            })
          });
        } catch (error) {
          console.error('Failed to track onboarding completion:', error);
          // Non-critical, continue anyway
        }
      }

      // Create dummy data for new users to explore the UI
      try {
        const dummyDataResponse = await fetch('/api/admin/create-dummy-crowd-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (dummyDataResponse.ok) {
          console.log('✅ Dummy data created successfully');
        } else {
          // Non-critical - continue even if dummy data creation fails
          console.log('⚠️ Dummy data creation skipped or failed (non-critical)');
        }
      } catch (error) {
        // Non-critical - continue even if dummy data creation fails
        console.error('Error creating dummy data (non-critical):', error);
      }

      // Redirect to admin dashboard
      router.push('/admin/crowd-requests?onboarding=complete');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still redirect even if save fails (user can fix in dashboard)
      router.push('/admin/crowd-requests');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            onNext={handleNext}
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        );
      case 2:
        return (
          <BasicInfoStep
            data={onboardingData}
            onDataUpdate={handleDataUpdate}
            onNext={handleNext}
            onBack={handleBack}
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
            organization={organization}
          />
        );
      case 3:
        return (
          <PaymentSetupStep
            paymentSetup={onboardingData.paymentSetup}
            onPaymentUpdate={(status) => handleDataUpdate({ paymentSetup: status })}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={() => {
              handleDataUpdate({ paymentSetup: 'skipped' });
              handleNext();
            }}
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
            organization={organization}
          />
        );
      case 4:
        return (
          <CustomizationStep
            data={onboardingData}
            onDataUpdate={handleDataUpdate}
            onNext={handleNext}
            onBack={handleBack}
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
            organization={organization}
          />
        );
      case 5:
        return (
          <QRCodeScreenshotStep
            data={onboardingData}
            onNext={handleNext}
            onBack={handleBack}
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
            organization={organization}
          />
        );
      case 6:
        return (
          <PreviewLaunchStep
            data={onboardingData}
            onComplete={handleComplete}
            onBack={handleBack}
            loading={loading}
            progress={progress}
            currentStep={currentStep}
            totalSteps={totalSteps}
            organization={organization}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-y-auto">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 sticky top-0 z-10">
        <div
          className="bg-purple-600 dark:bg-purple-500 h-1 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Wizard Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12 min-h-full flex items-center">
        <div className="w-full">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

