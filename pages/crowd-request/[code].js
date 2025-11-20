import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/company/Header';
import { Music, Mic, CreditCard, DollarSign, Loader2, CheckCircle, AlertCircle, Gift, Zap, Smartphone, QrCode } from 'lucide-react';

export default function CrowdRequestPage() {
  const router = useRouter();
  const { code } = router.query;
  
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
  
  const [amountType, setAmountType] = useState('custom'); // 'preset' or 'custom'
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
  const [eventInfo, setEventInfo] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [songUrl, setSongUrl] = useState('');
  const [extractingSong, setExtractingSong] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState({
    cashAppTag: '$M10DJ',
    venmoUsername: '@M10DJ'
  });

  useEffect(() => {
    if (code) {
      // Optionally fetch event info based on code
      fetchEventInfo(code);
    }
    // Fetch payment settings
    fetchPaymentSettings();
  }, [code]);

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

  const fetchEventInfo = async (eventCode) => {
    try {
      const response = await fetch(`/api/crowd-request/event-info?code=${eventCode}`);
      if (response.ok) {
        const data = await response.json();
        setEventInfo(data);
      }
    } catch (err) {
      console.error('Error fetching event info:', err);
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

      const data = await response.json();

      if (!response.ok) {
        // Don't show error for unsupported services, just let user enter manually
        if (response.status !== 400 && response.status !== 404) {
          setError(data.error || 'Could not extract song information');
        }
        setExtractingSong(false);
        return;
      }

      // Auto-fill the form fields
      if (data.title) {
        setFormData(prev => ({
          ...prev,
          songTitle: data.title
        }));
      }

      if (data.artist) {
        setFormData(prev => ({
          ...prev,
          songArtist: data.artist
        }));
      }

      // Show success message briefly
      if (data.title || data.artist) {
        // Clear the URL field after successful extraction
        setTimeout(() => {
          setSongUrl('');
        }, 1000);
      }

    } catch (err) {
      console.error('Error extracting song info:', err);
      // Don't show error, just let user enter manually
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

  const validateForm = () => {
    if (!formData.requesterName.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (requestType === 'song_request') {
      if (!formData.songTitle.trim()) {
        setError('Please enter a song title');
        return false;
      }
    } else if (requestType === 'shoutout') {
      if (!formData.recipientName.trim()) {
        setError('Please enter the recipient name');
        return false;
      }
      if (!formData.recipientMessage.trim()) {
        setError('Please enter a message for the shoutout');
        return false;
      }
    }

    const amount = getPaymentAmount();
    if (amount < minimumAmount) {
      setError(`Minimum payment is $${(minimumAmount / 100).toFixed(2)}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      // Scroll to error on mobile
      if (window.innerWidth < 640 && error) {
        setTimeout(() => {
          const errorEl = document.querySelector('.bg-red-50, .bg-red-900');
          if (errorEl) {
            errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      return;
    }

    setSubmitting(true);

    try {
      const amount = getPaymentAmount();
      
      const response = await fetch('/api/crowd-request/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventCode: code,
          requestType,
          songArtist: formData.songArtist || null,
          songTitle: formData.songTitle || null,
          recipientName: formData.recipientName || null,
          recipientMessage: formData.recipientMessage || null,
          requesterName: formData.requesterName,
          requesterEmail: formData.requesterEmail || null,
          requesterPhone: formData.requesterPhone || null,
          message: formData.message || null,
          amount,
          isFastTrack: requestType === 'song_request' ? isFastTrack : false,
          isNext: requestType === 'song_request' ? isNext : false,
          fastTrackFee: requestType === 'song_request' && isFastTrack ? fastTrackFee : 0,
          nextFee: requestType === 'song_request' && isNext ? nextFee : 0
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      // Save request ID and show payment method selection
      if (data.requestId) {
        setRequestId(data.requestId);
        setShowPaymentMethods(true);
        setSubmitting(false);
      } else if (data.checkoutUrl) {
        // Fallback: if checkoutUrl is provided, redirect directly (for backward compatibility)
        window.location.href = data.checkoutUrl;
      } else {
        setSuccess(true);
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
      setSubmitting(false);
      
      // Scroll to error on mobile
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
      // Reset payment method selection
      setSelectedPaymentMethod(null);
      return;
    }
    
    setSelectedPaymentMethod(paymentMethod);
    
    if (paymentMethod === 'card') {
      // Proceed with Stripe checkout
      setSubmitting(true);
      try {
        const response = await fetch('/api/crowd-request/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            amount: getPaymentAmount()
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout session');
        }

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } catch (err) {
        console.error('Checkout error:', err);
        setError(err.message || 'Failed to create checkout session');
        setSubmitting(false);
      }
    } else if (paymentMethod === 'cashapp' || paymentMethod === 'venmo') {
      // Update request with payment method
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
        // Non-critical, continue
      }
    }
    // For CashApp and Venmo, the PaymentMethodSelection component will handle display
  };


  // Payment Method Selection Component
  const PaymentMethodSelection = ({ requestId, amount, selectedPaymentMethod, submitting, onPaymentMethodSelected, onBack, paymentSettings }) => {
    const [cashAppQr, setCashAppQr] = useState(null);
    const [venmoQr, setVenmoQr] = useState(null);
    const [localSelectedMethod, setLocalSelectedMethod] = useState(null);

    const generateQRCode = (text) => {
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    };

    const handleCashAppClick = () => {
      // Strip $ from cashtag if present
      const cleanTag = paymentSettings.cashAppTag.replace(/^\$/, '');
      const amountStr = (amount / 100).toFixed(2);
      
      // Deep link to CashApp app
      const cashAppUrl = `https://cash.app/${cleanTag}/${amountStr}`;
      
      // Redirect immediately to app
      window.location.href = cashAppUrl;
      
      // Also show QR code as fallback
      const qr = generateQRCode(cashAppUrl);
      setCashAppQr(qr);
      setLocalSelectedMethod('cashapp');
      onPaymentMethodSelected('cashapp');
    };

    const handleVenmoClick = () => {
      // Strip @ from username if present
      const cleanUsername = paymentSettings.venmoUsername.replace(/^@/, '');
      const amountStr = (amount / 100).toFixed(2);
      
      // Deep link to Venmo app
      const venmoUrl = `venmo://paycharge?txn=pay&recipients=${cleanUsername}&amount=${amountStr}&note=Crowd%20Request`;
      
      // Try app deep link first, fallback to web
      const tryApp = () => {
        window.location.href = venmoUrl;
        // Fallback to web after 2 seconds if app doesn't open
        setTimeout(() => {
          const webUrl = `https://venmo.com/${cleanUsername}?txn=pay&amount=${amountStr}&note=Crowd%20Request`;
          window.location.href = webUrl;
        }, 2000);
      };
      
      tryApp();
      
      // Also show QR code
      const qr = generateQRCode(`https://venmo.com/${cleanUsername}?txn=pay&amount=${amountStr}&note=Crowd%20Request`);
      setVenmoQr(qr);
      setLocalSelectedMethod('venmo');
      onPaymentMethodSelected('venmo');
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
              className="w-full p-6 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all touch-manipulation"
            >
              <div className="flex items-center justify-center gap-3">
                <Smartphone className="w-8 h-8 text-green-600 dark:text-green-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Pay with CashApp
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleVenmoClick}
              className="w-full p-6 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all touch-manipulation"
            >
              <div className="flex items-center justify-center gap-3">
                <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Pay with Venmo
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodSelected('card')}
              disabled={submitting}
              className="w-full p-6 rounded-xl border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all touch-manipulation disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-3">
                <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Pay with Card
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

  const CashAppPaymentScreen = ({ qrCode, cashtag, amount, requestId, onBack }) => {
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

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <img src={qrCode} alt="CashApp QR Code" className="w-64 h-64" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>CashApp Tag:</strong> {cashtag}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Amount:</strong> ${(amount / 100).toFixed(2)}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            After sending payment, your request will be processed. You&apos;ll receive a confirmation once payment is verified.
          </p>
        </div>

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

  const VenmoPaymentScreen = ({ qrCode, username, amount, requestId, onBack }) => {
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

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <img src={qrCode} alt="Venmo QR Code" className="w-64 h-64" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Venmo Username:</strong> {username}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Amount:</strong> ${(amount / 100).toFixed(2)}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            <strong>Note:</strong> Crowd Request
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            After sending payment, your request will be processed. You&apos;ll receive a confirmation once payment is verified.
          </p>
        </div>

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
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <Header />
        
        <main className="section-container py-6 sm:py-8 md:py-12 px-4 sm:px-6 pb-32 sm:pb-12 relative z-10" style={{ paddingBottom: 'max(8rem, env(safe-area-inset-bottom, 0px) + 8rem)' }}>
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 mb-4 sm:mb-6 shadow-lg shadow-purple-500/50 dark:shadow-purple-500/30 transform hover:scale-105 transition-transform duration-300">
                <Music className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4 sm:mb-6 px-2 leading-tight">
                Request a Song or Shoutout
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 px-2 font-medium">
                {eventInfo?.event_name 
                  ? `Request for ${eventInfo.event_name}`
                  : 'Make a request and support the DJ!'}
              </p>
            </div>

              {success ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Request Submitted!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Payment processed successfully!
                  </p>
                </div>
              ) : showPaymentMethods ? (
                <PaymentMethodSelection
                  requestId={requestId}
                  amount={getPaymentAmount()}
                  selectedPaymentMethod={selectedPaymentMethod}
                  submitting={submitting}
                  paymentSettings={paymentSettings}
                  onPaymentMethodSelected={handlePaymentMethodSelected}
                  onBack={() => {
                    setShowPaymentMethods(false);
                    setSelectedPaymentMethod(null);
                  }}
                />
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Request Type Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    What would you like to request?
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <button
                      type="button"
                      onClick={() => setRequestType('song_request')}
                      className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all touch-manipulation ${
                        requestType === 'song_request'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 active:border-purple-300'
                      }`}
                    >
                      <Music className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 mx-auto ${
                        requestType === 'song_request' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'
                      }`} />
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Song Request</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Request your favorite song
                      </p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setRequestType('shoutout')}
                      className={`p-4 sm:p-6 rounded-lg sm:rounded-xl border-2 transition-all touch-manipulation ${
                        requestType === 'shoutout'
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                          : 'border-gray-200 dark:border-gray-700 active:border-pink-300'
                      }`}
                    >
                      <Mic className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 mx-auto ${
                        requestType === 'shoutout' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400'
                      }`} />
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Shoutout</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Give someone a special message
                      </p>
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
                            className="w-full px-4 py-3.5 sm:py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent touch-manipulation pr-12"
                            placeholder="Paste YouTube, Spotify, SoundCloud, or Tidal link"
                            autoComplete="off"
                          />
                          {extractingSong && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
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
                          className="w-full px-4 py-3.5 sm:py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent touch-manipulation"
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
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Enter artist name (optional)"
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
                </div>

                {/* Your Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="requesterName"
                        value={formData.requesterName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 sm:py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent touch-manipulation"
                        placeholder="Enter your name"
                        required
                        autoComplete="name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Email (optional)
                        </label>
                        <input
                          type="email"
                          name="requesterEmail"
                          value={formData.requesterEmail}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Phone (optional)
                        </label>
                        <input
                          type="tel"
                          name="requesterPhone"
                          value={formData.requesterPhone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="(901) 555-1234"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                    Payment Amount
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3 sm:gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setAmountType('preset')}
                        className={`flex-1 py-3 sm:py-3.5 px-4 rounded-lg border-2 transition-all touch-manipulation min-h-[48px] ${
                          amountType === 'preset'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-300 dark:border-gray-600 active:bg-gray-50 dark:active:bg-gray-700'
                        }`}
                      >
                        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Quick Amount</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setAmountType('custom')}
                        className={`flex-1 py-3 sm:py-3.5 px-4 rounded-lg border-2 transition-all touch-manipulation min-h-[48px] ${
                          amountType === 'custom'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-300 dark:border-gray-600 active:bg-gray-50 dark:active:bg-gray-700'
                        }`}
                      >
                        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Custom Amount</span>
                      </button>
                    </div>

                    {amountType === 'preset' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {presetAmounts.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setPresetAmount(preset.value)}
                            className={`p-4 sm:p-5 rounded-lg border-2 transition-all touch-manipulation min-h-[64px] ${
                              presetAmount === preset.value
                                ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30'
                                : 'border-gray-300 dark:border-gray-600 active:border-purple-300'
                            }`}
                          >
                            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
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

                    {/* Fast-Track and Next Options (only for song requests) */}
                    {requestType === 'song_request' && (
                      <div className="border-t-2 border-gray-200/50 dark:border-gray-700/50 pt-6 mt-6 space-y-4">
                        {/* Fast-Track Option */}
                        <label className={`group relative flex items-start gap-4 p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer touch-manipulation overflow-hidden ${
                          isFastTrack
                            ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 shadow-xl shadow-orange-500/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-orange-300 hover:shadow-lg'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isFastTrack}
                            onChange={(e) => {
                              setIsFastTrack(e.target.checked);
                              if (e.target.checked) setIsNext(false); // Only one can be selected
                            }}
                            className="sr-only"
                            aria-label="Fast-Track to Front of Queue"
                          />
                          {isFastTrack && (
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-transparent"></div>
                          )}
                          <div className={`relative mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                            isFastTrack
                              ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/50'
                              : 'border-gray-300 dark:border-gray-600 group-hover:border-orange-400'
                          }`}>
                            {isFastTrack && (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 relative">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                                isFastTrack
                                  ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                                <Zap className={`w-4 h-4 transition-colors ${
                                  isFastTrack ? 'text-white' : 'text-gray-400'
                                }`} />
                              </div>
                              <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                                Fast-Track (Priority Placement)
                              </span>
                              <span className="ml-auto text-base sm:text-lg font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent whitespace-nowrap">
                                +${(fastTrackFee / 100).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Get priority placement in the queue - your song will be played sooner!
                            </p>
                          </div>
                        </label>
                        
                        {/* Next Option */}
                        <label className={`group relative flex items-start gap-4 p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer touch-manipulation overflow-hidden ${
                          isNext
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 shadow-xl shadow-blue-500/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-blue-300 hover:shadow-lg'
                        }`}>
                          <input
                            type="checkbox"
                            checked={isNext}
                            onChange={(e) => {
                              setIsNext(e.target.checked);
                              if (e.target.checked) setIsFastTrack(false); // Only one can be selected
                            }}
                            className="sr-only"
                            aria-label="Next - Bump to Next"
                          />
                          {isNext && (
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent"></div>
                          )}
                          <div className={`relative mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                            isNext
                              ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50'
                              : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                          }`}>
                            {isNext && (
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 relative">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
                                isNext
                                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                                <Gift className={`w-4 h-4 transition-colors ${
                                  isNext ? 'text-white' : 'text-gray-400'
                                }`} />
                              </div>
                              <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                                Next (Bump to Next)
                              </span>
                              <span className="ml-auto text-base sm:text-lg font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                                +${(nextFee / 100).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Your song will be played next! Jump to the front of the line.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Base Amount:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            ${(getBaseAmount() / 100).toFixed(2)}
                          </span>
                        </div>
                        {isFastTrack && requestType === 'song_request' && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Zap className="w-4 h-4 text-orange-500" />
                              Fast-Track Fee:
                            </span>
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              +${(fastTrackFee / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {isNext && requestType === 'song_request' && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Gift className="w-4 h-4 text-blue-500" />
                              Next Fee:
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              +${(nextFee / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-purple-200 dark:border-purple-800 pt-2 flex items-center justify-between">
                          <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            Total Amount:
                          </span>
                          <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            ${(getPaymentAmount() / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button - Sticky on mobile for better UX */}
                <div 
                  className="sticky bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 pt-4 pb-12 sm:pb-4 sm:relative sm:bg-transparent sm:pt-0 sm:z-auto -mx-4 sm:mx-0 px-4 sm:px-0 border-t border-gray-200 dark:border-gray-700 sm:border-0 shadow-lg sm:shadow-none"
                  style={{ 
                    paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom, 0px) + 3rem))',
                    bottom: 'max(0px, env(safe-area-inset-bottom, 0px))'
                  }}
                >
                  <button
                    type="submit"
                    disabled={submitting || getPaymentAmount() < minimumAmount}
                    className="w-full btn-primary py-4 sm:py-4 text-base sm:text-lg font-semibold inline-flex items-center justify-center gap-2 min-h-[56px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                      // Ensure button is in viewport before submitting
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
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Music className="w-5 h-5" />
                        <span className="whitespace-nowrap">Submit Request</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3 sm:mt-2">
                    You&apos;ll choose your payment method after submitting.
                  </p>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

