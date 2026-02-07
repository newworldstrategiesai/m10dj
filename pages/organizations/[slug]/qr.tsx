/**
 * Minimal full-screen QR display page for iPad / large-screen crowd viewing.
 * No header, footer, or navigation - designed for DJs to display on an iPad
 * so crowd members can scan to request songs.
 *
 * URL: tipjar.live/username/qr or m10djcompany.com/username/qr
 *
 * Default (no query params): General all-event catch-all QR -> /{slug}/requests
 * Optional ?event=eventCode: Event-specific QR -> /crowd-request/{eventCode}
 *
 * Every organization has a working QR page at /{slug}/qr by default.
 */

import { useRouter } from 'next/router';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function OrganizationQRDisplayPage() {
  const router = useRouter();
  const { slug } = router.query;
  const eventCodeParam =
    typeof router.query.event === 'string'
      ? router.query.event
      : Array.isArray(router.query.event)
        ? router.query.event[0]
        : null;

  const [mounted, setMounted] = useState(false);
  const [organization, setOrganization] = useState<{ slug: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !slug) return;

    const slugStr = Array.isArray(slug) ? slug[0] : slug;
    if (!slugStr) return;

    async function loadOrg() {
      try {
        const supabase = createClient();
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('slug')
          .eq('slug', slugStr)
          .single();

        if (orgError || !org) {
          setError('Organization not found');
          return;
        }
        // Allow any org with a slug - no subscription gate here.
        // The requests page handles subscription when someone actually submits.
        setOrganization(org);
      } catch (err) {
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    loadOrg();
  }, [mounted, slug]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-pulse text-gray-500 dark:text-gray-400 text-lg">
          Loading…
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">{error || 'Not found'}</p>
      </div>
    );
  }

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || '';

  const requestUrl = eventCodeParam
    ? `${baseUrl}/crowd-request/${encodeURIComponent(eventCodeParam)}?qr=1`
    : `${baseUrl}/${organization.slug}/requests?qr=1`;

  const qrSize = 600;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(requestUrl)}`;

  return (
    <>
      <Head>
        <title>Scan to Request Songs</title>
        <meta name="robots" content="noindex" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center gap-6 max-w-2xl w-full">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white">
            Scan to request Songs
          </h1>
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden bg-white dark:bg-white p-4 shadow-lg"
            style={{ maxWidth: 'min(90vw, 640px)' }}
          >
            <img
              src={qrImageUrl}
              alt="QR code to request songs"
              className="w-full h-auto block"
              width={qrSize}
              height={qrSize}
              decoding="async"
            />
          </div>
        </div>
      </div>
    </>
  );
}
