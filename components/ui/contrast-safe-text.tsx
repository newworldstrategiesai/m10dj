'use client';

import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ContrastSafeTextProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'large';
  background?: 'light' | 'dark';
}

/**
 * Component that ensures text color meets WCAG AA contrast requirements
 * Automatically uses darker brand color on light backgrounds
 */
export function ContrastSafeText({
  children,
  className,
  variant = 'default',
  background = 'light',
}: ContrastSafeTextProps) {
  const textColorClass =
    background === 'light'
      ? variant === 'large'
        ? 'text-brand-700' // brand-700 for large text on light
        : 'text-brand-800' // brand-800 for normal text on light (WCAG AA)
      : 'text-brand'; // brand-500 for dark backgrounds

  return (
    <span className={cn(textColorClass, className)}>
      {children}
    </span>
  );
}

