import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

/**
 * Hook to track success page views
 * @param {string|null} requestId - The request ID from query params
 */
export function useSuccessPageTracking(requestId) {
  const router = useRouter();
  const hasTracked = useRef(false);
  const viewIdRef = useRef(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    // Wrap in try-catch to prevent React errors from blocking tracking
    try {
      // Normalize requestId - handle both string and array (Next.js query params can be arrays)
      const normalizedRequestId = Array.isArray(requestId) ? requestId[0] : requestId;
      
      // Only track once per page load and only if we have a request_id
      if (hasTracked.current) {
        return; // Already tracked successfully, don't track again
      }
      
      if (!normalizedRequestId) {
        // If router is ready but no request_id, log for debugging
        if (router.isReady) {
          console.log('⚠️ [SUCCESS-TRACKING] Router ready but no request_id:', {
            requestId,
            query: router.query,
            pathname: router.pathname
          });
        }
        return;
      }
      
      if (!router.isReady) {
        // Router not ready yet, will retry when it becomes ready
        return;
      }
      
      // Check retry limit
      if (retryCount.current >= MAX_RETRIES) {
        console.error('❌ [SUCCESS-TRACKING] Max retries reached, giving up');
        return;
      }
      
      retryCount.current += 1;

      // Track the success page view
      const trackView = async () => {
      try {
        console.log('🔵 [SUCCESS-TRACKING] Attempting to track success page view:', {
          request_id: normalizedRequestId,
          url: typeof window !== 'undefined' ? window.location.href : 'N/A',
          routerReady: router.isReady
        });
        
        const response = await fetch('/api/crowd-request/track-success-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request_id: normalizedRequestId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          viewIdRef.current = data.view_id;
          hasTracked.current = true; // Only mark as tracked on success
          console.log('✅ [SUCCESS-TRACKING] Success page view tracked:', {
            view_id: data.view_id,
            is_first_view: data.is_first_view
          });
        } else {
          // Log error response details
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('❌ [SUCCESS-TRACKING] Failed to track success page view:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            retryCount: retryCount.current,
            maxRetries: MAX_RETRIES
          });
          // Don't mark as tracked - will retry if under limit
        }
      } catch (error) {
        console.error('❌ [SUCCESS-TRACKING] Error tracking success page view:', {
          error: error.message,
          stack: error.stack,
          request_id: normalizedRequestId,
          retryCount: retryCount.current,
          maxRetries: MAX_RETRIES
        });
        // Don't mark as tracked - will retry if under limit
        // Don't block the user if tracking fails
      }
    };

      trackView();
    } catch (error) {
      // Catch any errors that might prevent tracking from running
      console.error('❌ [SUCCESS-TRACKING] Error in tracking hook setup:', error);
      // Still try to track even if there's an error
      const normalizedRequestId = Array.isArray(requestId) ? requestId[0] : requestId;
      if (normalizedRequestId && !hasTracked.current) {
        // Direct fetch as last resort
        fetch('/api/crowd-request/track-success-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: normalizedRequestId }),
        }).catch(err => console.error('❌ [SUCCESS-TRACKING] Fallback tracking also failed:', err));
      }
    }
  }, [requestId, router.isReady, router.query]);

  // Return the view ID if available
  return viewIdRef.current;
}

