'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripeElementsConfig } from '@/utils/stripe/connect';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

/** Result passed to onSuccess - includes recordSaleFailed when payment charged but record-sale failed */
export interface DoorPaymentResult {
  paymentIntentId: string;
  ticketId?: string;
  qrCode?: string;
  recordSaleFailed?: boolean;
  receiptSent?: boolean;
}

interface DoorPaymentFormProps {
  organizationId: string;
  quantity: number;
  priceCents: number;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone?: string;
  onSuccess: (result: DoorPaymentResult) => void;
  onError: (message: string) => void;
  branding?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
}

function recordSaleWithRetry(paymentIntentId: string, purchaserPhone?: string, maxAttempts = 3): Promise<{ ok: boolean; data?: any }> {
  return (async function attempt(n: number): Promise<{ ok: boolean; data?: any }> {
    const res = await fetch('/api/door/record-sale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId,
        purchaser_phone: purchaserPhone || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data };
    if (n < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, 600 * (n + 1)));
      return attempt(n + 1);
    }
    return { ok: false };
  })(0);
}

function InnerForm({
  organizationId,
  quantity,
  priceCents,
  purchaserName,
  purchaserEmail,
  purchaserPhone,
  clientSecret,
  onSuccess,
  onError,
  branding,
}: DoorPaymentFormProps & { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = priceCents * quantity;
  const totalDollars = totalCents / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: typeof window !== 'undefined' ? window.location.href : '',
          payment_method_data: {
            billing_details: {
              name: purchaserName.trim() || undefined,
              email: purchaserEmail.trim() || undefined,
            },
          },
        },
      });

      if (confirmError) throw new Error(confirmError.message || 'Payment failed');

      // confirmPayment may redirect for 3DS; if we get here, check PaymentIntent status
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
      if (paymentIntent?.status === 'succeeded') {
        const { ok, data: recordData } = await recordSaleWithRetry(paymentIntent.id, purchaserPhone || undefined);
        if (ok && recordData?.success) {
          onSuccess({
            paymentIntentId: paymentIntent.id,
            ticketId: recordData.ticketId,
            qrCode: recordData.qrCode,
            receiptSent: recordData.receiptSent,
          });
        } else {
          onSuccess({
            paymentIntentId: paymentIntent.id,
            recordSaleFailed: true,
          });
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Payment failed';
      setError(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 min-h-[52px] rounded-lg border border-input bg-background">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20" role="alert">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full min-h-[48px] py-3 px-4 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        style={branding?.primaryColor ? { backgroundColor: branding.primaryColor } : undefined}
      >
        {loading ? 'Processing…' : `Pay $${totalDollars.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function DoorPaymentForm(props: DoorPaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piError, setPiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPiError(null);

    fetch('/api/door/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: props.organizationId,
        quantity: props.quantity,
        purchaser_name: props.purchaserName.trim() || undefined,
        purchaser_email: props.purchaserEmail.trim() || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setPiError(data.error);
          return;
        }
        if (data.clientSecret) setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        if (!cancelled) setPiError(err?.message || 'Failed to load payment form');
      });

    return () => { cancelled = true; };
  }, [props.organizationId, props.quantity, props.purchaserName, props.purchaserEmail]);

  const baseOptions = getStripeElementsConfig(props.branding);
  const elementsOptions = clientSecret
    ? { ...baseOptions, clientSecret }
    : baseOptions;

  if (piError) {
    return (
      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <p className="text-sm text-destructive">{piError}</p>
        <p className="text-xs text-muted-foreground mt-1">Refresh the page to try again.</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-4 rounded-lg border border-input bg-muted/30 flex items-center justify-center min-h-[120px]">
        <p className="text-sm text-muted-foreground">Loading payment form…</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions} key={clientSecret}>
      <InnerForm {...props} clientSecret={clientSecret} />
    </Elements>
  );
}
