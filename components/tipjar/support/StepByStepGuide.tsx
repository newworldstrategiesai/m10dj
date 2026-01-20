'use client';

import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Step {
  number: number;
  title: string;
  description: string;
  details?: string[];
  tips?: string[];
  warning?: string;
}

interface StepByStepGuideProps {
  title: string;
  description?: string;
  steps: Step[];
  className?: string;
}

export function StepByStepGuide({ title, description, steps, className }: StepByStepGuideProps) {
  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8", className)}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.number} className="flex gap-4">
            {/* Step Number */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{step.number}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mx-auto mt-2 min-h-[40px]" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 pb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {step.description}
              </p>

              {step.details && step.details.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.tips && step.tips.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-3">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tip:</p>
                  <ul className="space-y-1">
                    {step.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                        <Circle className="w-3 h-3 mt-1 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step.warning && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mt-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">⚠️ {step.warning}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
