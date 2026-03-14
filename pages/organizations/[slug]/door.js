/**
 * Door ticket sales page - walk-up event tickets at the door
 * URL: /organizations/[slug]/door
 * Example: tipjar.live/m10djcompany/door
 *
 * Uses Stripe Connect for card payments. Admin configures price and venue in Door Settings.
 */

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { loadStripe } from '@stripe/stripe-js';
import { triggerConfetti } from '@/utils/confetti';
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
  const [successData, setSuccessData] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [priceEditing, setPriceEditing] = useState(false);
  const [priceSavePending, setPriceSavePending] = useState(false);
  const [priceSaveMsg, setPriceSaveMsg] = useState(null);
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [purchaserPhone, setPurchaserPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const confettiTriggered = useRef(false);

  useEffect(() => {
    if (success && !successData?.recordSaleFailed && !confettiTriggered.current) {
      confettiTriggered.current = true;
      triggerConfetti();
    }
  }, [success, successData?.recordSaleFailed]);

  // Handle return from 3DS redirect (Stripe appends payment_intent_client_secret to URL)
  useEffect(() => {
    if (!router.isReady || success) return;
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const clientSecret = params.get('payment_intent_client_secret');
    const status = params.get('redirect_status');
    if (!clientSecret || status !== 'succeeded') return;

    (async () => {
      try {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
        if (!stripe) return;
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
        if (paymentIntent?.status !== 'succeeded') return;

        const res = await fetch('/api/door/record-sale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success) {
          setSuccessData({
            paymentIntentId: paymentIntent.id,
            ticketId: data.ticketId,
            qrCode: data.qrCode,
            receiptSent: data.receiptSent,
          });
          setSuccess(true);
        } else {
          setSuccessData({ paymentIntentId: paymentIntent.id, recordSaleFailed: true });
          setSuccess(true);
        }
        window.history.replaceState({}, '', window.location.pathname);
      } catch (e) {
        console.error('[door] 3DS return handler:', e);
      }
    })();
  }, [router.isReady, success]);

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
        const [orgResult, settingsRes] = await Promise.all([
          (async () => {
            let { data: org } = await supabase
              .from('organizations')
              .select('id, name, slug, owner_id, requests_cover_photo_url, requests_artist_photo_url, requests_venue_photo_url, requests_primary_cover_source, subscription_status')
              .eq('slug', slugStr)
              .maybeSingle();
            if (!org) {
              const { data: norm } = await supabase.rpc('get_organization_by_normalized_slug', { input_slug: slugStr });
              if (norm?.[0]?.slug) {
                const { data: full } = await supabase.from('organizations').select('id, name, slug, owner_id, requests_cover_photo_url, requests_artist_photo_url, requests_venue_photo_url, requests_primary_cover_source, subscription_status').eq('slug', norm[0].slug).maybeSingle();
                return full;
              }
            }
            return org;
          })(),
          fetch(`/api/door/settings?slug=${encodeURIComponent(slugStr)}`),
        ]);

        const org = orgResult;
        if (!org) {
          setError('Organization not found');
          return;
        }
        if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
          setError('This organization is not currently active');
          return;
        }

        setOrganization(org);

        const settingsData = await settingsRes.json();
        if (settingsRes.ok) setDoorSettings(settingsData);

        const { data: { user } } = await supabase.auth.getUser();
        setIsOwner(!!(user && org.owner_id === user.id));
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

  const handlePriceSave = async (newCents) => {
    if (!organization || !isOwner) return;
    const cents = Math.round(Math.max(50, Math.min(99999, newCents)));
    setPriceSavePending(true);
    try {
      const supabase = createClient();
      const ds = doorSettings || {};
      const { error } = await supabase
        .from('organizations')
        .update({
          door_settings: {
            enabled: ds.enabled !== false,
            price_cents: cents,
            venue_display: ds.venue_display?.trim() || null,
            max_quantity_per_transaction: ds.max_quantity_per_transaction ?? 10,
          },
        })
        .eq('id', organization.id);
      if (error) throw error;
      setDoorSettings((s) => ({ ...(s || {}), price_cents: cents }));
      setPriceEditing(false);
      setPriceSaveMsg('Price updated');
      setTimeout(() => setPriceSaveMsg(null), 3000);
    } catch (e) {
      console.error('Failed to save price:', e);
      setPriceSaveMsg('Failed to save. Try again.');
      setTimeout(() => setPriceSaveMsg(null), 4000);
    } finally {
      setPriceSavePending(false);
    }
  };

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
                {successData?.recordSaleFailed ? (
                  <>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Payment received</h2>
                    <p className="text-muted-foreground text-sm">Your card was charged, but we couldn&apos;t confirm your ticket yet. Please save your payment ID and contact support if you don&apos;t see a confirmation email shortly.</p>
                    <p className="text-xs font-mono text-muted-foreground bg-muted px-3 py-2 rounded">{successData.paymentIntentId}</p>
                    <p className="text-xs text-muted-foreground">Check your email or contact the venue for assistance.</p>
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Payment successful</h2>
                    <p className="text-muted-foreground">Your ticket(s) have been purchased. You&apos;re all set!</p>
                    {successData?.receiptSent && purchaserEmail && (
                      <p className="text-sm text-muted-foreground">Receipt sent to {purchaserEmail}</p>
                    )}
                    {successData?.qrCode && (
                      <div className="pt-2 space-y-2">
                        <p className="text-sm text-muted-foreground">Show this QR code at the door</p>
                        <div className="inline-block p-3 sm:p-4 bg-white dark:bg-zinc-800 rounded-lg border border-border">
                          <img
                            src={`/api/events/tickets/qr/${encodeURIComponent(successData.qrCode)}`}
                            alt="Ticket QR code"
                            className="w-44 h-44 sm:w-48 sm:h-48"
                          />
                        </div>
                        <p className="text-xs font-mono text-muted-foreground break-all">{successData.qrCode}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : enabled ? (
              <>
                <div className="text-center">
                  {isOwner && priceEditing ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-24 h-9 text-center text-lg font-semibold"
                          defaultValue={(priceCents / 100).toFixed(2)}
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v >= 0.5) handlePriceSave(Math.round(v * 100));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v >= 0.5) handlePriceSave(Math.round(v * 100));
                            } else if (e.key === 'Escape') setPriceEditing(false);
                          }}
                          autoFocus
                          disabled={priceSavePending}
                        />
                        <span className="text-muted-foreground text-sm">per ticket</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPriceEditing(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-foreground">
                      ${(priceCents / 100).toFixed(2)} per ticket
                      {priceSaveMsg && <span className="ml-2 text-xs font-normal text-muted-foreground">{priceSaveMsg}</span>}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setPriceEditing(true)}
                          className="ml-2 text-xs font-normal text-muted-foreground hover:text-foreground underline"
                        >
                          Change
                        </button>
                      )}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Pay by card at the door</p>
                </div>

                <div className="space-y-4">
                  {formError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20" role="alert">
                      <p className="text-sm text-destructive">{formError}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input id="name" className="min-h-[44px]" placeholder="Your name" value={purchaserName} onChange={(e) => { setPurchaserName(e.target.value); setFormError(null); }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional, for receipt)</span></Label>
                    <Input id="email" type="email" className="min-h-[44px]" placeholder="you@example.com" value={purchaserEmail} onChange={(e) => { setPurchaserEmail(e.target.value); setFormError(null); }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" type="tel" className="min-h-[44px]" placeholder="(555) 123-4567" value={purchaserPhone} onChange={(e) => setPurchaserPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qty">Quantity</Label>
                    <select
                      id="qty"
                      className="w-full min-h-[44px] px-3 rounded-md border border-input bg-background"
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
                    onSuccess={(result) => {
                      setSuccessData(result);
                      setSuccess(true);
                    }}
                    onError={(msg) => setFormError(msg)}
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
