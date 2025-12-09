import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

/**
 * Hook to track QR code scans
 * @param {string} eventQrCode - The QR code identifier (event code or 'public')
 * @param {string|null} organizationId - Optional organization ID
 */
export function useQRScanTracking(eventQrCode, organizationId = null) {
  const router = useRouter();
  const hasTracked = useRef(false);
  const scanIdRef = useRef(null);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current || !eventQrCode) {
      return;
    }

    // Track the scan
    const trackScan = async () => {
      try {
        const referrer = typeof window !== 'undefined' ? document.referrer : null;
        
        const response = await fetch('/api/qr-scan/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_qr_code: eventQrCode,
            organization_id: organizationId,
            referrer: referrer
          }),
        });

        if (response.ok) {
          const data = await response.json();
          scanIdRef.current = data.scan_id;
          
          // Store scan ID and session ID in sessionStorage for linking to request
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('qr_scan_id', data.scan_id);
            sessionStorage.setItem('qr_session_id', data.session_id);
            sessionStorage.setItem('qr_event_code', eventQrCode);
          }
          
          hasTracked.current = true;
        }
      } catch (error) {
        console.error('Error tracking QR scan:', error);
        // Don't block the user if tracking fails
      }
    };

    trackScan();
  }, [eventQrCode, organizationId]);

  // Return the scan ID if available
  return scanIdRef.current;
}

