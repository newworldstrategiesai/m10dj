import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import FullScreenLoader to avoid SSR issues
const FullScreenLoader = dynamic(() => import('@/components/ui/FullScreenLoader'), {
  ssr: false,
});

/**
 * Reusable loading spinner component
 * For full-screen loading, uses M10 DJ Company rotating logo
 * For inline loading, shows a simple spinner
 */
const LoadingSpinner = React.memo(({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  fullScreen = false 
}) => {
  // For full-screen loading, use the M10 logo loader
  if (fullScreen) {
    return <FullScreenLoader isOpen={true} message={text} />;
  }

  // For inline loading, show a simple centered spinner
  // This maintains backward compatibility for non-fullscreen cases
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-[#fcba00] border-t-transparent rounded-full animate-spin`} />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;

