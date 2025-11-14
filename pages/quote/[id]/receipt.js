import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import { Receipt, Download, ArrowLeft, Loader2, CheckCircle, Calendar, CreditCard, FileText } from 'lucide-react';

export default function ReceiptPage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [leadResponse, quoteResponse, paymentsResponse] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/quote/${id}`),
        fetch(`/api/payments?contact_id=${id}`)
      ]);

      if (leadResponse.ok) {
        const lead = await leadResponse.json();
        setLeadData(lead);
      }

      if (quoteResponse.ok) {
        const quote = await quoteResponse.json();
        setQuoteData(quote);
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (paymentsData.payments && paymentsData.payments.length > 0) {
          // Get the most recent paid payment
          const paidPayments = paymentsData.payments
            .filter(p => p.payment_status === 'Paid')
            .sort((a, b) => new Date(b.transaction_date || b.created_at) - new Date(a.transaction_date || a.created_at));
          
          if (paidPayments.length > 0) {
            setPaymentData(paidPayments[0]); // Show most recent payment
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Receipt | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 animate-spin text-brand mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading receipt...</p>
          </div>
        </div>
      </>
    );
  }

  if (!paymentData) {
    return (
      <>
        <Head>
          <title>Receipt Not Found | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Payment Receipt Found</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We couldn&apos;t find a payment receipt for this booking.
              </p>
              <Link
                href={`/quote/${id}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Booking
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const paymentAmount = parseFloat(paymentData.total_amount) || 0;
  const paymentDate = paymentData.transaction_date 
    ? new Date(paymentData.transaction_date)
    : paymentData.created_at 
    ? new Date(paymentData.created_at)
    : new Date();

  return (
    <>
      <Head>
        <title>Payment Receipt | M10 DJ Company</title>
        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background: white;
              color: black;
            }
            .dark\\:bg-gray-800,
            .dark\\:bg-gray-900 {
              background: white !important;
            }
            .dark\\:text-white,
            .dark\\:text-gray-100 {
              color: black !important;
            }
            .dark\\:text-gray-400 {
              color: #666 !important;
            }
            .dark\\:border-gray-700 {
              border-color: #ddd !important;
            }
          }
        `}</style>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Action Buttons - Hidden in Print */}
          <div className="no-print flex justify-between items-center mb-6">
            <Link
              href={`/quote/${id}`}
              className="btn-outline inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Booking
            </Link>
            <button
              onClick={handleDownload}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
          </div>

          {/* Receipt Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-brand rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Receipt</h1>
              <p className="text-gray-600 dark:text-gray-400">Thank you for your payment!</p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-6 mb-8">
              {/* Payment Information */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Amount Paid:</span>
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-green-200 dark:border-green-800">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Date:</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {paymentDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  {paymentData.payment_method && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Method:</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {paymentData.payment_method}
                      </p>
                    </div>
                  )}
                  {paymentData.transaction_id && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Transaction ID:</p>
                      <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {paymentData.transaction_id}
                      </p>
                    </div>
                  )}
                  {paymentData.payment_intent && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Intent:</p>
                      <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {paymentData.payment_intent}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* What Was Paid For */}
              {quoteData && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Payment For:
                  </h3>
                  <div className="space-y-3">
                    {/* Package */}
                    {quoteData.package_name && (
                      <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{quoteData.package_name}</p>
                          {quoteData.package_price && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Package Price: ${quoteData.package_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Add-ons */}
                    {quoteData.addons && Array.isArray(quoteData.addons) && quoteData.addons.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add-ons:</p>
                        {quoteData.addons.map((addon, index) => (
                          <div key={index} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{addon.name || 'Add-on'}</p>
                              {addon.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{addon.description}</p>
                              )}
                            </div>
                            {addon.price && (
                              <p className="text-sm font-semibold text-gray-900 dark:text-white ml-4">
                                ${addon.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Information */}
              {leadData && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Information:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Name:</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {leadData.name || `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim() || 'N/A'}
                      </p>
                    </div>
                    {leadData.email && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email:</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{leadData.email}</p>
                      </div>
                    )}
                    {leadData.phone && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone:</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{leadData.phone}</p>
                      </div>
                    )}
                    {leadData.eventDate && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Event Date:</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(leadData.eventDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Company Information */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">M10 DJ Company</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Memphis, TN</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    This is your official payment receipt. Please keep this for your records.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

