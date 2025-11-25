import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import { CheckCircle, Download, Calendar, Mail, Phone, Loader2, FileText, CreditCard, Music } from 'lucide-react';

export default function ConfirmationPage() {
  const router = useRouter();
  const { id, payment_intent } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('verifying');
  const [paymentData, setPaymentData] = useState(null);
  const [hasPayment, setHasPayment] = useState(false);

  const fetchData = useCallback(async (retryCount = 0) => {
    try {
      const [leadResponse, quoteResponse] = await Promise.all([
        fetch(`/api/leads/get-lead?id=${id}?_t=${Date.now()}`),
        fetch(`/api/quote/${id}?_t=${Date.now()}`)
      ]);

      if (leadResponse.ok) {
        const lead = await leadResponse.json();
        setLeadData(lead);
      }

      if (quoteResponse.ok) {
        const quote = await quoteResponse.json();
        // Parse speaker_rental if it's a JSON string
        if (quote.speaker_rental && typeof quote.speaker_rental === 'string') {
          try {
            quote.speaker_rental = JSON.parse(quote.speaker_rental);
          } catch (e) {
            console.error('Error parsing speaker_rental:', e);
          }
        }
        setQuoteData(quote);
        console.log('📦 Quote data loaded:', {
          total_price: quote.total_price,
          package_price: quote.package_price,
          package_name: quote.package_name,
          speaker_rental: quote.speaker_rental ? (typeof quote.speaker_rental === 'string' ? 'string' : 'object') : 'null',
          addons: quote.addons?.length || 0,
          addonsTotal: (quote.addons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0)
        });
      } else if (quoteResponse.status === 404 && retryCount < 3) {
        // Quote not found - might be a timing issue, retry after a short delay
        console.log(`⚠️ Quote not found, retrying... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
      } else if (quoteResponse.status === 404) {
        console.error('❌ Quote not found after retries');
      }

      // Check for actual payment records
      try {
        // Check if there are any payments for this quote/contact
        const paymentsResponse = await fetch(`/api/payments?contact_id=${id}`);
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          if (paymentsData.payments && paymentsData.payments.length > 0) {
            // Filter for paid payments
            const paidPayments = paymentsData.payments.filter(p => p.payment_status === 'Paid');
            if (paidPayments.length > 0) {
              setHasPayment(true);
              const totalPaid = paidPayments.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
              setPaymentData({ totalPaid, payments: paidPayments });
              setPaymentStatus('succeeded');
            } else {
              setHasPayment(false);
              setPaymentStatus('pending');
            }
          } else {
            setHasPayment(false);
            setPaymentStatus('pending');
          }
        }
      } catch (error) {
        console.error('Error checking payments:', error);
        setHasPayment(false);
        setPaymentStatus('pending');
      }

      // Also check payment_intent if provided
      if (payment_intent) {
        try {
          const paymentResponse = await fetch(`/api/stripe/get-payment?payment_intent=${payment_intent}`);
          if (paymentResponse.ok) {
            const paymentDetails = await paymentResponse.json();
            if (paymentDetails.payment_status === 'paid' || paymentDetails.payment_status === 'succeeded') {
              setHasPayment(true);
              if (!paymentData) {
                setPaymentData({ 
                  totalPaid: paymentDetails.amount_total / 100,
                  payments: [paymentDetails]
                });
              }
              setPaymentStatus('succeeded');
            }
          }
        } catch (error) {
          console.error('Error verifying payment intent:', error);
        }
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

  // Calculate total amount - use total_price if available, otherwise calculate from package/speaker rental + addons
  const calculateTotalAmount = useMemo(() => {
    if (!quoteData) {
      console.log('⚠️ No quoteData available');
      return 0;
    }
    
    let total = Number(quoteData.total_price) || 0;
    
    console.log('💰 Initial total from total_price:', total);
    
    // If total_price is 0 or missing, calculate from components
    if (!total || total === 0) {
      let basePrice = Number(quoteData.package_price) || 0;
      
      console.log('📦 Base price from package_price:', basePrice);
      
      // Check for speaker rental
      if (quoteData.speaker_rental) {
        try {
          const speakerRental = typeof quoteData.speaker_rental === 'string' 
            ? JSON.parse(quoteData.speaker_rental) 
            : quoteData.speaker_rental;
          console.log('🔊 Speaker rental parsed:', speakerRental);
          if (speakerRental?.price) {
            basePrice = Number(speakerRental.price) || 0;
            console.log('🔊 Updated base price from speaker rental:', basePrice);
          }
        } catch (e) {
          console.error('❌ Error parsing speaker rental:', e);
        }
      }
      
      // Add addons
      const addonsTotal = (quoteData.addons || []).reduce((sum, addon) => {
        const addonPrice = Number(addon.price) || 0;
        console.log('➕ Addon:', addon.name, 'Price:', addonPrice);
        return sum + addonPrice;
      }, 0);
      
      console.log('➕ Addons total:', addonsTotal);
      
      total = basePrice + addonsTotal;
      console.log('💰 Calculated total:', total);
    }
    
    return total;
  }, [quoteData]);
  
  const totalAmount = calculateTotalAmount;
  const depositAmount = totalAmount * 0.5;
  const actualPaid = paymentData?.totalPaid || 0;
  // Calculate remaining balance: if no payment made, show total - deposit. If payment made, show total - paid.
  const remainingBalance = actualPaid > 0 
    ? Math.max(0, totalAmount - actualPaid)
    : Math.max(0, totalAmount - depositAmount);
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
            {hasPayment ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Payment Received
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                    <span className="text-2xl font-bold text-green-600">${actualPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {remainingBalance > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                      <span className="text-xl font-semibold">${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Package Value:</span>
                    <span className="text-2xl font-bold text-brand">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {remainingBalance > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>💡 Reminder:</strong> The remaining balance of ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is due 7 days before your event. We&apos;ll send you a reminder!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-brand" />
                  Payment Information
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Deposit Amount:</span>
                    <span className="text-2xl font-bold text-brand">${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                    <span className="text-xl font-semibold">${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Package Value:</span>
                    <span className="text-2xl font-bold text-brand">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>📝 Next Step:</strong> Complete your payment to secure your booking. Click the &quot;Make Payment&quot; button below to proceed with secure checkout.
                  </p>
                </div>
              </div>
            )}

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
                        {(leadData.event_date || leadData.eventDate) ? new Date(leadData.event_date || leadData.eventDate).toLocaleDateString('en-US', { 
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

            {/* Package or Speaker Rental Details */}
            {quoteData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-6">
                  {quoteData.speaker_rental ? 'Your Speaker Rental' : 'Your Package'}
                </h2>
                <div className="space-y-4">
                  {quoteData.speaker_rental ? (
                    <div>
                      <p className="text-xl font-bold text-brand">
                        {typeof quoteData.speaker_rental === 'string' 
                          ? JSON.parse(quoteData.speaker_rental).name 
                          : quoteData.speaker_rental.name}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        ${(typeof quoteData.speaker_rental === 'string' 
                          ? JSON.parse(quoteData.speaker_rental).price 
                          : quoteData.speaker_rental.price)?.toLocaleString()}
                      </p>
                      {typeof quoteData.speaker_rental === 'object' && quoteData.speaker_rental.startTime && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Event Time: {quoteData.speaker_rental.startTime} - {quoteData.speaker_rental.endTime}
                          {quoteData.speaker_rental.totalHours && (
                            <> ({quoteData.speaker_rental.totalHours.toFixed(1)} hours)</>
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-bold text-brand">{quoteData.package_name}</p>
                      <p className="text-gray-600 dark:text-gray-400">${quoteData.package_price?.toLocaleString()}</p>
                    </div>
                  )}
                  
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

            {/* Action Buttons - Prominent */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-2 text-center">Next Steps</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                Complete your booking by making a payment and signing your contract
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {!hasPayment && (
                  <Link
                    href={`/quote/${id}/payment`}
                    className="bg-gradient-to-r from-brand to-yellow-600 hover:from-yellow-600 hover:to-brand text-black font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-3 transform hover:scale-105"
                  >
                    <CreditCard className="w-10 h-10" />
                    <span className="text-xl">Make Payment</span>
                    <span className="text-sm opacity-90">
                      {remainingBalance > 0 
                        ? `Pay $${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} deposit`
                        : `Pay $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      }
                    </span>
                  </Link>
                )}
                {hasPayment && (
                  <Link
                    href={`/quote/${id}/questionnaire`}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-3 transform hover:scale-105"
                  >
                    <Music className="w-10 h-10" />
                    <span className="text-xl">Music Planning</span>
                    <span className="text-sm opacity-90">Complete your music questionnaire</span>
                  </Link>
                )}
                <Link
                  href={`/quote/${id}/contract`}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-3 transform hover:scale-105"
                >
                  <FileText className="w-10 h-10" />
                  <span className="text-xl">Sign Contract</span>
                  <span className="text-sm opacity-90">Review & e-sign your agreement</span>
                </Link>
                <Link
                  href={`/quote/${id}/invoice`}
                  className="btn-outline flex flex-col items-center justify-center gap-3 py-6 px-8 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-8 h-8 text-brand" />
                  <span className="font-semibold">View Invoice</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Download PDF</span>
                </Link>
                <Link
                  href={`/quote/${id}`}
                  className="btn-outline flex flex-col items-center justify-center gap-3 py-6 px-8 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileText className="w-8 h-8 text-brand" />
                  <span className="font-semibold">View Quote</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">See full details</span>
                </Link>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-gradient-to-r from-brand/10 to-purple-500/10 rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-6">What Happens Next?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold">Complete Payment & Contract</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Make your deposit payment and sign your contract to secure your booking.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold">Check Your Email</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      We&apos;ve sent a confirmation email to {leadData?.email} with your booking details.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold">We&apos;ll Reach Out</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      DJ Ben Murray will contact you within 24 hours to discuss your event details and music preferences.
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
      </div>
    </>
  );
}

