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
  PartyPopper,
  FileText
} from 'lucide-react';
import { triggerConfetti } from '@/utils/confetti';

export default function PaymentSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [confettiTriggered, setConfettiTriggered] = useState(false);

  useEffect(() => {
    if (session_id) {
      fetchPaymentDetails();
    }
  }, [session_id]);

  useEffect(() => {
    // Trigger confetti when page loads and payment is confirmed
    if (!loading && paymentDetails && !confettiTriggered) {
      triggerConfetti({
        duration: 3000,
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#9333ea', '#ec4899']
      });
      setConfettiTriggered(true);
    }
  }, [loading, paymentDetails, confettiTriggered]);

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

                {/* Contract Signing Section */}
                {paymentDetails?.contract && paymentDetails.contract.signing_url && (
                  <div className={`border-2 rounded-xl p-6 mb-6 ${
                    paymentDetails.contract.status === 'signed'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-blue-50 border-blue-300'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        paymentDetails.contract.status === 'signed'
                          ? 'bg-green-100'
                          : 'bg-blue-100'
                      }`}>
                        {paymentDetails.contract.status === 'signed' ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <FileText className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-2 ${
                          paymentDetails.contract.status === 'signed'
                            ? 'text-green-900'
                            : 'text-blue-900'
                        }`}>
                          {paymentDetails.contract.status === 'signed' 
                            ? 'Contract Signed ✓' 
                            : 'Sign Your Contract'}
                        </h3>
                        <p className={`text-sm mb-4 ${
                          paymentDetails.contract.status === 'signed'
                            ? 'text-green-700'
                            : 'text-blue-700'
                        }`}>
                          {paymentDetails.contract.status === 'signed'
                            ? 'Your service agreement has been signed. A copy has been sent to your email.'
                            : 'Please sign your service agreement to complete your booking. You can review and sign it now.'}
                        </p>
                        {paymentDetails.contract.contract_number && (
                          <p className={`text-xs mb-4 ${
                            paymentDetails.contract.status === 'signed'
                              ? 'text-green-600'
                              : 'text-blue-600'
                          }`}>
                            Contract #{paymentDetails.contract.contract_number}
                          </p>
                        )}
                        <a
                          href={paymentDetails.contract.signing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                            paymentDetails.contract.status === 'signed'
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <FileText className="w-5 h-5" />
                          {paymentDetails.contract.status === 'signed'
                            ? 'View Signed Contract'
                            : 'Sign Contract Now'}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

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
                    {paymentDetails?.contract && paymentDetails.contract.status !== 'signed' && (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Sign your service agreement using the button above</span>
                      </li>
                    )}
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

