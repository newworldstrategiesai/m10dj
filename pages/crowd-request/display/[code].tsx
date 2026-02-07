/**
 * Legacy QR display page - redirects to /[slug]/qr?event=[code].
 * Kept for backwards compatibility with old bookmarks/links.
 * URL: /crowd-request/display/[eventCode]
 */

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CrowdRequestDisplayPage() {
  const router = useRouter();
  const { code } = router.query;
  const [status, setStatus] = useState<'loading' | 'redirect' | 'fallback'>(
    'loading'
  );

  useEffect(() => {
    if (!router.isReady || !code) return;

    const eventCode = Array.isArray(code) ? code[0] : code;
    if (!eventCode) return;

    let cancelled = false;

    async function tryRedirect() {
      try {
        const res = await fetch(
          `/api/crowd-request/find-organization?eventCode=${encodeURIComponent(eventCode)}`
        );
        const data = await res.json();
        if (cancelled || !data?.organizationSlug) {
          setStatus('fallback');
          return;
        }
        setStatus('redirect');
        const baseUrl =
          typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || '';
        window.location.replace(`${baseUrl}/${data.organizationSlug}/qr?event=${encodeURIComponent(eventCode)}`);
      } catch {
        setStatus('fallback');
      }
    }

    tryRedirect();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, code, router]);

  if (status === 'fallback' || status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-pulse text-gray-500 dark:text-gray-400 text-lg">
          {status === 'loading' ? 'Loading…' : 'Organization not found. Use the QR page from your admin dashboard.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="animate-pulse text-gray-500 dark:text-gray-400 text-lg">
        Redirecting…
      </div>
    </div>
  );
}
