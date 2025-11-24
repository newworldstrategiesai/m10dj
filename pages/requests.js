import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/company/Header';
import { Music, Mic, Loader2, AlertCircle, Gift, Zap } from 'lucide-react';
import PaymentMethodSelection from '../components/crowd-request/PaymentMethodSelection';
import PaymentSuccessScreen from '../components/crowd-request/PaymentSuccessScreen';
import PaymentAmountSelector from '../components/crowd-request/PaymentAmountSelector';
import UpsellModal from '../components/crowd-request/UpsellModal';
import { usePaymentSettings } from '../hooks/usePaymentSettings';
import { useSongExtraction } from '../hooks/useSongExtraction';
import { useCrowdRequestPayment } from '../hooks/useCrowdRequestPayment';
import { useCrowdRequestValidation } from '../hooks/useCrowdRequestValidation';
import { crowdRequestAPI } from '../utils/crowd-request-api';
import { createLogger } from '../utils/logger';
import { CROWD_REQUEST_CONSTANTS } from '../constants/crowd-request';

const logger = createLogger('GeneralRequestsPage');

export default function GeneralRequestsPage({ 
  organizationId = null, 
  organizationName = null,
  embedMode = false,
  customBranding = null
} = {}) {
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [songUrl, setSongUrl] = useState('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [paymentCode, setPaymentCode] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Song/Shoutout, 2: Payment (Step 2 removed - contact info collected after payment)
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [additionalSongs, setAdditionalSongs] = useState([]); // Array of {songTitle, songArtist}

  // Use payment settings hook
  const {
    paymentSettings,
    fastTrackFee,
    nextFee,
    minimumAmount,
    presetAmounts,
    bundleDiscountEnabled,
    bundleDiscount: bundleDiscountPercent,
    loading: settingsLoading
  } = usePaymentSettings();

  // Set initial preset amount when settings load
  useEffect(() => {
    if (presetAmounts.length > 0 && presetAmount === CROWD_REQUEST_CONSTANTS.DEFAULT_PRESET_AMOUNT) {
      setPresetAmount(presetAmounts[0].value);
    }
  }, [presetAmounts, presetAmount]);

  // Use song extraction hook
  const { extractingSong, extractionError, extractSongInfo: extractSongInfoHook } = useSongExtraction();

  // Use payment calculation hook
  const { getBaseAmount, getPaymentAmount } = useCrowdRequestPayment({
    amountType,
    presetAmount,
    customAmount,
    presetAmounts,
    minimumAmount,
    requestType,
    isFastTrack,
    isNext,
    fastTrackFee,
    nextFee,
    additionalSongs,
    bundleDiscount: bundleDiscountPercent
  });

  // Use validation hook
  const { isSongSelectionComplete, validateForm: validateFormHook } = useCrowdRequestValidation({
    requestType,
    formData,
    getPaymentAmount,
    presetAmounts,
    minimumAmount
  });

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
    await extractSongInfoHook(url, setFormData);
    // Clear URL field after successful extraction
    setTimeout(() => {
      setSongUrl('');
    }, CROWD_REQUEST_CONSTANTS.SONG_EXTRACTION_DELAY);
  };

  // Update error state from extraction hook
  useEffect(() => {
    if (extractionError) {
      setError(extractionError);
    }
  }, [extractionError]);

  // getBaseAmount and getPaymentAmount are now provided by useCrowdRequestPayment hook
  // isSongSelectionComplete is now provided by useCrowdRequestValidation hook

  // Auto-advance to payment step when song selection is complete
  useEffect(() => {
    if (requestType === 'song_request' && currentStep === 1) {
      const songTitleFilled = formData?.songTitle?.trim()?.length > 0;
      const songArtistFilled = formData?.songArtist?.trim()?.length > 0;
      
      if (songTitleFilled && songArtistFilled) {
        // Small delay to ensure smooth transition and allow user to see the fields are filled
        const timer = setTimeout(() => {
          setCurrentStep(2);
        }, CROWD_REQUEST_CONSTANTS.AUTO_ADVANCE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [formData.songTitle, formData.songArtist, requestType, currentStep]);

  const validateForm = () => {
    return validateFormHook(setError);
  };

  // Don't auto-advance - let user control with Continue button

  const handleSubmit = async (e) => {
    try {
      e?.preventDefault?.();
      e?.stopPropagation?.();
    } catch (err) {
      logger.warn('Error preventing default', err);
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
            logger.warn('Scroll error', scrollErr);
          }
        }, 100);
      }
      return;
    }

    setSubmitting(true);

    try {
      const amount = getPaymentAmount();
      
      // Validate amount before submission - must be at least minimum preset amount
      const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
      if (!amount || amount < minPresetAmount) {
        throw new Error(`Minimum payment is $${(minPresetAmount / 100).toFixed(2)}`);
      }

      // Validate additional songs if any
      if (requestType === 'song_request' && additionalSongs.length > 0) {
        const invalidSongs = additionalSongs.filter(song => !song.songTitle?.trim());
        if (invalidSongs.length > 0) {
          throw new Error('Please enter a song title for all additional songs');
        }
      }
      
      // Create main request with total amount (includes all songs)
      // The main request amount will be the total, and additional requests will be $0 (bundled)
      const mainRequestBody = {
        eventCode: 'general',
        requestType: requestType || 'song_request',
        songArtist: formData?.songArtist?.trim() || null,
        songTitle: formData?.songTitle?.trim() || null,
        recipientName: formData?.recipientName?.trim() || null,
        recipientMessage: formData?.recipientMessage?.trim() || null,
        requesterName: formData?.requesterName?.trim() || 'Guest',
        requesterEmail: formData?.requesterEmail?.trim() || null,
        requesterPhone: formData?.requesterPhone?.trim() || null,
        message: formData?.message?.trim() || null,
        amount: amount, // Total amount for all songs
        isFastTrack: (requestType === 'song_request' && isFastTrack) || false,
        isNext: (requestType === 'song_request' && isNext) || false,
        fastTrackFee: (requestType === 'song_request' && isFastTrack) ? fastTrackFee : 0,
        nextFee: (requestType === 'song_request' && isNext) ? nextFee : 0,
        organizationId: organizationId || null // Include organization ID if provided
      };
      
      const mainData = await crowdRequestAPI.submitRequest(mainRequestBody);

      // Create additional song requests if any
      const validAdditionalSongs = additionalSongs.filter(song => song.songTitle?.trim());
      const baseAmount = getBaseAmount();
      const discountedAmountPerSong = Math.round(baseAmount * (1 - bundleDiscountPercent));
      const allRequestIds = [mainData.requestId];

      if (validAdditionalSongs.length > 0) {
        for (const song of validAdditionalSongs) {
          const additionalRequestBody = {
            eventCode: 'general',
            requestType: 'song_request',
            songArtist: song.songArtist?.trim() || null,
            songTitle: song.songTitle?.trim() || null,
            requesterName: formData?.requesterName?.trim() || 'Guest',
            requesterEmail: formData?.requesterEmail?.trim() || null,
            requesterPhone: formData?.requesterPhone?.trim() || null,
            amount: 0, // Bundled with main request - payment already included in main request
            isFastTrack: false,
            isNext: false,
            fastTrackFee: 0,
            nextFee: 0,
            message: `Bundled with main request - ${Math.round(bundleDiscountPercent * 100)}% discount applied`,
            organizationId: organizationId || null // Include organization ID if provided
          };

          try {
            const additionalData = await crowdRequestAPI.submitRequest(additionalRequestBody);
            if (additionalData?.requestId) {
              allRequestIds.push(additionalData.requestId);
            }
          } catch (err) {
            logger.warn('Failed to create additional song request', err);
            // Continue with other songs even if one fails
          }
        }
      }

      // Save main request ID, payment code, and show payment method selection
      if (mainData?.requestId) {
        setRequestId(mainData.requestId);
        if (mainData.paymentCode) {
          setPaymentCode(mainData.paymentCode);
        }
        setShowPaymentMethods(true);
        setSubmitting(false);
      } else if (mainData?.checkoutUrl) {
        window.location.href = mainData.checkoutUrl;
      } else {
        logger.warn('No requestId or checkoutUrl received, marking as success');
        setSuccess(true);
        setSubmitting(false);
      }
    } catch (err) {
      logger.error('Submission error', err);
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
      const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
      if (!amount || amount < minPresetAmount) {
        setError(`Invalid payment amount. Minimum is $${(minPresetAmount / 100).toFixed(2)}`);
        setSelectedPaymentMethod(null);
        return;
      }
      
      setSubmitting(true);
      try {
        logger.info('Creating checkout', { requestId, amount });
        const data = await crowdRequestAPI.createCheckout({
          requestId,
          amount
        });

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          logger.error('No checkoutUrl in response', data);
          throw new Error('No checkout URL received from server');
        }
      } catch (err) {
        logger.error('Checkout error', err);
        setError(err.message || 'Failed to create checkout session. Please try again.');
        setSubmitting(false);
        setSelectedPaymentMethod(null); // Reset selection on error
      }
    } else if (paymentMethod === 'cashapp' || paymentMethod === 'venmo') {
      try {
        await crowdRequestAPI.updatePaymentMethod({
          requestId,
          paymentMethod
        });
      } catch (err) {
        logger.error('Error updating payment method', err);
      }
    }
  };



  // Payment Method Selection, CashAppPaymentScreen, and VenmoPaymentScreen components
  // are now imported from components/crowd-request/

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
          WebkitScrollbar: { display: 'none' },
          ...(customBranding?.whiteLabelEnabled ? {
            backgroundColor: customBranding.backgroundColor,
            color: customBranding.textColor,
            '--brand-primary': customBranding.primaryColor,
            '--brand-secondary': customBranding.secondaryColor,
            fontFamily: customBranding.fontFamily,
          } : {})
        }}
      >
        {/* Apply custom branding styles */}
        {customBranding?.whiteLabelEnabled && (
          <style jsx global>{`
            :root {
              --brand-primary: ${customBranding.primaryColor};
              --brand-secondary: ${customBranding.secondaryColor};
              --brand-background: ${customBranding.backgroundColor};
              --brand-text: ${customBranding.textColor};
              --brand-font: ${customBranding.fontFamily};
            }
            body {
              font-family: ${customBranding.fontFamily} !important;
            }
            .bg-purple-500, .bg-purple-600, .from-purple-500, .to-purple-600 {
              background-color: ${customBranding.primaryColor} !important;
            }
            .bg-pink-500, .bg-pink-600, .via-pink-500, .to-pink-600 {
              background-color: ${customBranding.secondaryColor} !important;
            }
            .text-purple-600, .text-purple-500 {
              color: ${customBranding.primaryColor} !important;
            }
            .text-pink-600, .text-pink-500 {
              color: ${customBranding.secondaryColor} !important;
            }
            .border-purple-500, .border-purple-600 {
              border-color: ${customBranding.primaryColor} !important;
            }
          `}</style>
        )}
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse"
            style={{ 
              backgroundColor: customBranding?.whiteLabelEnabled 
                ? `${customBranding.primaryColor}20` 
                : 'rgba(147, 51, 234, 0.2)'
            }}
          ></div>
          <div 
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse" 
            style={{ 
              animationDelay: '1s',
              backgroundColor: customBranding?.whiteLabelEnabled 
                ? `${customBranding.secondaryColor}20` 
                : 'rgba(236, 72, 153, 0.2)'
            }}
          ></div>
        </div>
        
        {!embedMode && <Header customLogoUrl={customBranding?.customLogoUrl} />}
        
        <main className="section-container py-2 sm:py-3 px-4 sm:px-6 relative z-10" style={{ minHeight: embedMode ? '100vh' : 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
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
              <PaymentSuccessScreen requestId={requestId} amount={getPaymentAmount()} />
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
                onError={setError}
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
                  <PaymentAmountSelector
                    amountType={amountType}
                    setAmountType={setAmountType}
                    presetAmount={presetAmount}
                    setPresetAmount={setPresetAmount}
                    customAmount={customAmount}
                    setCustomAmount={setCustomAmount}
                    presetAmounts={presetAmounts}
                    minimumAmount={minimumAmount}
                    requestType={requestType}
                    isFastTrack={isFastTrack}
                    setIsFastTrack={setIsFastTrack}
                    isNext={isNext}
                    setIsNext={setIsNext}
                    fastTrackFee={fastTrackFee}
                    nextFee={nextFee}
                    getBaseAmount={getBaseAmount}
                    getPaymentAmount={getPaymentAmount}
                  />
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
                    disabled={submitting || (currentStep >= 2 && getPaymentAmount() < (presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount))}
                    className="group relative w-full py-5 sm:py-6 text-base sm:text-lg font-bold inline-flex items-center justify-center gap-3 min-h-[64px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    onClick={(e) => {
                      if (currentStep === 1) {
                        e.preventDefault();
                        // Clear any previous errors and show upsell modal
                        setError('');
                        if (requestType === 'song_request' && bundleDiscountEnabled) {
                          setShowUpsellModal(true);
                        } else {
                          setCurrentStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
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

      {/* Upsell Modal - Multiple Song Requests Bundle */}
      <UpsellModal
        show={showUpsellModal && requestType === 'song_request'}
        onClose={() => setShowUpsellModal(false)}
        formData={formData}
        additionalSongs={additionalSongs}
        setAdditionalSongs={setAdditionalSongs}
        bundleDiscount={bundleDiscountPercent}
        getBaseAmount={getBaseAmount}
        getPaymentAmount={getPaymentAmount}
        onContinue={() => {
          // Validate that all additional songs have titles
          const validSongs = additionalSongs.filter(song => song.songTitle?.trim());
          const invalidSongs = additionalSongs.filter(song => !song.songTitle?.trim());
          
          if (invalidSongs.length > 0) {
            setError('Please enter a song title for all additional songs, or remove empty ones');
            return;
          }
          
          // Remove any empty songs
          setAdditionalSongs(validSongs);
          setShowUpsellModal(false);
          setCurrentStep(2);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSkip={() => {
          setShowUpsellModal(false);
          setCurrentStep(2);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        error={error}
        setError={setError}
      />
    </>
  );
}

