'use client';

import React, { useEffect, useState } from 'react';

interface FullScreenLoaderProps {
  isOpen: boolean;
  message?: string;
  onFadeComplete?: () => void;
}

export default function FullScreenLoader({ 
  isOpen, 
  message,
  onFadeComplete
}: FullScreenLoaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsFading(false);
    } else if (shouldRender) {
      // Start fade out
      setIsFading(true);
      // Remove from DOM after fade completes
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsFading(false);
        onFadeComplete?.();
      }, 800); // Match fade duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, onFadeComplete]);

  if (!mounted || !shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center transition-opacity duration-700 ease-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center relative z-10">
        {/* Animated Logo GIF - Centered */}
        <div className="relative w-64 h-64 md:w-96 md:h-96">
          <img
            src="/M10-Rotating-Logo.gif"
            alt="M10 DJ Company Loading Animation"
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>

        {/* Loading Message - Optional */}
        {message && (
          <p className="mt-8 text-lg font-medium text-white animate-pulse drop-shadow-lg">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

