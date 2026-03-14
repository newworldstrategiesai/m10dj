/**
 * Door ticket sales page - walk-up event tickets at the door
 * URL: /organizations/[slug]/door
 * Example: tipjar.live/m10djcompany/door
 *
 * Uses Stripe Connect for card payments. Admin configures price and venue in Door Settings.
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClient } from '@/utils/supabase/client';
import { getCoverPhotoUrl } from '../../../utils/cover-photo-helper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DoorPaymentForm = dynamic(() => import('@/components/door/DoorPaymentForm'), { ssr: false });

export default function OrganizationDoorPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [organization, setOrganization] = useState(null);
  const [doorSettings, setDoorSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [purchaserPhone, setPurchaserPhone] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      if (router.isReady) setError('Organization not found');
      return;
    }
    const slugStr = Array.isArray(slug) ? slug[0] : slug;
    if (!slugStr) return;

    async function load() {
      try {
        const supabase = createClient();
        let { data: org } = await supabase
          .from('organizations')
          .select('id, name, slug, requests_cover_photo_url, requests_artist_photo_url, requests_venue_photo_url, requests_primary_cover_source, subscription_status')
          .eq('slug', slugStr)
          .maybeSingle();

        if (!org) {
          const { data: norm } = await supabase.rpc('get_organization_by_normalized_slug', { input_slug: slugStr });
          if (norm?.[0]?.slug) {
            const { data: full } = await supabase.from('organizations').select('id, name, slug, requests_cover_photo_url, requests_artist_photo_url, requests_venue_photo_url, requests_primary_cover_source, subscription_status').eq('slug', norm[0].slug).maybeSingle();
            org = full;
          }
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

        const res = await fetch(`/api/door/settings?slug=${encodeURIComponent(slugStr)}`);
        const data = await res.json();
        if (res.ok) setDoorSettings(data);
      } catch {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug, router.isReady]);

  const venueDisplay = doorSettings?.venue_display || organization?.name || '';
  const priceCents = doorSettings?.price_cents ?? 1500;
  const maxQty = doorSettings?.max_quantity_per_transaction ?? 10;
  const enabled = doorSettings?.enabled ?? false;

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

  const coverUrl = getCoverPhotoUrl(organization);
  const siteName = 'TipJar.Live';
  const siteUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live');
  const currentUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${siteUrl}/${organization.slug}/door`;
  const pageTitle = `${organization.name} – Door Tickets | ${siteName}`;
  const pageDescription = venueDisplay
    ? `Buy door tickets for ${organization.name} at ${venueDisplay}. Walk-up ticket sales.`
    : `Buy door tickets for ${organization.name}. Pay by card at the door.`;
  const ogImageUrl = `${siteUrl}/api/og/door/${encodeURIComponent(organization.slug)}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={currentUrl} />
        {/* Open Graph / Facebook / iPhone SMS Preview */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`Door Tickets – ${organization.name}${venueDisplay ? ` at ${venueDisplay}` : ''}`} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="en_US" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={currentUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:image:alt" content={`Door Tickets – ${organization.name}`} />
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
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
            {success ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground">Payment successful</h2>
                <p className="text-muted-foreground">Your ticket(s) have been purchased. You're all set!</p>
              </div>
            ) : enabled ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">${(priceCents / 100).toFixed(2)} per ticket</p>
                  <p className="text-sm text-muted-foreground">Pay by card at the door</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" required placeholder="Your name" value={purchaserName} onChange={(e) => setPurchaserName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required placeholder="you@example.com" value={purchaserEmail} onChange={(e) => setPurchaserEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" type="tel" placeholder="(555) 123-4567" value={purchaserPhone} onChange={(e) => setPurchaserPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qty">Quantity</Label>
                    <select
                      id="qty"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                    >
                      {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <DoorPaymentForm
                    organizationId={organization.id}
                    quantity={quantity}
                    priceCents={priceCents}
                    purchaserName={purchaserName}
                    purchaserEmail={purchaserEmail}
                    purchaserPhone={purchaserPhone || undefined}
                    onSuccess={() => setSuccess(true)}
                    onError={(msg) => {}}
                  />
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Walk-up ticket sales are not yet configured.</p>
                <p className="text-sm text-muted-foreground">Check back soon!</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
