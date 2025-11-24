import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/company/Header';
import { Music, Mic, Loader2, AlertCircle, Gift, Zap } from 'lucide-react';
import PaymentMethodSelection from '../../components/crowd-request/PaymentMethodSelection';
import PaymentSuccessScreen from '../../components/crowd-request/PaymentSuccessScreen';
import PaymentAmountSelector from '../../components/crowd-request/PaymentAmountSelector';
import UpsellModal from '../../components/crowd-request/UpsellModal';
import { usePaymentSettings } from '../../hooks/usePaymentSettings';
import { useSongExtraction } from '../../hooks/useSongExtraction';
import { useCrowdRequestPayment } from '../../hooks/useCrowdRequestPayment';
import { useCrowdRequestValidation } from '../../hooks/useCrowdRequestValidation';
import { crowdRequestAPI } from '../../utils/crowd-request-api';
import { createLogger } from '../../utils/logger';
import { CROWD_REQUEST_CONSTANTS } from '../../constants/crowd-request';

const logger = createLogger('CrowdRequestPage');

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
  const [eventInfo, setEventInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [songUrl, setSongUrl] = useState('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [paymentCode, setPaymentCode] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Song/Shoutout, 2: Payment (contact info collected by Stripe or via receipt request)
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

  useEffect(() => {
    if (code) {
      // Optionally fetch event info based on code
      fetchEventInfo(code);
    }
  }, [code]);

  const fetchEventInfo = async (eventCode) => {
    try {
      const response = await fetch(`/api/crowd-request/event-info?code=${eventCode}`);
      if (response.ok) {
        const data = await response.json();
        setEventInfo(data);
      }
    } catch (err) {
      logger.error('Error fetching event info', err);
    }
  };

  // Update error state from extraction hook
  useEffect(() => {
    if (extractionError) {
      setError(extractionError);
    }
  }, [extractionError]);

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

  // getBaseAmount and getPaymentAmount are now provided by useCrowdRequestPayment hook
  // isSongSelectionComplete is now provided by useCrowdRequestValidation hook
  // validateForm is now provided by useCrowdRequestValidation hook

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
      
      // Validate additional songs if any
      if (requestType === 'song_request' && additionalSongs.length > 0) {
        const invalidSongs = additionalSongs.filter(song => !song.songTitle?.trim());
        if (invalidSongs.length > 0) {
          throw new Error('Please enter a song title for all additional songs');
        }
      }

      // Create main request with total amount (includes all songs)
      const mainRequestBody = {
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
        amount: amount, // Total amount for all songs
        isFastTrack: requestType === 'song_request' ? isFastTrack : false,
        isNext: requestType === 'song_request' ? isNext : false,
        fastTrackFee: requestType === 'song_request' && isFastTrack ? fastTrackFee : 0,
        nextFee: requestType === 'song_request' && isNext ? nextFee : 0
      };
      
      const mainData = await crowdRequestAPI.submitRequest(mainRequestBody);

      // Create additional song requests if any
      const validAdditionalSongs = additionalSongs.filter(song => song.songTitle?.trim());
      const allRequestIds = [mainData.requestId];

      if (validAdditionalSongs.length > 0) {
        for (const song of validAdditionalSongs) {
          const additionalRequestBody = {
            eventCode: code,
            requestType: 'song_request',
            songArtist: song.songArtist?.trim() || null,
            songTitle: song.songTitle?.trim() || null,
            requesterName: formData.requesterName?.trim() || 'Guest',
            requesterEmail: formData.requesterEmail || null,
            requesterPhone: formData.requesterPhone || null,
            amount: 0, // Bundled with main request - payment already included in main request
            isFastTrack: false,
            isNext: false,
            fastTrackFee: 0,
            nextFee: 0,
            message: `Bundled with main request - ${Math.round(bundleDiscountPercent * 100)}% discount applied`
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

      // Save request ID, payment code, and show payment method selection
      if (mainData.requestId) {
        setRequestId(mainData.requestId);
        if (mainData.paymentCode) {
          setPaymentCode(mainData.paymentCode);
        }
        setShowPaymentMethods(true);
        setSubmitting(false);
      } else if (mainData.checkoutUrl) {
        window.location.href = mainData.checkoutUrl;
      } else {
        setSuccess(true);
        setSubmitting(false);
      }
    } catch (err) {
      logger.error('Submission error', err);
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
        logger.info('Creating checkout', { requestId, amount: getPaymentAmount() });
        const data = await crowdRequestAPI.createCheckout({
          requestId,
          amount: getPaymentAmount()
        });

        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          logger.error('No checkoutUrl in response', data);
          throw new Error('No checkout URL received from server');
        }
      } catch (err) {
        logger.error('Checkout error', err);
        setError(err.message || 'Failed to create checkout session');
        setSubmitting(false);
      }
    } else if (paymentMethod === 'cashapp' || paymentMethod === 'venmo') {
      // Update request with payment method
      try {
        await crowdRequestAPI.updatePaymentMethod({
          requestId,
          paymentMethod
        });
      } catch (err) {
        logger.error('Error updating payment method', err);
        // Non-critical, continue
      }
    }
    // For CashApp and Venmo, the PaymentMethodSelection component will handle display
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
                          // Clear any previous errors and show upsell modal
                          setError('');
                          if (requestType === 'song_request' && bundleDiscountEnabled) {
                            setShowUpsellModal(true);
                          } else {
                            setCurrentStep(2);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
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

