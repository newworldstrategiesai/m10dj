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
  Shield
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

              {/* Contract Status Banner */}
              {invoice?.contract?.status === 'signed' && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-1 flex items-center gap-2">
                        Contract Signed ✓
                      </h3>
                      <p className="text-sm text-green-700">
                        Your service agreement has been signed. Complete your payment below to finalize your booking.
                      </p>
                      {invoice?.contract?.contract_number && (
                        <p className="text-xs text-green-600 mt-2">
                          Contract #{invoice.contract.contract_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {invoice?.contract?.status === 'signed' && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Contract Signed
                      </span>
                    )}
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
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
                  {invoice.line_items && invoice.line_items.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {invoice.line_items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{item.description || 'Line Item'}</p>
                              <p className="text-sm text-gray-600">
                                {item.quantity || 1} × ${(item.rate || 0).toFixed(2)}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">${((item.total || item.amount || 0)).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium text-gray-900">${(invoice.subtotal || subtotal).toFixed(2)}</span>
                        </div>
                        {invoice.tax_rate && invoice.tax_rate > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax ({invoice.tax_rate}%):</span>
                            <span className="font-medium text-gray-900">${(invoice.tax || 0).toFixed(2)}</span>
                          </div>
                        )}
                        {invoice.discount_amount && invoice.discount_amount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-medium text-gray-900">-${(invoice.discount_amount || 0).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-[#fcba00]">${(invoice.total_amount || total).toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No line items found for this invoice.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Payment Action */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                {invoice.status === 'paid' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-900">Already Paid</p>
                    <p className="text-sm text-green-700 mt-1">This invoice has been paid</p>
                  </div>
                ) : (
                  <>
                    {/* Gratuity Section */}
                    <div className="border-b border-gray-200 pb-4 mb-4">
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Gratuity (Optional)
                      </label>
                      
                      {/* Preset Percentage Buttons */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[10, 15, 20, 25].map((percent) => (
                          <button
                            key={percent}
                            type="button"
                            onClick={() => {
                              setTipType('percentage');
                              setTipPercentage(percent);
                              setCustomTipAmount('');
                            }}
                            className={`py-2 px-2 rounded-lg border-2 transition-all text-xs font-medium ${
                              tipType === 'percentage' && tipPercentage === percent
                                ? 'border-[#fcba00] bg-[#fcba00]/10 text-[#fcba00]'
                                : 'border-gray-300 text-gray-700 hover:border-[#fcba00]'
                            }`}
                          >
                            {percent}%
                          </button>
                        ))}
                      </div>
                      
                      {/* Custom Amount Option */}
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTipType('custom');
                            setCustomTipAmount('');
                          }}
                          className={`w-full py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            tipType === 'custom'
                              ? 'border-[#fcba00] bg-[#fcba00]/10 text-[#fcba00]'
                              : 'border-gray-300 text-gray-700 hover:border-[#fcba00]'
                          }`}
                        >
                          Custom Amount
                        </button>
                        
                        {tipType === 'custom' && (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
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
                              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
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
                          className={`w-full py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                            tipType === 'none'
                              ? 'border-gray-400 bg-gray-100 text-gray-700'
                              : 'border-gray-300 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          No Gratuity
                        </button>
                      </div>
                      
                      {/* Display Selected Gratuity */}
                      {gratuityAmount > 0 && (
                        <div className="flex justify-between text-gray-600 pt-3 mt-3 border-t border-gray-200">
                          <span>
                            Gratuity {tipType === 'percentage' ? `(${tipPercentage}%)` : ''}:
                          </span>
                          <span className="font-medium text-gray-900">
                            ${gratuityAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Amount Display */}
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h3>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      {gratuityAmount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Includes ${gratuityAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} gratuity
                        </p>
                      )}
                    </div>

                    {/* Contract Status Section */}
                    {invoice?.contract?.signing_url && invoice.contract.status !== 'signed' && (
                      <a
                        href={invoice.contract.signing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-3"
                      >
                        <FileText className="w-5 h-5" />
                        Sign Contract
                      </a>
                    )}

                    {invoice?.contract?.status === 'signed' && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-green-900 mb-1">Contract Signed ✓</p>
                            <p className="text-sm text-green-700">
                              Your service agreement has been executed. You're ready to complete payment.
                            </p>
                            {invoice?.contract?.contract_number && (
                              <p className="text-xs text-green-600 mt-1">
                                Contract #{invoice.contract.contract_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

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

