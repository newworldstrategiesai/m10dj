'use client';

import React from 'react';
import Script from 'next/script';
import Head from 'next/head';
import Image from 'next/image';

// Mobile Performance Optimization Component
// Based on latest 2024 Core Web Vitals research and best practices

export const CriticalResourceHints = () => (
  <Head>
    {/* DNS Prefetch for external domains */}
    <link rel="dns-prefetch" href="//fonts.googleapis.com" />
    <link rel="dns-prefetch" href="//fonts.gstatic.com" />
    <link rel="dns-prefetch" href="//www.googletagmanager.com" />
    
    {/* Preconnect to critical external resources */}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    
    {/* Preload critical assets */}
    <link rel="preload" href="/logo-static.jpg" as="image" type="image/jpeg" />
    
    {/* Resource hints for mobile optimization */}
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    
    {/* Optimize for mobile performance */}
    <meta name="format-detection" content="telephone=no" />
    <meta name="msapplication-tap-highlight" content="no" />
    
    {/* Critical CSS is now in styles/critical-mobile.css */}
  </Head>
);

export const OptimizedScriptLoader = ({ children }) => (
  <>
    {/* Critical scripts with optimized loading strategies */}
    <Script
      id="web-vitals-polyfill"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          // Web Vitals polyfill for older browsers
          if (!('PerformanceObserver' in window)) {
            const script = document.createElement('script');
            script.src = 'https://polyfill.io/v3/polyfill.min.js?features=PerformanceObserver';
            script.async = true;
            document.head.appendChild(script);
          }
        `
      }}
    />
    
    {/* Performance monitoring */}
    <Script
      id="performance-monitor"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          // Monitor Core Web Vitals
          function reportWebVitals(metric) {
            // Send to analytics
            if (typeof gtag !== 'undefined') {
              gtag('event', metric.name, {
                value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                event_category: 'Web Vitals',
                event_label: metric.id,
                non_interaction: true,
              });
            }
          }
          
          // Load web vitals library
          import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB, getINP }) => {
            getCLS(reportWebVitals);
            getFID ? getFID(reportWebVitals) : getINP(reportWebVitals);
            getFCP(reportWebVitals);
            getLCP(reportWebVitals);
            getTTFB(reportWebVitals);
          });
        `
      }}
    />
    
    {children}
  </>
);

export const MobileImageOptimizer = ({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
}) => {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${width}/${height}` }}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        quality={85}
        className="object-cover"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </div>
  );
};

export const LazySection = ({ children, threshold = 0.1, rootMargin = "50px" }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={ref}>
      {isVisible ? children : <div style={{ height: '200px' }} />}
    </div>
  );
};

export const OptimizedButton = ({ onClick, children, className = "", ...props }) => {
  const handleClick = React.useCallback((e) => {
    // Optimize for INP - use requestIdleCallback for non-critical work
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => onClick?.(e));
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => onClick?.(e), 0);
    }
  }, [onClick]);

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`${className} touch-manipulation`}
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        ...props.style
      }}
    >
      {children}
    </button>
  );
};

// Service Worker registration for caching
export const ServiceWorkerManager = () => {
  React.useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return null;
};

// Performance budget monitor
export const PerformanceBudgetMonitor = () => {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Monitor long tasks that could hurt INP
          if (entry.entryType === 'longtask' && entry.duration > 50) {
            console.warn('Long task detected:', entry.duration + 'ms');
          }
          
          // Monitor layout shifts
          if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            console.warn('Layout shift detected:', entry.value);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask', 'layout-shift'] });

      return () => observer.disconnect();
    }
  }, []);

  return null;
};

export default {
  CriticalResourceHints,
  OptimizedScriptLoader,
  MobileImageOptimizer,
  LazySection,
  OptimizedButton,
  ServiceWorkerManager,
  PerformanceBudgetMonitor
};