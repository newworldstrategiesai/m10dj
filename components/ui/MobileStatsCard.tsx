/**
 * MobileStatsCard Component
 * 
 * Mobile-optimized stat cards that display properly on small screens
 * - 2 columns on mobile
 * - 4 columns on desktop
 * - Larger text on mobile for readability
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCard {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  color?: string;
}

interface MobileStatsCardProps {
  stats: StatCard[];
}

export function MobileStatsCard({ stats }: MobileStatsCardProps) {
  const getChangeColor = (type?: string) => {
    switch (type) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const colorClass = stat.color || 'text-purple-600 dark:text-purple-400';

        return (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            {/* Icon */}
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass}`}>
                <Icon className={`w-5 h-5 lg:w-6 lg:h-6 ${colorClass}`} />
              </div>
              {stat.change && (
                <span className={`text-xs lg:text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </span>
              )}
            </div>

            {/* Value */}
            <div className="mb-1">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
            </div>

            {/* Label */}
            <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 font-medium">
              {stat.label}
            </div>

            {/* Optional description */}
            {stat.description && (
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {stat.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MobileStatsCard;

