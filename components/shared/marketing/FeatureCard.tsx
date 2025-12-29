'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import { ReactNode } from 'react';
import { Product } from '@/components/marketing/types';

/**
 * Product color mappings for feature cards
 * These map to Tailwind classes for each product's brand colors
 */
const productColors: Record<Product, { icon: string; hover: string; border: string }> = {
  tipjar: {
    icon: 'text-emerald-500',
    hover: 'hover:border-emerald-500/50',
    border: 'border-emerald-500/20',
  },
  djdash: {
    icon: 'text-blue-500',
    hover: 'hover:border-blue-500/50',
    border: 'border-blue-500/20',
  },
  m10dj: {
    icon: 'text-yellow-500',
    hover: 'hover:border-yellow-500/50',
    border: 'border-yellow-500/20',
  },
};

interface SharedFeatureCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
  /** Product determines the color theme */
  product?: Product;
  /** Custom icon color class (overrides product default) */
  iconColorClass?: string;
  /** Show gradient background on hover */
  gradientHover?: boolean;
}

/**
 * Shared Feature Card Component
 * 
 * A product-aware feature card that automatically applies brand colors
 * based on the product prop. Can be used across TipJar, DJDash, and M10DJ.
 * 
 * @example
 * // TipJar usage
 * <FeatureCard 
 *   product="tipjar"
 *   title="Instant Tips"
 *   description="Get paid instantly"
 *   icon={<DollarSign className="w-8 h-8" />}
 * />
 * 
 * @example
 * // DJDash usage
 * <FeatureCard 
 *   product="djdash"
 *   title="Find DJs"
 *   description="Browse verified professionals"
 *   icon={<Search className="w-8 h-8" />}
 * />
 */
export function FeatureCard({ 
  title, 
  description, 
  icon, 
  className,
  product = 'tipjar',
  iconColorClass,
  gradientHover = false,
}: SharedFeatureCardProps) {
  const colors = productColors[product];
  const iconColor = iconColorClass || colors.icon;
  
  return (
    <Card 
      className={cn(
        "p-6 h-full transition-all duration-300",
        "dark:bg-gray-900 dark:border-gray-800",
        "hover:shadow-lg hover:-translate-y-1",
        colors.hover,
        gradientHover && "hover:bg-gradient-to-br hover:from-gray-50 hover:to-white dark:hover:from-gray-800 dark:hover:to-gray-900",
        className
      )}
    >
      {icon && (
        <div className={cn("mb-4", iconColor)}>
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </Card>
  );
}

export default FeatureCard;

