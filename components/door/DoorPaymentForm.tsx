'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface DoorPaymentFormProps {
  organizationId: string;
  quantity: number;
  priceCents: number;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

function InnerForm({
  organizationId,
  quantity,
  priceCents,
  purchaserName,
  purchaserEmail,
  purchaserPhone,
  onSuccess,
  onError,
}: DoorPaymentFormProps) {
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
      const res = await fetch('/api/door/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          quantity,
          purchaser_name: purchaserName,
          purchaser_email: purchaserEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment');

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (confirmError) throw new Error(confirmError.message || 'Payment failed');
      if (paymentIntent?.status === 'succeeded') {
        // Record sale
        const recordRes = await fetch('/api/door/record-sale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            purchaser_phone: purchaserPhone || undefined,
          }),
        });
        if (!recordRes.ok) {
          console.warn('Payment succeeded but record-sale failed');
        }
        onSuccess(paymentIntent.id);
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
      <div className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
              },
            },
          }}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Processing…' : `Pay $${totalDollars.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function DoorPaymentForm(props: DoorPaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe' } }}>
      <InnerForm {...props} />
    </Elements>
  );
}
