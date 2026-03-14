/**
 * Door ticket sales page - walk-up event tickets at the door
 * URL: /organizations/[slug]/door
 * Example: tipjar.live/m10djcompany/door
 *
 * Uses existing Stripe Connect payment infrastructure.
 * Admin configures door price and venue/location in Door settings.
 *
 * Loads org via client Supabase (same as requests page) to avoid API 404 issues
 * that can occur with relative fetch on some deployments.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@/utils/supabase/client';
import { getCoverPhotoUrl } from '../../../utils/cover-photo-helper';

export default function OrganizationDoorPage() {
  const router = useRouter();
  const { slug } = router.query;
  const supabase = useMemo(() => createClient(), []);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      if (router.isReady) setError('Organization not found');
      return;
    }

    const slugStr = Array.isArray(slug) ? slug[0] : slug;
    if (!slugStr) return;

    async function loadOrganization() {
      try {
        let { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, slug, cover_photo_path, subscription_status')
          .eq('slug', slugStr)
          .maybeSingle();

        if (!org && !orgError) {
          const { data: normalizedOrgs } = await supabase
            .rpc('get_organization_by_normalized_slug', { input_slug: slugStr });
          if (normalizedOrgs?.[0]?.slug) {
            const { data: fullOrg } = await supabase
              .from('organizations')
              .select('id, name, slug, cover_photo_path, subscription_status')
              .eq('slug', normalizedOrgs[0].slug)
              .maybeSingle();
            org = fullOrg;
          }
        }

        if (orgError) {
          setError('Organization not found');
          return;
        }
        if (!org) {
          setError('Organization not found');
          return;
        }
        if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
          setError('This organization is not currently active');
          return;
        }

        setOrganization(org);
      } catch {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [slug, router.isReady, supabase]);

  // door_settings (venue_display, price_cents) will come from migration + admin UI
  const venueDisplay = organization?.name || '';
  const doorPrice = null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
        <h1 className="text-xl font-semibold text-foreground mb-2">Page not available</h1>
        <p className="text-muted-foreground">{error || 'Organization not found'}</p>
      </div>
    );
  }

  const coverUrl = getCoverPhotoUrl(organization.cover_photo_path);
  const siteName = 'TipJar.Live';

  return (
    <>
      <Head>
        <title>{organization.name} – Door Tickets | {siteName}</title>
        <meta name="description" content={`Buy door tickets for ${organization.name}${venueDisplay ? ` at ${venueDisplay}` : ''}`} />
        <meta property="og:title" content={`${organization.name} – Door Tickets`} />
        <meta property="og:description" content={`Buy walk-up tickets at the door${venueDisplay ? ` – ${venueDisplay}` : ''}`} />
        {coverUrl && <meta property="og:image" content={coverUrl} />}
      </Head>

      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <header className="relative overflow-hidden">
          {coverUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coverUrl})` }}
            />
          )}
          <div className="relative bg-black/40 dark:bg-black/50 px-4 py-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow">
              {organization.name}
            </h1>
            {venueDisplay && (
              <p className="mt-2 text-lg text-white/90 drop-shadow">{venueDisplay}</p>
            )}
            <p className="mt-1 text-white/80 drop-shadow">Door tickets</p>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-8">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Walk-up ticket sales are coming soon.
            </p>
            {doorPrice != null && (
              <p className="text-lg font-semibold">
                ${(doorPrice).toFixed(2)} per ticket
              </p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
