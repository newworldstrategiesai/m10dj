import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import { CheckCircle, Download, Calendar, Mail, Phone, Loader2, FileText, CreditCard, Receipt, ExternalLink, Sparkles, Link as LinkIcon, Copy, Bookmark } from 'lucide-react';
import ManualPaymentForm from '../../../components/quote/ManualPaymentForm';

export default function ThankYouPage() {
  const router = useRouter();
  const { id, payment_intent, session_id, payment_method, amount } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showManualPaymentForm, setShowManualPaymentForm] = useState(false);
  const [manualPaymentInfo, setManualPaymentInfo] = useState(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
    
    // Check if they came from Venmo/Cash App payment
    const checkManualPayment = () => {
      // Check URL parameter first
      if (payment_method && (payment_method === 'venmo' || payment_method === 'cashapp')) {
        setShowManualPaymentForm(true);
        setManualPaymentInfo({
          paymentMethod: payment_method === 'venmo' ? 'Venmo' : 'Cash App',
          amount: amount ? parseFloat(amount) : null,
          paymentType: null // Will be determined from quote data
        });
        return;
      }
      
      // Check sessionStorage for pending payment
      if (typeof window !== 'undefined') {
        const pendingPayment = sessionStorage.getItem('venmo_payment_pending');
        if (pendingPayment) {
          try {
            const payment = JSON.parse(pendingPayment);
            // Check if payment was made in last 10 minutes
            const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
            if (payment.timestamp > tenMinutesAgo) {
              setShowManualPaymentForm(true);
              setManualPaymentInfo({
                paymentMethod: payment.paymentMethod || 'Venmo',
                amount: parseFloat(payment.amount),
                paymentType: payment.paymentType || null
              });
            } else {
              // Clear old payment data
              sessionStorage.removeItem('venmo_payment_pending');
            }
          } catch (e) {
            console.error('Error parsing pending payment:', e);
          }
        }
      }
    };
    
    checkManualPayment();
  }, [id, payment_intent, session_id, payment_method, amount]);

  const handleCreateAccount = async () => {
    if (!leadData?.email) {
      setAccountMessage({ type: 'error', text: 'Email address not found' });
      return;
    }

    setCreatingAccount(true);
    setAccountMessage(null);

    try {
      const response = await fetch('/api/client/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: leadData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.hasAccount) {
          setAccountStatus('exists');
          setAccountMessage({ 
            type: 'info', 
            text: 'An account already exists for this email. Please sign in to access your portal.' 
          });
        } else {
          setAccountStatus('link-sent');
          setAccountMessage({ 
            type: 'success', 
            text: 'Account creation link sent! Check your email for a magic link to create your account.' 
          });
        }
      } else {
        setAccountMessage({ type: 'error', text: data.message || data.error || 'Failed to create account' });
      }
    } catch (error) {
      console.error('Error creating account:', error);
      setAccountMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleCopyLink = async () => {
    const quoteUrl = `${window.location.origin}/quote/${id}`;
    try {
      await navigator.clipboard.writeText(quoteUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = quoteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

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
        
        // If quote has invoice_id, fetch invoice details
        if (quote.invoice_id) {
          try {
            const invoiceResponse = await fetch(`/api/invoices/${quote.invoice_id}`);
            if (invoiceResponse.ok) {
              const invoice = await invoiceResponse.json();
              setInvoiceData(invoice);
            }
          } catch (e) {
            console.log('Could not fetch invoice details:', e);
          }
        }
      }

      // Fetch payment details if we have a session_id or payment_intent
      if (session_id || payment_intent) {
        try {
          const paymentResponse = await fetch(`/api/stripe/get-payment?${session_id ? `session_id=${session_id}` : `payment_intent=${payment_intent}`}`);
          if (paymentResponse.ok) {
            const payment = await paymentResponse.json();
            setPaymentData(payment);
          }
        } catch (e) {
          console.log('Could not fetch payment details:', e);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Thank You | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading your payment confirmation...</p>
          </div>
        </div>
      </>
    );
  }

  const totalAmount = quoteData?.total_price || 0;
  const depositAmount = totalAmount * 0.5;
  const remainingBalance = totalAmount - depositAmount;
  const firstName = leadData?.name?.split(' ')[0] || 'there';
  const paymentAmount = paymentData?.amount_total ? paymentData.amount_total / 100 : (quoteData?.total_price || 0);

  return (
    <>
      <Head>
        <title>Thank You for Your Payment! | M10 DJ Company</title>
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
              🎉 Thank You, {firstName}!
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-300 mb-2">
              Your payment has been received successfully
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              We&apos;re excited to be part of your special day
            </p>
          </div>

            {/* Manual Payment Recording Form - Show if came from Venmo/Cash App */}
            {showManualPaymentForm && manualPaymentInfo && (
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Record Your {manualPaymentInfo.paymentMethod} Payment
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    We see you completed payment via {manualPaymentInfo.paymentMethod}. Please confirm the details below so we can update your account.
                  </p>
                  <ManualPaymentForm
                    leadId={id}
                    amount={manualPaymentInfo.amount || (quoteData?.total_price || 0)}
                    paymentType={manualPaymentInfo.paymentType || (paymentData ? null : 'deposit')}
                    onPaymentRecorded={() => {
                      // Clear sessionStorage
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('venmo_payment_pending');
                        sessionStorage.removeItem('venmo_thank_you_url');
                      }
                      // Hide form and refresh data
                      setShowManualPaymentForm(false);
                      fetchData();
                    }}
                  />
                </div>
              </div>
            )}

            {/* Payment Recap */}
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Payment Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 border-2 border-green-200 dark:border-green-800">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-green-600" />
                Payment Confirmation
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                  <span className="text-3xl font-bold text-green-600">${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                {/* What You Paid For */}
                {quoteData && (
                  <div className="pt-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What You Paid For:</h3>
                    <div className="space-y-3">
                      {/* Package */}
                      {quoteData.package_name && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{quoteData.package_name}</p>
                              {quoteData.package_price && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  ${quoteData.package_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Add-ons */}
                      {quoteData.addons && Array.isArray(quoteData.addons) && quoteData.addons.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add-ons:</p>
                          {quoteData.addons.map((addon, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
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
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Total */}
                      {quoteData.total_price && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              ${quoteData.total_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {paymentData?.payment_intent && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Transaction ID:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{paymentData.payment_intent}</span>
                  </div>
                )}
                {paymentData?.created && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Payment Date:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(paymentData.created * 1000).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {paymentAmount < totalAmount && (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                    <span className="text-xl font-semibold">${(totalAmount - paymentAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>📧 Receipt Sent:</strong> A payment receipt has been sent to {leadData?.email || 'your email address'}.
                </p>
              </div>
            </div>

            {/* What Just Happened */}
            <div className="bg-gradient-to-r from-brand/10 to-purple-500/10 rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-brand" />
                What Just Happened?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold">Payment Processed</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your payment of ${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been securely processed and confirmed.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold">Booking Confirmed</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your event booking is now confirmed and secured. We&apos;ve reserved your date!
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold">Documents Generated</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your contract and invoice have been created and are ready for review.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <p className="font-semibold">Email Confirmation Sent</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Check your inbox at {leadData?.email || 'your email'} for a detailed confirmation with all your booking information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Your Link - Most Important */}
            <div className="bg-gradient-to-r from-brand to-purple-600 rounded-2xl shadow-xl p-8 md:p-12 text-white">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Bookmark className="w-6 h-6" />
                Save This Link to Continue Later
              </h2>
              <p className="text-lg mb-6 opacity-90">
                You can return to your booking anytime using this link. No account needed!
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <LinkIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium opacity-90">Your Booking Link:</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded p-3">
                  <code className="text-sm flex-1 break-all text-white/90">
                    {typeof window !== 'undefined' ? `${window.location.origin}/quote/${id}` : `/quote/${id}`}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 bg-white text-brand px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
                  >
                    {linkCopied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium flex items-start gap-2">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Bookmark this page or save the link to easily return and complete your booking, view your contract, make payments, and more.</span>
                </p>
              </div>
              
              {/* Optional Account Creation - Less Prominent */}
              <div className="border-t border-white/20 pt-6 mt-6">
                <p className="text-sm mb-4 opacity-75 text-center">
                  Want a centralized dashboard? Create an account to access all your bookings in one place.
                </p>
                {accountMessage && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    accountMessage.type === 'success' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                      : accountMessage.type === 'error'
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <p className="text-sm font-medium">{accountMessage.text}</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href={`/signin?redirect=${encodeURIComponent('/client/dashboard')}`}
                    className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-white/30"
                  >
                    Sign In
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleCreateAccount}
                    disabled={creatingAccount || accountStatus === 'link-sent'}
                    className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : accountStatus === 'link-sent' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Link Sent!
                      </>
                    ) : (
                      <>
                        Create Account
                        <Mail className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Access Documents */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Quick Access to Your Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href={`/quote/${id}/contract`}
                  className="btn-outline flex flex-col items-center justify-center gap-2 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FileText className="w-8 h-8 text-brand" />
                  <span className="font-semibold">View Contract</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sign & Download</span>
                </Link>
                <Link
                  href={`/quote/${id}/invoice`}
                  className="btn-outline flex flex-col items-center justify-center gap-2 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CreditCard className="w-8 h-8 text-brand" />
                  <span className="font-semibold">View Invoice</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Download PDF</span>
                </Link>
                {paymentData && (
                  <Link
                    href={`/quote/${id}/receipt`}
                    className="btn-outline flex flex-col items-center justify-center gap-2 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Receipt className="w-8 h-8 text-brand" />
                    <span className="font-semibold">View Receipt</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payment confirmation</span>
                  </Link>
                )}
                <Link
                  href={`/quote/${id}`}
                  className="btn-outline flex flex-col items-center justify-center gap-2 p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Calendar className="w-8 h-8 text-brand" />
                  <span className="font-semibold">View Booking</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Return to quote</span>
                </Link>
              </div>
            </div>

            {/* Event Details Recap */}
            {leadData && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-6">Your Event Details</h2>
                <div className="space-y-4">
                  {leadData.eventDate && (
                    <div className="flex items-start gap-4">
                      <Calendar className="w-5 h-5 text-brand mt-1" />
                      <div>
                        <p className="font-semibold">Event Date</p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {new Date(leadData.eventDate).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                  )}
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

