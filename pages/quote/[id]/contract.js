import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import SignatureCapture from '../../../components/SignatureCapture';
import { FileText, Download, ArrowLeft, Loader2, CheckCircle, Calendar, MapPin, PenTool, X } from 'lucide-react';

export default function ContractPage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signatureMethod, setSignatureMethod] = useState('draw');

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
        
        // If quote has contract_id, fetch contract details
        if (quote.contract_id) {
          try {
            const contractResponse = await fetch(`/api/contracts/${quote.contract_id}`);
            if (contractResponse.ok) {
              const contract = await contractResponse.json();
              setContractData(contract);
            }
          } catch (e) {
            console.log('Could not fetch contract details:', e);
          }
        }
        
        // If quote has invoice_id, fetch invoice details to check payment status
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
        // Quote not found, but we can still show contract based on lead data
        console.log('Quote not found, will display contract from lead data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSignatureModal = () => {
    setShowSignatureModal(true);
  };

  const handleSignatureChange = (data, method) => {
    setSignatureData(data);
    setSignatureMethod(method);
  };

  const handleSign = async () => {
    if (!leadData || !quoteData) return;
    
    if (!signatureData) {
      alert('Please provide your signature before signing the contract.');
      return;
    }
    
    setSigning(true);
    try {
      const response = await fetch(`/api/quote/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          clientName: leadData.name,
          clientEmail: leadData.email,
          signatureData: signatureData,
          signatureMethod: signatureMethod
        })
      });

      if (response.ok) {
        const result = await response.json();
        setContractData(result.contract);
        setShowSignatureModal(false);
        setSignatureData('');
        alert('Contract signed successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sign contract');
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      alert(error.message || 'Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Contract | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading contract...</p>
          </div>
        </div>
      </>
    );
  }

  const totalAmount = quoteData?.total_price || 0;
  const depositAmount = totalAmount * 0.5;
  const remainingBalance = totalAmount - depositAmount;
  const contractNumber = contractData?.contract_number || `CONT-${id.substring(0, 8).toUpperCase()}`;
  const isSigned = contractData?.status === 'signed' || contractData?.signed_at;

  return (
    <>
      <Head>
        <title>Service Contract {contractNumber} | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap"
          rel="stylesheet"
        />
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

          {/* Contract Document */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 print:shadow-none print:rounded-none">
            {/* Contract Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-8 mb-8">
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Contract for Services</h1>
                <p className="text-gray-600 dark:text-gray-400">Contract Number: {contractNumber}</p>
              </div>
              {isSigned && (
                <div className="no-print bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-green-800 dark:text-green-200 font-semibold">Contract Signed</p>
                  {contractData?.signed_at && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Signed on {new Date(contractData.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Contract Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                This Contract for Services (the &quot;Contract&quot;) is made effective as of <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> (the &quot;Effective Date&quot;), by and between <strong>{leadData?.name || 'Client'}</strong> (&quot;Client&quot;) and M10 DJ Company, (&quot;M10&quot;) of 65 Stewart Rd, Eads, Tennessee 38028 (collectively the &quot;Parties&quot;).
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                NOW, THEREFORE, FOR AND IN CONSIDERATION of the mutual promises and agreements contained herein, Client hires M10, and M10 agrees to provide Disc Jockey services (&quot;DJ&quot; services) to Client under the terms and conditions hereby agreed upon by the parties:
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. DESCRIPTION OF SERVICES</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Client hereby agrees to engage M10 to provide Client with DJ services (collectively, the &quot;Services&quot;) to be performed at the following event(s):
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Event Details:</p>
                {leadData?.eventDate && (
                  <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span><strong>Date:</strong> {new Date(leadData.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                )}
                {leadData?.location && (
                  <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2 mt-2">
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span><strong>Location:</strong> {leadData.location}</span>
                  </p>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Services shall consist primarily of providing musical entertainment by means of a recorded music format.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. PERFORMANCE OF SERVICES</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>a.</strong> M10 shall arrive at the event location one hour before the starting time to set-up and conduct sound check. M10&apos;s playlist shall have an unlimited playlist of songs from both latest and old classics. M10 shall incorporate guest&apos;s requests into the playlist unless otherwise directed by Client. Music shall be played without any breaks unless requested by Client. Time is of the essence. Requests for extended playing time beyond the agreed-upon hours of service shall be accommodated if feasible.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>b.</strong> M10 shall be familiar with indoor and outdoor set-up and sound mixing. M10 shall provide multi-color lighting for a ball room effect. M10 shall have high quality microphone and sound system.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. TERM</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Client and M10 agree that this Contract between the Parties is for Services that shall commence on the above date and complete on <strong>{leadData?.eventDate ? new Date(leadData.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the event date'}</strong>. The Contract may be extended and/or renewed by agreement of all Parties in writing thereafter.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. PAYMENT</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For your convenience, payments can be made online using a valid credit card. Otherwise, payment is to be made by cash or check.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                An initial retainer of <strong>${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> of total cost <strong>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> and a signed contract must be secured prior to any services being performed by Consultant. Remaining balance is due as indicated in the schedule below:
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Payment Schedule:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Deposit: ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Due upon signing)</li>
                  <li>Remaining Balance: ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Due 7 days before event)</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. CANCELLATION POLICY</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All retainer fees are non-refundable. Cancellation of this Contract by Client which is received in writing more than 30 days prior to the event will result in a refund of any monies paid, less the retainer fee. Cancellation of Services received less than 30 days prior to the event obligate Client to make full remaining payment of the total fees agreed upon. If cancellation is initiated by M10 all monies paid to M10 from Client shall be fully refunded INCLUDING retainer fee. Any refund shall be paid out at month&apos;s end.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">6. WARRANTY</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                M10 shall provide its services and meet its obligations under this Contract in a timely and workmanlike manner, using knowledge and recommendations for performing the services which meet generally acceptable standards in M10&apos;s industry and region, and will provide a standard of care equal to, or superior to, care used by service providers similar to M10 on similar projects.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">7. SIGNATORIES</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This Agreement shall be signed on behalf of Client by <strong>{leadData?.name || 'Client'}</strong> and on behalf of M10 by Ben Murray, Manager and effective as of the date first above written.
              </p>
            </div>

            {/* Signature Section */}
            {!isSigned && (
              <div className="no-print border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                  <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Ready to Sign?</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    By clicking &quot;Sign Contract&quot; below, you agree to the terms and conditions outlined in this contract.
                  </p>
                </div>
                <button
                  onClick={handleOpenSignatureModal}
                  disabled={signing}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  <PenTool className="w-5 h-5" />
                  Sign Contract
                </button>
              </div>
            )}

            {isSigned && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-4">Client Signature</p>
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded p-4 h-24 flex items-center justify-center">
                      {contractData?.client_signature_data ? (
                        <img src={contractData.client_signature_data} alt="Client Signature" className="max-h-full" />
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">{contractData?.signed_by_client || leadData?.name}</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{contractData?.signed_by_client || leadData?.name}</p>
                    {contractData?.signed_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(contractData.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="font-semibold text-gray-900 dark:text-white">M10 DJ Company Signature</p>
                      {!contractData?.signed_by_vendor_at && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded border border-yellow-300 dark:border-yellow-700">
                          PENDING
                        </span>
                      )}
                    </div>
                    <div className={`border-2 rounded p-4 h-24 flex flex-col items-center justify-center ${
                      contractData?.signed_by_vendor_at 
                        ? 'border-gray-300 dark:border-gray-600' 
                        : 'border-dashed border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                    }`}>
                      {contractData?.vendor_signature_data ? (
                        <img src={contractData.vendor_signature_data} alt="M10 DJ Company Signature" className="max-h-full" />
                      ) : contractData?.signed_by_vendor_at ? (
                        <p className="text-gray-500 dark:text-gray-400">Ben Murray, Manager</p>
                      ) : (
                        <div className="text-center">
                          <p className="text-yellow-700 dark:text-yellow-400 font-medium text-sm">Not Signed</p>
                          <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-1">Awaiting Manager Signature</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Ben Murray</p>
                    {contractData?.signed_by_vendor_at ? (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(contractData.signed_by_vendor_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    ) : (
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 font-medium">
                        Signature Pending
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="no-print max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/quote/${id}/invoice`}
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View Invoice
            </Link>
            <Link
              href={`/quote/${id}/payment`}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Make Payment
            </Link>
          </div>
        </main>

        {/* Signature Modal */}
        {showSignatureModal && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign Contract</h2>
                <button
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSignatureData('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Please review the contract terms above.</strong> By signing below, you agree to all terms and conditions outlined in this contract.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={leadData?.name || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <SignatureCapture
                  onSignatureChange={handleSignatureChange}
                  label="Your Signature"
                  defaultMethod="type"
                />

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    className="mt-1"
                    required
                  />
                  <label htmlFor="agree-terms" className="text-sm text-gray-700 dark:text-gray-300">
                    I understand that this electronic signature is legally binding and has the same effect as a handwritten signature.
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSignatureData('');
                  }}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSign}
                  disabled={signing || !signatureData}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" />
                      Sign Contract
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @media print {
          /* Hide all non-contract elements */
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
          
          /* Contract container styling */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Contract document styling */
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0.75in !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Ensure text is black for printing */
          body, p, span, div, h1, h2, h3, h4, h5, h6, td, th, label {
            color: #000 !important;
          }
          
          /* Keep white backgrounds */
          .bg-white,
          .bg-gray-50,
          .bg-green-50 {
            background: white !important;
          }
          
          /* Yellow warning backgrounds for pending signatures */
          .bg-yellow-50,
          .bg-yellow-100 {
            background: #fef3c7 !important;
          }
          
          /* Dashed border for pending signatures */
          .border-yellow-400,
          .border-yellow-600 {
            border-color: #f59e0b !important;
            border-style: dashed !important;
          }
          
          /* Dark mode text should be black in print */
          .dark\\:text-white,
          .dark\\:text-gray-300,
          .dark\\:text-gray-400 {
            color: #000 !important;
          }
          
          /* Yellow warning text should be dark brown for print visibility */
          .text-yellow-600,
          .text-yellow-700,
          .text-yellow-800,
          .text-yellow-400,
          .text-yellow-500 {
            color: #92400e !important;
          }
          
          /* Pending badge styling for print */
          .bg-yellow-100 {
            background: #fef3c7 !important;
            border: 1px solid #f59e0b !important;
            color: #92400e !important;
          }
          
          /* Signature section */
          .signature-section {
            page-break-inside: avoid;
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
