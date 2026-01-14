import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SignatureCapture from '@/components/SignatureCapture';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Download,
  Mail
} from 'lucide-react';

interface ContractData {
  id: string;
  contract_number: string;
  contract_html: string;
  event_name: string;
  event_date: string;
  total_amount: number;
  status: string;
  signed_at?: string;
  signed_by_client?: string;
  signed_by_client_email?: string;
  client_signature_data?: string;
  contact: {
    first_name: string;
    last_name: string;
    email_address: string;
  };
}

export default function SignContractPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [ownerSignatureData, setOwnerSignatureData] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);
  const [contractHtmlWithSignatures, setContractHtmlWithSignatures] = useState<string>('');

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/contracts/validate-token?token=${token}`);
      const data = await res.json();

      console.log('[sign-contract] API response:', {
        ok: res.ok,
        has_contract: !!data.contract,
        contract_status: data.contract?.status,
        has_contract_html: !!data.contract?.contract_html,
        contract_html_length: data.contract?.contract_html?.length || 0
      });

      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired contract link');
      }

      if (!data.contract) {
        throw new Error('Contract data not found');
      }

      if (data.contract.status === 'expired') {
        setError('This contract link has expired. Please contact us for a new link.');
        return;
      }

      // Check if contract_html is missing
      if (!data.contract.contract_html) {
        console.warn('[sign-contract] Contract HTML is missing after API call');
        // Try refreshing once more - the API might have regenerated it
        console.log('[sign-contract] Attempting to refresh contract data...');
        setTimeout(async () => {
          const retryRes = await fetch(`/api/contracts/validate-token?token=${token}`);
          const retryData = await retryRes.json();
          if (retryData.contract?.contract_html) {
            setContractData(retryData.contract);
            setLoading(false);
          } else {
            setError('Contract content is not available. Please contact us for assistance.');
            setLoading(false);
          }
        }, 1000);
        return;
      }

      // If contract is already signed, show it in view-only mode
      if (data.contract.status === 'signed') {
        setContractData(data.contract);
        setSigned(true); // Show signed view
        setLoading(false);
        return;
      }

      setContractData(data.contract);
      const clientName = `${data.contract.contact?.first_name || ''} ${data.contract.contact?.last_name || ''}`.trim() || 'Client';
      setSignatureName(clientName);
      
      // Initialize contract HTML with signature areas
      if (data.contract.contract_html) {
        setContractHtmlWithSignatures(data.contract.contract_html);
      }

      // Mark as viewed
      await fetch('/api/contracts/mark-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (err: any) {
      console.error('[sign-contract] Error loading contract:', err);
      setError(err.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureChange = (data: string, method: 'draw' | 'type', signerType?: 'client' | 'owner') => {
    if (signerType === 'owner') {
      setOwnerSignatureData(data);
    } else {
      setSignatureData(data);
      setSignatureMethod(method);
    }
    
    // Update contract HTML to show signature in the signature area
    if (data && contractData?.contract_html) {
      const signatureId = signerType === 'owner' ? 'owner-signature-area' : 'client-signature-area';
      const signatureAreaRegex = new RegExp(
        `<div id="${signatureId}"[^>]*>.*?</div>`,
        's'
      );
      
      const signatureImg = `<img src="${data}" alt="Signature" style="max-width: 100%; height: auto; border: 1px solid #ddd; background: white; padding: 10px; border-radius: 4px;" />`;
      
      const updatedHtml = contractData.contract_html.replace(
        signatureAreaRegex,
        `<div id="${signatureId}" class="signature-capture-area" data-signer-type="${signerType || 'client'}">${signatureImg}</div>`
      );
      setContractHtmlWithSignatures(updatedHtml);
    }
  };

  const handleSubmit = async () => {

    if (!signatureData) {
      alert('Please provide your signature');
      return;
    }

    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signature_name: signatureName,
          signature_data: signatureData,
          signature_method: signatureMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign contract');
      }

      // If invoice payment is needed, redirect to payment page
      if (data.needs_payment && data.payment_token) {
        // Show redirecting state
        setRedirectingToPayment(true);
        // Redirect to payment page after a brief delay
        setTimeout(() => {
          window.location.href = `/pay/${data.payment_token}`;
        }, 1000);
        return;
      }

      setSigned(true);
    } catch (err: any) {
      alert(err.message || 'Failed to sign contract');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || redirectingToPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <Loader className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600">
            {redirectingToPayment ? 'Redirecting to payment page...' : 'Loading contract...'}
          </p>
          {redirectingToPayment && (
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Please complete your payment to finalize your booking.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-center">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Unable to Load Contract</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <a
            href="mailto:m10djcompany@gmail.com"
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Mail className="w-4 h-4" />
            Contact Us
          </a>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-4 sm:py-8 px-4">
        <Head>
          <title>Contract Signed - M10 DJ Company</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        </Head>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                    Contract Signed ✓
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 break-words">
                    {contractData?.event_name} - {contractData?.event_date ? new Date(contractData.event_date).toLocaleDateString() : 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                    Contract #{contractData?.contract_number}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">
                  ${contractData?.total_amount.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Total Amount</div>
              </div>
            </div>
          </div>

          {/* Contract Content */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <div className="mb-4 sm:mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <p className="font-semibold text-sm sm:text-base">This contract has been signed</p>
                </div>
                {contractData && (
                  <div className="mt-3 text-xs sm:text-sm text-green-700 space-y-1">
                    {contractData.signed_by_client && (
                      <p>Signed by: <strong>{contractData.signed_by_client}</strong></p>
                    )}
                    {contractData.signed_at && (
                      <p>Signed on: <strong>{new Date(contractData.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contract HTML Content */}
            <div className="max-h-[50vh] sm:max-h-[600px] overflow-y-auto border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 bg-gray-50">
              <div 
                className="prose prose-sm sm:prose-base max-w-none text-xs sm:text-sm"
                dangerouslySetInnerHTML={{ __html: contractData?.contract_html || '' }}
              />
            </div>

            {/* Signature Display (if available) */}
            {contractData?.client_signature_data && (
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Signature</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <img 
                    src={contractData.client_signature_data} 
                    alt="Contract Signature" 
                    className="max-w-full sm:max-w-xs h-auto border border-gray-300 bg-white p-2 rounded"
                  />
                </div>
              </div>
            )}

            {/* Download/Print Options */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-200 mt-4 sm:mt-6">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                A copy of this signed contract has been sent to your email.
              </p>
              <div className="flex gap-3 justify-center sm:justify-end">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Download className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3">What's Next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>A signed copy of the contract has been sent to your email</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You will receive an invoice for the deposit payment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>We'll be in touch to finalize event details</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Sign Contract - {contractData?.event_name} - M10 DJ Company</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap"
          rel="stylesheet"
        />
        <style jsx global>{`
          /* Google Doc-like styling */
          body {
            font-family: 'Times New Roman', Times, serif !important;
            background: white !important;
          }
          
          .contract-container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in;
            background: white;
            min-height: 100vh;
          }
          
          .contract-content {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
          }
          
          .contract-content h1 {
            font-family: 'Times New Roman', Times, serif;
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20pt;
            border-bottom: 2px solid #000;
            padding-bottom: 10pt;
          }
          
          .contract-content h2 {
            font-family: 'Times New Roman', Times, serif;
            font-size: 14pt;
            font-weight: bold;
            margin-top: 18pt;
            margin-bottom: 12pt;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4pt;
          }
          
          .contract-content p {
            margin: 6pt 0;
            text-align: justify;
          }
          
          .contract-content ul, .contract-content ol {
            margin: 6pt 0;
            padding-left: 30pt;
          }
          
          .contract-content li {
            margin: 3pt 0;
          }
          
          .signature-section {
            margin-top: 30pt;
            padding-top: 15pt;
            border-top: 2px solid #000;
          }
          
          .signature-box {
            margin: 15pt 0;
            padding: 12pt;
            border: 1px solid #ddd;
            background-color: #fafafa;
          }
          
          .signature-capture-area {
            min-height: 60pt;
            margin: 8pt 0;
            padding: 8pt;
            border: 1px dashed #ccc;
            background-color: #fafafa;
          }
          
          /* Mobile adjustments */
          @media (max-width: 768px) {
            .contract-container {
              padding: 20px;
            }
            
            .contract-content {
              font-size: 11pt;
            }
          }
        `}</style>
      </Head>

      <div className="contract-container">
        {/* Contract Content - Full Screen Document Style */}
        <div 
          ref={contractContentRef}
          id="contract-content"
          className="contract-content"
          dangerouslySetInnerHTML={{ __html: contractHtmlWithSignatures || contractData?.contract_html || '' }}
        />

        {/* Signature Modal */}
        <Dialog open={signatureModalOpen} onOpenChange={setSignatureModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {signingFor === 'client' ? 'Sign Contract' : 'Authorized Representative Signature'}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <SignatureCapture
                onSignatureChange={(data, method) => handleSignatureChange(data, method)}
                defaultMethod="type"
                initialName={signingFor === 'client' ? signatureName : ''}
                label={signingFor === 'client' ? 'Your Signature' : 'Signature'}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Agreement Checkbox */}
        <div className="mt-6 mb-6" style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
          <label className="flex items-start gap-3 cursor-pointer" style={{ fontSize: '11pt' }}>
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              required
              className="mt-1 w-4 h-4 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
              style={{ marginTop: '2px' }}
            />
            <span style={{ lineHeight: '1.6' }}>
              I acknowledge that I have read, understood, and agree to the terms and conditions outlined in this contract. 
              I understand that this electronic signature is legally binding and has the same effect as a handwritten signature.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-300 mb-8">
          <p style={{ fontSize: '10pt', color: '#666' }}>
            By signing, you agree to the terms of this contract
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !signatureData || !agreeToTerms}
            className="px-8 py-3 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            style={{ fontSize: '12pt' }}
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Sign Contract
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="text-center mb-4" style={{ fontSize: '9pt', color: '#999', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <p>🔒 This is a secure signing page. Your signature is encrypted and legally binding.</p>
          <p className="mt-1">Questions? Contact us at m10djcompany@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

