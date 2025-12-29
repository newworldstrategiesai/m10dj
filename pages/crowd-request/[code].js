import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/company/Header';
import { Music, Mic, Loader2, AlertCircle, Gift, Zap } from 'lucide-react';
import PaymentMethodSelection from '../../components/crowd-request/PaymentMethodSelection';
import PaymentSuccessScreen from '../../components/crowd-request/PaymentSuccessScreen';
import PaymentAmountSelector from '../../components/crowd-request/PaymentAmountSelector';
import { usePaymentSettings } from '../../hooks/usePaymentSettings';
import { useSongExtraction } from '../../hooks/useSongExtraction';
import { useCrowdRequestPayment } from '../../hooks/useCrowdRequestPayment';
import { useCrowdRequestValidation } from '../../hooks/useCrowdRequestValidation';
import { crowdRequestAPI } from '../../utils/crowd-request-api';
import { createLogger } from '../../utils/logger';
import { CROWD_REQUEST_CONSTANTS } from '../../constants/crowd-request';
import { useQRScanTracking } from '../../hooks/useQRScanTracking';

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
  const [extractedSongUrl, setExtractedSongUrl] = useState(''); // Store the URL that was used for extraction
  const [isExtractedFromLink, setIsExtractedFromLink] = useState(false); // Track if song was extracted from link
  const [showLinkField, setShowLinkField] = useState(true); // Track if link field should be shown
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [paymentCode, setPaymentCode] = useState(null);
  const [additionalRequestIds, setAdditionalRequestIds] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Song/Shoutout, 2: Payment (contact info collected by Stripe or via receipt request)
  const [additionalSongs, setAdditionalSongs] = useState([]); // Array of {songTitle, songArtist}
  const [audioFile, setAudioFile] = useState(null); // Selected audio file
  const [audioUploading, setAudioUploading] = useState(false); // Upload status
  const [audioFileUrl, setAudioFileUrl] = useState(''); // Uploaded file URL
  const [artistRightsConfirmed, setArtistRightsConfirmed] = useState(false); // Artist rights checkbox
  const [isArtist, setIsArtist] = useState(false); // Is the requester the artist
  const [organizationId, setOrganizationId] = useState(null); // Organization ID for this event
  const [bundleSize, setBundleSize] = useState(1); // Bundle size: 1, 2, or 3
  const [bundleSongs, setBundleSongs] = useState([]); // Array of {songTitle, songArtist} for bundle songs

  // Initialize bundle songs array when bundle size changes
  useEffect(() => {
    if (bundleSize > 1) {
      const newBundleSongs = [];
      for (let i = 0; i < bundleSize - 1; i++) {
        newBundleSongs.push(bundleSongs[i] || { songTitle: '', songArtist: '' });
      }
      setBundleSongs(newBundleSongs);
    } else {
      setBundleSongs([]);
    }
  }, [bundleSize]); // Only depend on bundleSize, not bundleSongs to avoid infinite loop

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
  const { getBaseAmount, getPaymentAmount, calculateBundlePrice } = useCrowdRequestPayment({
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
    bundleDiscount: bundleDiscountPercent,
    bundleSize, // Pass bundle size
    audioFileUrl,
    audioUploadFee: 10000 // $100.00 in cents
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
      // Fetch event info and determine organization
      fetchEventInfo(code);
      determineOrganization(code);
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

  // Determine organization from existing requests with same event code or from URL
  const determineOrganization = async (eventCode) => {
    try {
      // First, try to find an existing request with the same event code to get its organization
      const response = await fetch(`/api/crowd-request/find-organization?eventCode=${encodeURIComponent(eventCode)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.organizationId) {
          setOrganizationId(data.organizationId);
          logger.info('Found organization from existing requests:', data.organizationId);
          return;
        }
      }
      
      // Fallback: Try to extract organization from URL path
      // If URL is /{slug}/crowd-request/{code}, extract slug
      if (typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/').filter(p => p);
        if (pathParts.length >= 2 && pathParts[0] !== 'crowd-request') {
          const potentialSlug = pathParts[0];
          // Try to look up organization by slug (if you have this endpoint)
          // For now, we'll let the backend handle it via header detection
          logger.info('Could not determine organization from URL, backend will use fallback methods');
        }
      }
      
      logger.warn('Could not determine organization for event code:', eventCode);
    } catch (err) {
      logger.error('Error determining organization', err);
    }
  };

  // Update error state from extraction hook
  useEffect(() => {
    if (extractionError) {
      setError(extractionError);
    }
  }, [extractionError]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // Detect if a URL was pasted into song title or artist field
    if ((name === 'songTitle' || name === 'songArtist') && value) {
      const urlPattern = /(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|tidal\.com|music\.apple\.com|itunes\.apple\.com)/i;
      if (urlPattern.test(value)) {
        // Move the URL to the link field and extract from there
        setSongUrl(value);
        // Extract song info from the URL (this will populate songTitle and songArtist)
        await extractSongInfo(value);
        // Clear the field that had the URL (don't set it as the field value)
        return;
      }
    }
    
    // Normal input change - set the field value
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear audio upload when user manually enters song title or artist name
    // (they're requesting an existing song, not uploading custom audio)
    if ((name === 'songTitle' || name === 'songArtist') && value?.trim()) {
      if (audioFileUrl || audioFile) {
        setAudioFile(null);
        setAudioFileUrl('');
        setArtistRightsConfirmed(false);
        setIsArtist(false);
      }
    }
  };

  const handleSongUrlChange = async (e) => {
    const url = e.target.value;
    setSongUrl(url);

    // Auto-extract when URL is pasted and looks complete
    if (url && (url.includes('youtube.com') || url.includes('youtu.be') || 
        url.includes('spotify.com') || url.includes('soundcloud.com') || 
        url.includes('tidal.com') || url.includes('music.apple.com') || 
        url.includes('itunes.apple.com'))) {
      await extractSongInfo(url);
    }
  };

  const extractSongInfo = async (url) => {
    await extractSongInfoHook(url, setFormData);
    // Store the URL that was used for extraction and mark as extracted
    setExtractedSongUrl(url);
    setIsExtractedFromLink(true);
    // Keep URL visible in the link field for a moment, then clear it
    // The useEffect will handle hiding the field when song info is populated
    setTimeout(() => {
      setSongUrl('');
    }, CROWD_REQUEST_CONSTANTS.SONG_EXTRACTION_DELAY);
    
    // Clear audio upload when song is extracted from URL (user wants an existing song)
    if (audioFileUrl || audioFile) {
      setAudioFile(null);
      setAudioFileUrl('');
      setArtistRightsConfirmed(false);
      setIsArtist(false);
    }
  };

  // Hide link field when song is manually entered
  useEffect(() => {
    if (formData.songTitle && formData.songArtist && showLinkField && !extractingSong) {
      // Song is populated manually or from extraction, hide link field
      setShowLinkField(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.songTitle, formData.songArtist, extractingSong]);

  // Reset form to clean slate when "Share another song" is clicked
  const handleShareAnotherSong = () => {
    setFormData(prev => ({
      ...prev,
      songTitle: '',
      songArtist: ''
    }));
    setSongUrl('');
    setExtractedSongUrl('');
    setIsExtractedFromLink(false);
    setShowLinkField(true);
    setError('');
    // Reset step if we're on payment step
    if (currentStep >= 2) {
      setCurrentStep(1);
    }
  };

  // getBaseAmount and getPaymentAmount are now provided by useCrowdRequestPayment hook
  // isSongSelectionComplete is now provided by useCrowdRequestValidation hook
  // validateForm is now provided by useCrowdRequestValidation hook
  
  const hasAutoFocusedNameField = useRef(false); // Track if we've already auto-focused the name field

  // Auto-focus name field when song selection is complete (only once per session)
  useEffect(() => {
    if (requestType === 'song_request' && isSongSelectionComplete() && currentStep === 1) {
      // Only auto-focus name field once, and only if name is empty
      if (!hasAutoFocusedNameField.current && !formData.requesterName?.trim()) {
        hasAutoFocusedNameField.current = true;
        setTimeout(() => {
          const nameInput = document.querySelector('input[name="requesterName"]');
          if (nameInput) {
            nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nameInput.focus();
          }
        }, 100);
      }
    }
    // Reset the flag when song selection becomes incomplete (user cleared fields)
    if (!isSongSelectionComplete()) {
      hasAutoFocusedNameField.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.songTitle, formData.songArtist, requestType, currentStep]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      // Scroll to error message after a brief delay to allow state to update
      // Note: Don't check `error` here - it's stale (React state updates are async)
      setTimeout(() => {
        const errorEl = document.querySelector('.bg-red-50, .bg-red-900');
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setSubmitting(true);

    try {
      const amount = getPaymentAmount();
      
      // Validate bundle songs if bundle size > 1
      if (requestType === 'song_request' && bundleSize > 1) {
        if (!bundleSongs || bundleSongs.length < bundleSize - 1) {
          throw new Error(`Please enter song details for all ${bundleSize} songs in your bundle`);
        }
        const invalidSongs = bundleSongs.filter(song => !song.songTitle?.trim());
        if (invalidSongs.length > 0) {
          throw new Error('Please enter a song title for all songs in your bundle');
        }
      }
      
      // Validate additional songs if any (legacy support)
      if (requestType === 'song_request' && additionalSongs.length > 0 && bundleSize === 1) {
        const invalidSongs = additionalSongs.filter(song => !song.songTitle?.trim());
        if (invalidSongs.length > 0) {
          throw new Error('Please enter a song title for all additional songs');
        }
      }

      // Validate audio upload requirements
      if (audioFileUrl && !artistRightsConfirmed) {
        throw new Error('Please confirm that you own the rights to the music');
      }

      // Get scan tracking data from sessionStorage
      const scanId = typeof window !== 'undefined' ? sessionStorage.getItem('qr_scan_id') : null;
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('qr_session_id') : null;

      // Create main request with total amount (includes all songs)
      const mainRequestBody = {
        eventCode: code,
        requestType,
        songArtist: formData.songArtist || null,
        songTitle: formData.songTitle || null,
        recipientName: formData.recipientName || null,
        recipientMessage: formData.recipientMessage || null,
        requesterName: formData.requesterName?.trim(),
        requesterEmail: formData.requesterEmail || null,
        requesterPhone: formData.requesterPhone || null,
        message: formData.message || null,
        amount: amount, // Total amount for all songs
        isFastTrack: requestType === 'song_request' ? isFastTrack : false,
        isNext: requestType === 'song_request' ? isNext : false,
        fastTrackFee: requestType === 'song_request' && isFastTrack ? fastTrackFee : 0,
        nextFee: requestType === 'song_request' && isNext ? nextFee : 0,
        audioFileUrl: audioFileUrl || null,
        isCustomAudio: !!audioFileUrl,
        artistRightsConfirmed: artistRightsConfirmed,
        isArtist: isArtist,
        scanId: scanId,
        sessionId: sessionId,
        organizationId: organizationId || null, // Include organization ID if determined
        postedLink: extractedSongUrl || null // Include the original URL if request was created from a posted link
      };
      
      const mainData = await crowdRequestAPI.submitRequest(mainRequestBody);

      const allRequestIds = [mainData.requestId];
      const additionalIds = [];

      // Handle bundle songs (new bundle system)
      if (requestType === 'song_request' && bundleSize > 1 && bundleSongs && bundleSongs.length > 0) {
        // Calculate price per song in bundle
        const baseAmount = getBaseAmount();
        const bundlePrice = calculateBundlePrice(baseAmount, bundleSize, minimumAmount);
        const pricePerSong = Math.round(bundlePrice / bundleSize);
        
        for (let i = 0; i < bundleSongs.length; i++) {
          const song = bundleSongs[i];
          const bundleRequestBody = {
            eventCode: code,
            requestType: 'song_request',
            songArtist: song.songArtist?.trim() || null,
            songTitle: song.songTitle?.trim() || null,
            requesterName: formData.requesterName?.trim(),
            requesterEmail: formData.requesterEmail || null,
            requesterPhone: formData.requesterPhone || null,
            amount: pricePerSong, // Each song gets equal share of bundle price
            isFastTrack: false, // Bundle songs don't get fast track (only main song can)
            isNext: false,
            fastTrackFee: 0,
            nextFee: 0,
            organizationId: organizationId || null,
            message: `Bundle deal - ${bundleSize} songs for $${(bundlePrice / 100).toFixed(2)}`
          };

          try {
            const bundleData = await crowdRequestAPI.submitRequest(bundleRequestBody);
            if (bundleData?.requestId) {
              allRequestIds.push(bundleData.requestId);
              additionalIds.push(bundleData.requestId);
            }
          } catch (err) {
            logger.warn('Failed to create bundle song request', err);
            // Continue with other songs even if one fails
          }
        }
      }

      // Legacy: Create additional song requests if any (only if not using bundle system)
      if (requestType === 'song_request' && bundleSize === 1 && additionalSongs.length > 0) {
        for (let i = 0; i < additionalSongs.length; i++) {
          const song = additionalSongs[i] || {};
          const additionalRequestBody = {
            eventCode: code,
            requestType: 'song_request',
            songArtist: song.songArtist?.trim() || null,
            songTitle: song.songTitle?.trim() || null,
            requesterName: formData.requesterName?.trim(),
            requesterEmail: formData.requesterEmail || null,
            requesterPhone: formData.requesterPhone || null,
            amount: 0, // Bundled with main request - payment already included in main request
            isFastTrack: false,
            isNext: false,
            fastTrackFee: 0,
            nextFee: 0,
            organizationId: organizationId || null,
            message: `Bundled with main request - ${Math.round(bundleDiscountPercent * 100)}% discount applied. ${song.songTitle?.trim() ? '' : 'Song details to be added after payment.'}`
          };

          try {
            const additionalData = await crowdRequestAPI.submitRequest(additionalRequestBody);
            if (additionalData?.requestId) {
              allRequestIds.push(additionalData.requestId);
              additionalIds.push(additionalData.requestId);
            }
          } catch (err) {
            logger.warn('Failed to create additional song request', err);
            // Continue with other songs even if one fails
          }
        }
      }
      
      // Store additional request IDs for post-payment form
      setAdditionalRequestIds(additionalIds);

      // Save request ID, payment code, and show payment method selection
      if (mainData.requestId) {
        setRequestId(mainData.requestId);
        if (mainData.paymentCode) {
          setPaymentCode(mainData.paymentCode);
        }
        setShowPaymentMethods(true);
        setSubmitting(false);
        // Scroll to payment UI after a brief delay to ensure it's rendered
        setTimeout(() => {
          const paymentElement = document.querySelector('[data-payment-methods]');
          if (paymentElement) {
            paymentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
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
        {!showPaymentMethods && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        )}
        
        {!showPaymentMethods && <Header />}
        
        <main className={`section-container ${showPaymentMethods ? 'py-8 sm:py-12 md:py-16' : 'py-4 sm:py-6'} px-4 sm:px-6 relative z-10`} style={{ minHeight: showPaymentMethods ? '100vh' : 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
          <div className={`${showPaymentMethods ? 'max-w-lg' : 'max-w-2xl'} mx-auto w-full flex-1 flex flex-col`}>
            {/* Header - Compact for no-scroll design */}
            {!showPaymentMethods && (
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
            )}

              {success ? (
                <PaymentSuccessScreen 
                  requestId={requestId} 
                  amount={getPaymentAmount()} 
                  additionalRequestIds={additionalRequestIds}
                />
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
                  requesterName={formData.requesterName}
                  additionalSongs={additionalSongs}
                  setAdditionalSongs={setAdditionalSongs}
                  bundleDiscount={bundleDiscountPercent}
                  bundleDiscountEnabled={bundleDiscountEnabled}
                  getBaseAmount={getBaseAmount}
                  getPaymentAmount={getPaymentAmount}
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
                      {/* Music Link Input - Show only when showLinkField is true */}
                      {showLinkField ? (
                        <>
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
                                placeholder="Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link"
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
                        </>
                      ) : (
                        /* Show "Start over" button when link field is hidden */
                        <div className="mb-2">
                          <button
                            type="button"
                            onClick={handleShareAnotherSong}
                            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                          >
                            <Music className="w-4 h-4" />
                            Start over
                          </button>
                        </div>
                      )}

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
                          Artist Name <span className="text-red-500">*</span>
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

                      {/* Bundle Songs Input (only show when bundle size > 1) */}
                      {bundleSize > 1 && bundleSongs.length > 0 && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-2 mb-3">
                            <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Bundle Songs ({bundleSize - 1} additional {bundleSize - 1 === 1 ? 'song' : 'songs'})
                            </h3>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                            Enter the details for your additional bundle songs:
                          </p>
                          <div className="space-y-4">
                            {bundleSongs.map((song, index) => (
                              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-purple-200 dark:border-purple-700">
                                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
                                  Song {index + 2} of {bundleSize}
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                                      Song Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={song.songTitle || ''}
                                      onChange={(e) => {
                                        const newSongs = [...bundleSongs];
                                        newSongs[index] = { ...newSongs[index], songTitle: e.target.value };
                                        setBundleSongs(newSongs);
                                      }}
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      placeholder="Enter song title"
                                      required
                                      autoComplete="off"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                                      Artist Name
                                    </label>
                                    <input
                                      type="text"
                                      value={song.songArtist || ''}
                                      onChange={(e) => {
                                        const newSongs = [...bundleSongs];
                                        newSongs[index] = { ...newSongs[index], songArtist: e.target.value };
                                        setBundleSongs(newSongs);
                                      }}
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      placeholder="Enter artist name"
                                      autoComplete="off"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audio File Upload Section - Subtle styling */}
                      {/* Hide when user manually enters song title or artist name (they're requesting an existing song) */}
                      {!formData.songTitle?.trim() && !formData.songArtist?.trim() && (
                      <div className="mt-3 p-3 bg-transparent rounded-md border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="flex items-center gap-1.5 mb-2 opacity-70">
                          <Music className="w-3.5 h-3.5 text-gray-500 dark:text-gray-500" />
                          <label className="block text-xs text-gray-600 dark:text-gray-400">
                            Have your own track? Upload audio
                          </label>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-2">
                          Perfect for upcoming artists or custom tracks. ($100 per file)
                        </p>
                        
                        {!audioFileUrl ? (
                          <div>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setAudioFile(file);
                                  setAudioUploading(true);
                                  try {
                                    // Upload to API endpoint
                                    const formData = new FormData();
                                    formData.append('audio', file);
                                    
                                    const response = await fetch('/api/crowd-request/upload-audio', {
                                      method: 'POST',
                                      body: formData
                                    });
                                    
                                    if (!response.ok) {
                                      throw new Error('Upload failed');
                                    }
                                    
                                    const data = await response.json();
                                    setAudioFileUrl(data.url);
                                  } catch (err) {
                                    logger.error('Audio upload error', err);
                                    setError('Failed to upload audio file. Please try again.');
                                    setAudioFile(null);
                                  } finally {
                                    setAudioUploading(false);
                                  }
                                }
                              }}
                              className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 dark:file:bg-purple-700 dark:hover:file:bg-purple-600"
                              disabled={audioUploading}
                            />
                            {audioUploading && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Uploading...
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Music className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {audioFile?.name || 'Audio file uploaded'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAudioFile(null);
                                setAudioFileUrl('');
                              }}
                              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {/* Artist Rights Checkboxes */}
                        {audioFileUrl && (
                          <div className="mt-4 space-y-2">
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={artistRightsConfirmed}
                                onChange={(e) => setArtistRightsConfirmed(e.target.checked)}
                                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                required={!!audioFileUrl}
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                I confirm that I own the rights to this music or have permission to use it
                              </span>
                            </label>
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isArtist}
                                onChange={(e) => setIsArtist(e.target.checked)}
                                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                I am the artist (this is for promotion, not just a play)
                              </span>
                            </label>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-2">
                              +$100.00 for audio upload
                            </p>
                          </div>
                        )}
                      </div>
                      )}
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
                          // Clear any previous errors and go to payment step
                          setError('');
                          setCurrentStep(2);
                          // Scroll to payment section
                          setTimeout(() => {
                            const paymentElement = document.querySelector('[data-payment-section]');
                            if (paymentElement) {
                              paymentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }, 100);
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

                  {/* Requester Information - Required for payment verification */}
                  {/* Always show name field - it's required for all request types and must remain visible after auto-advance to step 2 */}
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="requesterName"
                        value={formData.requesterName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your name"
                        required
                        autoComplete="name"
                      />
                      {/* Only show help text when there's a name validation error */}
                      {error === 'Please enter your name' && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                          Required: Helps us match your payment to your request
                        </p>
                      )}
                    </div>
                    <div>
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
                </div>

                {/* Payment Amount - Only show after song selection is complete and step 2 */}
                {isSongSelectionComplete() && currentStep >= 2 && (
                  <div className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]" data-payment-section>
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
                      bundleSize={bundleSize}
                      setBundleSize={setBundleSize}
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

    </>
  );
}

