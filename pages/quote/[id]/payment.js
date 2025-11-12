import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { CreditCard, CheckCircle, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function CheckoutForm({ leadData, quoteData, totalAmount, depositAmount }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { id } = router.query;
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/quote/${id}/confirmation`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
        <h3 className="font-bold mb-4">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Package:</span>
            <span className="font-semibold">${totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>50% Deposit Due Now:</span>
            <span className="text-brand">${depositAmount.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Remaining balance of ${(totalAmount - depositAmount).toLocaleString()} due 7 days before your event
          </p>
        </div>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6">
        <Link
          href={`/quote/${id}/contract`}
          className="btn-outline inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Contract
        </Link>
        
        <button
          type="submit"
          disabled={!stripe || processing}
          className={`btn-primary inline-flex items-center gap-2 ${
            (!stripe || processing) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Pay ${depositAmount.toLocaleString()} Securely
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 pt-4 text-sm text-gray-500">
        <Shield className="w-4 h-4" />
        <span>Secured by Stripe • PCI Compliant • SSL Encrypted</span>
      </div>
    </form>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [leadResponse, quoteResponse] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/quote/${id}`)
      ]);

      if (leadResponse.ok) {
        const lead = await leadResponse.json();
        setLeadData(lead);
      }

      if (quoteResponse.ok) {
        const quote = await quoteResponse.json();
        setQuoteData(quote);

        // Create payment intent
        const depositAmount = Math.round(quote.total_price * 0.5 * 100); // 50% in cents
        const paymentResponse = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: depositAmount,
            leadId: id,
            metadata: {
              leadId: id,
              leadName: lead.name,
              leadEmail: lead.email,
              packageName: quote.package_name,
              totalAmount: quote.total_price,
              depositAmount: quote.total_price * 0.5
            }
          })
        });

        if (paymentResponse.ok) {
          const { clientSecret } = await paymentResponse.json();
          setClientSecret(clientSecret);
        } else {
          setError('Failed to initialize payment');
        }
      } else {
        setError('Quote not found. Please complete previous steps first.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  const totalAmount = quoteData?.total_price || 0;
  const depositAmount = totalAmount * 0.5;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#6366f1',
      },
    },
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Payment | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Initializing secure payment...</p>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  if (error || !leadData || !quoteData || !clientSecret) {
    return (
      <>
        <Head>
          <title>Payment Error | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4">
            <div className="max-w-md text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-3xl font-bold mb-4">Payment Not Available</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {error || "Please complete previous steps first."}
              </p>
              <Link href={`/quote/${id}/contract`} className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                Back to Contract
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Secure Payment | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        <main className="section-container py-12 md:py-20">
          {/* Progress Indicator */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold hidden sm:inline">Selection</span>
              </div>
              <div className="h-1 w-16 bg-brand"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold hidden sm:inline">Contract</span>
              </div>
              <div className="h-1 w-16 bg-brand"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold">3</div>
                <span className="text-sm font-semibold hidden sm:inline">Payment</span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full mb-4">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-semibold">Secure Payment</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Complete Your Booking
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Pay your deposit to secure your date
            </p>
          </div>

          {/* Payment Form */}
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            {clientSecret && (
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm
                  leadData={leadData}
                  quoteData={quoteData}
                  totalAmount={totalAmount}
                  depositAmount={depositAmount}
                />
              </Elements>
            )}
          </div>

          {/* Trust Badges */}
          <div className="max-w-2xl mx-auto mt-8">
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>Powered by Stripe</span>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

