/**
 * Onboarding Wizard Component
 * 
 * Multi-step onboarding flow with progress tracking
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from 'lucide-react';

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<OnboardingStepProps>;
  canSkip?: boolean;
  required?: boolean;
}

export interface OnboardingStepProps {
  organization: any;
  onComplete: () => void;
  onSkip?: () => void;
  onNext: () => void;
  onBack: () => void;
  isActive: boolean;
}

interface OnboardingWizardProps {
  organization: any;
  steps: OnboardingStep[];
  onComplete?: () => void;
  initialStep?: number;
  completedSteps?: string[];
}

export default function OnboardingWizard({
  organization,
  steps,
  onComplete,
  initialStep = 0,
  completedSteps = []
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completed, setCompleted] = useState<Set<string>>(new Set(completedSteps));
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData.component;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps complete
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = async () => {
    const newCompleted = new Set(completed);
    newCompleted.add(currentStepData.id);
    setCompleted(newCompleted);
    
    // Save progress to database
    try {
      await fetch('/api/organizations/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: currentStepData.id,
          completed: true
        })
      });
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
    
    handleNext();
  };

  const handleSkip = () => {
    if (currentStepData.canSkip) {
      const newSkipped = new Set(skipped);
      newSkipped.add(currentStepData.id);
      setSkipped(newSkipped);
      handleNext();
    }
  };

  const handleComplete = async () => {
    // Mark all steps as complete
    const allStepIds = steps.map(s => s.id);
    const allCompleted = new Set<string>();
    allStepIds.forEach(id => allCompleted.add(id));
    setCompleted(allCompleted);
    
    // Save completion to database
    try {
      await fetch('/api/organizations/update-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allStepsCompleted: true
        })
      });
    } catch (error) {
      console.error('Failed to save onboarding completion:', error);
    }
    
    onComplete?.();
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
      // Scroll to active step on mobile
      if (stepRefs.current[index] && carouselRef.current) {
        const stepElement = stepRefs.current[index];
        const carousel = carouselRef.current;
        const stepLeft = stepElement.offsetLeft;
        const stepWidth = stepElement.offsetWidth;
        const carouselWidth = carousel.offsetWidth;
        const scrollPosition = stepLeft - (carouselWidth / 2) + (stepWidth / 2);
        
        carousel.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  // Auto-scroll to active step when step changes
  useEffect(() => {
    if (stepRefs.current[currentStep] && carouselRef.current) {
      const stepElement = stepRefs.current[currentStep];
      const carousel = carouselRef.current;
      const stepLeft = stepElement.offsetLeft;
      const stepWidth = stepElement.offsetWidth;
      const carouselWidth = carousel.offsetWidth;
      const scrollPosition = stepLeft - (carouselWidth / 2) + (stepWidth / 2);
      
      carousel.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentStep]);

  const isStepCompleted = (stepId: string) => completed.has(stepId);
  const isStepSkipped = (stepId: string) => skipped.has(stepId);
  const isStepActive = (index: number) => index === currentStep;

  return (
    <div className="w-full max-w-4xl mx-auto overflow-x-hidden">
      {/* Progress Bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators - Desktop: Full width, Mobile: Scrollable carousel */}
      <div className="mb-6 sm:mb-8">
        {/* Desktop: Full width layout */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => goToStep(index)}
                className={`flex flex-col items-center flex-1 min-w-0 ${
                  isStepActive(index)
                    ? 'text-purple-600 dark:text-purple-400'
                    : isStepCompleted(step.id)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all flex-shrink-0 ${
                    isStepActive(index)
                      ? 'bg-purple-600 text-white scale-110'
                      : isStepCompleted(step.id)
                      ? 'bg-green-600 text-white'
                      : isStepSkipped(step.id)
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {isStepCompleted(step.id) ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="font-semibold text-sm">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-center max-w-[80px] truncate">
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 min-w-0 ${
                    isStepCompleted(step.id) || currentStep > index
                      ? 'bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Scrollable carousel */}
        <div 
          ref={carouselRef}
          className="md:hidden overflow-x-auto overflow-y-hidden -mx-4 px-4 pb-2 scrollbar-hide scroll-smooth-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex items-center gap-4 min-w-max py-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                ref={(el) => { stepRefs.current[index] = el; }}
                onClick={() => goToStep(index)}
                className={`flex flex-col items-center gap-2 min-w-[80px] flex-shrink-0 ${
                  isStepActive(index)
                    ? 'text-purple-600 dark:text-purple-400'
                    : isStepCompleted(step.id)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
                aria-label={`Step ${index + 1}: ${step.title}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isStepActive(index)
                      ? 'bg-purple-600 text-white scale-110 ring-4 ring-purple-200 dark:ring-purple-900'
                      : isStepCompleted(step.id)
                      ? 'bg-green-600 text-white'
                      : isStepSkipped(step.id)
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {isStepCompleted(step.id) ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="font-semibold text-sm">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-center whitespace-nowrap">
                  {step.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 min-h-[400px] overflow-x-hidden">
        <CurrentStepComponent
          organization={organization}
          onComplete={handleStepComplete}
          onSkip={currentStepData.canSkip ? handleSkip : undefined}
          onNext={handleNext}
          onBack={handleBack}
          isActive={true}
        />
      </div>

      {/* Navigation */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {currentStepData.canSkip && (
            <button
              onClick={handleSkip}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Skip for Now
            </button>
          )}
          <button
            onClick={handleNext}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

