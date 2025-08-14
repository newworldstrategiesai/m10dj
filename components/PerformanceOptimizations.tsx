'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function PerformanceOptimizations() {
  useEffect(() => {
    // Preload critical routes for Memphis wedding DJ
    if (typeof window !== 'undefined') {
      const router = (window as any).__NEXT_ROUTER__ || {};
      
      // Preload high-value pages for better UX
      const criticalRoutes = [
        '/memphis-wedding-dj',
        '/memphis-wedding-dj-prices-2025',
        '/services',
        '/contact'
      ];

      criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });

      // Preload critical images that appear above fold
      const criticalImages = [
        '/logo-static.jpg',
        '/assets/m10 dj company logo static.jpg'
      ];

      criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = src;
        link.as = 'image';
        document.head.appendChild(link);
      });

      // Implement intersection observer for lazy loading below-fold content
      if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-lazy]');
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              img.src = img.dataset.lazy || '';
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
      }

      // Web Vitals monitoring disabled to prevent SEO interference
      // TODO: Re-enable after traffic recovery with proper analytics integration
      // if (process.env.NODE_ENV === 'production') {
      //   import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      //     // Send to analytics instead of console.log
      //   });
      // }

      // Image optimization disabled to prevent DOM manipulation during crawling
      // TODO: Implement server-side image optimization instead of client-side
      // const images = document.querySelectorAll('img');
      // images.forEach(img => {
      //   if (!img.loading) {
      //     img.loading = 'lazy';
      //   }
      //   if (!img.decoding) {
      //     img.decoding = 'async';
      //   }
      // });
    }
  }, []);

  return null; // This component doesn't render anything visible
}

// Lazy loading wrapper for heavy components
export function LazyComponent({ 
  children, 
  fallback = <div>Loading...</div>,
  rootMargin = '50px'
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  useEffect(() => {
    // Track page load performance for Memphis wedding DJ pages
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Log performance metrics in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`${entry.name}: ${entry.duration}ms`);
          }
          
          // Send to analytics in production
          if (process.env.NODE_ENV === 'production' && window.gtag) {
            window.gtag('event', 'web_vitals', {
              event_category: 'Performance',
              event_label: entry.name,
              value: Math.round(entry.duration)
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });

      return () => observer.disconnect();
    }
  }, []);
}