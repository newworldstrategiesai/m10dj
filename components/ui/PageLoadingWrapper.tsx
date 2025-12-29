'use client';

import React, { useEffect, useState } from 'react';
import FullScreenLoader from './FullScreenLoader';

interface PageLoadingWrapperProps {
  children: React.ReactNode;
  isLoading: boolean;
  message?: string;
  minLoadTime?: number; // Minimum time to show loader (ms) for smoother UX
}

/**
 * Wrapper component for pages that need full-screen loading with fade-out
 * Shows M10 DJ Company rotating logo on semi-transparent overlay
 * Displays blurred page skeleton below the overlay
 * Fades away smoothly when loading completes
 */
export default function PageLoadingWrapper({ 
  children, 
  isLoading, 
  message,
  minLoadTime = 500 
}: PageLoadingWrapperProps) {
  const [showLoader, setShowLoader] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      // Wait for minimum load time, then fade out
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, remaining);
      
      return () => clearTimeout(timer);
    } else {
      setShowLoader(true);
    }
  }, [isLoading, minLoadTime, startTime]);

  return (
    <>
      {/* Page content - always visible but blurred when loading */}
      <div className={showLoader ? 'blur-sm opacity-90' : 'blur-0 opacity-100 transition-all duration-700 ease-out'}>
        {children}
      </div>
      {/* Loading overlay - semi-transparent with logo */}
      <FullScreenLoader 
        isOpen={showLoader} 
        message={message}
      />
    </>
  );
}

