import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import { FileText, Download, ArrowLeft, Loader2, CheckCircle, Calendar, MapPin, Users } from 'lucide-react';

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [hasPayment, setHasPayment] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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

        // Fetch payment data to show payment status
        try {
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
              } else {
                setHasPayment(false);
              }
            } else {
              setHasPayment(false);
            }
          }
        } catch (error) {
          console.error('Error checking payments:', error);
          setHasPayment(false);
        }
      } else {
        // Quote not found, but we can still show invoice based on lead data
        console.log('Quote not found, will display invoice from lead data');
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
    // Generate PDF or print
    window.print();
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Invoice | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading invoice...</p>
          </div>
        </div>
      </>
    );
  }

  const totalAmount = quoteData?.total_price || 0;
  const depositAmount = totalAmount * 0.5;
  const actualPaid = paymentData?.totalPaid || 0;
  const remainingBalance = totalAmount - actualPaid;
  const isFullyPaid = actualPaid >= totalAmount;
  const isPartiallyPaid = actualPaid > 0 && actualPaid < totalAmount;
  const invoiceNumber = invoiceData?.invoice_number || `INV-${id.substring(0, 8).toUpperCase()}`;
  const invoiceDate = invoiceData?.invoice_date || new Date().toISOString().split('T')[0];
  const dueDate = invoiceData?.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <>
      <Head>
        <title>Invoice {invoiceNumber} | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header className="no-print" />

        <main className="section-container py-12 md:py-20">
          {/* Header Actions */}
          <div className="no-print max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Link
              href={`/quote/${id}/confirmation`}
              className="inline-flex items-center gap-2 text-brand hover:text-brand-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Confirmation
            </Link>
            <button
              onClick={handleDownload}
              className="btn-outline inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Invoice Document */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 print:shadow-none print:rounded-none">
            {/* Company Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-8 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-brand mb-2">M10 DJ Company</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    65 Stewart Rd<br />
                    Eads, Tennessee 38028<br />
                    Phone: (901) 410-2020<br />
                    Email: info@m10djcompany.com
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-4xl font-bold mb-2">INVOICE</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Invoice #: <span className="font-semibold text-gray-900 dark:text-white">{invoiceNumber}</span><br />
                    Date: <span className="font-semibold text-gray-900 dark:text-white">{new Date(invoiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span><br />
                    Due Date: <span className="font-semibold text-gray-900 dark:text-white">{new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            {leadData && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Bill To:</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{leadData.name}</p>
                {leadData.email && (
                  <p className="text-gray-600 dark:text-gray-400">{leadData.email}</p>
                )}
                {leadData.phone && (
                  <p className="text-gray-600 dark:text-gray-400">{leadData.phone}</p>
                )}
                {leadData.location && (
                  <div className="mt-2 flex items-start gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mt-1" />
                    <span>{leadData.location}</span>
                  </div>
                )}
                {leadData.eventDate && (
                  <div className="mt-2 flex items-start gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mt-1" />
                    <span>{new Date(leadData.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            )}

            {/* Line Items */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Description</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900 dark:text-white">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteData && (
                    <>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{quoteData.package_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Wedding DJ Package</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          ${quoteData.package_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {quoteData.addons && quoteData.addons.length > 0 && (
                        <>
                          {quoteData.addons.map((addon, idx) => (
                            <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-4 px-4">
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">{addon.name}</p>
                                  {addon.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{addon.description}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right font-semibold text-gray-900 dark:text-white">
                                ${addon.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-full md:w-1/2">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white">
                      <span>Total:</span>
                      <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  {/* Payment Status */}
                  {hasPayment && (
                    <>
                      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Amount Paid:</span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            ${actualPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        {!isFullyPaid && (
                          <div className="flex justify-between text-gray-600 dark:text-gray-400 mt-1">
                            <span>Remaining Balance:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                      {isFullyPaid && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Invoice Paid in Full</span>
                          </div>
                        </div>
                      )}
                      {isPartiallyPaid && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <span className="font-semibold">Partially Paid</span>
                          </div>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Terms</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Deposit Required:</strong> ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (50% of total)</p>
                <p><strong>Remaining Balance:</strong> ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due 7 days before event</p>
                <p>Payments can be made online via credit card, or by cash or check.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Thank you for choosing M10 DJ Company!</p>
              <p className="mt-2">Questions? Contact us at (901) 410-2020 or info@m10djcompany.com</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="no-print max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/quote/${id}/payment`}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Make Payment
            </Link>
            <Link
              href={`/quote/${id}/contract`}
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View Contract
            </Link>
          </div>
        </main>

      </div>

      <style jsx global>{`
        @media print {
          /* Hide all non-invoice elements */
          .no-print,
          header,
          nav,
          footer,
          .no-print * {
            display: none !important;
          }
          
          /* Reset page styling */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Invoice container styling */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Invoice document styling */
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0.75in !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Ensure text is black for printing */
          * {
            color: #000 !important;
          }
          
          /* Keep white backgrounds */
          .bg-white,
          .bg-gray-50 {
            background: white !important;
          }
          
          /* Dark mode text should be black in print */
          .dark\\:text-white,
          .dark\\:text-gray-300,
          .dark\\:text-gray-400 {
            color: #000 !important;
          }
          
          /* Brand color should be dark for print */
          .text-brand {
            color: #000 !important;
          }
          
          /* Page breaks */
          .page-break {
            page-break-before: always;
          }
          
          /* No page breaks inside important sections */
          h1, h2, h3 {
            page-break-after: avoid;
          }
          
          /* Print-friendly spacing */
          @page {
            margin: 0.75in;
            size: letter;
          }
        }
      `}</style>
    </>
  );
}

