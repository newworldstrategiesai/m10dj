/**
 * Mobile-Friendly Contract Signing Page
 * 
 * Clean, focused signing experience for standalone contracts like NDAs.
 * Works without login - uses signing token for authentication.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SignatureCapture from '@/components/SignatureCapture';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ContractData {
  id: string;
  contract_number: string;
  contract_html: string;
  contract_type?: string;
  event_name: string;
  status: string;
  is_personal?: boolean;
  is_standalone?: boolean;
  sender_name?: string;
  contact: {
    first_name: string;
    last_name: string;
    email_address: string;
  };
}

export default function SignPage() {
  const router = useRouter();
  const { token } = router.query;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showFullContract, setShowFullContract] = useState(false);

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

      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired link');
      }

      if (data.contract.status === 'signed') {
        setError('This document has already been signed.');
        return;
      }

      if (data.contract.status === 'expired') {
        setError('This link has expired. Please request a new one.');
        return;
      }

      setContractData(data.contract);
      setSignatureName(`${data.contract.contact.first_name} ${data.contract.contact.last_name}`.trim());

      // Mark as viewed
      await fetch('/api/contracts/mark-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureChange = (data: string, method: 'draw' | 'type') => {
    setSignatureData(data);
    setSignatureMethod(method);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signatureData) {
      alert('Please provide your signature');
      return;
    }

    if (!agreeToTerms) {
      alert('Please confirm that you have read and agree to the terms');
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
        throw new Error(data.error || 'Failed to sign document');
      }

      setSigned(true);
    } catch (err: any) {
      alert(err.message || 'Failed to sign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Document</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Signed success state
  if (signed) {
    return (
      <>
        <Head>
          <title>Document Signed</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Successfully Signed!</h1>
            <p className="text-gray-600 mb-6">
              Your signature has been recorded. A confirmation email has been sent to you.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <p className="text-sm text-gray-500">Document ID</p>
              <p className="font-mono text-gray-900">{contractData?.contract_number}</p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Legally binding electronic signature</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Main signing interface
  const isPersonal = contractData?.is_personal || contractData?.contract_type === 'personal_agreement' || contractData?.contract_type === 'nda';
  const documentTitle = isPersonal ? 'Confidentiality Agreement' : (contractData?.event_name || 'Agreement');

  return (
    <>
      <Head>
        <title>Sign Document - {contractData?.contract_number}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 text-sm sm:text-base">
                  {documentTitle}
                </h1>
                <p className="text-xs text-gray-500">
                  {contractData?.sender_name && `From ${contractData.sender_name}`}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-32">
          {/* Document Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <button
              onClick={() => setShowFullContract(!showFullContract)}
              className="w-full px-4 py-3 flex items-center justify-between text-left border-b border-gray-100"
            >
              <span className="font-medium text-gray-900">View Full Document</span>
              {showFullContract ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {showFullContract && contractData?.contract_html && (
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: contractData.contract_html }}
                />
              </div>
            )}
            
            {!showFullContract && (
              <div className="p-4 text-center text-gray-500 text-sm">
                <p>Tap to expand and read the full document</p>
              </div>
            )}
          </div>

          {/* Signature Section */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Signature</h2>
              
              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                  placeholder="Enter your full legal name"
                  required
                />
              </div>

              {/* Signature Capture */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draw or Type Your Signature
                </label>
                <SignatureCapture 
                  onSignatureChange={handleSignatureChange}
                  initialName={signatureName}
                />
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900">
                  I have read and agree to the terms of this document. I understand that by signing electronically, 
                  my signature is legally binding.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:relative sm:bg-transparent sm:border-0 sm:p-0">
              <button
                type="submit"
                disabled={submitting || !signatureData || !agreeToTerms}
                className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Sign Document
                  </>
                )}
              </button>
              
              <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                Document ID: {contractData?.contract_number}
              </p>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}

