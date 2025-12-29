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

  useEffect(() => {
    // Only track once per page load and only if we have a request_id
    if (hasTracked.current || !requestId || !router.isReady) {
      return;
    }

    // Track the success page view
    const trackView = async () => {
      try {
        const response = await fetch('/api/crowd-request/track-success-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request_id: requestId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          viewIdRef.current = data.view_id;
          hasTracked.current = true;
          console.log('✅ Success page view tracked:', {
            view_id: data.view_id,
            is_first_view: data.is_first_view
          });
        }
      } catch (error) {
        console.error('Error tracking success page view:', error);
        // Don't block the user if tracking fails
      }
    };

    trackView();
  }, [requestId, router.isReady]);

  // Return the view ID if available
  return viewIdRef.current;
}

