/**
 * Pay-on-phone page for kiosk flow: /[slug]/requests/pay?code=PAYMENT_CODE
 * User scans QR at kiosk, lands here, completes payment (card / Cash App / Venmo).
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import PaymentMethodSelection from '@/components/crowd-request/PaymentMethodSelection';
import { usePaymentSettings } from '@/hooks/usePaymentSettings';

const noop = () => {};

export default function RequestPayPage() {
  const router = useRouter();
  const { slug, code } = router.query;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(!!code);
  const [error, setError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { paymentSettings } = usePaymentSettings({
    organizationId: request?.organizationId ?? null,
  });

  useEffect(() => {
    if (!code || typeof code !== 'string') {
      setLoading(false);
      if (router.isReady && !code) setError('Missing payment code');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`/api/crowd-request/pay-by-code?code=${encodeURIComponent(code.trim())}`)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 404) throw new Error('Request not found or already paid');
          throw new Error(res.status === 400 ? 'Invalid payment code' : 'Something went wrong');
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (slug && data.organizationSlug && data.organizationSlug !== slug) {
          setError('This link does not match this organization.');
          setRequest(null);
        } else {
          setRequest(data);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load request');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [code, slug, router.isReady]);

  const amount = request?.amount ?? 0;
  const getPaymentAmount = () => amount;
  const getBaseAmount = () => amount;

  if (!router.isReady || loading) {
    return (
      <>
        <Head>
          <title>Complete your payment</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-muted/30 dark:bg-muted/10 p-4">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Loading…</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !request) {
    return (
      <>
        <Head>
          <title>Payment link invalid</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-muted/30 dark:bg-muted/10 p-4">
          <div className="max-w-md w-full rounded-xl border bg-card p-6 shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Cannot load payment</h1>
            <p className="text-muted-foreground mb-6">{error || 'Request not found or already paid.'}</p>
            {slug && (
              <Link
                href={`/${slug}/requests`}
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to requests
              </Link>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Complete your payment</title>
      </Head>
      <div className="min-h-screen bg-muted/30 dark:bg-muted/10 p-4 pb-8">
        <div className="max-w-md mx-auto pt-4">
          <Link
            href={slug ? `/${slug}/requests` : '#'}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to requests
          </Link>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h1 className="text-xl font-semibold mb-1">Complete your payment</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Amount: ${(amount / 100).toFixed(2)}
              {request.requestType === 'song_request' && request.songTitle && (
                <> · {request.songTitle}{request.songArtist ? ` by ${request.songArtist}` : ''}</>
              )}
            </p>
            <PaymentMethodSelection
              requestId={request.requestId}
              amount={amount}
              selectedPaymentMethod={selectedPaymentMethod}
              submitting={submitting}
              paymentSettings={paymentSettings}
              paymentCode={request.paymentCode}
              requestType={request.requestType}
              songTitle={request.songTitle}
              songArtist={request.songArtist}
              recipientName={request.recipientName}
              requesterName={request.requesterName}
              onRequesterNameChange={noop}
              additionalSongs={[]}
              setAdditionalSongs={noop}
              bundleSongs={[]}
              bundleSize={1}
              bundleDiscount={0}
              bundleDiscountEnabled={false}
              getBaseAmount={getBaseAmount}
              getPaymentAmount={getPaymentAmount}
              onPaymentMethodSelected={setSelectedPaymentMethod}
              onError={setError}
              onBack={() => router.push(slug ? `/${slug}/requests` : '/')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
