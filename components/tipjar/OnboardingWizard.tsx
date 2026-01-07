'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import WelcomeStep from './onboarding/WelcomeStep';
import BasicInfoStep from './onboarding/BasicInfoStep';
import PaymentSetupStep from './onboarding/PaymentSetupStep';
import QRCodeScreenshotStep from './onboarding/QRCodeScreenshotStep';
import PreviewLaunchStep from './onboarding/PreviewLaunchStep';

export interface OnboardingData {
  displayName: string;
  location: string;
  slug: string;
  paymentSetup: 'completed' | 'skipped' | 'pending';
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

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Load existing organization data if available
  useEffect(() => {
    if (organization) {
      setOnboardingData(prev => ({
        ...prev,
        displayName: organization.requests_header_artist_name || organization.name || '',
        location: organization.requests_header_location || '',
        slug: organization.slug || '',
        paymentSetup: organization.stripe_connect_account_id ? 'completed' : 'pending'
      }));
    } else if (user?.email) {
      // Auto-suggest display name from email
      const emailPrefix = user.email.split('@')[0];
      setOnboardingData(prev => ({
        ...prev,
        displayName: emailPrefix || '',
        slug: generateSlugFromName(emailPrefix)
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
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            name: onboardingData.displayName,
            slug: onboardingData.slug,
            requests_header_artist_name: onboardingData.displayName,
            requests_header_location: onboardingData.location || null,
            onboarding_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', organization.id);

        if (updateError) throw updateError;

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

      // Redirect to admin dashboard
      router.push('/admin/crowd-requests?onboarding=complete');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still redirect even if save fails
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
      case 5:
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 min-h-full flex items-center">
        <div className="w-full">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

