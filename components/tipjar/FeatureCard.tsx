'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

export function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  return (
    <Card className={cn("p-6 h-full hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-800", className)}>
      {icon && (
        <div className="mb-4 text-tipjar-primary-500">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold mb-2 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </Card>
  );
}

