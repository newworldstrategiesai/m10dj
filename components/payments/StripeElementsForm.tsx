/**
 * White-Labeled Stripe Elements Payment Form
 * 
 * This component provides a fully customizable payment form with minimal Stripe branding.
 * Use this instead of Stripe Checkout for maximum branding control.
 */

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { getStripeElementsConfig } from '@/utils/stripe/connect';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeElementsFormProps {
  amount: number;
  organizationId: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  branding?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
}

function PaymentForm({ amount, organizationId, onSuccess, onError, branding }: StripeElementsFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get payment intent from your API
      const response = await fetch('/api/stripe-connect/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          organizationId: organizationId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { clientSecret } = await response.json();

      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: branding?.textColor || '#1f2937',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: branding?.primaryColor,
        }}
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Secure payment processing
        {/* Optional: Small "Powered by Stripe" text (legal requirement, can be very small) */}
        <span className="text-[8px] opacity-50"> • Powered by Stripe</span>
      </p>
    </form>
  );
}

export default function StripeElementsForm(props: StripeElementsFormProps) {
  const elementsOptions = getStripeElementsConfig(props.branding);

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentForm {...props} />
    </Elements>
  );
}

