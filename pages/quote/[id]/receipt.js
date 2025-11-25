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
    if (!id || id === 'null' || id === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      // Fetch all data in parallel, but handle errors gracefully
      const [leadResponse, quoteResponse, paymentsResponse] = await Promise.allSettled([
        fetch(`/api/leads/get-lead?id=${id}`),
        fetch(`/api/quote/${id}`),
        fetch(`/api/payments?contact_id=${id}`)
      ]);

      // Handle lead data
      if (leadResponse.status === 'fulfilled' && leadResponse.value.ok) {
        try {
          const lead = await leadResponse.value.json();
          setLeadData(lead);
        } catch (e) {
          console.error('Error parsing lead data:', e);
        }
      } else {
        console.warn('Failed to fetch lead data:', leadResponse.status === 'rejected' ? leadResponse.reason : 'Response not OK');
      }

      // Handle quote data
      if (quoteResponse.status === 'fulfilled' && quoteResponse.value.ok) {
        try {
          const quote = await quoteResponse.value.json();
          setQuoteData(quote);
        } catch (e) {
          console.error('Error parsing quote data:', e);
        }
      } else {
        console.warn('Failed to fetch quote data:', quoteResponse.status === 'rejected' ? quoteResponse.reason : 'Response not OK');
      }

      // Handle payments data - this is critical for the receipt
      if (paymentsResponse.status === 'fulfilled' && paymentsResponse.value.ok) {
        try {
          const paymentsData = await paymentsResponse.value.json();
          if (paymentsData.payments && paymentsData.payments.length > 0) {
            // Get the most recent paid payment
            const paidPayments = paymentsData.payments
              .filter(p => p.payment_status === 'Paid' || p.payment_status === 'paid' || p.status === 'succeeded')
              .sort((a, b) => {
                const dateA = new Date(a.transaction_date || a.created_at || 0);
                const dateB = new Date(b.transaction_date || b.created_at || 0);
                return dateB - dateA;
              });
            
            if (paidPayments.length > 0) {
              setPaymentData(paidPayments[0]); // Show most recent payment
            } else {
              console.warn('No paid payments found');
            }
          } else {
            console.warn('No payments found in response');
          }
        } catch (e) {
          console.error('Error parsing payments data:', e);
        }
      } else {
        console.error('Failed to fetch payments data:', paymentsResponse.status === 'rejected' ? paymentsResponse.reason : 'Response not OK');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      // Always set loading to false, even if some requests failed
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

  if (!paymentData && !loading) {
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
                We couldn&apos;t find a payment receipt for this booking. This may be because:
              </p>
              <ul className="text-left text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto space-y-2">
                <li>• No payment has been recorded yet</li>
                <li>• Payment is still pending</li>
                <li>• Payment was recorded with a different status</li>
              </ul>
              <div className="flex gap-4 justify-center">
                <Link
                  href={`/quote/${id}`}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Booking
                </Link>
                {id && (
                  <Link
                    href={`/admin/contacts/${id}`}
                    className="btn-outline inline-flex items-center gap-2"
                  >
                    View Contact Details
                  </Link>
                )}
              </div>
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
                    {/* Show actual payment amount, not package price */}
                    <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {paymentData.payment_name || 'Payment'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Amount: ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {quoteData.package_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            For: {quoteData.package_name}
                            {quoteData.total_price && quoteData.total_price > paymentAmount && (
                              <span className="ml-2">(Total: ${quoteData.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Add-ons */}
                    {quoteData.addons && Array.isArray(quoteData.addons) && quoteData.addons.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Service includes:</p>
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

