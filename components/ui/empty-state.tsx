'use client';

import { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    href?: string;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {children && <div className="mb-6">{children}</div>}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            action.href ? (
              <a
                href={action.href}
                className="btn-primary"
                aria-label={action.label}
              >
                {action.label}
              </a>
            ) : (
              <Button
                onClick={action.onClick}
                className="btn-primary"
                aria-label={action.label}
              >
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <a
                href={secondaryAction.href}
                className="btn-outline"
                aria-label={secondaryAction.label}
              >
                {secondaryAction.label}
              </a>
            ) : (
              <Button
                onClick={secondaryAction.onClick}
                variant="outline"
                className="btn-outline"
                aria-label={secondaryAction.label}
              >
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

