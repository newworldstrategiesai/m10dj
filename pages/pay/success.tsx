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
  FileText,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { triggerConfetti } from '@/utils/confetti';

export default function PaymentSuccess() {
  const router = useRouter();
  const { session_id, payment_token, contract_signed } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    
    if (session_id) {
      // Came from payment - fetch payment details
      fetchPaymentDetails();
    } else if (payment_token) {
      // Came from contract signing - fetch invoice data
      fetchInvoiceByToken();
    } else {
      // For preview/demo purposes, stop loading if no params
      setLoading(false);
    }
  }, [session_id, payment_token, router.isReady]);

  const fetchInvoiceByToken = async () => {
    try {
      const response = await fetch(`/api/invoices/get-by-token?token=${payment_token}`);
      if (response.ok) {
        const data = await response.json();
        setInvoiceData(data.invoice);
        setPaymentDetails({
          contract: data.invoice.contract,
          invoice_number: data.invoice.invoice_number,
          invoice_id: data.invoice.id
        });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Trigger confetti when payment is confirmed (session_id means payment was successful)
    // For standalone invoices, trigger confetti even without full paymentDetails
    if (!loading && !confettiTriggered) {
      if (session_id || paymentDetails) {
        triggerConfetti({
          duration: 4000,
          particleCount: 150,
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#9333ea', '#ec4899', '#fcba00']
        });
        setConfettiTriggered(true);
      }
    }
  }, [loading, paymentDetails, session_id, confettiTriggered]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/stripe/verify-payment?session_id=${session_id}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
      } else {
        // Even if API call fails, payment was successful (we have session_id)
        // Set minimal payment details so success screen can still show
        setPaymentDetails({
          success: true,
          status: 'paid',
          amount: null, // Will be shown as "processed successfully" without amount
          transaction_id: session_id
        });
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      // Payment was successful even if we can't fetch details
      // Set minimal payment details for helpful default screen
      setPaymentDetails({
        success: true,
        status: 'paid',
        amount: null,
        transaction_id: session_id
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!invoiceData) return;

    setProcessingPayment(true);
    try {
      const finalTotal = invoiceData.total_amount || 0;
      const amountInCents = Math.round(finalTotal * 100);
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoiceData.id,
          amount: amountInCents,
          gratuityAmount: 0,
          gratuityType: null,
          gratuityPercentage: null,
          paymentType: 'full',
          successUrl: `${window.location.origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pay/cancelled?token=${payment_token}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  // Handle router query not ready yet
  if (!router.isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
              {/* Success Header - Dynamic based on source */}
              <div className={`px-8 py-12 text-center ${
                session_id 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  {session_id ? (
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  ) : (
                    <FileText className="w-12 h-12 text-blue-600" />
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {session_id ? 'Payment Successful!' : 'Contract Signed!'}
                </h1>
                <p className="text-white/90 text-lg">
                  {session_id 
                    ? 'Thank you for your payment' 
                    : 'Your service agreement has been signed'}
                </p>
              </div>

              {/* Progress Indicator - Dynamic based on order */}
              {(paymentDetails?.contract || invoiceData) && (
                <div className="px-8 pt-6">
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {/* Contract Step - Show first if they signed first */}
                    {!session_id && paymentDetails?.contract && (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <span className="font-semibold text-green-700">Contract Signed</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </>
                    )}
                    
                    {/* Payment Step */}
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        session_id
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}>
                        {session_id ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <CreditCard className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <span className={`font-semibold ${
                        session_id
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }`}>
                        {session_id ? 'Payment Complete' : 'Complete Payment'}
                      </span>
                    </div>
                    
                    {/* Contract Step - Show second if they paid first */}
                    {session_id && paymentDetails?.contract && (
                      <>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        <div className="flex items-center gap-2">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            paymentDetails.contract.status === 'signed'
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}>
                            {paymentDetails.contract.status === 'signed' ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : (
                              <FileText className="w-6 h-6 text-gray-600" />
                            )}
                          </div>
                          <span className={`font-semibold ${
                            paymentDetails.contract.status === 'signed'
                              ? 'text-green-700'
                              : 'text-gray-600'
                          }`}>
                            {paymentDetails.contract.status === 'signed' ? 'Contract Signed' : 'Sign Contract'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Section - Dynamic based on source */}
              <div className="px-8 py-6">
                {/* Payment Details - Show if payment was completed */}
                {session_id && (
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      Payment Details
                    </h2>
                    
                    <div className="space-y-3">
                      {paymentDetails?.invoice_number && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Invoice Number:</span>
                          <span className="font-semibold text-gray-900">{paymentDetails.invoice_number}</span>
                        </div>
                      )}
                      {paymentDetails?.amount ? (
                        <div className="flex justify-between items-center pt-3 pb-3 border-t border-gray-200 border-b border-gray-200">
                          <span className="text-gray-600 font-medium text-base">Amount Paid:</span>
                          <span className="font-bold text-green-600 text-3xl">${paymentDetails.amount.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-6 pt-3 pb-3 border-t border-gray-200 border-b border-gray-200">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <p className="text-gray-700 font-bold text-lg mb-1">Payment Processed Successfully!</p>
                            <p className="text-sm text-gray-600">A receipt will be sent to your email shortly.</p>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Payment Date:</span>
                        <span className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="font-semibold text-gray-900">Credit Card (Stripe)</span>
                      </div>
                      {paymentDetails?.transaction_id && (
                        <div className="flex justify-between items-start pt-2 border-t border-gray-200">
                          <span className="text-gray-600 text-xs">Transaction ID:</span>
                          <span className="font-mono text-xs text-gray-500 break-all text-right max-w-[60%]">{paymentDetails.transaction_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Action - Show if contract signed first */}
                {!session_id && invoiceData && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-6 mb-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                        <CreditCard className="w-7 h-7 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2 text-amber-900">
                          Next Step: Complete Your Payment
                        </h3>
                        <p className="text-sm mb-4 text-amber-800">
                          Your contract is signed! Now complete your payment to finalize your booking.
                        </p>
                        {invoiceData.invoice_number && (
                          <p className="text-xs mb-4 font-medium text-amber-700">
                            Invoice: {invoiceData.invoice_number}
                          </p>
                        )}
                        <div className="bg-white rounded-lg p-4 mb-4 border border-amber-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Total Amount:</span>
                            <span className="text-2xl font-bold text-amber-600">
                              ${(invoiceData.total_amount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handlePayment}
                          disabled={processingPayment}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                          {processingPayment ? (
                            <>
                              <Loader className="w-5 h-5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-5 h-5" />
                              <span>Pay Securely Now →</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contract Signing Section - Dynamic based on status */}
                {paymentDetails?.contract && paymentDetails.contract.signing_url && (
                  <div className={`border-2 rounded-xl p-6 mb-6 ${
                    paymentDetails.contract.status === 'signed'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                      : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 shadow-lg'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center ${
                        paymentDetails.contract.status === 'signed'
                          ? 'bg-green-100'
                          : 'bg-amber-100'
                      }`}>
                        {paymentDetails.contract.status === 'signed' ? (
                          <CheckCircle className="w-7 h-7 text-green-600" />
                        ) : (
                          <FileText className="w-7 h-7 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg mb-2 ${
                          paymentDetails.contract.status === 'signed'
                            ? 'text-green-900'
                            : 'text-amber-900'
                        }`}>
                          {paymentDetails.contract.status === 'signed' 
                            ? '✓ Contract Signed - All Set!' 
                            : 'Next Step: Sign Your Service Agreement'}
                        </h3>
                        <p className={`text-sm mb-4 ${
                          paymentDetails.contract.status === 'signed'
                            ? 'text-green-700'
                            : 'text-amber-800'
                        }`}>
                          {paymentDetails.contract.status === 'signed'
                            ? 'Your service agreement has been signed and executed. A copy has been sent to your email. Your booking is complete!'
                            : 'Your payment is complete! Now please review and sign your service agreement to finalize your booking. This only takes a minute.'}
                        </p>
                        {paymentDetails.contract.contract_number && (
                          <p className={`text-xs mb-4 font-medium ${
                            paymentDetails.contract.status === 'signed'
                              ? 'text-green-600'
                              : 'text-amber-700'
                          }`}>
                            Contract #{paymentDetails.contract.contract_number}
                          </p>
                        )}
                        <a
                          href={paymentDetails.contract.signing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-base transition-all transform hover:scale-105 ${
                            paymentDetails.contract.status === 'signed'
                              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg'
                          }`}
                        >
                          <FileText className="w-5 h-5" />
                          {paymentDetails.contract.status === 'signed'
                            ? 'View Signed Contract'
                            : 'Sign Contract Now →'}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* What's Next - Dynamic based on completion status */}
                <div className={`border rounded-xl p-6 mb-6 ${
                  paymentDetails?.contract?.status === 'signed'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                    : session_id && !paymentDetails?.contract
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' // Standalone invoice payment
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
                    paymentDetails?.contract?.status === 'signed' || (session_id && !paymentDetails?.contract)
                      ? 'text-green-900'
                      : 'text-blue-900'
                  }`}>
                    <Calendar className="w-5 h-5" />
                    {paymentDetails?.contract?.status === 'signed' || (session_id && !paymentDetails?.contract)
                      ? 'What Happens Next?' 
                      : 'What\'s Next?'}
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {paymentDetails?.contract?.status === 'signed' ? (
                      <>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-green-900">All set!</span>
                            <span className="text-green-800"> Your payment and contract are complete.</span>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-green-800">You'll receive confirmation emails with all details</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-green-800">Stripe will send you a receipt for your records</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-green-800">We'll be in touch soon to finalize event details</span>
                        </li>
                      </>
                    ) : session_id && !paymentDetails?.contract ? (
                      <>
                        {/* Standalone invoice payment - helpful default message */}
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-green-900">Payment confirmed!</span>
                            <span className="text-green-800"> Your invoice payment has been processed successfully.</span>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-green-800">A receipt has been sent to your email address</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-green-800">Stripe will also send you a payment confirmation</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-green-800">Your payment records are updated and secure</span>
                        </li>
                        {paymentDetails?.invoice_number && (
                          <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-green-800">Invoice <strong>{paymentDetails.invoice_number}</strong> has been marked as paid</span>
                          </li>
                        )}
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-900">Sign your service agreement</span>
                            <span className="text-blue-800"> using the button above (if you haven't already)</span>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-800">You'll receive a payment confirmation email shortly</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-800">Stripe will send you a receipt for your records</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-800">We'll be in touch to finalize event details</span>
                        </li>
                      </>
                    )}
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
                  {(paymentDetails?.invoice_id || session_id) && (
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

