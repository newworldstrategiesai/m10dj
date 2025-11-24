import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/company/Header';
import { Music, Mic, CreditCard, DollarSign, Loader2, CheckCircle, AlertCircle, Gift, Zap, Smartphone, QrCode, Copy, Check } from 'lucide-react';

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
  const [eventInfo, setEventInfo] = useState(null);
  
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
  const [currentStep, setCurrentStep] = useState(1); // 1: Song/Shoutout, 2: Payment (contact info collected by Stripe or via receipt request)

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
      const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
      // Ensure custom amount is at least the minimum preset amount
      const validatedCustom = Math.max(custom * 100, minPresetAmount);
      return Math.round(validatedCustom); // Convert to cents
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
    if (requestType === 'song_request') {
      return formData.songTitle.trim().length > 0 && formData.songArtist.trim().length > 0;
    } else if (requestType === 'shoutout') {
      return formData.recipientName.trim().length > 0 && formData.recipientMessage.trim().length > 0;
    }
    return false;
  };

  const validateForm = () => {
    // Name is optional - will default to 'Guest' if not provided
    if (requestType === 'song_request') {
      if (!formData.songTitle.trim()) {
        setError('Please enter a song title');
        return false;
      }
      if (!formData.songArtist.trim()) {
        setError('Please enter an artist name');
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
    const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
    if (amount < minPresetAmount) {
      setError(`Minimum payment is $${(minPresetAmount / 100).toFixed(2)}`);
      return false;
    }

    return true;
  };

  // Don't auto-advance - let user control with Continue button

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
          requesterName: formData.requesterName?.trim() || 'Guest',
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

      // Save request ID, payment code, and show payment method selection
      if (data.requestId) {
        setRequestId(data.requestId);
        if (data.paymentCode) {
          setPaymentCode(data.paymentCode);
        }
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

    const handleCashAppClick = async () => {
      try {
        if (!requestId) {
          throw new Error('Request not created yet. Please fill out the form first.');
        }
        
        if (!amount || amount <= 0) {
          throw new Error('Invalid payment amount');
        }
        
        // Use Stripe Checkout with Cash App Pay pre-selected
        setSubmitting(true);
        setError('');
        
        console.log('Creating Cash App Pay checkout with:', { requestId, amount });
        const response = await fetch('/api/crowd-request/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            amount: amount,
            preferredPaymentMethod: 'cashapp' // This will show only Cash App Pay
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
          // Update payment method to cashapp before redirecting
          await fetch('/api/crowd-request/update-payment-method', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId,
              paymentMethod: 'cashapp'
            })
          });
          
          // Redirect to Stripe Checkout with Cash App Pay
          window.location.href = data.checkoutUrl;
        } else {
          console.error('No checkoutUrl in response:', data);
          throw new Error('No checkout URL received from server');
        }
      } catch (err) {
        console.error('CashApp payment error:', err);
        setError(err.message || 'Failed to create checkout session. Please try again.');
        setSubmitting(false);
      }
    };

    const handleVenmoClick = () => {
      // Strip @ from username if present
      const cleanUsername = paymentSettings.venmoUsername.replace(/^@/, '');
      const amountStr = (amount / 100).toFixed(2);
      
      // Build payment note with song/shoutout details
      const paymentNote = buildPaymentNote();
      const encodedNote = encodeURIComponent(paymentNote);
      
      // Deep link to Venmo app
      const venmoUrl = `venmo://paycharge?txn=pay&recipients=${cleanUsername}&amount=${amountStr}&note=${encodedNote}`;
      
      // Try app deep link first, fallback to web
      const tryApp = () => {
        window.location.href = venmoUrl;
        // Fallback to web after 2 seconds if app doesn't open
        setTimeout(() => {
          const webUrl = `https://venmo.com/${cleanUsername}?txn=pay&amount=${amountStr}&note=${encodedNote}`;
          window.location.href = webUrl;
        }, 2000);
      };
      
      tryApp();
      
      // Also show QR code with proper note
      const qr = generateQRCode(`https://venmo.com/${cleanUsername}?txn=pay&amount=${amountStr}&note=${encodedNote}`);
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
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleCashAppClick}
              className="group relative w-full p-5 rounded-2xl border-2 border-green-500/80 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-green-950/40 hover:from-green-100 hover:via-emerald-100 hover:to-green-100 dark:hover:from-green-900/50 dark:hover:via-emerald-900/40 dark:hover:to-green-900/50 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-green-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 via-green-400/5 to-green-400/10 group-hover:from-green-400/5 group-hover:via-green-400/10 group-hover:to-green-400/15 transition-all duration-300"></div>
              <div className="relative flex items-center justify-start gap-4 pl-2">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow p-2.5 flex-shrink-0">
                  <svg viewBox="0 0 32 32" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M31.453 4.625c-0.688-1.891-2.177-3.375-4.068-4.063-1.745-0.563-3.333-0.563-6.557-0.563h-9.682c-3.198 0-4.813 0-6.531 0.531-1.896 0.693-3.385 2.188-4.068 4.083-0.547 1.734-0.547 3.333-0.547 6.531v9.693c0 3.214 0 4.802 0.531 6.536 0.688 1.891 2.177 3.375 4.068 4.063 1.734 0.547 3.333 0.547 6.536 0.547h9.703c3.214 0 4.813 0 6.536-0.531 1.896-0.688 3.391-2.182 4.078-4.078 0.547-1.734 0.547-3.333 0.547-6.536v-9.667c0-3.214 0-4.813-0.547-6.547zM23.229 10.802l-1.245 1.24c-0.25 0.229-0.635 0.234-0.891 0.010-1.203-1.010-2.724-1.568-4.292-1.573-1.297 0-2.589 0.427-2.589 1.615 0 1.198 1.385 1.599 2.984 2.198 2.802 0.938 5.12 2.109 5.12 4.854 0 2.99-2.318 5.042-6.104 5.266l-0.349 1.604c-0.063 0.302-0.328 0.516-0.635 0.516h-2.391l-0.12-0.010c-0.354-0.078-0.578-0.432-0.505-0.786l0.375-1.693c-1.438-0.359-2.76-1.083-3.844-2.094v-0.016c-0.25-0.25-0.25-0.656 0-0.906l1.333-1.292c0.255-0.234 0.646-0.234 0.896 0 1.214 1.146 2.839 1.786 4.521 1.76 1.734 0 2.891-0.734 2.891-1.896s-1.172-1.464-3.385-2.292c-2.349-0.839-4.573-2.026-4.573-4.802 0-3.224 2.677-4.797 5.854-4.943l0.333-1.641c0.063-0.302 0.333-0.516 0.641-0.51h2.37l0.135 0.016c0.344 0.078 0.573 0.411 0.495 0.76l-0.359 1.828c1.198 0.396 2.333 1.026 3.302 1.849l0.031 0.031c0.25 0.266 0.25 0.667 0 0.906z" className="text-green-600 dark:text-green-400"/>
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pay with CashApp
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleVenmoClick}
              className="group relative w-full p-5 rounded-2xl border-2 border-blue-500/80 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-blue-950/40 hover:from-blue-100 hover:via-cyan-100 hover:to-blue-100 dark:hover:from-blue-900/50 dark:hover:via-cyan-900/40 dark:hover:to-blue-900/50 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-blue-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-blue-400/5 to-blue-400/10 group-hover:from-blue-400/5 group-hover:via-blue-400/10 group-hover:to-blue-400/15 transition-all duration-300"></div>
              <div className="relative flex items-center justify-start gap-4 pl-2">
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow p-2.5 flex-shrink-0">
                  <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z" className="text-blue-600 dark:text-blue-400"/>
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pay with Venmo
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodSelected('card')}
              disabled={submitting}
              className="group relative w-full p-5 rounded-2xl border-2 border-purple-500/80 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/40 dark:via-pink-950/30 dark:to-purple-950/40 hover:from-purple-100 hover:via-pink-100 hover:to-purple-100 dark:hover:from-purple-900/50 dark:hover:via-pink-900/40 dark:hover:to-purple-900/50 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-purple-400/5 to-purple-400/10 group-hover:from-purple-400/5 group-hover:via-purple-400/10 group-hover:to-purple-400/15 transition-all duration-300"></div>
              <div className="relative flex items-center justify-start gap-4 pl-2">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pay with Card
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onPaymentMethodSelected('card')}
              disabled={submitting}
              className="group relative w-full p-4 rounded-lg bg-black hover:bg-gray-900 active:bg-gray-800 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span className="text-white font-semibold text-base font-sans tracking-tight">
                  Pay
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
    const [noteCopied, setNoteCopied] = useState(false);
    
    const handleCopyNote = async () => {
      try {
        await navigator.clipboard.writeText(paymentNote);
        setNoteCopied(true);
        setTimeout(() => setNoteCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy note:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = paymentNote;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setNoteCopied(true);
          setTimeout(() => setNoteCopied(false), 2000);
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
        }
        document.body.removeChild(textArea);
      }
    };
    
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

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>CashApp Tag:</strong> {cashtag}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Amount:</strong> ${(amount / 100).toFixed(2)}
          </p>
          {paymentNote && (
            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                <strong>⚠️ IMPORTANT: Copy this note and paste it in CashApp:</strong>
              </p>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border-2 border-green-300 dark:border-green-600 relative">
                <p className="text-sm text-gray-900 dark:text-white font-mono break-words select-all pr-12">
                  {paymentNote}
                </p>
                <button
                  type="button"
                  onClick={handleCopyNote}
                  className="absolute top-2 right-2 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Copy to clipboard"
                >
                  {noteCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                CashApp doesn&apos;t support notes in URLs. Click &quot;Copy&quot; above, then paste it in the CashApp payment note field when you send the payment.
              </p>
            </div>
          )}
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

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <img src={qrCode} alt="Venmo QR Code" className="w-64 h-64" />
          </div>
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
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <Header />
        
        <main className="section-container py-4 sm:py-6 px-4 sm:px-6 relative z-10" style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
            {/* Header - Compact for no-scroll design */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 mb-3 sm:mb-4 shadow-lg shadow-purple-500/50 dark:shadow-purple-500/30">
                <Music className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-2 sm:mb-3 px-2">
                Request a Song or Shoutout
              </h1>
              {eventInfo?.event_name && (
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 px-2">
                  {eventInfo.event_name}
                </p>
              )}
              
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className={`h-2 rounded-full transition-all ${currentStep >= 1 ? 'bg-purple-500 w-8' : 'bg-gray-300 dark:bg-gray-600 w-2'}`}></div>
                <div className={`h-2 rounded-full transition-all ${currentStep >= 2 ? 'bg-purple-500 w-8' : 'bg-gray-300 dark:bg-gray-600 w-2'}`}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {currentStep === 1 && 'Step 1 of 2: Choose your request'}
                {currentStep === 2 && 'Step 2 of 2: Payment'}
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
                  paymentCode={paymentCode}
                  requestType={requestType}
                  songTitle={formData.songTitle}
                  songArtist={formData.songArtist}
                  recipientName={formData.recipientName}
                  onPaymentMethodSelected={handlePaymentMethodSelected}
                  onBack={() => {
                    setShowPaymentMethods(false);
                    setSelectedPaymentMethod(null);
                  }}
                />
              ) : (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-3 sm:space-y-4 overflow-y-auto">
                {/* Request Type Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-5 flex-shrink-0">
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

                  {/* Continue Button - Step 1 */}
                  {currentStep === 1 && isSongSelectionComplete() && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Continue to Payment
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
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
                <div className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-5 flex-shrink-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-500" />
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
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty string for clearing
                              if (value === '') {
                                setCustomAmount('');
                                return;
                              }
                              // Get minimum preset amount (first option)
                              const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100;
                              const numValue = parseFloat(value);
                              // Only update if value is valid and >= minimum preset
                              if (!isNaN(numValue) && numValue >= minPresetAmount) {
                                setCustomAmount(value);
                              } else if (numValue < minPresetAmount && numValue >= 0) {
                                // Show the value but it will be invalid
                                setCustomAmount(value);
                              }
                            }}
                            min={presetAmounts.length > 0 ? (presetAmounts[0].value / 100).toFixed(2) : (minimumAmount / 100).toFixed(2)}
                            step="0.01"
                            inputMode="decimal"
                            className={`w-full pl-12 pr-4 py-3.5 sm:py-3 text-base rounded-lg border ${
                              customAmount && parseFloat(customAmount) > 0 && parseFloat(customAmount) < (presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100)
                                ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent touch-manipulation`}
                            placeholder={(presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100).toFixed(2)}
                          />
                        </div>
                        {customAmount && parseFloat(customAmount) > 0 && parseFloat(customAmount) < (presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100) ? (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                            Minimum amount is ${(presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Minimum: ${(presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Fast-Track and Next Options (only for song requests) */}
                    {requestType === 'song_request' && (
                      <div className="border-t-2 border-gray-200/50 dark:border-gray-700/50 pt-6 mt-6 space-y-4">
                        {/* Fast-Track Option - More Compact */}
                        <label 
                          className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer touch-manipulation ${
                            isFastTrack
                              ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 shadow-lg shadow-orange-500/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-orange-300'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            // Allow deselection: if already checked, uncheck it
                            if (isFastTrack) {
                              setIsFastTrack(false);
                            } else {
                              setIsFastTrack(true);
                              setIsNext(false);
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="priorityOption"
                            checked={isFastTrack}
                            onChange={() => {}} // Handled by label onClick
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
                        <label 
                          className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer touch-manipulation ${
                            isNext
                              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 shadow-lg shadow-blue-500/20'
                              : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-blue-300'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            // Allow deselection: if already checked, uncheck it
                            if (isNext) {
                              setIsNext(false);
                            } else {
                              setIsNext(true);
                              setIsFastTrack(false);
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="priorityOption"
                            checked={isNext}
                            onChange={() => {}} // Handled by label onClick
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
                </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button - Fixed at bottom, only on step 2 */}
                {isSongSelectionComplete() && currentStep >= 2 && (
                <div 
                  className="sticky bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 shadow-lg flex-shrink-0"
                  style={{ 
                    paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
                  }}
                >
                  <button
                    type="submit"
                    disabled={submitting || getPaymentAmount() < (presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount)}
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

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                    You&apos;ll choose your payment method after submitting.
                  </p>
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

