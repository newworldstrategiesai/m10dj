'use client';

import { useState } from 'react';

interface AnnualToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
}

export default function AnnualToggle({ isAnnual, onToggle }: AnnualToggleProps) {
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      <span className={`text-lg font-medium ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        Monthly
      </span>
      <button
        onClick={() => onToggle(!isAnnual)}
        className={`relative w-14 h-8 rounded-full transition-colors ${
          isAnnual ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
            isAnnual ? 'transform translate-x-6' : ''
          }`}
        />
      </button>
      <span className={`text-lg font-medium ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        Annual
        <span className="ml-2 text-sm text-green-600 dark:text-green-400">(Save 17%)</span>
      </span>
    </div>
  );
}

