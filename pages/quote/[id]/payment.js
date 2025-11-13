import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { CreditCard, ArrowLeft, Loader2, CheckCircle, Lock, AlertCircle, FileText } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState('deposit'); // 'deposit' or 'full'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
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
      } else {
        // Quote not found - this is okay, we can still show payment page
        // but user should select services first
        console.log('Quote not found - user may need to select services first');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!quoteData) return;

    setProcessing(true);
    setError(null);

    try {
      // For small amounts (< $10), always charge full amount
      const totalAmount = quoteData.total_price || 0;
      const isSmallAmount = totalAmount < 10;
      const amount = isSmallAmount
        ? Math.round(totalAmount * 100) // Full amount in cents
        : (paymentType === 'deposit' 
          ? Math.round(totalAmount * 0.5 * 100) // 50% deposit in cents
          : Math.round(totalAmount * 100)); // Full amount in cents

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          amount: amount,
          description: (isSmallAmount || paymentType === 'full')
            ? `Full payment for ${quoteData.package_name}`
            : `Deposit for ${quoteData.package_name}`,
          successUrl: `${window.location.origin}/quote/${id}/confirmation?payment_intent={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/quote/${id}/payment`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }

      const { sessionId, url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        // Fallback: Redirect to Stripe checkout using the session ID
        // We'll construct the checkout URL or use the API to get it
        throw new Error('Payment session created but redirect URL not available. Please contact support.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to process payment. Please try again.');
      setProcessing(false);
    }
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
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading payment information...</p>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  const totalAmount = quoteData?.total_price || 0;
  // For very small amounts (like $1), don't split into deposit - just charge full amount
  const depositAmount = totalAmount < 10 ? totalAmount : totalAmount * 0.5;
  const remainingBalance = totalAmount - depositAmount;
  // For small amounts, always use full payment
  const paymentAmount = totalAmount < 10 ? totalAmount : (paymentType === 'deposit' ? depositAmount : totalAmount);

  // If no quote data, show message
  if (!quoteData && !loading) {
    return (
      <>
        <Head>
          <title>Payment | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <main className="section-container py-12 md:py-20">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Select Services First
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Please select your services before making a payment.
              </p>
              <Link
                href={`/quote/${id}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Service Selection
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Make Payment | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        <main className="section-container py-12 md:py-20">
          {/* Header */}
          <div className="max-w-2xl mx-auto mb-8">
            <Link
              href={`/quote/${id}/confirmation`}
              className="inline-flex items-center gap-2 text-brand hover:text-brand-dark transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Confirmation
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Secure Payment
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Complete your booking with a secure payment
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Payment Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment Summary</h2>
              
              {quoteData && (
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{quoteData.package_name}</p>
                    <p className="text-gray-600 dark:text-gray-400">${quoteData.package_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  
                  {quoteData.addons && quoteData.addons.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">Add-ons:</p>
                      <ul className="space-y-2">
                        {quoteData.addons.map((addon, idx) => (
                          <li key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{addon.name}</span>
                            <span>${addon.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                    <span>Total:</span>
                    <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Payment Type Selection - Only show for amounts >= $10 */}
              {totalAmount >= 10 && (
                <div className="mt-6 space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Payment Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      style={{ borderColor: paymentType === 'deposit' ? '#8B5CF6' : 'transparent' }}>
                      <input
                        type="radio"
                        name="paymentType"
                        value="deposit"
                        checked={paymentType === 'deposit'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="mr-3 text-brand focus:ring-brand"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">Pay Deposit (50%)</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} now</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Remaining ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due 7 days before event</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      style={{ borderColor: paymentType === 'full' ? '#8B5CF6' : 'transparent' }}>
                      <input
                        type="radio"
                        name="paymentType"
                        value="full"
                        checked={paymentType === 'full'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="mr-3 text-brand focus:ring-brand"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">Pay in Full</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} now</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Save time and pay everything upfront</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment Details</h2>
              
              <div className="space-y-6">
                {/* Amount Display */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount to Pay</p>
                  <p className="text-3xl font-bold text-brand">${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                {/* Security Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm">Secure Payment</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Your payment is processed securely through Stripe. We never store your credit card information.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing || !quoteData}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 py-4 text-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Securely
                    </>
                  )}
                </button>

                {/* Alternative Payment */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                    Prefer to pay another way?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    Contact us at <a href="tel:+19014102020" className="text-brand hover:underline">(901) 410-2020</a> or{' '}
                    <a href="mailto:info@m10djcompany.com" className="text-brand hover:underline">info@m10djcompany.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Links */}
          <div className="max-w-2xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/quote/${id}/invoice`}
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View Invoice
            </Link>
            <Link
              href={`/quote/${id}/contract`}
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View Contract
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
