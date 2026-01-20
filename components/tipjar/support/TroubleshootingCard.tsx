'use client';

import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';
import { DashboardLink } from './DashboardLink';

interface Solution {
  step: number;
  action: string;
  details?: string;
}

interface TroubleshootingCardProps {
  issue: string;
  symptoms: string[];
  causes: string[];
  solutions: Solution[];
  severity?: 'low' | 'medium' | 'high';
  className?: string;
  isLoggedIn?: boolean;
}

const severityConfig = {
  low: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  medium: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  high: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
  },
};

export function TroubleshootingCard({
  issue,
  symptoms,
  causes,
  solutions,
  severity = 'medium',
  className,
  isLoggedIn = false,
}: TroubleshootingCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border-2 p-6 md:p-8",
        config.borderColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className={cn("p-2 rounded-lg", config.bgColor)}>
          <Icon className={cn("w-6 h-6", config.color)} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{issue}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">Severity: {severity}</p>
        </div>
      </div>

      {/* Symptoms */}
      {symptoms.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            Symptoms
          </h4>
          <ul className="space-y-1">
            {symptoms.map((symptom, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Causes */}
      {causes.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            Common Causes
          </h4>
          <ul className="space-y-1">
            {causes.map((cause, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Solutions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          Solutions
        </h4>
        <ol className="space-y-3">
          {solutions.map((solution) => (
            <li key={solution.step} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{solution.step}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  <DashboardLink text={solution.action} isLoggedIn={isLoggedIn} />
                </p>
                {solution.details && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <DashboardLink text={solution.details} isLoggedIn={isLoggedIn} />
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
