/**
 * Public Payment Page
 * Customers use this to pay invoices via Stripe
 */

import { useState, useEffect } from 'react';
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
  Shield
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  due_date: string;
  line_items: Array<{
    description: string;
    quantity: number;
    rate: number;
    total: number;
  }>;
  contacts: {
    first_name: string;
    last_name: string;
    email_address: string;
  };
}

export default function PaymentPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const fetchInvoice = async () => {
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

  const handlePayment = async () => {
    if (!invoice) return;

    setProcessing(true);
    setError('');

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
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

  return (
    <>
      <Head>
        <title>Pay Invoice {invoice.invoice_number} - M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#fcba00] rounded-full mb-4">
              <FileText className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Payment</h1>
            <p className="text-gray-600">Complete your payment securely with Stripe</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Invoice Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Bill To</h2>
                </div>
                <div className="text-gray-700">
                  <p className="font-medium">{invoice.contacts.first_name} {invoice.contacts.last_name}</p>
                  <p className="text-sm text-gray-600">{invoice.contacts.email_address}</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
                  </div>
                  {invoice.due_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
                  <div className="space-y-3">
                    {invoice.line_items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.description}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} × ${item.rate.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">${item.total.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    {tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-[#fcba00]">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Payment Action */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    ${total.toFixed(2)}
                  </h3>
                  <p className="text-sm text-gray-600">Amount Due</p>
                </div>

                {invoice.status === 'paid' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-900">Already Paid</p>
                    <p className="text-sm text-green-700 mt-1">This invoice has been paid</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full bg-[#fcba00] hover:bg-[#e5a800] active:bg-[#d99800] text-black font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Pay Securely
                        </>
                      )}
                    </button>

                    {/* Security Badges */}
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>Secured by Stripe</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>256-bit SSL encryption</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>PCI compliant</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        By completing this payment, you agree to our terms of service
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Help Section */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p className="font-semibold text-gray-900 mb-2">Need Help?</p>
                <p className="mb-2">Contact us anytime:</p>
                <a href="tel:9014102020" className="text-[#fcba00] hover:underline font-medium">
                  (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

