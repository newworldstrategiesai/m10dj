/**
 * Payment Success Page
 * Shown after successful Stripe payment
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  CheckCircle,
  Download,
  Home,
  Mail,
  Calendar,
  Loader,
  PartyPopper
} from 'lucide-react';

export default function PaymentSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (session_id) {
      fetchPaymentDetails();
    }
  }, [session_id]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/stripe/verify-payment?session_id=${session_id}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Payment Successful - M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="text-center">
              <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Confirming your payment...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                <p className="text-green-100 text-lg">Thank you for your payment</p>
              </div>

              {/* Payment Details */}
              <div className="px-8 py-6">
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
                  
                  {paymentDetails ? (
                    <div className="space-y-3">
                      {paymentDetails.invoice_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice Number:</span>
                          <span className="font-semibold text-gray-900">{paymentDetails.invoice_number}</span>
                        </div>
                      )}
                      {paymentDetails.amount && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-semibold text-green-600">${paymentDetails.amount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Date:</span>
                        <span className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-semibold text-gray-900">Credit Card</span>
                      </div>
                      {paymentDetails.transaction_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction ID:</span>
                          <span className="font-mono text-xs text-gray-900">{paymentDetails.transaction_id}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">Your payment has been processed successfully.</p>
                  )}
                </div>

                {/* What's Next */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    What's Next?
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>You'll receive a payment confirmation email shortly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Stripe will send you a receipt for your records</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>We'll be in touch to finalize event details</span>
                    </li>
                  </ul>
                </div>

                {/* Contact Section */}
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Looking forward to making your event amazing!
                  </p>
                  
                  <div className="space-y-3">
                    <a
                      href="mailto:djbenmurray@gmail.com"
                      className="inline-flex items-center gap-2 text-[#fcba00] hover:text-[#e5a800] font-medium"
                    >
                      <Mail className="w-4 h-4" />
                      djbenmurray@gmail.com
                    </a>
                    <br />
                    <a
                      href="tel:9014102020"
                      className="inline-flex items-center gap-2 text-[#fcba00] hover:text-[#e5a800] font-medium"
                    >
                      📞 (901) 410-2020
                    </a>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://m10djcompany.com"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#fcba00] hover:bg-[#e5a800] text-black font-semibold rounded-lg transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Back to Website
                  </a>
                  {paymentDetails?.invoice_id && (
                    <button
                      onClick={() => window.print()}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Print Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Thank You Note */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Thank you for choosing M10 DJ Company!
            </p>
            <p className="text-gray-500 text-xs mt-2">
              If you have any questions, don't hesitate to reach out.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

