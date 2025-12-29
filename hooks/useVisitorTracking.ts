/**
 * React hook for visitor tracking
 * 
 * Automatically tracks page views and manages visitor sessions
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  trackPageView,
  getVisitorSession,
  setVisitorId,
  getStoredVisitorId,
  linkVisitorToContact,
} from '@/utils/visitor-tracking';

interface UseVisitorTrackingOptions {
  /**
   * Organization ID for multi-tenant tracking (e.g., M10 DJ Company's ID)
   */
  organizationId?: string;
  
  /**
   * Whether to track this page (default: true)
   */
  enabled?: boolean;
  
  /**
   * Skip tracking on admin pages (default: true)
   */
  skipAdminPages?: boolean;
}

/**
 * Hook to track page views automatically
 * 
 * @example
 * ```tsx
 * function MyPage() {
 *   useVisitorTracking({ organizationId: 'm10dj-org-id' });
 *   return <div>My Page Content</div>;
 * }
 * ```
 */
export function useVisitorTracking(options: UseVisitorTrackingOptions = {}) {
  const {
    organizationId,
    enabled = true,
    skipAdminPages = true,
  } = options;

  const router = useRouter();
  const hasTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const path = router.asPath || window.location.pathname;
    
    // Skip admin pages if configured
    if (skipAdminPages && path.startsWith('/admin')) return;

    // Don't track the same page twice (prevents double tracking on re-renders)
    if (hasTrackedRef.current === path) return;
    hasTrackedRef.current = path;

    // Track the page view
    trackPageView(organizationId);

    // Reset the tracked path when the route changes
    const handleRouteChange = () => {
      hasTrackedRef.current = null;
    };

    router.events.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.asPath, organizationId, enabled, skipAdminPages, router.events]);

  return {
    /**
     * Get the current visitor ID (may be null if not yet assigned)
     */
    getVisitorId: getStoredVisitorId,
    
    /**
     * Get visitor session info
     */
    getSession: getVisitorSession,
    
    /**
     * Link the current visitor to contact info
     * Call this when the user provides their email/phone
     */
    linkToContact: linkVisitorToContact,
  };
}

/**
 * Hook to get visitor ID for form submissions
 * 
 * @example
 * ```tsx
 * function ContactForm() {
 *   const { visitorId, linkToContact } = useVisitorId();
 *   
 *   const handleSubmit = async (data) => {
 *     await submitForm({ ...data, visitor_id: visitorId });
 *     await linkToContact({ email: data.email, name: data.name });
 *   };
 * }
 * ```
 */
export function useVisitorId() {
  const visitorId = getStoredVisitorId();

  return {
    visitorId,
    linkToContact: linkVisitorToContact,
    setVisitorId,
  };
}

export default useVisitorTracking;

