'use client';

import { LucideIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { StepByStepGuide } from './StepByStepGuide';
import { TroubleshootingCard } from './TroubleshootingCard';
import { cn } from '@/utils/cn';

interface FeatureGuideProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  overview?: string;
  steps?: Array<{
    number: number;
    title: string;
    description: string;
    details?: string[];
    tips?: string[];
    warning?: string;
  }>;
  troubleshooting?: Array<{
    issue: string;
    symptoms: string[];
    causes: string[];
    solutions: Array<{
      step: number;
      action: string;
      details?: string;
    }>;
    severity?: 'low' | 'medium' | 'high';
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  className?: string;
  isLoggedIn?: boolean;
}

export function FeatureGuide({
  id,
  icon: Icon,
  title,
  description,
  overview,
  steps,
  troubleshooting,
  faqs,
  className,
  isLoggedIn = false,
}: FeatureGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      id={id}
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden scroll-mt-20",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          {/* Overview */}
          {overview && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {overview}
              </p>
            </div>
          )}

          {/* Step-by-Step Guide */}
          {steps && steps.length > 0 && (
            <div>
              <StepByStepGuide
                title={`${title} Setup Guide`}
                steps={steps}
                className="border-0 p-0 shadow-none"
                isLoggedIn={isLoggedIn}
              />
            </div>
          )}

          {/* Troubleshooting */}
          {troubleshooting && troubleshooting.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Troubleshooting
              </h4>
              <div className="space-y-4">
                {troubleshooting.map((issue, idx) => (
                  <TroubleshootingCard
                    key={idx}
                    issue={issue.issue}
                    symptoms={issue.symptoms}
                    causes={issue.causes}
                    solutions={issue.solutions}
                    severity={issue.severity || 'medium'}
                    className="border-0 shadow-none"
                    isLoggedIn={isLoggedIn}
                  />
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {faqs && faqs.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h4>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                  >
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {faq.question}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
