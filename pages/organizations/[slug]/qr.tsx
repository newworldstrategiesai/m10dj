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
  const [organization, setOrganization] = useState<{
    slug: string;
    qr_display_background?: string | null;
    qr_display_halo_enabled?: boolean | null;
    qr_display_theme_toggle_enabled?: boolean | null;
  } | null>(null);
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
          .select('slug, qr_display_background, qr_display_halo_enabled, qr_display_theme_toggle_enabled')
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

  const useAurora = organization.qr_display_background !== 'plain';
  const showHalo = organization.qr_display_halo_enabled !== false;
  const showThemeToggle = organization.qr_display_theme_toggle_enabled !== false;

  const content = (
    <div className="relative z-10 flex flex-col items-center justify-center gap-6 max-w-2xl w-full px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white drop-shadow-sm">
        Scan to Request Songs
      </h1>

      {/* QR card: gradient border always visible + blurred surge that thickens as it travels */}
      <div
        className="relative flex-shrink-0 qr-card-wrapper"
        style={{ maxWidth: 'min(85vw, 560px)' }}
      >
        {showHalo && (
          <>
            <style>{`
              @keyframes surge-travel {
                to { stroke-dashoffset: 1; }
              }
              .qr-card-wrapper .surge-path {
                stroke-dasharray: 0.14 0.86;
                stroke-dashoffset: 0;
                animation: surge-travel 3s ease-in-out infinite;
              }
            `}</style>
            {/* 1. Base gradient border – always visible, blurry (light behind card) */}
            <div
              className="absolute -inset-4 rounded-3xl z-0 blur-md opacity-90"
              style={{
                background:
                  'conic-gradient(from 0deg, #BC82F3, #F5B9EA, #8D9FFF, #FF6778, #FFBA71, #C686FF, #BC82F3)',
              }}
            />
            {/* 2. Surge – behind card (z-[5]) so blur doesn't bleed onto QR; reads as light behind */}
            <svg
              className="absolute inset-0 z-[5] w-full h-full pointer-events-none rounded-2xl"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="qrSurgeGradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
                  <stop offset="0%" stopColor="#BC82F3" />
                  <stop offset="25%" stopColor="#F5B9EA" />
                  <stop offset="50%" stopColor="#8D9FFF" />
                  <stop offset="75%" stopColor="#FF6778" />
                  <stop offset="100%" stopColor="#FFBA71" />
                </linearGradient>
                <filter id="surge-blur" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                  </feMerge>
                </filter>
              </defs>
              <path
                className="surge-path"
                d="M 5,0 H 95 A 5,5 0 0 1 100,5 V 95 A 5,5 0 0 1 95,100 H 5 A 5,5 0 0 1 0,95 V 5 A 5,5 0 0 1 5,0 Z"
                fill="none"
                stroke="url(#qrSurgeGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                pathLength="1"
                filter="url(#surge-blur)"
              />
            </svg>
          </>
        )}
        <div className="relative z-10 rounded-2xl overflow-hidden bg-white p-5 shadow-2xl ring-1 ring-black/5">
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
  );

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

      {useAurora ? (
        <AuroraBackground className="min-h-screen w-full">
          {content}
          {showThemeToggle && (
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="fixed bottom-5 left-5 z-50 p-2.5 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-black/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
        </AuroraBackground>
      ) : (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
          {content}
          {showThemeToggle && (
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="fixed bottom-5 left-5 z-50 p-2.5 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-black/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
        </div>
      )}
    </>
  );
}
