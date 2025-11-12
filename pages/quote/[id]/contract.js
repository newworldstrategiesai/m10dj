import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { FileText, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';

export default function ContractPage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  // Signature canvas
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

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
      } else {
        setError('Quote not found. Please complete service selection first.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current && !loading) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  }, [loading]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!hasSignature || !agreed) {
      alert('Please sign the contract and agree to the terms');
      return;
    }

    setSigning(true);

    try {
      // Get signature as base64
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL();

      // Save signature
      const response = await fetch('/api/quote/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          signature: signatureData,
          agreedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save signature');
      }

      // Redirect to payment page
      router.push(`/quote/${id}/payment`);
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('There was an error saving your signature. Please try again or contact us at (901) 410-2020.');
    } finally {
      setSigning(false);
    }
  };

  const firstName = leadData?.name?.split(' ')[0] || 'there';
  const totalAmount = quoteData?.total_price || 0;

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
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading your contract...</p>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  if (error || !leadData || !quoteData) {
    return (
      <>
        <Head>
          <title>Contract Not Found | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4">
            <div className="max-w-md text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-3xl font-bold mb-4">Contract Not Available</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {error || "Please complete service selection first."}
              </p>
              <Link href={`/quote/${id}`} className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                Back to Service Selection
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Service Agreement | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

        <main className="section-container py-12 md:py-20">
          {/* Progress Indicator */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold hidden sm:inline">Selection</span>
              </div>
              <div className="h-1 w-16 bg-brand"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold">2</div>
                <span className="text-sm font-semibold hidden sm:inline">Contract</span>
              </div>
              <div className="h-1 w-16 bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-400 flex items-center justify-center font-bold">3</div>
                <span className="text-sm font-semibold text-gray-500 hidden sm:inline">Payment</span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full mb-4">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-semibold">Service Agreement</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Review & Sign Your Contract
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Please review the agreement and sign below to proceed to payment
            </p>
          </div>

          {/* Contract Content */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold mb-6">DJ Services Agreement</h2>
              
              <p className="mb-4">
                <strong>Client:</strong> {leadData.name}<br />
                <strong>Email:</strong> {leadData.email}<br />
                <strong>Phone:</strong> {leadData.phone}<br />
                <strong>Event Date:</strong> {leadData.event_date ? new Date(leadData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}<br />
                <strong>Location:</strong> {leadData.location || 'TBD'}
              </p>

              <h3 className="text-xl font-bold mt-8 mb-4">Services Selected</h3>
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
                <div className="mb-4">
                  <p className="font-bold text-brand">{quoteData.package_name}</p>
                  <p className="text-2xl font-bold">${quoteData.package_price?.toLocaleString()}</p>
                </div>
                
                {quoteData.addons && quoteData.addons.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <p className="font-semibold mb-2">Add-ons:</p>
                    <ul className="space-y-2">
                      {quoteData.addons.map((addon, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{addon.name}</span>
                          <span className="font-semibold">${addon.price?.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Total:</span>
                    <span className="text-3xl font-bold text-brand">${totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-8 mb-4">Terms & Conditions</h3>
              
              <p className="mb-4">
                This agreement is made between M10 DJ Company ("Service Provider") and {leadData.name} ("Client") for DJ entertainment services.
              </p>

              <h4 className="font-bold mt-6 mb-2">1. Services</h4>
              <p className="mb-4">
                Service Provider agrees to provide professional DJ and entertainment services as selected above for the Client&apos;s event on {leadData.event_date ? new Date(leadData.event_date).toLocaleDateString() : 'the specified date'}.
              </p>

              <h4 className="font-bold mt-6 mb-2">2. Payment Terms</h4>
              <p className="mb-4">
                Total fee: ${totalAmount.toLocaleString()}. A 50% deposit (${(totalAmount * 0.5).toLocaleString()}) is due upon signing this agreement. The remaining balance is due 7 days before the event date.
              </p>

              <h4 className="font-bold mt-6 mb-2">3. Cancellation Policy</h4>
              <p className="mb-4">
                Cancellations more than 90 days before the event: Full refund minus $200 administrative fee.<br />
                Cancellations 60-90 days before: 50% refund.<br />
                Cancellations less than 60 days before: No refund, but may reschedule within 1 year.
              </p>

              <h4 className="font-bold mt-6 mb-2">4. Service Provider Responsibilities</h4>
              <ul className="list-disc pl-6 mb-4">
                <li>Arrive on time and provide services as specified</li>
                <li>Maintain professional equipment in good working condition</li>
                <li>Dress professionally and maintain professional demeanor</li>
                <li>Provide backup equipment for critical components</li>
              </ul>

              <h4 className="font-bold mt-6 mb-2">5. Client Responsibilities</h4>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide accurate event details and timeline</li>
                <li>Ensure venue has appropriate electrical power and space</li>
                <li>Provide final music preferences at least 2 weeks before event</li>
                <li>Ensure payment is received per the payment terms</li>
              </ul>

              <h4 className="font-bold mt-6 mb-2">6. Force Majeure</h4>
              <p className="mb-4">
                Neither party shall be liable for failure to perform due to circumstances beyond their reasonable control, including but not limited to acts of God, severe weather, or government restrictions.
              </p>
            </div>

            {/* Signature Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
              <h3 className="text-xl font-bold mb-6">Electronic Signature</h3>
              
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-brand focus:ring-brand rounded"
                  />
                  <span className="text-sm">
                    I have read and agree to the terms and conditions outlined in this service agreement. I understand that this electronic signature is legally binding.
                  </span>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Sign below:
                </label>
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <button
                  onClick={clearSignature}
                  className="text-sm text-gray-600 hover:text-brand mt-2"
                >
                  Clear Signature
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6">
                <Link
                  href={`/quote/${id}`}
                  className="btn-outline inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Selection
                </Link>
                
                <button
                  onClick={handleSubmit}
                  disabled={!hasSignature || !agreed || signing}
                  className={`btn-primary inline-flex items-center gap-2 ${
                    (!hasSignature || !agreed || signing) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {signing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue to Payment →
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

