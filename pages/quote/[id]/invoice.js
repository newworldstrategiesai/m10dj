import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { FileText, Download, ArrowLeft, Loader2, CheckCircle, Calendar, MapPin, Users } from 'lucide-react';

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

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
      } else {
        // Quote not found, but we can still show invoice based on lead data
        console.log('Quote not found, will display invoice from lead data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <Footer />
        </div>
      </>
    );
  }

  const totalAmount = quoteData?.total_price || 0;
  const depositAmount = totalAmount * 0.5;
  const remainingBalance = totalAmount - depositAmount;
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
        <Header />

        <main className="section-container py-12 md:py-20">
          {/* Header Actions */}
          <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
          <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
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

        <Footer />
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}

