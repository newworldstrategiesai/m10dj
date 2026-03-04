'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_TIPJAR_GA_MEASUREMENT_ID;

function isTipJarHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h.includes('tipjar.live') || h.includes('tipjar.com');
}

/**
 * Google Analytics 4 for TipJar.Live only.
 * Loads only when:
 * - NEXT_PUBLIC_TIPJAR_GA_MEASUREMENT_ID is set (e.g. G-XXXXXXXXXX)
 * - Current host is tipjar.live (or tipjar.com)
 *
 * Use this in both Pages Router (_app.js) and App Router (tipjar layout).
 * No-op when not on TipJar domain or when ID is missing.
 */
export default function GoogleAnalyticsTipJar() {
  const [pathname, setPathname] = useState<string | null>(null);
  const [onTipJarDomain, setOnTipJarDomain] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    setOnTipJarDomain(isTipJarHost());
    setPathname(window.location.pathname);
  }, []);

  const shouldLoad = MEASUREMENT_ID && onTipJarDomain;

  // Send page_view on client-side route changes (both routers)
  useEffect(() => {
    if (!shouldLoad || !pathname || typeof window === 'undefined') return;
    if (typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag !== 'function')
      return;

    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('config', MEASUREMENT_ID, {
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname, shouldLoad]);

  if (!MEASUREMENT_ID || !onTipJarDomain) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="tipjar-ga-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
