/**
 * Minimal full-screen QR display page for iPad / large-screen crowd viewing.
 * No header, footer, navigation, or chat widget - designed for DJs to display
 * on an iPad so crowd members can scan to request songs.
 *
 * Features:
 * - Aurora animated background
 * - Light/dark mode toggle (bottom-left, non-intrusive)
 * - Clean, distraction-free layout
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
import { useTheme } from 'next-themes';
import { createClient } from '@/utils/supabase/client';
import { AuroraBackground } from '@/components/ui/shadcn-io/aurora-background';
import { Sun, Moon } from 'lucide-react';

export default function OrganizationQRDisplayPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { theme, setTheme, resolvedTheme } = useTheme();
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
        setOrganization(org);
      } catch (err) {
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    loadOrg();
  }, [mounted, slug]);

  const isDark = mounted && resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-pulse text-gray-500 dark:text-gray-400 text-lg">
          Loading…
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
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

      <AuroraBackground className="min-h-screen w-full">
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 max-w-2xl w-full px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white drop-shadow-sm">
            Scan to Request Songs
          </h1>

          {/* Halo wrapper - Siri-like glowing border */}
          <div
            className="relative flex-shrink-0"
            style={{ maxWidth: 'min(85vw, 560px)' }}
          >
            {/* Spinning glow layer */}
            <div
              className="absolute -inset-1 rounded-3xl opacity-60 dark:opacity-75 blur-xl animate-spin-slow"
              style={{
                background:
                  'conic-gradient(from 0deg, #ff6b6b, #c084fc, #60a5fa, #34d399, #fbbf24, #f472b6, #ff6b6b)',
              }}
            />
            {/* QR card on top */}
            <div className="relative rounded-2xl overflow-hidden bg-white p-5 shadow-2xl ring-1 ring-black/5">
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

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center font-medium opacity-80">
            Point your camera at the QR code to get started
          </p>
        </div>

        {/* Theme Toggle - Bottom Left, Non-Intrusive */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="fixed bottom-5 left-5 z-50 p-2.5 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-black/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          {isDark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </AuroraBackground>
    </>
  );
}
