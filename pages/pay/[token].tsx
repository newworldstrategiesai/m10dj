/**
 * Public Payment Page
 * Customers use this to pay invoices via Stripe
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader,
  Calendar,
  User,
  DollarSign,
  FileText,
  Lock,
  Shield,
  Download
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  subtotal?: number;
  tax?: number;
  tax_rate?: number | null;
  discount_amount?: number;
  status: string;
  due_date: string;
  issue_date?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    rate: number;
    total: number;
  }>;
  notes?: string | null;
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    email_address: string;
    phone?: string | null;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<Invoice & { contract?: { id: string; contract_number: string; status: string; signing_url: string | null } | null } | null>(null);
  const [tipType, setTipType] = useState<'none' | 'percentage' | 'custom'>('none');
  const [tipPercentage, setTipPercentage] = useState(15);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [showLineItems, setShowLineItems] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (token && typeof token === 'string') {
      fetchInvoice();
    }
  }, [token]);

  const fetchInvoice = async () => {
    if (!token || typeof token !== 'string') return;
    
    try {
      const response = await fetch(`/api/invoices/get-by-token?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Invoice not found or link expired');
      }

      const data = await response.json();
      
      if (data.invoice.status === 'paid') {
        setError('This invoice has already been paid');
      }
      
      setInvoice(data.invoice);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  // Calculate gratuity amount
  const gratuityAmount = useMemo(() => {
    if (!invoice || tipType === 'none') return 0;
    
    if (tipType === 'percentage') {
      const baseAmount = invoice.total_amount || 0;
      return baseAmount * (tipPercentage / 100);
    } else if (tipType === 'custom') {
      return parseFloat(customTipAmount) || 0;
    }
    
    return 0;
  }, [invoice, tipType, tipPercentage, customTipAmount]);

  // Calculate final total with gratuity
  const finalTotal = useMemo(() => {
    if (!invoice) return 0;
    const baseAmount = invoice.total_amount || 0;
    return baseAmount + gratuityAmount;
  }, [invoice, gratuityAmount]);

  const handlePayment = async () => {
    if (!invoice) return;

    setProcessing(true);
    setError('');

    try {
      // Calculate payment amount (invoice total + gratuity)
      const amountInCents = Math.round(finalTotal * 100);
      
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: amountInCents,
          gratuityAmount: gratuityAmount > 0 ? gratuityAmount : 0,
          gratuityType: gratuityAmount > 0 ? tipType : null,
          gratuityPercentage: (tipType === 'percentage') ? tipPercentage : null,
          paymentType: 'full', // Invoice payments are always full payments
          successUrl: `${window.location.origin}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pay/cancelled?token=${token}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!token || typeof token !== 'string') return;

    setDownloadingPdf(true);
    setError('');

    try {
      const response = await fetch(`/api/invoices/download-pdf-by-token?token=${token}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', response.status, errorText);
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Response is not a PDF:', contentType);
        throw new Error('Server returned invalid PDF format');
      }

      // Create blob and download
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create filename
      const invoiceNumber = invoice?.invoice_number || 'Invoice';
      const firstName = invoice?.contacts?.first_name || '';
      const lastName = invoice?.contacts?.last_name || '';
      const eventDate = invoice?.due_date ? 
        new Date(invoice.due_date).toISOString().split('T')[0] : '';
      
      let filename = 'Invoice';
      if (firstName || lastName) {
        filename = `Invoice-${firstName}${lastName ? `-${lastName}` : ''}`;
      } else {
        filename = `Invoice-${invoiceNumber}`;
      }
      if (eventDate) {
        filename += `-${eventDate}`;
      }
      filename += '.pdf';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError(err.message || 'Failed to download PDF');
      console.error('PDF download error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Handle router query not ready yet
  if (!router.isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-[#fcba00] mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Build default metadata for loading state
  const defaultBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
  const defaultPaymentUrl = token ? `${defaultBaseUrl}/pay/${token}` : `${defaultBaseUrl}/pay`;
  const defaultOgTitle = 'Invoice Payment - M10 DJ Company';
  const defaultOgDescription = 'Complete your secure payment online. Powered by Stripe.';
  const defaultOgImage = `${defaultBaseUrl}/assets/payment-og-image.png`;
  const defaultFallbackOgImage = `${defaultBaseUrl}/logo-static.jpg`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Head>
          <title>{defaultOgTitle}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
          <meta name="robots" content="noindex, nofollow" />
          <meta name="description" content={defaultOgDescription} />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={defaultPaymentUrl} />
          <meta property="og:title" content={defaultOgTitle} />
          <meta property="og:description" content={defaultOgDescription} />
          <meta property="og:image" content={defaultOgImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="M10 DJ Company Payment" />
          <meta property="og:site_name" content="M10 DJ Company" />
          <meta property="og:locale" content="en_US" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={defaultPaymentUrl} />
          <meta name="twitter:title" content={defaultOgTitle} />
          <meta name="twitter:description" content={defaultOgDescription} />
          <meta name="twitter:image" content={defaultOgImage} />
          <meta name="twitter:image:alt" content="M10 DJ Company Payment" />
          <meta name="twitter:creator" content="@m10djcompany" />
          <meta name="twitter:site" content="@m10djcompany" />
        </Head>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-[#fcba00] mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Head>
          <title>Error - M10 DJ Company Payment</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
          <meta name="robots" content="noindex, nofollow" />
          <meta name="description" content="Unable to load invoice. Please contact us for assistance." />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={defaultPaymentUrl} />
          <meta property="og:title" content="Payment Error - M10 DJ Company" />
          <meta property="og:description" content="Unable to load invoice. Please contact us for assistance." />
          <meta property="og:image" content={defaultOgImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="M10 DJ Company Payment" />
          <meta property="og:site_name" content="M10 DJ Company" />
          <meta property="og:locale" content="en_US" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={defaultPaymentUrl} />
          <meta name="twitter:title" content="Payment Error - M10 DJ Company" />
          <meta name="twitter:description" content="Unable to load invoice. Please contact us for assistance." />
          <meta name="twitter:image" content={defaultOgImage} />
          <meta name="twitter:image:alt" content="M10 DJ Company Payment" />
          <meta name="twitter:creator" content="@m10djcompany" />
          <meta name="twitter:site" content="@m10djcompany" />
        </Head>
        
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Invoice</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact us at{' '}
              <a href="tel:9014102020" className="text-[#fcba00] hover:underline">
                (901) 410-2020
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const subtotal = invoice.line_items?.reduce((sum, item) => sum + item.total, 0) || 0;
  const tax = 0; // Calculate if needed
  const total = invoice.total_amount || subtotal;

  // Build Open Graph metadata
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
  const paymentUrl = `${baseUrl}/pay/${token}`;
  const ogTitle = `Pay Invoice ${invoice.invoice_number} - M10 DJ Company`;
  const ogDescription = `Complete your secure payment${invoice.total_amount ? ` of $${invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}${invoice.due_date ? `. Due ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}. Powered by Stripe.`;
  // Use payment-specific OG image if available, fallback to default logo
  const ogImage = `${baseUrl}/assets/payment-og-image.png`;
  const fallbackOgImage = `${baseUrl}/logo-static.jpg`;

  return (
    <>
      <Head>
        <title>{ogTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={paymentUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:secure_url" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`Payment for Invoice ${invoice.invoice_number} - M10 DJ Company`} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:site_name" content="M10 DJ Company" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={paymentUrl} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={`Payment for Invoice ${invoice.invoice_number} - M10 DJ Company`} />
        <meta name="twitter:creator" content="@m10djcompany" />
        <meta name="twitter:site" content="@m10djcompany" />
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse-slow {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slide-in-from-top {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slide-in-from-bottom {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-in {
            animation: fade-in 0.3s ease-out;
          }
          .fade-in {
            animation: fade-in 0.3s ease-out;
          }
          .slide-in-from-top-2 {
            animation: slide-in-from-top 0.3s ease-out;
          }
          .slide-in-from-bottom-2 {
            animation: slide-in-from-bottom 0.3s ease-out;
          }
        `}} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#fcba00] to-[#e5a800] rounded-2xl mb-4 sm:mb-6 shadow-lg transform transition-transform hover:scale-105 active:scale-95">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-black" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Invoice Payment</h1>
            <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">Complete your payment securely with Stripe</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content - Invoice Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bill To</h2>
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <p className="font-medium text-base">{invoice.contacts.first_name} {invoice.contacts.last_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{invoice.contacts.email_address}</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice Details</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {invoice?.contract?.status === 'signed' && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Contract Signed
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Download PDF Button */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {downloadingPdf ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download Invoice PDF</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Invoice Summary - Always Visible */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Invoice Number:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{invoice.invoice_number}</span>
                  </div>
                  {invoice.due_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(() => {
                          try {
                            const date = new Date(invoice.due_date);
                            if (isNaN(date.getTime())) {
                              // If date parsing fails, try to extract just the day if it's just a number
                              const dayOnly = parseInt(invoice.due_date);
                              if (!isNaN(dayOnly) && dayOnly >= 1 && dayOnly <= 31) {
                                // Assume it's the day of the current month/year
                                const now = new Date();
                                const fullDate = new Date(now.getFullYear(), now.getMonth(), dayOnly);
                                return fullDate.toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                });
                              }
                              return invoice.due_date; // Fallback to raw value
                            }
                            return date.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                          } catch (e) {
                            return invoice.due_date; // Fallback to raw value
                          }
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                    <span className="text-2xl font-bold text-[#fcba00]">${(invoice.total_amount || total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Line Items - Progressive Disclosure */}
                {invoice.line_items && invoice.line_items.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                      onClick={() => setShowLineItems(!showLineItems)}
                      className="w-full flex items-center justify-between text-left mb-3 group"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#fcba00] transition-colors">
                        Service Details
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.line_items.length} {invoice.line_items.length === 1 ? 'item' : 'items'}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${
                            showLineItems ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {showLineItems && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {invoice.line_items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{item.description || 'Line Item'}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {item.quantity || 1} × ${(item.rate || 0).toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900 dark:text-white">${((item.total || item.amount || 0)).toFixed(2)}</p>
                          </div>
                        ))}

                        {/* Detailed Totals */}
                        <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                            <span className="font-medium text-gray-900 dark:text-white">${(invoice.subtotal || subtotal).toFixed(2)}</span>
                          </div>
                          {invoice.tax_rate && invoice.tax_rate > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Tax ({invoice.tax_rate}%):</span>
                              <span className="font-medium text-gray-900 dark:text-white">${(invoice.tax || 0).toFixed(2)}</span>
                            </div>
                          )}
                          {invoice.discount_amount && invoice.discount_amount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">-${(invoice.discount_amount || 0).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Payment Action */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:sticky lg:top-6 transition-shadow hover:shadow-2xl">
                {invoice.status === 'paid' ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <p className="font-bold text-lg text-green-900 dark:text-green-100">Already Paid</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">This invoice has been paid</p>
                  </div>
                ) : (
                  <>
                    {/* Contract Status */}
                    {invoice?.contract && invoice.contract.signing_url && (
                      <div className={`mb-6 rounded-xl p-4 border-2 transition-all ${
                        invoice.contract.status === 'signed' 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700' 
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-700'
                      }`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              invoice.contract.status === 'signed' 
                                ? 'bg-green-100 dark:bg-green-900/50' 
                                : 'bg-blue-100 dark:bg-blue-900/50'
                            }`}>
                              {invoice.contract.status === 'signed' ? (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : (
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold mb-1 text-sm ${
                              invoice.contract.status === 'signed' 
                                ? 'text-green-900 dark:text-green-100' 
                                : 'text-blue-900 dark:text-blue-100'
                            }`}>
                              {invoice.contract.status === 'signed' ? 'Contract Signed ✓' : 'Service Agreement'}
                            </p>
                            <p className={`text-xs ${
                              invoice.contract.status === 'signed' 
                                ? 'text-green-700 dark:text-green-300' 
                                : 'text-blue-700 dark:text-blue-300'
                            }`}>
                              {invoice.contract.status === 'signed' 
                                ? "Your service agreement has been executed."
                                : "Review and sign your service agreement. You can complete payment at any time."}
                            </p>
                            {invoice.contract.contract_number && (
                              <p className={`text-xs mt-1 ${
                                invoice.contract.status === 'signed' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                Contract #{invoice.contract.contract_number}
                              </p>
                            )}
                          </div>
                        </div>
                        <a
                          href={invoice.contract.signing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 ${
                            invoice.contract.status === 'signed'
                              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          {invoice.contract.status === 'signed' 
                            ? 'View Signed Contract' 
                            : 'Sign Contract'}
                        </a>
                      </div>
                    )}

                    {/* Amount Display - Prominent */}
                    <div className="text-center mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg animate-pulse-slow">
                        <DollarSign className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight transition-all duration-300">
                        ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                      {gratuityAmount > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Includes ${gratuityAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} gratuity
                        </p>
                      )}
                    </div>

                    {/* Gratuity Section - Redesigned */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-4">
                        Add Gratuity (Optional)
                      </label>
                      
                      {/* Preset Percentage Buttons - 2x2 Grid */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                        {[10, 15, 20, 25].map((percent) => {
                          const isSelected = tipType === 'percentage' && tipPercentage === percent;
                          const calculatedAmount = invoice ? (invoice.total_amount || 0) * (percent / 100) : 0;
                          return (
                            <button
                              key={percent}
                              type="button"
                              onClick={() => {
                                setTipType('percentage');
                                setTipPercentage(percent);
                                setCustomTipAmount('');
                              }}
                              className={`py-3 sm:py-3.5 px-3 sm:px-4 rounded-xl border-2 transition-all transform hover:scale-105 active:scale-95 touch-manipulation min-h-[60px] ${
                                isSelected
                                  ? 'border-[#fcba00] bg-[#fcba00]/10 dark:bg-[#fcba00]/20 text-[#fcba00] shadow-md'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#fcba00] dark:hover:border-[#fcba00] bg-white dark:bg-gray-700'
                              }`}
                            >
                              <div className="font-bold text-sm sm:text-base">{percent}%</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                ${calculatedAmount.toFixed(2)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Custom Amount & No Tip Options */}
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTipType('custom');
                            setCustomTipAmount('');
                          }}
                          className={`w-full py-3 px-4 rounded-xl border-2 transition-all text-sm font-semibold transform hover:scale-105 active:scale-95 touch-manipulation min-h-[48px] ${
                            tipType === 'custom'
                              ? 'border-[#fcba00] bg-[#fcba00]/10 dark:bg-[#fcba00]/20 text-[#fcba00] shadow-md'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#fcba00] dark:hover:border-[#fcba00] bg-white dark:bg-gray-700'
                          }`}
                        >
                          Custom Amount
                        </button>
                        
                        {tipType === 'custom' && (
                          <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-semibold">$</span>
                            <input
                              type="number"
                              value={customTipAmount}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                                  setCustomTipAmount(value);
                                }
                              }}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base font-medium focus:ring-2 focus:ring-[#fcba00] focus:border-[#fcba00] transition-all"
                            />
                          </div>
                        )}
                        
                        {/* No Tip Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setTipType('none');
                            setCustomTipAmount('');
                          }}
                          className={`w-full py-3 px-4 rounded-xl border-2 transition-all text-sm font-semibold transform hover:scale-105 active:scale-95 touch-manipulation min-h-[48px] ${
                            tipType === 'none'
                              ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                          }`}
                        >
                          No Gratuity
                        </button>
                      </div>
                      
                      {/* Display Selected Gratuity */}
                      {gratuityAmount > 0 && (
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Gratuity {tipType === 'percentage' ? `(${tipPercentage}%)` : ''}:
                          </span>
                          <span className="font-bold text-lg text-[#fcba00]">
                            ${gratuityAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Security Badges - Above Payment Button */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <p className="text-xs font-semibold text-green-900 dark:text-green-300 mb-3 text-center">Your payment is secure</p>
                      <div className="space-y-2.5 text-xs text-green-800 dark:text-green-300">
                        <div className="flex items-center gap-2.5">
                          <Shield className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="font-medium">Secured by Stripe</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Lock className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="font-medium">256-bit SSL encryption</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="font-medium">PCI compliant</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Button - Enhanced */}
                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className={`w-full bg-gradient-to-r from-[#fcba00] to-[#e5a800] hover:from-[#e5a800] hover:to-[#d99800] active:from-[#d99800] active:to-[#c88600] text-black font-bold py-4 sm:py-5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 mb-4 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation min-h-[56px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md ${
                        processing ? 'cursor-wait' : ''
                      }`}
                    >
                      {processing ? (
                        <>
                          <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                          <span className="text-base sm:text-lg">Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span className="text-base sm:text-lg">Pay Securely</span>
                        </>
                      )}
                    </button>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                        By completing this payment, you agree to our{' '}
                        <a href="/terms" className="text-[#fcba00] hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                          terms of service
                        </a>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Help Section */}
              <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-white mb-2 text-base">Need Help?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Contact us anytime:</p>
                <a 
                  href="tel:9014102020" 
                  className="inline-flex items-center gap-2 text-[#fcba00] hover:text-[#e5a800] font-bold text-lg transition-colors group"
                >
                  <span>(901) 410-2020</span>
                  <svg 
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

