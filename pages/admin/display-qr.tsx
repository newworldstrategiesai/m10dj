/**
 * Redirects to the org's QR display page at /{slug}/qr
 * Makes the QR page easily accessible from the admin sidebar without needing slug in the nav.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentOrganization } from '@/utils/organization-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DisplayQRRedirectPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'redirect' | 'error'>(
    'loading'
  );

  useEffect(() => {
    let cancelled = false;

    async function redirectToQR() {
      try {
        const supabase = createClientComponentClient();
        const org = await getCurrentOrganization(supabase);

        if (cancelled) return;

        if (!org?.slug) {
          setStatus('error');
          return;
        }

        setStatus('redirect');
        const baseUrl =
          typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || '';
        window.location.href = `${baseUrl}/${org.slug}/qr`;
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    redirectToQR();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">
          Could not load organization. Please try again or go to Crowd Requests
          to generate your QR.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {status === 'redirect' ? 'Opening QR display…' : 'Loading…'}
        </p>
      </div>
    </div>
  );
}
