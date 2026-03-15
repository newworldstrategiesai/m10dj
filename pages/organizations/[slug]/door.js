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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizePending, setCustomizePending] = useState(false);
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [purchaserPhone, setPurchaserPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'card' | 'venmo'
  const [venmoData, setVenmoData] = useState(null); // { qrCode, paymentCode, ticketId, totalAmount }
  const [venmoSubmitting, setVenmoSubmitting] = useState(false);
  const confettiTriggered = useRef(false);

  useEffect(() => {
    if (success && !successData?.recordSaleFailed && !confettiTriggered.current) {
      confettiTriggered.current = true;
      triggerConfetti();
    }
  }, [success, successData?.recordSaleFailed]);

  // Handle return from Venmo redirect (venmo_ticket and qr in URL)
  useEffect(() => {
    if (!router.isReady || success) return;
    const { venmo_ticket, qr } = router.query;
    if (venmo_ticket && qr) {
      setSuccessData({ ticketId: venmo_ticket, qrCode: decodeURIComponent(qr) });
      setSuccess(true);
      router.replace(router.asPath.split('?')[0], undefined, { shallow: true });
    }
  }, [router.isReady, router.query.venmo_ticket, router.query.qr, success]);

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
  const venmoEnabled = doorSettings?.venmo_enabled === true;

  const handleVenmoPay = async () => {
    if (!organization) return;
    setVenmoSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/door/record-venmo-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          quantity,
          priceCents,
          purchaserName: purchaserName.trim() || 'Walk-up',
          purchaserEmail: purchaserEmail.trim() || undefined,
          purchaserPhone: purchaserPhone.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create ticket');
      setVenmoData({
        qrCode: data.qrCode,
        paymentCode: data.paymentCode,
        ticketId: data.ticketId,
        totalAmount: data.totalAmount,
      });
    } catch (e) {
      setFormError(e.message || 'Failed. Try again.');
    } finally {
      setVenmoSubmitting(false);
    }
  };

  const handlePriceSave = async (newCents) => {
    if (!organization || !isOwner) return;
    const cents = Math.round(Math.max(50, Math.min(99999, newCents)));
    setPriceSavePending(true);
    try {
      const supabase = createClient();
      const ds = doorSettings || {};
      const merged = {
        ...ds,
        enabled: ds.enabled !== false,
        price_cents: cents,
        venue_display: (ds.venue_display || '').trim() || null,
        max_quantity_per_transaction: ds.max_quantity_per_transaction ?? 10,
      };
      const { error } = await supabase
        .from('organizations')
        .update({ door_settings: merged })
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

  const handleCustomizeSave = async (updates) => {
    if (!organization || !isOwner) return;
    setCustomizePending(true);
    try {
      const res = await fetch('/api/door/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: organization.id, ...updates }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setDoorSettings((s) => ({ ...(s || {}), ...updates }));
    } catch (e) {
      console.error('Failed to save customization:', e);
    } finally {
      setCustomizePending(false);
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

  const showCover = doorSettings?.show_cover_photo !== false;
  const coverUrl =
    showCover &&
    (doorSettings?.cover_photo_url?.trim?.() || getCoverPhotoUrl(organization));
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
              {doorSettings?.header_text ?? organization.name}
            </h1>
            {(doorSettings?.subtitle_text ?? venueDisplay) && (
              <p className="mt-2 text-lg text-white/90 drop-shadow">
                {doorSettings?.subtitle_text ?? venueDisplay}
              </p>
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
                {isOwner && (
                  <Collapsible open={customizeOpen} onOpenChange={setCustomizeOpen} className="border-b border-border pb-4">
                    <CollapsibleTrigger className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                      {customizeOpen ? '▼' : '▶'} Customize door page
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="header">Header text</Label>
                        <Input
                          id="header"
                          defaultValue={doorSettings?.header_text ?? organization.name}
                          placeholder={organization.name}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (doorSettings?.header_text ?? organization.name)) {
                              handleCustomizeSave({ header_text: v || null });
                            }
                          }}
                          disabled={customizePending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subtitle">Subtitle</Label>
                        <Input
                          id="subtitle"
                          defaultValue={doorSettings?.subtitle_text ?? venueDisplay}
                          placeholder={venueDisplay}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (doorSettings?.subtitle_text ?? venueDisplay)) {
                              handleCustomizeSave({ subtitle_text: v || null });
                            }
                          }}
                          disabled={customizePending}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="showCover"
                          checked={doorSettings?.show_cover_photo !== false}
                          onChange={(e) => handleCustomizeSave({ show_cover_photo: e.target.checked })}
                          disabled={customizePending}
                          className="rounded border-input"
                        />
                        <Label htmlFor="showCover" className="font-normal">Show cover photo</Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coverUrl">Cover photo URL (optional)</Label>
                        <Input
                          id="coverUrl"
                          type="url"
                          placeholder="https://..."
                          defaultValue={doorSettings?.cover_photo_url || ''}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (doorSettings?.cover_photo_url || '')) {
                              handleCustomizeSave({ cover_photo_url: v || null });
                            }
                          }}
                          disabled={customizePending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="btnColor">Button color (hex)</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="btnColor"
                            type="color"
                            className="w-12 h-10 p-1 cursor-pointer"
                            value={doorSettings?.button_color || '#9333ea'}
                            onChange={(e) => handleCustomizeSave({ button_color: e.target.value })}
                            disabled={customizePending}
                          />
                          <Input
                            type="text"
                            placeholder="#9333ea (optional)"
                            defaultValue={doorSettings?.button_color || ''}
                            className="flex-1 font-mono text-sm"
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v === '' && doorSettings?.button_color) {
                                handleCustomizeSave({ button_color: null });
                              } else if (v && /^#[0-9A-Fa-f]{6}$/.test(v) && v !== (doorSettings?.button_color || '')) {
                                handleCustomizeSave({ button_color: v });
                              }
                            }}
                            disabled={customizePending}
                          />
                        </div>
                      </div>
                      {customizePending && (
                        <p className="text-xs text-muted-foreground">Saving…</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

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

                  {/* Payment method selection */}
                  <div className="space-y-2">
                    <Label>Payment method</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`min-h-[48px] rounded-lg border-2 font-medium transition-colors ${
                          paymentMethod === 'card'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input bg-background hover:border-primary/50'
                        }`}
                      >
                        Card / Cash App
                      </button>
                      {venmoEnabled && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('venmo')}
                          className={`min-h-[48px] rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            paymentMethod === 'venmo'
                              ? 'border-[#008CFF] bg-[#008CFF]/10 text-[#008CFF]'
                              : 'border-input bg-background hover:border-[#008CFF]/50'
                          }`}
                        >
                          <svg viewBox="0 0 48 48" className="w-5 h-5" fill="currentColor">
                            <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z"/>
                          </svg>
                          Venmo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Venmo flow: show Venmo screen or "Pay with Venmo" button */}
                  {paymentMethod === 'venmo' && venmoData ? (
                    <div className="space-y-4 pt-2">
                      <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-3">
                        <p className="text-xs font-semibold text-purple-800 dark:text-purple-200 mb-1">Include this code in your Venmo note:</p>
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-100 text-center font-mono">{venmoData.paymentCode}</p>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white dark:bg-zinc-800 p-2 rounded-lg border">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                              `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live')}/venmo-redirect?recipients=${encodeURIComponent(doorSettings?.venmo_phone_number || (doorSettings?.venmo_username || '').replace(/^@/, ''))}&amount=${(venmoData.totalAmount || 0).toFixed(2)}&note=${encodeURIComponent(`Door ticket ${venmoData.paymentCode}`)}`
                            )}`}
                            alt="Venmo QR"
                            className="w-40 h-40"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const recipients = doorSettings?.venmo_phone_number || (doorSettings?.venmo_username || '').replace(/^@/, '');
                          const note = `Door ticket ${venmoData.paymentCode}`;
                          const slugVal = organization?.slug || router.query.slug || '';
                          const returnUrl = `${window.location.origin}/organizations/${slugVal}/door?venmo_ticket=${venmoData.ticketId}&qr=${encodeURIComponent(venmoData.qrCode || '')}`;
                          const url = `/venmo-redirect?recipients=${encodeURIComponent(recipients)}&amount=${(venmoData.totalAmount || 0).toFixed(2)}&note=${encodeURIComponent(note)}`;
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('venmo_thank_you_url', returnUrl);
                            window.location.href = url;
                          }
                        }}
                        className="w-full py-3 px-4 bg-[#008CFF] hover:bg-[#0077E6] text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                      >
                        <svg viewBox="0 0 48 48" className="w-5 h-5" fill="currentColor">
                          <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z"/>
                        </svg>
                        Open Venmo to Pay
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSuccessData({ qrCode: venmoData.qrCode, ticketId: venmoData.ticketId });
                          setSuccess(true);
                        }}
                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                      >
                        I&apos;ve Paid – Show My Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => { setVenmoData(null); setPaymentMethod(null); }}
                        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        ← Choose different payment method
                      </button>
                    </div>
                  ) : paymentMethod === 'venmo' ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleVenmoPay}
                        disabled={venmoSubmitting}
                        className="w-full min-h-[48px] py-3 px-4 bg-[#008CFF] hover:bg-[#0077E6] disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                      >
                        {venmoSubmitting ? 'Creating ticket…' : (
                          <>
                            <svg viewBox="0 0 48 48" className="w-5 h-5" fill="currentColor">
                              <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z"/>
                            </svg>
                            Pay ${((priceCents * quantity) / 100).toFixed(2)} with Venmo
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod(null)}
                        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        ← Choose different payment method
                      </button>
                    </div>
                  ) : paymentMethod === 'card' ? (
                    <DoorPaymentForm
                    organizationId={organization.id}
                    quantity={quantity}
                    priceCents={priceCents}
                    purchaserName={purchaserName}
                    purchaserEmail={purchaserEmail}
                    purchaserPhone={purchaserPhone || undefined}
                    branding={doorSettings?.button_color ? { primaryColor: doorSettings.button_color } : undefined}
                    onSuccess={(result) => {
                      setSuccessData(result);
                      setSuccess(true);
                    }}
                    onError={(msg) => setFormError(msg)}
                  />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Choose a payment method above
                    </p>
                  )}
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
