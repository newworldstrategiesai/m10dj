'use client';

import React, { useEffect, useState } from 'react';

interface FullScreenLoaderProps {
  isOpen: boolean;
  message?: string;
}

export default function FullScreenLoader({ 
  isOpen, 
  message = 'Loading...' 
}: FullScreenLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center"
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center">
        {/* Animated Logo GIF */}
        <div className="relative w-96 h-96">
          <img
            src="/M10-Rotating-Logo.gif"
            alt="M10 DJ Company Loading Animation"
            className="w-full h-full object-contain"
            loading="eager"
            priority-like
          />
        </div>

        {/* Loading Message */}
        {message && (
          <p className="mt-8 text-lg font-medium text-white dark:text-gray-100 animate-pulse">
            {message}
          </p>
        )}

        {/* Subtle Progress Indicator */}
        <div className="mt-6 flex gap-2">
          <div className="h-2 w-2 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="h-2 w-2 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="h-2 w-2 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

