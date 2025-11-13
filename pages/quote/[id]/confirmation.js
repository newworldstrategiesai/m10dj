import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { CheckCircle, Download, Calendar, Mail, Phone, Loader2, FileText, CreditCard } from 'lucide-react';

export default function ConfirmationPage() {
  const router = useRouter();
  const { id, payment_intent } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('verifying');

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
      }

      // Verify payment status
      if (payment_intent) {
        const paymentResponse = await fetch(`/api/stripe/verify-payment?payment_intent=${payment_intent}`);
        if (paymentResponse.ok) {
          const { status } = await paymentResponse.json();
          setPaymentStatus(status);
        }
      } else {
        setPaymentStatus('succeeded');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id, payment_intent]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  const totalAmount = quoteData?.total_price || 0;
  const depositAmount = totalAmount * 0.5;
  const remainingBalance = totalAmount - depositAmount;
  const firstName = leadData?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <>
        <Head>
          <title>Confirming Booking | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Confirming your booking...</p>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Booking Confirmed! | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        <main className="section-container py-12 md:py-20">
          {/* Success Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              🎉 You&apos;re All Set, {firstName}!
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-300 mb-2">
              Your booking is confirmed!
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              We&apos;re excited to be part of your special day
            </p>
          </div>

          {/* Confirmation Details */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Payment Received
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Deposit Paid:</span>
                  <span className="text-2xl font-bold text-green-600">${depositAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                  <span className="text-xl font-semibold">${remainingBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Package Value:</span>
                  <span className="text-2xl font-bold text-brand">${totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Reminder:</strong> The remaining balance of ${remainingBalance.toLocaleString()} is due 7 days before your event. We&apos;ll send you a reminder!
                </p>
              </div>
            </div>

            {/* Event Details */}
            {leadData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-6">Event Details</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Calendar className="w-5 h-5 text-brand mt-1" />
                    <div>
                      <p className="font-semibold">Date</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {leadData.event_date ? new Date(leadData.event_date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'TBD'}
                      </p>
                    </div>
                  </div>
                  {leadData.location && (
                    <div className="flex items-start gap-4">
                      <Mail className="w-5 h-5 text-brand mt-1" />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-gray-600 dark:text-gray-400">{leadData.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Package Details */}
            {quoteData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-6">Your Package</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xl font-bold text-brand">{quoteData.package_name}</p>
                    <p className="text-gray-600 dark:text-gray-400">${quoteData.package_price?.toLocaleString()}</p>
                  </div>
                  
                  {quoteData.addons && quoteData.addons.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="font-semibold mb-2">Add-ons:</p>
                      <ul className="space-y-2">
                        {quoteData.addons.map((addon, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{addon.name} - ${addon.price?.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-brand/10 to-purple-500/10 rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-6">What Happens Next?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold">Check Your Email</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We&apos;ve sent a confirmation email to {leadData?.email} with your booking details and signed contract.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold">We&apos;ll Reach Out</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      DJ Ben Murray will contact you within 24 hours to discuss your event details and music preferences.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold">Plan Your Perfect Playlist</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We&apos;ll work together to curate the perfect music selection for your celebration.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <p className="font-semibold">Enjoy Your Event!</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Relax and enjoy - we&apos;ll handle everything to make your event unforgettable.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Links */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Your Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href={`/quote/${id}/invoice`}
                  className="btn-outline flex flex-col items-center justify-center gap-2 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileText className="w-8 h-8 text-brand" />
                  <span className="font-semibold">View Invoice</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Download PDF</span>
                </Link>
                <Link
                  href={`/quote/${id}/contract`}
                  className="btn-outline flex flex-col items-center justify-center gap-2 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileText className="w-8 h-8 text-brand" />
                  <span className="font-semibold">View Contract</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sign & Download</span>
                </Link>
                <Link
                  href={`/quote/${id}/payment`}
                  className="btn-primary flex flex-col items-center justify-center gap-2 p-6"
                >
                  <CreditCard className="w-8 h-8" />
                  <span className="font-semibold">Make Payment</span>
                  <span className="text-sm opacity-90">Secure checkout</span>
                </Link>
              </div>
            </div>

            {/* Contact Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Questions or Need Changes?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;re here to help! Contact us anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="tel:+19014102020"
                  className="btn-primary inline-flex items-center gap-2 justify-center"
                >
                  <Phone className="w-5 h-5" />
                  Call (901) 410-2020
                </a>
                <a
                  href="mailto:info@m10djcompany.com"
                  className="btn-outline inline-flex items-center gap-2 justify-center"
                >
                  <Mail className="w-5 h-5" />
                  Email Us
                </a>
              </div>
            </div>

            {/* Return Home */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-brand hover:underline"
              >
                ← Return to Homepage
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

