import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/company/Header';
import { Music, Mic, CreditCard, DollarSign, Loader2, CheckCircle, AlertCircle, Gift, Zap, Smartphone } from 'lucide-react';

export default function GeneralRequestsPage() {
  const [requestType, setRequestType] = useState('song_request'); // 'song_request' or 'shoutout'
  const [formData, setFormData] = useState({
    songArtist: '',
    songTitle: '',
    recipientName: '',
    recipientMessage: '',
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    message: ''
  });
  
  const [amountType, setAmountType] = useState('preset'); // 'preset' or 'custom'
  const [presetAmount, setPresetAmount] = useState(500); // $5.00 in cents
  const [customAmount, setCustomAmount] = useState('');
  const [isFastTrack, setIsFastTrack] = useState(false);
  const [isNext, setIsNext] = useState(false);
  const [fastTrackFee, setFastTrackFee] = useState(1000); // $10.00 fast-track fee in cents
  const [nextFee, setNextFee] = useState(2000); // $20.00 next fee in cents
  const [minimumAmount, setMinimumAmount] = useState(100); // $1.00 minimum in cents
  const [presetAmounts, setPresetAmounts] = useState([
    { label: '$5', value: 500 },
    { label: '$10', value: 1000 },
    { label: '$20', value: 2000 },
    { label: '$50', value: 5000 }
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [songUrl, setSongUrl] = useState('');
  const [extractingSong, setExtractingSong] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [paymentCode, setPaymentCode] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState({
    cashAppTag: '$DJbenmurray',
    venmoUsername: '@djbenmurray'
  });
  const [currentStep, setCurrentStep] = useState(1); // 1: Song/Shoutout, 2: Payment (Step 2 removed - contact info collected after payment)

  useEffect(() => {
    // Fetch payment settings
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/crowd-request/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.cashAppTag) setPaymentSettings(prev => ({ ...prev, cashAppTag: data.cashAppTag }));
        if (data.venmoUsername) setPaymentSettings(prev => ({ ...prev, venmoUsername: data.venmoUsername }));
        if (data.fastTrackFee) setFastTrackFee(data.fastTrackFee);
        if (data.minimumAmount) setMinimumAmount(data.minimumAmount);
        if (data.presetAmounts && Array.isArray(data.presetAmounts)) {
          const presets = data.presetAmounts.map((amount) => ({
            label: `$${(amount / 100).toFixed(0)}`,
            value: amount
          }));
          setPresetAmounts(presets);
          if (presets.length > 0) {
            setPresetAmount(presets[0].value);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err);
      // Use defaults if fetch fails
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSongUrlChange = async (e) => {
    const url = e.target.value;
    setSongUrl(url);

    // Auto-extract when URL is pasted and looks complete
    if (url && (url.includes('youtube.com') || url.includes('youtu.be') || 
        url.includes('spotify.com') || url.includes('soundcloud.com') || 
        url.includes('tidal.com'))) {
      await extractSongInfo(url);
    }
  };

  const extractSongInfo = async (url) => {
    if (!url || extractingSong) return;

    setExtractingSong(true);
    setError('');

    try {
      const response = await fetch('/api/crowd-request/extract-song-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse extraction response:', parseError);
        setExtractingSong(false);
        setError('Could not extract song information. Please enter the details manually.');
        return;
      }

      if (!response.ok) {
        // Show timeout errors and other non-client errors
        if (response.status === 504 || (response.status !== 400 && response.status !== 404)) {
          setError(data?.error || data?.message || 'Could not extract song information. Please try again or enter the details manually.');
        }
        setExtractingSong(false);
        return;
      }

      // Auto-fill the form fields
      if (data?.title) {
        setFormData(prev => ({
          ...prev,
          songTitle: data.title
        }));
      }

      if (data?.artist) {
        setFormData(prev => ({
          ...prev,
          songArtist: data.artist
        }));
      }

      // Clear the URL field after successful extraction
      if (data.title || data.artist) {
        setTimeout(() => {
          setSongUrl('');
        }, 1000);
      }

    } catch (err) {
      console.error('Error extracting song info:', err);
    } finally {
      setExtractingSong(false);
    }
  };

  const getBaseAmount = () => {
    if (amountType === 'preset') {
      return presetAmount;
    } else {
      const custom = parseFloat(customAmount) || 0;
      return Math.round(custom * 100); // Convert to cents
    }
  };

  const getPaymentAmount = () => {
    const baseAmount = getBaseAmount();
    const fastTrack = (requestType === 'song_request' && isFastTrack) ? fastTrackFee : 0;
    const next = (requestType === 'song_request' && isNext) ? nextFee : 0;
    return baseAmount + fastTrack + next;
  };

  // Check if song selection is complete (for showing payment section)
  const isSongSelectionComplete = () => {
    try {
      if (requestType === 'song_request') {
        return formData?.songTitle?.trim()?.length > 0 && formData?.songArtist?.trim()?.length > 0;
      } else if (requestType === 'shoutout') {
        return formData?.recipientName?.trim()?.length > 0 && formData?.recipientMessage?.trim()?.length > 0;
      }
      return false;
    } catch (err) {
      console.error('Error checking song selection:', err);
      return false;
    }
  };

  // Auto-advance to payment step when song selection is complete
  useEffect(() => {
    if (requestType === 'song_request' && currentStep === 1) {
      const songTitleFilled = formData?.songTitle?.trim()?.length > 0;
      const songArtistFilled = formData?.songArtist?.trim()?.length > 0;
      
      if (songTitleFilled && songArtistFilled) {
        // Small delay to ensure smooth transition and allow user to see the fields are filled
        const timer = setTimeout(() => {
          setCurrentStep(2);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [formData.songTitle, formData.songArtist, requestType, currentStep]);

  const validateForm = () => {
    try {
      // Name and email are optional - we'll use fallbacks if not provided
      // Only require the core request details and payment amount
      
      if (requestType === 'song_request') {
        if (!formData?.songTitle?.trim()) {
          setError('Please enter a song title');
          return false;
        }
        if (!formData?.songArtist?.trim()) {
          setError('Please enter an artist name');
          return false;
        }
      } else if (requestType === 'shoutout') {
        if (!formData?.recipientName?.trim()) {
          setError('Please enter the recipient name');
          return false;
        }
        if (!formData?.recipientMessage?.trim()) {
          setError('Please enter a message for the shoutout');
          return false;
        }
      }

      const amount = getPaymentAmount();
      if (!amount || amount < minimumAmount) {
        setError(`Minimum payment is $${(minimumAmount / 100).toFixed(2)}`);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Validation error:', err);
      setError('Validation error. Please check your inputs and try again.');
      return false;
    }
  };

  // Don't auto-advance - let user control with Continue button

  const handleSubmit = async (e) => {
    try {
      e?.preventDefault?.();
      e?.stopPropagation?.();
    } catch (err) {
      console.warn('Error preventing default:', err);
    }
    
    setError('');

    if (!validateForm()) {
      if (typeof window !== 'undefined' && window.innerWidth < 640 && error) {
        setTimeout(() => {
          try {
            const errorEl = document.querySelector('.bg-red-50, .bg-red-900');
            if (errorEl) {
              errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } catch (scrollErr) {
            console.warn('Scroll error:', scrollErr);
          }
        }, 100);
      }
      return;
    }

    setSubmitting(true);

    try {
      const amount = getPaymentAmount();
      
      // Validate amount before submission
      if (!amount || amount < minimumAmount) {
        throw new Error(`Minimum payment is $${(minimumAmount / 100).toFixed(2)}`);
      }
      
      // Build request body with safe defaults
      const requestBody = {
        eventCode: 'general', // Use 'general' for the public page
        requestType: requestType || 'song_request',
        songArtist: formData?.songArtist?.trim() || null,
        songTitle: formData?.songTitle?.trim() || null,
        recipientName: formData?.recipientName?.trim() || null,
        recipientMessage: formData?.recipientMessage?.trim() || null,
        requesterName: formData?.requesterName?.trim() || 'Guest',
        requesterEmail: formData?.requesterEmail?.trim() || null,
        requesterPhone: formData?.requesterPhone?.trim() || null,
        message: formData?.message?.trim() || null,
        amount: amount || minimumAmount,
        isFastTrack: (requestType === 'song_request' && isFastTrack) || false,
        isNext: (requestType === 'song_request' && isNext) || false,
        fastTrackFee: (requestType === 'song_request' && isFastTrack) ? (fastTrackFee || 0) : 0,
        nextFee: (requestType === 'song_request' && isNext) ? (nextFee || 0) : 0
      };
      
      const response = await fetch('/api/crowd-request/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }).catch((fetchError) => {
        console.error('Network error:', fetchError);
        throw new Error('Network error. Please check your connection and try again.');
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Server error: ${response.status}`;
        const errorDetails = data?.details ? ` (${data.details})` : '';
        const errorHint = data?.hint ? ` Hint: ${data.hint}` : '';
        throw new Error(errorMessage + errorDetails + errorHint);
      }

      // Save request ID, payment code, and show payment method selection
      if (data?.requestId) {
        setRequestId(data.requestId);
        if (data.paymentCode) {
          setPaymentCode(data.paymentCode);
        } else {
          console.warn('⚠️ No payment code received from server');
        }
        setShowPaymentMethods(true);
        setSubmitting(false);
      } else if (data?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback: mark as success even without explicit requestId
        console.warn('⚠️ No requestId or checkoutUrl received, marking as success');
        setSuccess(true);
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
      setSubmitting(false);
      
      if (window.innerWidth < 640) {
        setTimeout(() => {
          const errorEl = document.querySelector('.bg-red-50, .bg-red-900');
          if (errorEl) {
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };

    const handlePaymentMethodSelected = async (paymentMethod) => {
    if (paymentMethod === null) {
      setSelectedPaymentMethod(null);
      setError(''); // Clear any errors when deselecting
      return;
    }
    
    // Clear any previous errors
    setError('');
    setSelectedPaymentMethod(paymentMethod);
    
    if (paymentMethod === 'card') {
      if (!requestId) {
        setError('Request ID is missing. Please try submitting again.');
        setSelectedPaymentMethod(null);
        return;
      }
      
      const amount = getPaymentAmount();
      if (!amount || amount < minimumAmount) {
        setError(`Invalid payment amount. Minimum is $${(minimumAmount / 100).toFixed(2)}`);
        setSelectedPaymentMethod(null);
        return;
      }
      
      setSubmitting(true);
      try {
        console.log('Creating checkout with:', { requestId, amount });
        const response = await fetch('/api/crowd-request/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            amount: amount
          })
        });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse checkout response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}: Failed to create checkout session`;
        console.error('Checkout API error:', {
          status: response.status,
          statusText: response.statusText,
          error: data?.error,
          message: data?.message,
          fullData: data
        });
        throw new Error(errorMsg);
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        console.error('No checkoutUrl in response:', data);
        throw new Error('No checkout URL received from server');
      }
      } catch (err) {
        console.error('Checkout error:', err);
        setError(err.message || 'Failed to create checkout session. Please try again.');
        setSubmitting(false);
        setSelectedPaymentMethod(null); // Reset selection on error
      }
    } else if (paymentMethod === 'cashapp' || paymentMethod === 'venmo') {
      try {
        await fetch('/api/crowd-request/update-payment-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            paymentMethod
          })
        });
      } catch (err) {
        console.error('Error updating payment method:', err);
      }
    }
  };


  // Receipt Request Component - Now collects name and email for contact info
  const ReceiptRequestButton = ({ requestId, amount }) => {
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [receiptName, setReceiptName] = useState('');
    const [receiptEmail, setReceiptEmail] = useState('');
    const [sendingReceipt, setSendingReceipt] = useState(false);
    const [receiptSent, setReceiptSent] = useState(false);
    const [receiptError, setReceiptError] = useState('');

    const handleRequestReceipt = async (e) => {
      e.preventDefault();
      if (!receiptEmail.trim()) {
        setReceiptError('Please enter your email address');
        return;
      }

      setSendingReceipt(true);
      setReceiptError('');

      try {
        const response = await fetch('/api/crowd-request/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            email: receiptEmail.trim(),
            name: receiptName.trim() || null // Optional name
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send receipt');
        }

        setReceiptSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setReceiptEmail('');
          setReceiptName('');
          setReceiptSent(false);
        }, 2000);
      } catch (err) {
        console.error('Error sending receipt:', err);
        setReceiptError(err.message || 'Failed to send receipt. Please try again.');
      } finally {
        setSendingReceipt(false);
      }
    };

    if (receiptSent) {
      return (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4">
          <p className="text-sm text-green-700 dark:text-green-300 font-semibold text-center">
            ✅ Receipt sent! Check your email.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Gift className="w-5 h-5" />
            Get My Receipt (for tax write-offs)
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Optional: Get a receipt for your records
          </p>
        </div>

        {showEmailModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Get Your Receipt
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                Enter your information to receive a receipt for tax purposes. This receipt can be used for expense write-offs.
              </p>

              <form onSubmit={handleRequestReceipt}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Your Name <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={receiptName}
                    onChange={(e) => setReceiptName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your name (optional)"
                    autoFocus
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={receiptEmail}
                    onChange={(e) => setReceiptEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                  {receiptError && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">{receiptError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      setReceiptEmail('');
                      setReceiptName('');
                      setReceiptError('');
                    }}
                    className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={sendingReceipt}
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReceipt ? 'Sending...' : 'Send Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  };

  // Payment Success Screen Component
  const PaymentSuccessScreen = ({ requestId }) => {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 shadow-lg shadow-green-500/30">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Request Submitted!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
          Payment processed successfully!
        </p>
        <ReceiptRequestButton requestId={requestId} amount={getPaymentAmount()} />
      </div>
    );
  };

  // Payment Method Selection Component
  const PaymentMethodSelection = ({ requestId, amount, selectedPaymentMethod, submitting, onPaymentMethodSelected, onBack, paymentSettings, paymentCode, requestType, songTitle, songArtist, recipientName }) => {
    const [cashAppQr, setCashAppQr] = useState(null);
    const [venmoQr, setVenmoQr] = useState(null);
    const [localSelectedMethod, setLocalSelectedMethod] = useState(null);

    const generateQRCode = (text) => {
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    };

    // Build payment note with song/shoutout details
    const buildPaymentNote = () => {
      let note = '';
      
      if (requestType === 'song_request') {
        if (songTitle) {
          note = songTitle;
          if (songArtist) {
            note += ` by ${songArtist}`;
          }
          if (paymentCode) {
            note += ` - ${paymentCode}`;
          }
        } else {
          note = paymentCode ? `Song Request - ${paymentCode}` : 'Song Request';
        }
      } else if (requestType === 'shoutout') {
        if (recipientName) {
          note = `Shoutout for ${recipientName}`;
          if (paymentCode) {
            note += ` - ${paymentCode}`;
          }
        } else {
          note = paymentCode ? `Shoutout - ${paymentCode}` : 'Shoutout';
        }
      } else {
        note = paymentCode ? `Crowd Request - ${paymentCode}` : 'Crowd Request';
      }
      
      // Keep note under character limits:
      // CashApp: ~100 characters
      // Venmo: ~280 characters
      // Trim to be safe
      if (note.length > 200) {
        note = note.substring(0, 197) + '...';
      }
      
      return note;
    };

    const handleCashAppClick = () => {
      try {
        if (!paymentSettings?.cashAppTag) {
          throw new Error('CashApp tag is not configured. Please contact support.');
        }
        
        if (!amount || amount <= 0) {
          throw new Error('Invalid payment amount');
        }
        
        // Strip $ from cashtag if present
        const cleanTag = paymentSettings.cashAppTag.replace(/^\$/, '');
        const amountStr = (amount / 100).toFixed(2);
        
        // Build payment note with song/shoutout details
        const paymentNote = buildPaymentNote();
        const encodedNote = encodeURIComponent(paymentNote);
        
        // Deep link to CashApp app with note
        // CashApp note parameter: ?note=...
        const cashAppUrl = `https://cash.app/${cleanTag}/${amountStr}?note=${encodedNote}`;
        
        // Also show QR code as fallback
        const qr = generateQRCode(cashAppUrl);
        setCashAppQr(qr);
        setLocalSelectedMethod('cashapp');
        onPaymentMethodSelected('cashapp');
        
        // Redirect immediately to app (after state is set)
        setTimeout(() => {
          window.location.href = cashAppUrl;
        }, 100);
      } catch (err) {
        console.error('CashApp payment error:', err);
        // Error will be handled by parent component's error state
        if (err.message) {
          // Pass error to parent - but we don't have access to setError here
          // So we'll log it and show QR code anyway as fallback
        }
      }
    };

    const handleVenmoClick = () => {
      try {
        if (!paymentSettings?.venmoUsername) {
          throw new Error('Venmo username is not configured. Please contact support.');
        }
        
        if (!amount || amount <= 0) {
          throw new Error('Invalid payment amount');
        }
        
        // Strip @ from username if present
        const cleanUsername = paymentSettings.venmoUsername.replace(/^@/, '');
        const amountStr = (amount / 100).toFixed(2);
        
        // Build payment note with song/shoutout details
        const paymentNote = buildPaymentNote();
        const encodedNote = encodeURIComponent(paymentNote);
        
        // Also show QR code first
        const webUrl = `https://venmo.com/${cleanUsername}?txn=pay&amount=${amountStr}&note=${encodedNote}`;
        const qr = generateQRCode(webUrl);
        setVenmoQr(qr);
        setLocalSelectedMethod('venmo');
        onPaymentMethodSelected('venmo');
        
        // Deep link to Venmo app
        const venmoUrl = `venmo://paycharge?txn=pay&recipients=${cleanUsername}&amount=${amountStr}&note=${encodedNote}`;
        
        // Try app deep link first, fallback to web after 2 seconds
        setTimeout(() => {
          window.location.href = venmoUrl;
          
          // Fallback to web after 2 seconds if app doesn't open
          setTimeout(() => {
            window.location.href = webUrl;
          }, 2000);
        }, 100);
      } catch (err) {
        console.error('Venmo payment error:', err);
        // Error will be handled by parent component's error state
        if (err.message) {
          // Pass error to parent - but we don't have access to setError here
          // So we'll log it and show QR code anyway as fallback
        }
      }
    };

    // Use local state if available, otherwise fall back to prop
    const currentMethod = localSelectedMethod || selectedPaymentMethod;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Choose Payment Method
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Total: <span className="font-bold text-purple-600 dark:text-purple-400">${(amount / 100).toFixed(2)}</span>
          </p>
        </div>

        {currentMethod === 'cashapp' && cashAppQr ? (
          <CashAppPaymentScreen
            qrCode={cashAppQr}
            cashtag={paymentSettings.cashAppTag}
            amount={amount}
            requestId={requestId}
            paymentCode={paymentCode}
            paymentNote={buildPaymentNote()}
            onBack={() => {
              setLocalSelectedMethod(null);
              setCashAppQr(null);
              onPaymentMethodSelected(null);
            }}
          />
        ) : currentMethod === 'venmo' && venmoQr ? (
          <VenmoPaymentScreen
            qrCode={venmoQr}
            username={paymentSettings.venmoUsername}
            amount={amount}
            requestId={requestId}
            paymentCode={paymentCode}
            paymentNote={buildPaymentNote()}
            onBack={() => {
              setLocalSelectedMethod(null);
              setVenmoQr(null);
              onPaymentMethodSelected(null);
            }}
          />
        ) : currentMethod === 'card' ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Redirecting to secure payment...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleCashAppClick}
              className="group relative w-full p-6 rounded-2xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/40 dark:hover:to-emerald-900/30 transition-all duration-300 touch-manipulation overflow-hidden shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-green-400/10 group-hover:to-green-400/20 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Pay with CashApp
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleVenmoClick}
              className="group relative w-full p-6 rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/40 dark:hover:to-cyan-900/30 transition-all duration-300 touch-manipulation overflow-hidden shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-blue-400/10 group-hover:to-blue-400/20 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Pay with Venmo
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodSelected('card')}
              disabled={submitting}
              className="group relative w-full p-6 rounded-2xl border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/30 transition-all duration-300 touch-manipulation overflow-hidden shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-400/10 group-hover:to-purple-400/20 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Pay with Card
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodSelected('card')}
              disabled={submitting}
              className="group relative w-full p-6 rounded-2xl border-2 border-black dark:border-gray-700 bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 hover:from-gray-800 hover:to-gray-900 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 touch-manipulation overflow-hidden shadow-lg shadow-black/20 hover:shadow-black/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 group-hover:to-white/10 transition-all duration-300"></div>
              <div className="relative flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shadow-lg">
                  {/* Apple Pay logo style */}
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-13.5a5.5 5.5 0 0 0-5.5-5.5c-1.33 0-2.67.5-4 1.5a5.5 5.5 0 0 0-1 1.5c-1.33-1-2.67-1.5-4-1.5A5.5 5.5 0 0 0 2 8.5c0 5.5 3 13.5 6 13.5 1.25 0 2.5-1.06 4-1.06z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-white font-sans tracking-wide">
                  Pay with Apple Pay
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full mt-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              ← Back to form
            </button>
          </div>
        )}
      </div>
    );
  };

  const CashAppPaymentScreen = ({ qrCode, cashtag, amount, requestId, paymentCode, paymentNote, onBack }) => {
    return (
      <div className="text-center space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pay with CashApp
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Scan the QR code or send ${(amount / 100).toFixed(2)} to {cashtag}
          </p>
        </div>

        {paymentCode && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4">
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2 font-semibold">
              🔑 IMPORTANT: Include this code in your payment note:
            </p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 text-center font-mono">
              {paymentCode}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
              This helps us verify your payment quickly!
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <img src={qrCode} alt="CashApp QR Code" className="w-64 h-64" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>CashApp Tag:</strong> {cashtag}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Amount:</strong> ${(amount / 100).toFixed(2)}
          </p>
          {paymentNote && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                <strong>Payment Note (will be included):</strong>
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                {paymentNote}
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            After sending payment, your request will be processed. You&apos;ll receive a confirmation once payment is verified.
          </p>
        </div>

        <ReceiptRequestButton requestId={requestId} amount={amount} />

        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Choose Different Payment Method
        </button>
      </div>
    );
  };

  const VenmoPaymentScreen = ({ qrCode, username, amount, requestId, paymentCode, paymentNote, onBack }) => {
    return (
      <div className="text-center space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pay with Venmo
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Scan the QR code or send ${(amount / 100).toFixed(2)} to {username}
          </p>
        </div>

        {paymentCode && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4">
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2 font-semibold">
              🔑 IMPORTANT: Include this code in your payment note:
            </p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 text-center font-mono">
              {paymentCode}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
              This helps us verify your payment quickly!
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <img src={qrCode} alt="Venmo QR Code" className="w-64 h-64" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Venmo Username:</strong> {username}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Amount:</strong> ${(amount / 100).toFixed(2)}
          </p>
          {paymentNote && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                <strong>Payment Note (will be included):</strong>
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                {paymentNote}
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            After sending payment, your request will be processed. You&apos;ll receive a confirmation once payment is verified.
          </p>
        </div>

        <ReceiptRequestButton requestId={requestId} amount={amount} />

        <button
          type="button"
          onClick={onBack}
          className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Choose Different Payment Method
        </button>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Request a Song or Shoutout | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <style dangerouslySetInnerHTML={{__html: `
          /* Prevent scrollbar from appearing and causing layout shift */
          /* Force scrollbar to always be present but invisible to prevent layout shift */
          html {
            overflow-y: scroll !important; /* Always show scrollbar space */
            scrollbar-gutter: stable !important; /* Reserve space even when hidden */
          }
          body {
            overflow-y: scroll !important; /* Always show scrollbar space */
            scrollbar-gutter: stable !important; /* Reserve space even when hidden */
            -ms-overflow-style: none !important;
            scrollbar-width: thin !important; /* Use thin scrollbar to minimize space */
            scrollbar-color: transparent transparent !important; /* Make it transparent */
          }
          /* Make scrollbar completely transparent but keep it present */
          html::-webkit-scrollbar,
          body::-webkit-scrollbar {
            width: 15px !important; /* Standard macOS scrollbar width */
            background: transparent !important;
          }
          html::-webkit-scrollbar-thumb,
          body::-webkit-scrollbar-thumb {
            background: transparent !important;
            border: none !important;
          }
          html::-webkit-scrollbar-thumb:hover,
          body::-webkit-scrollbar-thumb:hover {
            background: transparent !important;
          }
          html::-webkit-scrollbar-track,
          body::-webkit-scrollbar-track {
            background: transparent !important;
          }
          /* Hide scrollbars on all other elements */
          *::-webkit-scrollbar {
            width: 0px !important;
            background: transparent !important;
          }
          *::-webkit-scrollbar-thumb {
            background: transparent !important;
            width: 0px !important;
          }
          *::-webkit-scrollbar-track {
            background: transparent !important;
          }
          #__next {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            scrollbar-color: transparent transparent !important;
          }
          #__next::-webkit-scrollbar {
            width: 0px !important;
            background: transparent !important;
          }
          #__next::-webkit-scrollbar-thumb {
            background: transparent !important;
            width: 0px !important;
          }
          /* Override yellow focus rings */
          #__next button:focus,
          #__next a:focus,
          #__next div:focus,
          #__next *:focus {
            outline: none !important;
            box-shadow: none !important;
          }
        `}} />
      </Head>

      <div 
        className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 relative overflow-hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <Header />
        
        <main className="section-container py-2 sm:py-3 px-4 sm:px-6 relative z-10" style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
            {/* Header - Compact for no-scroll design */}
            <div className="text-center mb-2 sm:mb-3">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 mb-2 shadow-md shadow-purple-500/40 dark:shadow-purple-500/20">
                <Music className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-1 sm:mb-2 px-2">
                Request a Song or Shoutout
              </h1>
              
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className={`h-1.5 rounded-full transition-all ${currentStep >= 1 ? 'bg-purple-500 w-8' : 'bg-gray-300 dark:bg-gray-600 w-2'}`}></div>
                <div className={`h-1.5 rounded-full transition-all ${currentStep >= 2 ? 'bg-purple-500 w-8' : 'bg-gray-300 dark:bg-gray-600 w-2'}`}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {currentStep === 1 && 'Step 1 of 2: Choose your request'}
                {currentStep === 2 && 'Step 2 of 2: Payment'}
              </p>
            </div>

            {/* Error Message - Show at top level so it's always visible */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-1">Error</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {success ? (
              <PaymentSuccessScreen requestId={requestId} />
            ) : showPaymentMethods ? (
              <PaymentMethodSelection
                requestId={requestId}
                amount={getPaymentAmount()}
                selectedPaymentMethod={selectedPaymentMethod}
                submitting={submitting}
                paymentSettings={paymentSettings}
                paymentCode={paymentCode}
                requestType={requestType}
                songTitle={formData.songTitle}
                songArtist={formData.songArtist}
                recipientName={formData.recipientName}
                onPaymentMethodSelected={handlePaymentMethodSelected}
                onBack={() => {
                  setShowPaymentMethods(false);
                  setSelectedPaymentMethod(null);
                  setError(''); // Clear error when going back
                }}
              />
              ) : (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-3 sm:space-y-4 overflow-y-auto">
                {/* Request Type Selection */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 flex-shrink-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                    What would you like to request?
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <button
                      type="button"
                      onClick={() => setRequestType('song_request')}
                      className={`group relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 touch-manipulation overflow-hidden ${
                        requestType === 'song_request'
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 shadow-lg shadow-purple-500/20 scale-105'
                          : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-purple-300 hover:scale-[1.02] hover:shadow-md'
                      }`}
                    >
                      {requestType === 'song_request' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent"></div>
                      )}
                      <div className="relative">
                        <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl mb-4 transition-all duration-300 ${
                          requestType === 'song_request'
                            ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50'
                            : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30'
                        }`}>
                          <Music className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            requestType === 'song_request' ? 'text-white' : 'text-gray-400 group-hover:text-purple-500'
                          }`} />
                        </div>
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2">Song Request</h3>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setRequestType('shoutout')}
                      className={`group relative p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 touch-manipulation overflow-hidden ${
                        requestType === 'shoutout'
                          ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/30 dark:to-pink-800/20 shadow-lg shadow-pink-500/20 scale-105'
                          : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-pink-300 hover:scale-[1.02] hover:shadow-md'
                      }`}
                    >
                      {requestType === 'shoutout' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-transparent"></div>
                      )}
                      <div className="relative">
                        <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl mb-4 transition-all duration-300 ${
                          requestType === 'shoutout'
                            ? 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/50'
                            : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30'
                        }`}>
                          <Mic className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            requestType === 'shoutout' ? 'text-white' : 'text-gray-400 group-hover:text-pink-500'
                          }`} />
                        </div>
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2">Shoutout</h3>
                      </div>
                    </button>
                  </div>

                  {/* Song Request Fields */}
                  {requestType === 'song_request' && (
                    <div className="space-y-4">
                      {/* Music Link Input */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          <Music className="w-4 h-4 inline mr-1" />
                          Paste Music Link (Optional)
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            value={songUrl}
                            onChange={handleSongUrlChange}
                            className="w-full px-5 py-4 text-base rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200 touch-manipulation pr-12"
                            placeholder="Paste YouTube, Spotify, SoundCloud, or Tidal link"
                            autoComplete="off"
                          />
                          {extractingSong && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                              <span className="text-xs text-purple-600 dark:text-purple-400 hidden sm:inline">Extracting...</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                          We&apos;ll automatically fill in the song title and artist name
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                            Or enter manually
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Song Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="songTitle"
                          value={formData.songTitle}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 text-base rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200 touch-manipulation"
                          placeholder="Enter song title"
                          required
                          autoComplete="off"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Artist Name
                        </label>
                        <input
                          type="text"
                          name="songArtist"
                          value={formData.songArtist}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200"
                          placeholder="Enter artist name"
                          required
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  )}

                  {/* Shoutout Fields */}
                  {requestType === 'shoutout' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Recipient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="recipientName"
                          value={formData.recipientName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="Who is this shoutout for?"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="recipientMessage"
                          value={formData.recipientMessage}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="What would you like to say?"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Message */}
                  {currentStep === 1 && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Any additional information..."
                    />
                  </div>
                  )}

                </div>

                {/* Payment Amount - Only show after song selection is complete and step 2 */}
                {isSongSelectionComplete() && currentStep >= 2 && (
                <div className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards] bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-5 flex-shrink-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-500" />
                    Payment Amount
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3 sm:gap-4 mb-6 p-1 bg-gray-100/50 dark:bg-gray-700/30 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setAmountType('preset')}
                        className={`flex-1 py-3.5 px-4 rounded-xl border-2 transition-all duration-300 touch-manipulation min-h-[48px] ${
                          amountType === 'preset'
                            ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                            : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="font-bold text-sm sm:text-base">Quick Amount</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setAmountType('custom')}
                        className={`flex-1 py-3.5 px-4 rounded-xl border-2 transition-all duration-300 touch-manipulation min-h-[48px] ${
                          amountType === 'custom'
                            ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                            : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span className="font-bold text-sm sm:text-base">Custom Amount</span>
                      </button>
                    </div>

                    {amountType === 'preset' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {presetAmounts.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setPresetAmount(preset.value)}
                            className={`group relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 touch-manipulation min-h-[72px] overflow-hidden ${
                              presetAmount === preset.value
                                ? 'border-purple-500 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/40 scale-105'
                                : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-purple-300 hover:scale-[1.02] hover:shadow-lg'
                            }`}
                          >
                            {presetAmount === preset.value && (
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                            )}
                            <span className={`relative text-lg sm:text-xl font-bold transition-colors ${
                              presetAmount === preset.value
                                ? 'text-white'
                                : 'text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'
                            }`}>
                              {preset.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {amountType === 'custom' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Enter Amount (USD)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            min="1"
                            step="0.01"
                            inputMode="decimal"
                            className="w-full pl-12 pr-4 py-3.5 sm:py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent touch-manipulation"
                            placeholder="5.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Minimum: ${(minimumAmount / 100).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Fast-Track and Next Options (only for song requests) - Compact Radio Style */}
                    {requestType === 'song_request' && (
                      <div className="border-t-2 border-gray-200/50 dark:border-gray-700/50 pt-4 mt-4 space-y-3">
                        {/* Fast-Track Option - More Compact */}
                        <label className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer touch-manipulation ${
                          isFastTrack
                            ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 shadow-lg shadow-orange-500/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-orange-300'
                        }`}>
                          <input
                            type="radio"
                            name="priorityOption"
                            checked={isFastTrack}
                            onChange={(e) => {
                              setIsFastTrack(e.target.checked);
                              if (e.target.checked) setIsNext(false);
                            }}
                            className="sr-only"
                            aria-label="Fast-Track Priority Placement"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            isFastTrack
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isFastTrack && <div className="w-2 h-2 rounded-full bg-white"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Zap className={`w-4 h-4 ${isFastTrack ? 'text-orange-500' : 'text-gray-400'}`} />
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                  Fast-Track
                                </span>
                              </div>
                              <span className="text-sm font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                +${(fastTrackFee / 100).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Priority placement in queue
                            </p>
                          </div>
                        </label>
                        
                        {/* Next Option - More Compact */}
                        <label className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer touch-manipulation ${
                          isNext
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 shadow-lg shadow-blue-500/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-blue-300'
                        }`}>
                          <input
                            type="radio"
                            name="priorityOption"
                            checked={isNext}
                            onChange={(e) => {
                              setIsNext(e.target.checked);
                              if (e.target.checked) setIsFastTrack(false);
                            }}
                            className="sr-only"
                            aria-label="Next - Bump to Next"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            isNext
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isNext && <div className="w-2 h-2 rounded-full bg-white"></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Gift className={`w-4 h-4 ${isNext ? 'text-blue-500' : 'text-gray-400'}`} />
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                  Next
                                </span>
                              </div>
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                +${(nextFee / 100).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Play next - jump to front
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-purple-200/50 dark:border-purple-700/30">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-base">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">Base Amount:</span>
                          <span className="text-gray-900 dark:text-white font-bold text-lg">
                            ${(getBaseAmount() / 100).toFixed(2)}
                          </span>
                        </div>
                        {isFastTrack && requestType === 'song_request' && (
                          <div className="flex items-center justify-between text-base">
                            <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                              <Zap className="w-5 h-5 text-orange-500" />
                              Fast-Track Fee:
                            </span>
                            <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                              +${(fastTrackFee / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {isNext && requestType === 'song_request' && (
                          <div className="flex items-center justify-between text-base">
                            <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                              <Gift className="w-5 h-5 text-blue-500" />
                              Next Fee:
                            </span>
                            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                              +${(nextFee / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="border-t-2 border-purple-300/50 dark:border-purple-700/50 pt-4 flex items-center justify-between">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            Total Amount:
                          </span>
                          <span className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                            ${(getPaymentAmount() / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
                )}


                {/* Submit Button - Sticky at bottom, appears when song selection is complete */}
                {isSongSelectionComplete() && (
                <div 
                  className="sticky bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 shadow-lg flex-shrink-0 mt-auto focus:outline-none focus:ring-0"
                  style={{ 
                    paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
                    position: 'sticky',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <button
                    type={currentStep === 1 ? "button" : "submit"}
                    disabled={submitting || (currentStep >= 2 && getPaymentAmount() < minimumAmount)}
                    className="group relative w-full py-5 sm:py-6 text-base sm:text-lg font-bold inline-flex items-center justify-center gap-3 min-h-[64px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    onClick={(e) => {
                      if (currentStep === 1) {
                        e.preventDefault();
                        setCurrentStep(2);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                      }
                      if (window.innerWidth < 640) {
                        e.preventDefault();
                        const button = e.currentTarget;
                        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                          const form = button.closest('form');
                          if (form) {
                            form.requestSubmit();
                          }
                        }, 300);
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {submitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                        <span className="relative z-10">Processing...</span>
                      </>
                    ) : currentStep === 1 ? (
                      <>
                        <Music className="w-6 h-6 relative z-10" />
                        <span className="whitespace-nowrap relative z-10">Continue to Payment</span>
                      </>
                    ) : (
                      <>
                        <Music className="w-6 h-6 relative z-10" />
                        <span className="whitespace-nowrap relative z-10">Submit Request</span>
                      </>
                    )}
                  </button>

                  {currentStep >= 2 && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                      You&apos;ll choose your payment method after submitting.
                    </p>
                  )}
                </div>
                )}
              </form>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

