import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SignatureCapture from '@/components/SignatureCapture';
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
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [redirectingToPayment, setRedirectingToPayment] = useState(false);

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
        throw new Error(data.error || 'Invalid or expired contract link');
      }

      if (data.contract.status === 'signed') {
        setError('This contract has already been signed.');
        return;
      }

      if (data.contract.status === 'expired') {
        setError('This contract link has expired. Please contact us for a new link.');
        return;
      }

      setContractData(data.contract);
      setSignatureName(`${data.contract.contact.first_name} ${data.contract.contact.last_name}`);

      // Mark as viewed
      await fetch('/api/contracts/mark-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load contract');
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {redirectingToPayment ? 'Redirecting to payment page...' : 'Loading contract...'}
          </p>
          {redirectingToPayment && (
            <p className="text-sm text-gray-500 mt-2">
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
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Contract</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="mailto:m10djcompany@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <Head>
          <title>Contract Signed - M10 DJ Company</title>
        </Head>

        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Contract Signed Successfully! 🎉
            </h1>
            <p className="text-gray-600">
              Thank you for signing the contract. A copy has been sent to your email.
            </p>
          </div>

          {/* Contract Details */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contract Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Contract Number:</span>
                <span className="font-semibold text-gray-900">{contractData?.contract_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Event:</span>
                <span className="font-semibold text-gray-900">{contractData?.event_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Event Date:</span>
                <span className="font-semibold text-gray-900">
                  {contractData?.event_date ? new Date(contractData.event_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold text-gray-900">
                  ${contractData?.total_amount.toLocaleString()}
                </span>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <Head>
        <title>Sign Contract - {contractData?.event_name} - M10 DJ Company</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Contract for Services
              </h1>
              <p className="text-gray-600">
                {contractData?.event_name} - {contractData?.event_date ? new Date(contractData.event_date).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Contract #{contractData?.contract_number}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                ${contractData?.total_amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-6 mb-6 bg-gray-50">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: contractData?.contract_html || '' }}
            />
          </div>

          {/* Signature Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Signer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Legal Name *
              </label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your full legal name"
              />
            </div>

            {/* Signature Capture */}
            <SignatureCapture
              onSignatureChange={handleSignatureChange}
              label="Signature *"
            />

            {/* Agreement Checkbox */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  required
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  I acknowledge that I have read, understood, and agree to the terms and conditions outlined in this contract. 
                  I understand that this electronic signature is legally binding and has the same effect as a handwritten signature.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                By signing, you agree to the terms of this contract
              </p>
              <button
                type="submit"
                disabled={submitting || !signatureData || !agreeToTerms}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
          </form>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 This is a secure signing page. Your signature is encrypted and legally binding.</p>
          <p className="mt-1">Questions? Contact us at m10djcompany@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

