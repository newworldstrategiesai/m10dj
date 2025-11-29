'use client';

import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps = [],
  className,
  showLabels = true,
  orientation = 'horizontal',
}: ProgressIndicatorProps) {
  const isCompleted = (index: number) => completedSteps.includes(index) || index < currentStep;
  const isCurrent = (index: number) => index === currentStep;

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col space-y-4', className)} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label={`Step ${currentStep + 1} of ${steps.length}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  isCompleted(index)
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent(index)
                    ? 'bg-brand border-brand text-white'
                    : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                )}
                aria-current={isCurrent(index) ? 'step' : undefined}
              >
                {isCompleted(index) ? (
                  <CheckCircle className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 mt-2',
                    isCompleted(index) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="flex-1 pt-1">
              {showLabels && (
                <>
                  <div
                    className={cn(
                      'font-semibold text-sm',
                      isCurrent(index)
                        ? 'text-gray-900 dark:text-white'
                        : isCompleted(index)
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {step.description}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label={`Step ${currentStep + 1} of ${steps.length}`}>
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <button
              type="button"
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
                isCompleted(index)
                  ? 'bg-green-500 border-green-500 text-white'
                  : isCurrent(index)
                  ? 'bg-brand border-brand text-white scale-110'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              )}
              aria-current={isCurrent(index) ? 'step' : undefined}
              aria-label={`${step.label}${isCurrent(index) ? ' (current step)' : isCompleted(index) ? ' (completed)' : ''}`}
              disabled={!isCurrent(index) && !isCompleted(index)}
            >
              {isCompleted(index) ? (
                <CheckCircle className="w-6 h-6" aria-hidden="true" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </button>
            {showLabels && (
              <div className="mt-2 text-center max-w-[100px]">
                <div
                  className={cn(
                    'text-xs font-medium',
                    isCurrent(index)
                      ? 'text-gray-900 dark:text-white'
                      : isCompleted(index)
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                    {step.description}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

