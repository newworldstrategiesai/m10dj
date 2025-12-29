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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check initial dark mode state
    const checkDarkMode = () => {
      // Check for dark class, data-force-dark attribute, or if we're on a requests page
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const hasForceDark = document.documentElement.getAttribute('data-force-dark') === 'true';
      const isRequestsPage = typeof window !== 'undefined' && 
        (window.location.pathname.includes('/requests') || 
         document.documentElement.getAttribute('data-requests-page') === 'true');
      
      setIsDarkMode(hasDarkClass || hasForceDark || isRequestsPage);
    };
    
    // Check immediately
    checkDarkMode();
    
    // Check again after a short delay to catch late-applied dark mode (like on requests page)
    const initialCheckTimeout = setTimeout(checkDarkMode, 150);
    
    // Watch for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' || 
            mutation.attributeName === 'data-force-dark' ||
            mutation.attributeName === 'data-requests-page') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { 
      attributes: true,
      attributeFilter: ['class', 'data-force-dark', 'data-requests-page']
    });
    
    // Also check periodically to catch any missed changes
    const intervalId = setInterval(checkDarkMode, 200);
    
    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(intervalId);
      observer.disconnect();
    };
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

  // Use white logo in dark mode, regular logo in light mode
  const logoSrc = isDarkMode 
    ? '/assets/m10 dj company logo white.gif'
    : '/M10-Rotating-Logo.gif';
  
  // Bright backdrop for light mode, dark backdrop for dark mode
  const backdropClass = isDarkMode
    ? 'bg-black/75 backdrop-blur-md'
    : 'backdrop-blur-2xl';
  
  const textColorClass = isDarkMode
    ? 'text-white'
    : 'text-gray-900';

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ease-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-label="Loading"
      aria-live="polite"
    >
      {/* Heavenly cloudy white backdrop for light mode */}
      {!isDarkMode && (
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20">
          {/* Cloud layer 1 */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/40 backdrop-blur-3xl"></div>
          {/* Cloud layer 2 */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-white/30 backdrop-blur-2xl"></div>
          {/* Cloud layer 3 - subtle radial gradients for cloud effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.8)_0%,transparent_50%)] backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.6)_0%,transparent_50%)] backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4)_0%,transparent_60%)] backdrop-blur-2xl"></div>
        </div>
      )}
      
      {/* Dark backdrop for dark mode */}
      {isDarkMode && (
        <div className={`absolute inset-0 ${backdropClass}`}></div>
      )}
      <div className="flex flex-col items-center justify-center relative z-10">
        {/* Animated Logo GIF - Centered */}
        <div className="relative w-64 h-64 md:w-96 md:h-96">
          <img
            src={logoSrc}
            alt="M10 DJ Company Loading Animation"
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>

        {/* Loading Message - Optional */}
        {message && (
          <p className={`mt-8 text-lg font-medium ${textColorClass} animate-pulse drop-shadow-lg`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

