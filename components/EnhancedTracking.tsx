'use client';

import { useEffect } from 'react';
import { trackEvent as collectEvent } from '../utils/analytics-collector';

// Enhanced tracking utilities for M10 DJ Company
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  // Collect for admin dashboard
  if (typeof window !== 'undefined') {
    collectEvent(eventName, parameters);
  }

  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: parameters?.category || 'engagement',
      event_label: parameters?.label,
      value: parameters?.value,
      ...parameters
    });
  }

  // Facebook Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, parameters);
  }
};

// Business-specific tracking functions
export const trackLead = (leadType: string, additionalData?: Record<string, any>) => {
  trackEvent('generate_lead', {
    category: 'lead_generation',
    lead_type: leadType,
    ...additionalData
  });
};

export const trackServiceInterest = (serviceType: string, location?: string) => {
  trackEvent('view_item', {
    category: 'service_interest',
    item_name: serviceType,
    item_category: 'dj_services',
    location: location
  });
};

export const trackContactAction = (actionType: 'phone' | 'email' | 'form', method?: string) => {
  trackEvent('contact', {
    category: 'contact_action',
    method: actionType,
    contact_method: method
  });
};

export const trackPriceInterest = (priceRange?: string, serviceType?: string) => {
  trackEvent('view_pricing', {
    category: 'pricing_interest',
    price_range: priceRange,
    service_type: serviceType
  });
};

// Enhanced tracking component
const EnhancedTracking = () => {
  useEffect(() => {
    // Track initial page engagement
    const handleScroll = () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      
      // Track meaningful scroll milestones
      if (scrollPercent === 25) {
        trackEvent('scroll', { category: 'engagement', label: '25_percent' });
      } else if (scrollPercent === 50) {
        trackEvent('scroll', { category: 'engagement', label: '50_percent' });
      } else if (scrollPercent === 75) {
        trackEvent('scroll', { category: 'engagement', label: '75_percent' });
      }
    };

    // Track time on site
    const startTime = Date.now();
    const trackTimeOnSite = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent >= 30) {
        trackEvent('engagement_time', { 
          category: 'engagement', 
          value: timeSpent,
          label: 'engaged_user'
        });
      }
    };

    // Set up event listeners
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll);
    
    // Track engagement after 30 seconds
    const timeoutId = setTimeout(trackTimeOnSite, 30000);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeoutId);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return null;
};

// Declare gtag and fbq for TypeScript
declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
    fbq: (command: string, eventName: string, parameters?: any) => void;
  }
}

export default EnhancedTracking;