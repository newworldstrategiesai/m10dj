import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/company/Header';
import { Music, Mic, Loader2, AlertCircle, Gift, Zap, Facebook, Instagram, Twitter, Youtube, Linkedin, Link2, DollarSign, ChevronDown, Clock } from 'lucide-react';
import SocialAccountSelector from '../components/ui/SocialAccountSelector';
import PaymentMethodSelection from '../components/crowd-request/PaymentMethodSelection';
import PaymentSuccessScreen from '../components/crowd-request/PaymentSuccessScreen';
import PaymentAmountSelector from '../components/crowd-request/PaymentAmountSelector';
import { usePaymentSettings } from '../hooks/usePaymentSettings';
import { useSongExtraction } from '../hooks/useSongExtraction';
import { useCrowdRequestPayment } from '../hooks/useCrowdRequestPayment';
import { useCrowdRequestValidation } from '../hooks/useCrowdRequestValidation';
import { crowdRequestAPI } from '../utils/crowd-request-api';
import { createLogger } from '../utils/logger';
import { CROWD_REQUEST_CONSTANTS } from '../constants/crowd-request';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCoverPhotoUrl } from '../utils/cover-photo-helper';
import { useQRScanTracking } from '../hooks/useQRScanTracking';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import BiddingInterface from '../components/bidding/BiddingInterface';
import BidSuccessModal from '../components/bidding/BidSuccessModal';

const logger = createLogger('GeneralRequestsPage');

const DEFAULT_COVER_PHOTO = '/assets/DJ-Ben-Murray-Dodge-Poster.png';

// Wrapper component for /requests route that loads organization data
export default function RequestsPageWrapper() {
  const router = useRouter();
  // Don't use useMemo for client component - causes hooks violation
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function loadDefaultOrganization() {
      try {
        console.log('🔄 [REQUESTS] Loading default organization for /requests route...');
        
        // Load the default organization (M10 DJ Company with slug 'm10dj')
        // You can change this to load a different default organization
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', 'm10dj')
          .single();

        if (error) {
          console.error('❌ [REQUESTS] Error loading organization:', error);
          // Continue without organization data - will use defaults
          setLoading(false);
          return;
        }

        if (org && (org.subscription_status === 'active' || org.subscription_status === 'trial')) {
          // Auto-fix: If requests_header_artist_name is missing, set it to organization name
          // This ensures the header displays correctly for organizations created before this fix
          if (!org.requests_header_artist_name && org.name) {
            try {
              const { error: updateError } = await supabase
                .from('organizations')
                .update({ requests_header_artist_name: org.name })
                .eq('id', org.id);
              
              if (!updateError) {
                // Update the org object for this request
                org.requests_header_artist_name = org.name;
                console.log('✅ [REQUESTS] Auto-set requests_header_artist_name to:', org.name);
              }
            } catch (updateError) {
              console.error('❌ [REQUESTS] Error auto-setting requests_header_artist_name:', updateError);
              // Continue anyway - the page will fall back to using org.name
            }
          }
          
          setOrganization(org);
          console.log('✅ [REQUESTS] Organization loaded:', {
            id: org.id,
            name: org.name,
            artist_name: org.requests_header_artist_name
          });
        }
      } catch (err) {
        console.error('❌ [REQUESTS] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDefaultOrganization();
    
    // Set up interval to refresh organization data every 10 seconds
    const refreshInterval = setInterval(() => {
      loadDefaultOrganization();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <GeneralRequestsPage
      key={`${organization?.id || 'default'}-${organization?.updated_at || Date.now()}`}
      organizationId={organization?.id || null}
      organizationName={organization?.name || null}
      organizationCoverPhoto={getCoverPhotoUrl(organization, DEFAULT_COVER_PHOTO)}
      organizationData={organization}
      isOwner={isOwner}
      customBranding={organization?.white_label_enabled ? {
        whiteLabelEnabled: organization.white_label_enabled,
        customLogoUrl: organization.custom_logo_url,
        primaryColor: organization.primary_color,
        secondaryColor: organization.secondary_color,
        backgroundColor: organization.background_color,
        textColor: organization.text_color,
        fontFamily: organization.font_family
      } : null}
      forceBiddingMode={false} // /requests page uses normal mode by default (respects organization setting)
    />
  );
}

// The actual GeneralRequestsPage component
export function GeneralRequestsPage({ 
  organizationId = null, 
  organizationName = null,
  embedMode = false,
  customBranding = null,
  organizationCoverPhoto = null,
  organizationData = null,
  isOwner = false,
  forceBiddingMode = false, // Force bidding mode regardless of organization setting
  allowedRequestTypes = null, // Array of allowed request types (e.g., ['song_request']). If null, all types allowed.
  minimalHeader = false // Use minimal header (for bid page)
} = {}) {
  // Log when organizationData changes
  useEffect(() => {
    console.log('🎨 [GENERAL REQUESTS] GeneralRequestsPage organizationData changed:', {
      hasOrganizationData: !!organizationData,
      artist_name: organizationData?.requests_header_artist_name,
      location: organizationData?.requests_header_location,
      date: organizationData?.requests_header_date,
      updated_at: organizationData?.updated_at,
      organizationDataType: typeof organizationData,
      organizationDataKeys: organizationData ? Object.keys(organizationData).filter(k => k.startsWith('requests_')) : []
    });
  }, [organizationData]);
  // Use default cover photo if none is provided - always show a cover photo
  const coverPhoto = organizationCoverPhoto || DEFAULT_COVER_PHOTO;
  
  // Log cover photo for debugging
  useEffect(() => {
    console.log('🖼️ [GENERAL REQUESTS] Cover photo:', {
      organizationCoverPhoto,
      coverPhoto,
      fromOrganizationData: organizationData?.requests_cover_photo_url || organizationData?.requests_artist_photo_url || organizationData?.requests_venue_photo_url,
      primaryCoverSource: organizationData?.requests_primary_cover_source,
      hasArtist: !!organizationData?.requests_artist_photo_url,
      hasVenue: !!organizationData?.requests_venue_photo_url,
      artistUrl: organizationData?.requests_artist_photo_url,
      venueUrl: organizationData?.requests_venue_photo_url
    });
  }, [organizationCoverPhoto, coverPhoto, organizationData]);
  // Determine default request type - if allowedRequestTypes is set, use first allowed type
  const defaultRequestType = allowedRequestTypes && allowedRequestTypes.length > 0
    ? allowedRequestTypes[0]
    : (organizationData?.requests_default_request_type || 'song_request');
  
  const [requestType, setRequestType] = useState(defaultRequestType); // 'song_request', 'shoutout', or 'tip'
  
  // Lock request type if only one type is allowed (e.g., on /bid page)
  useEffect(() => {
    if (allowedRequestTypes && allowedRequestTypes.length === 1) {
      setRequestType(allowedRequestTypes[0]);
    }
  }, [allowedRequestTypes]);
  
  // Wrapper for setRequestType that respects allowedRequestTypes
  const handleRequestTypeChange = (newType) => {
    if (!allowedRequestTypes || allowedRequestTypes.includes(newType)) {
      setRequestType(newType);
    }
  };
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
  const [extractedSongUrl, setExtractedSongUrl] = useState(''); // Store the URL that was used for extraction
  const [isExtractedFromLink, setIsExtractedFromLink] = useState(false); // Track if song was extracted from link
  const [showLinkField, setShowLinkField] = useState(true); // Track if link field should be shown
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const songTitleInputRef = useRef(null); // Ref for scrolling to song title field
  const [requestId, setRequestId] = useState(null);
  const [paymentCode, setPaymentCode] = useState(null);
  const [additionalRequestIds, setAdditionalRequestIds] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Song/Shoutout, 2: Payment (Step 2 removed - contact info collected after payment)
  const [additionalSongs, setAdditionalSongs] = useState([]); // Array of {songTitle, songArtist}
  const [socialSelectorOpen, setSocialSelectorOpen] = useState(false);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState(null);
  const [audioFile, setAudioFile] = useState(null); // Selected audio file
  const [audioUploading, setAudioUploading] = useState(false); // Upload status
  const [audioFileUrl, setAudioFileUrl] = useState(''); // Uploaded file URL
  const [artistRightsConfirmed, setArtistRightsConfirmed] = useState(false); // Artist rights checkbox
  const [isArtist, setIsArtist] = useState(false); // Is the requester the artist
  const [audioUploadExpanded, setAudioUploadExpanded] = useState(false); // Audio upload section expanded state
  const [biddingEnabled, setBiddingEnabled] = useState(false); // Whether bidding is enabled for this org
  const [biddingRequestId, setBiddingRequestId] = useState(null); // Request ID if added to bidding round
  const [showBiddingInterface, setShowBiddingInterface] = useState(false); // Show bidding UI
  const [currentWinningBid, setCurrentWinningBid] = useState(0); // Current winning bid amount in cents
  const [showBidSuccessModal, setShowBidSuccessModal] = useState(false); // Show success modal after bid submission
  const [submittedBidAmount, setSubmittedBidAmount] = useState(0); // Amount of submitted bid
  const [roundNumber, setRoundNumber] = useState(null); // Current round number
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(0); // Time remaining in round

  // Helper function to get social URL with user preference
  const getSocialUrl = (platform, defaultUrl) => {
    if (platform === 'instagram' || platform === 'facebook') {
      const saved = typeof window !== 'undefined' 
        ? localStorage.getItem(`${platform}_account_preference`)
        : null;
      if (saved === 'djbenmurray') {
        return `https://${platform}.com/djbenmurray`;
      } else if (saved === 'm10djcompany') {
        return `https://${platform}.com/m10djcompany`;
      }
    }
    return defaultUrl;
  };

  // Handle social link click
  const handleSocialClick = (e, platform) => {
    if (platform === 'instagram' || platform === 'facebook') {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setSelectedSocialPlatform(platform);
      setSocialSelectorOpen(true);
    }
  };

  // Handle account selection
  const handleAccountSelect = (account) => {
    if (selectedSocialPlatform) {
      const url = `https://${selectedSocialPlatform}.com/${account}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

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

  // Track QR code scan for public requests page
  useQRScanTracking('public', organizationId);

  // Check if bidding is enabled for this organization
  // /requests page: Only enable if organization setting is true
  // /bid page: Always enabled via forceBiddingMode prop
  useEffect(() => {
    if (forceBiddingMode) {
      // /bid page - always enable bidding
      setBiddingEnabled(true);
    } else {
      // /requests page - only enable if organization setting is true
      setBiddingEnabled(organizationData?.requests_bidding_enabled || false);
    }
  }, [organizationData, forceBiddingMode]);

  // Fetch current winning bid for dynamic preset amounts (only in bidding mode)
  useEffect(() => {
    // Calculate bidding mode inline to avoid dependency on shouldUseBidding
    const isBiddingMode = (forceBiddingMode || biddingEnabled) && requestType === 'song_request';
    if (!isBiddingMode || !organizationId) return;

    const fetchCurrentWinningBid = async () => {
      try {
        const response = await fetch(`/api/bidding/current-round?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.active && data.requests && data.requests.length > 0) {
            // Find the highest bid across all requests
            const highestBid = Math.max(...data.requests.map(r => r.current_bid_amount || 0));
            setCurrentWinningBid(highestBid);
          } else {
            setCurrentWinningBid(0);
          }
        }
      } catch (error) {
        console.error('Error fetching current winning bid:', error);
        setCurrentWinningBid(0);
      }
    };

    const fetchRoundInfo = async () => {
      try {
        const response = await fetch(`/api/bidding/current-round?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.active && data.round) {
            setRoundNumber(data.round.roundNumber);
            setRoundTimeRemaining(data.round.timeRemaining);
            
            if (data.requests && data.requests.length > 0) {
              // Find the highest bid across all requests
              const highestBid = Math.max(...data.requests.map(r => r.current_bid_amount || 0));
              setCurrentWinningBid(highestBid);
            } else {
              setCurrentWinningBid(0);
            }
          } else {
            setCurrentWinningBid(0);
            setRoundTimeRemaining(0);
          }
        }
      } catch (error) {
        console.error('Error fetching round info:', error);
        setCurrentWinningBid(0);
      }
    };

    fetchRoundInfo();
    // Poll every 3 seconds to keep winning bid and timer updated (more frequent for better UX)
    const interval = setInterval(fetchRoundInfo, 3000);
    
    // Update timer every second
    const timerInterval = setInterval(() => {
      setRoundTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [forceBiddingMode, biddingEnabled, requestType, organizationId]);

  // Apply dark mode only on requests page - ensure it overrides any theme settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Force dark mode on requests page
      const applyDarkMode = () => {
        document.documentElement.classList.add('dark');
        // Also set data attribute to prevent theme provider from overriding
        document.documentElement.setAttribute('data-force-dark', 'true');
      };
      
      // Apply immediately
      applyDarkMode();
      
      // Also apply after a short delay to override any theme provider changes
      const timeoutId = setTimeout(applyDarkMode, 100);
      
      // Monitor for theme changes and re-apply dark mode
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (!document.documentElement.classList.contains('dark')) {
              applyDarkMode();
            }
          }
        });
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Cleanup: remove dark mode when component unmounts (user navigates away)
      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
        document.documentElement.classList.remove('dark');
        document.documentElement.removeAttribute('data-force-dark');
      };
    }
  }, []);

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
    bundleDiscount: bundleDiscountPercent,
    audioFileUrl,
    audioUploadFee: 10000 // $100.00 in cents
  });

  // Check if bidding mode is enabled - use useMemo to make it reactive to state changes
  const shouldUseBidding = useMemo(() => {
    return (forceBiddingMode || biddingEnabled) && requestType === 'song_request';
  }, [forceBiddingMode, biddingEnabled, requestType]);

  // Calculate minimum bid amount based on current winning bid (only for bidding mode)
  const dynamicMinimumAmount = useMemo(() => {
    if (!shouldUseBidding) return null;
    // Minimum bid must be at least $5 above winning bid (or $5 if no bids yet)
    // Always add $5 to the winning bid, even if it's 0
    const minAmount = currentWinningBid > 0 ? currentWinningBid + 500 : 500;
    return minAmount;
  }, [shouldUseBidding, currentWinningBid]);

  // Generate dynamic preset amounts based on current winning bid (only for bidding mode)
  const dynamicBidPresets = useMemo(() => {
    if (!shouldUseBidding) return null;
    
    // Use the dynamic minimum amount
    const minBid = dynamicMinimumAmount || 500;
    const presets = [
      { value: minBid, label: `$${(minBid / 100).toFixed(2)}` },
      { value: minBid + 500, label: `$${((minBid + 500) / 100).toFixed(2)}` }, // +$5
      { value: minBid + 1000, label: `$${((minBid + 1000) / 100).toFixed(2)}` }, // +$10
      { value: minBid + 2000, label: `$${((minBid + 2000) / 100).toFixed(2)}` }, // +$20
      { value: minBid + 5000, label: `$${((minBid + 5000) / 100).toFixed(2)}` } // +$50
    ];
    // Filter out any amounts that are less than or equal to the winning bid (safety check)
    return presets.filter(preset => preset.value > currentWinningBid);
  }, [shouldUseBidding, currentWinningBid, dynamicMinimumAmount]);
  
  // Use validation hook - pass isExtractedFromLink to make artist optional when extracted
  const { isSongSelectionComplete, validateForm: validateFormHook } = useCrowdRequestValidation({
    requestType,
    formData,
    getPaymentAmount,
    presetAmounts,
    minimumAmount,
    isExtractedFromLink, // Pass flag to validation hook
    skipPaymentValidation: shouldUseBidding // Skip payment validation in bidding mode
  });

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
  };

  // Hide link field when song is manually entered
  useEffect(() => {
    if (formData.songTitle && formData.songArtist && showLinkField && !extractingSong) {
      // Song is populated manually or from extraction, hide link field
      setShowLinkField(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.songTitle, formData.songArtist, extractingSong]);

  // Auto-expand audio upload section if file is already uploaded
  useEffect(() => {
    if (audioFileUrl && !audioUploadExpanded) {
      setAudioUploadExpanded(true);
    }
  }, [audioFileUrl, audioUploadExpanded]);

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

  // Update error state from extraction hook
  useEffect(() => {
    if (extractionError) {
      setError(extractionError);
    }
  }, [extractionError]);

  // getBaseAmount and getPaymentAmount are now provided by useCrowdRequestPayment hook
  // isSongSelectionComplete is now provided by useCrowdRequestValidation hook

  // Track previous extraction state to detect when extraction completes
  const prevExtractingSong = useRef(extractingSong);
  
  // Auto-advance to payment step when song selection is complete (not for tip)
  useEffect(() => {
    if (requestType === 'song_request' && isSongSelectionComplete() && currentStep === 1) {
      // Auto-advance to step 2 (payment) when song selection is complete
      setCurrentStep(2);
      // Scroll to payment section after a brief delay to ensure it's rendered
      setTimeout(() => {
        const paymentElement = document.querySelector('[data-payment-section]');
        if (paymentElement) {
          paymentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
    // For tip, we're already showing the payment selector inline, so no need to advance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.songTitle, formData.songArtist, requestType, currentStep]);
  
  // Scroll to song title field after extraction completes (don't auto-advance)
  useEffect(() => {
    // If extraction just finished (was extracting, now not extracting)
    if (prevExtractingSong.current && !extractingSong && isExtractedFromLink) {
      // Small delay to ensure fields are rendered
      const timer = setTimeout(() => {
        if (songTitleInputRef.current) {
          // Scroll to the song title field
          songTitleInputRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          // Focus the field briefly to highlight it
          songTitleInputRef.current.focus();
          setTimeout(() => {
            if (songTitleInputRef.current) {
              songTitleInputRef.current.blur();
            }
          }, 500);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
    prevExtractingSong.current = extractingSong;
  }, [extractingSong, isExtractedFromLink]);

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
      // shouldUseBidding is already defined at component level via useMemo
      // In bidding mode, payment happens when placing a bid, not at submission
      let amount = 0; // Default to 0 for bidding mode
      
      // Only validate and get payment amount if NOT in bidding mode
      if (!shouldUseBidding) {
        amount = getPaymentAmount();
        
        // Validate amount before submission - must be at least minimum preset amount
        const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
        if (!amount || amount < minPresetAmount) {
          throw new Error(`Minimum payment is $${(minPresetAmount / 100).toFixed(2)}`);
        }
      }

      // Note: We allow payment even if additional songs don't have titles yet
      // Users can enter song details after payment
      
      // Build message with song URL if extracted from link
      let messageWithUrl = formData?.message?.trim() || '';
      if (extractedSongUrl && requestType === 'song_request') {
        const urlNote = `Song URL: ${extractedSongUrl}`;
        messageWithUrl = messageWithUrl ? `${messageWithUrl}\n\n${urlNote}` : urlNote;
      }
      
      // Validate audio upload requirements (only for song requests)
      if (requestType === 'song_request' && audioFileUrl && !artistRightsConfirmed) {
        throw new Error('Please confirm that you own the rights to the music');
      }

      // Create main request with total amount (includes all songs)
      // The main request amount will be the total, and additional requests will be $0 (bundled)
      // Get scan tracking data from sessionStorage
      const scanId = typeof window !== 'undefined' ? sessionStorage.getItem('qr_scan_id') : null;
      const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('qr_session_id') : null;

      const mainRequestBody = {
        eventCode: 'general',
        requestType: requestType || 'song_request',
        songArtist: (requestType === 'song_request' ? formData?.songArtist?.trim() : null) || null,
        songTitle: (requestType === 'song_request' ? formData?.songTitle?.trim() : null) || null,
        recipientName: (requestType === 'shoutout' ? formData?.recipientName?.trim() : null) || null,
        recipientMessage: (requestType === 'shoutout' ? formData?.recipientMessage?.trim() : null) || null,
        requesterName: formData?.requesterName?.trim() || 'Guest',
        requesterEmail: formData?.requesterEmail?.trim() || null,
        requesterPhone: formData?.requesterPhone?.trim() || null,
        message: (requestType === 'tip' ? 'Tip' : messageWithUrl) || null,
        amount: amount, // Total amount for all songs (0 in bidding mode)
        isFastTrack: (requestType === 'song_request' && isFastTrack) || false,
        isNext: (requestType === 'song_request' && isNext) || false,
        fastTrackFee: (requestType === 'song_request' && isFastTrack) ? fastTrackFee : 0,
        nextFee: (requestType === 'song_request' && isNext) ? nextFee : 0,
        scanId: scanId,
        sessionId: sessionId,
        organizationId: organizationId || null, // Include organization ID if provided
        audioFileUrl: (requestType === 'song_request' ? audioFileUrl : null) || null,
        isCustomAudio: (requestType === 'song_request' && !!audioFileUrl) || false,
        artistRightsConfirmed: (requestType === 'song_request' ? artistRightsConfirmed : false) || false,
        isArtist: (requestType === 'song_request' ? isArtist : false) || false
      };
      
      const mainData = await crowdRequestAPI.submitRequest(mainRequestBody);

      // If bidding is enabled, add request to bidding round instead of processing payment
      // Only for song requests (not tips or shoutouts in bidding mode)
      // On /bid page, force bidding mode even if organization setting is disabled
      if (shouldUseBidding && mainData?.requestId && organizationId) {
        try {
          const biddingResponse = await fetch('/api/bidding/add-request-to-round', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: mainData.requestId,
              organizationId: organizationId,
              forceBiddingMode: forceBiddingMode || false
            })
          });

          const biddingData = await biddingResponse.json();
          
          if (biddingResponse.ok && biddingData.success) {
            // Successfully added to bidding round - now place the actual bid
            const bidAmount = getPaymentAmount();
            setBiddingRequestId(mainData.requestId);
            
            // Place the bid immediately with the selected amount
            try {
              const placeBidResponse = await fetch('/api/bidding/place-bid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  requestId: mainData.requestId,
                  biddingRoundId: biddingData.biddingRoundId,
                  bidAmount: bidAmount,
                  bidderName: formData.requesterName?.trim() || 'Guest',
                  bidderEmail: formData.requesterEmail?.trim() || null,
                  bidderPhone: formData.requesterPhone?.trim() || null,
                  organizationId: organizationId
                })
              });
              
              const placeBidData = await placeBidResponse.json();
              
              if (!placeBidResponse.ok) {
                console.warn('Failed to place initial bid:', placeBidData.error);
                // Continue anyway - user can place bid manually later
              }
              
              // Update current winning bid if bid was placed successfully
              if (placeBidResponse.ok && placeBidData.success) {
                // Fetch updated round info to get accurate winning bid
                const roundInfoResponse = await fetch(`/api/bidding/current-round?organizationId=${organizationId}`);
                if (roundInfoResponse.ok) {
                  const roundInfo = await roundInfoResponse.json();
                  if (roundInfo.active && roundInfo.requests && roundInfo.requests.length > 0) {
                    const highestBid = Math.max(...roundInfo.requests.map(r => r.current_bid_amount || 0));
                    setCurrentWinningBid(highestBid);
                  }
                }
              }
            } catch (bidError) {
              console.error('Error placing initial bid:', bidError);
              // Continue anyway - user can place bid manually later
            }
            
            // Show success modal
            setSubmittedBidAmount(bidAmount);
            setShowBiddingInterface(true);
            setSubmitting(false);
            
            // Get round info for success modal
            if (biddingData.round) {
              setRoundNumber(biddingData.round.roundNumber);
              const now = new Date();
              const endsAt = new Date(biddingData.round.endsAt);
              const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
              setRoundTimeRemaining(remaining);
            }
            
            // Show success modal
            setShowBidSuccessModal(true);
            
            // Scroll to bidding interface after modal closes
            return; // Exit early - don't process payment
          } else {
            // Failed to add to bidding round - fall back to regular payment
            console.warn('Failed to add request to bidding round, falling back to regular payment:', biddingData.error);
          }
        } catch (biddingError) {
          console.error('Error adding request to bidding round:', biddingError);
          // Fall back to regular payment flow
        }
      }

      // Create additional song requests if any (only for song requests, not tips or shoutouts)
      // Count the number of additional songs (based on array length, not whether they have titles)
      const additionalSongCount = (requestType === 'song_request' ? additionalSongs.length : 0);
      const baseAmount = getBaseAmount();
      const discountedAmountPerSong = Math.round(baseAmount * (1 - bundleDiscountPercent));
      const allRequestIds = [mainData.requestId];

      // Create placeholder requests for additional songs (users will fill in details after payment)
      const additionalIds = [];
      if (additionalSongCount > 0 && requestType === 'song_request') {
        for (let i = 0; i < additionalSongCount; i++) {
          const song = additionalSongs[i] || {};
          const additionalRequestBody = {
            eventCode: 'general',
            requestType: 'song_request',
            songArtist: song.songArtist?.trim() || null,
            songTitle: song.songTitle?.trim() || null, // Can be null - user will add after payment
            requesterName: formData?.requesterName?.trim() || 'Guest',
            requesterEmail: formData?.requesterEmail?.trim() || null,
            requesterPhone: formData?.requesterPhone?.trim() || null,
            amount: 0, // Bundled with main request - payment already included in main request
            isFastTrack: false,
            isNext: false,
            fastTrackFee: 0,
            nextFee: 0,
            message: `Bundled with main request - ${Math.round(bundleDiscountPercent * 100)}% discount applied. ${song.songTitle?.trim() ? '' : 'Song details to be added after payment.'}`,
            organizationId: organizationId || null // Include organization ID if provided
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

      // Save main request ID, payment code, and show payment method selection
      if (mainData?.requestId) {
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

  // Get the site URL for absolute image URLs
  const siteUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com');
  
  // Convert cover photo to absolute URL if it's relative
  const getAbsoluteImageUrl = (imageUrl) => {
    if (!imageUrl) return `${siteUrl}${DEFAULT_COVER_PHOTO}`;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If it starts with /, it's a relative path
    if (imageUrl.startsWith('/')) {
      return `${siteUrl}${imageUrl}`;
    }
    // Otherwise, assume it's a relative path
    return `${siteUrl}/${imageUrl}`;
  };

  const ogImageUrl = getAbsoluteImageUrl(coverPhoto);
  const pageTitle = organizationData?.requests_page_title || 'Request a Song or Shoutout | M10 DJ Company';
  const pageDescription = organizationData?.requests_page_description || 
    (organizationData?.requests_header_artist_name 
      ? `Request a song or shoutout for ${organizationData.requests_header_artist_name}`
      : 'Request a song or shoutout for your event');
  const currentUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `${siteUrl}/requests`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Open Graph / Facebook / iPhone SMS Preview */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={organizationData?.requests_header_artist_name || 'Request a Song or Shoutout'} />
        <meta property="og:site_name" content={organizationName || 'M10 DJ Company'} />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={currentUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:image:alt" content={organizationData?.requests_header_artist_name || 'Request a Song or Shoutout'} />
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          /* Ensure modal appears in all browsers */
          [role="dialog"] {
            animation: fadeIn 0.2s ease-in-out !important;
            -webkit-animation: fadeIn 0.2s ease-in-out !important;
          }
        `}</style>
        <style dangerouslySetInnerHTML={{__html: `
          /* Remove body padding-top on requests page to allow hero image to start at top - MUST be first with highest specificity */
          html body,
          body,
          body[data-no-header-padding="true"],
          html[data-requests-page="true"] body {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
          /* Ensure header is transparent from the start on requests page */
          header[data-transparent="true"],
          header:not([data-transparent="false"]) {
            background-color: transparent !important;
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            box-shadow: none !important;
            border: none !important;
            border-bottom: none !important;
          }
          /* Prevent scrollbar from appearing and causing layout shift */
          /* Force scrollbar to always be present but invisible to prevent layout shift */
          html {
            overflow-y: scroll !important; /* Always show scrollbar space */
            overflow-x: hidden !important; /* Prevent horizontal scroll */
            scrollbar-gutter: stable !important; /* Reserve space even when hidden */
          }
          body {
            overflow-y: scroll !important; /* Always show scrollbar space */
            overflow-x: hidden !important; /* Prevent horizontal scroll */
            scrollbar-gutter: stable !important; /* Reserve space even when hidden */
            -ms-overflow-style: none !important;
            scrollbar-width: thin !important; /* Use thin scrollbar to minimize space */
            scrollbar-color: transparent transparent !important; /* Make it transparent */
            max-width: 100vw !important; /* Prevent horizontal overflow */
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
        className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-black dark:via-black dark:to-black relative overflow-x-hidden"
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
        {!showPaymentMethods && (
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
                  : 'rgba(252, 186, 0, 0.2)'
              }}
            ></div>
          </div>
        )}
        
        {!embedMode && !showPaymentMethods && <Header customLogoUrl={customBranding?.customLogoUrl} transparent={true} socialLinks={organizationData?.social_links} isOwner={isOwner} organizationSlug={organizationData?.slug} organizationId={organizationId} />}
        
        {/* Hero Section with Text Fallback */}
        {!embedMode && !showPaymentMethods && (
          <div 
            className={`relative w-full overflow-hidden top-0 bg-gradient-to-b from-gray-900 via-black to-black ${
              minimalHeader 
                ? 'h-[120px] sm:h-[140px] min-h-[100px] sm:min-h-[120px]' 
                : 'h-[40vh] sm:h-[50vh] md:h-[60vh] min-h-[250px] sm:min-h-[350px] md:min-h-[400px] max-h-[600px]'
            }`}
            style={{ 
              zIndex: 0,
              backgroundImage: coverPhoto ? `url(${coverPhoto})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Gradient overlay for text readability - dark at top, darker at bottom */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70 z-10"></div>
            {/* Content overlay */}
            <div className={`relative z-20 h-full flex flex-col justify-between items-center text-center px-4 ${
              minimalHeader ? 'justify-center' : ''
            }`} style={{ paddingTop: minimalHeader ? '60px' : '80px', paddingBottom: minimalHeader ? '10px' : '20px' }}>
              {/* Top content section */}
              <div className={`flex flex-col items-center justify-center ${minimalHeader ? '' : 'flex-1'}`}>
                {/* Artist Name */}
                <h1 
                  className={`font-black text-white drop-shadow-2xl uppercase tracking-tight ${
                    minimalHeader
                      ? 'text-xl sm:text-2xl mb-1'
                      : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6'
                  }`}
                  style={{
                    fontFamily: 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif',
                    letterSpacing: '0.05em',
                    textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {(() => {
                    const artistName = organizationData?.requests_header_artist_name || organizationData?.name || 'DJ';
                    console.log('🎨 Rendering artist name:', artistName, 'from organizationData:', {
                      requests_header_artist_name: organizationData?.requests_header_artist_name,
                      name: organizationData?.name
                    });
                    return artistName.toUpperCase();
                  })()}
                </h1>
                
                {/* Location - Only show if value exists and not minimal header */}
                {!minimalHeader && organizationData?.requests_header_location && (
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/90 mb-3 sm:mb-4 drop-shadow-lg">
                    {organizationData.requests_header_location}
                  </p>
                )}
                
                {/* Date - Only show if value exists and not minimal header */}
                {!minimalHeader && organizationData?.requests_header_date && (
                  <p className="text-lg sm:text-xl md:text-2xl text-white/80 drop-shadow-md">
                    {organizationData.requests_header_date}
                  </p>
                )}
                
                {/* Charity Donation Info - Hide on minimal header */}
                {!minimalHeader && organizationData?.charity_donation_enabled && organizationData?.charity_name && (
                  <div className="mt-4 sm:mt-6 px-4 py-2 sm:py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <p className="text-sm sm:text-base md:text-lg text-white/90 font-semibold mb-1">
                      💝 Supporting {organizationData.charity_name}
                    </p>
                    {organizationData.charity_donation_percentage === 100 ? (
                      <p className="text-xs sm:text-sm text-white/80">
                        All proceeds go to charity
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-white/80">
                        {organizationData.charity_donation_percentage}% of tips donated
                      </p>
                    )}
                    {organizationData.charity_url && (
                      <a
                        href={organizationData.charity_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-white/90 underline hover:text-white mt-1 inline-block"
                      >
                        Learn more →
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              {/* Bottom section with social icons - Hide on minimal header */}
              {!minimalHeader && (
              <div className="w-full flex flex-col items-center gap-4 mt-4 sm:mt-6">
                {/* Social Links - Positioned at bottom */}
                {organizationData?.social_links && Array.isArray(organizationData.social_links) && organizationData.social_links.length > 0 ? (
                  <div className="flex items-center justify-center gap-3">
                    {organizationData.social_links
                      .filter(link => link.enabled !== false)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((link, index) => {
                        const getSocialIcon = (platform) => {
                          const iconProps = { className: "w-5 h-5", strokeWidth: 2, fill: "none" };
                          switch (platform?.toLowerCase()) {
                            case 'facebook':
                              return <Facebook {...iconProps} />;
                            case 'instagram':
                              return <Instagram {...iconProps} />;
                            case 'twitter':
                              return <Twitter {...iconProps} />;
                            case 'youtube':
                              return <Youtube {...iconProps} />;
                            case 'linkedin':
                              return <Linkedin {...iconProps} />;
                            default:
                              return <Link2 {...iconProps} />;
                          }
                        };
                        const platform = link.platform?.toLowerCase();
                        const isSelectable = platform === 'instagram' || platform === 'facebook';
                        
                        if (isSelectable) {
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSocialClick(e, platform);
                              }}
                              className="flex items-center justify-center w-8 h-8 text-white/90 hover:text-white transition-opacity hover:opacity-70 cursor-pointer border-0 bg-transparent p-0"
                              aria-label={link.label || link.platform}
                            >
                              {getSocialIcon(link.platform)}
                            </button>
                          );
                        }
                        
                        return (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-8 h-8 text-white/90 hover:text-white transition-opacity hover:opacity-70"
                            aria-label={link.label || link.platform}
                          >
                            {getSocialIcon(link.platform)}
                          </a>
                        );
                      })}
                  </div>
                ) : (
                  // Default fallback social links
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSocialClick(e, 'instagram');
                      }}
                      className="flex items-center justify-center w-8 h-8 text-white/90 hover:text-white transition-opacity hover:opacity-70 cursor-pointer border-0 bg-transparent p-0"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" strokeWidth={2} fill="none" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSocialClick(e, 'facebook');
                      }}
                      className="flex items-center justify-center w-8 h-8 text-white/90 hover:text-white transition-opacity hover:opacity-70 cursor-pointer border-0 bg-transparent p-0"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5" strokeWidth={2} fill="none" />
                    </button>
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        )}
        
        <main className={`section-container relative z-10 ${showPaymentMethods ? 'py-8 sm:py-12 md:py-16' : 'py-3 sm:py-6 md:py-8 lg:py-12'} px-3 sm:px-4 md:px-6 overflow-x-hidden`} style={{ minHeight: embedMode ? '100vh' : (showPaymentMethods ? '100vh' : 'auto'), display: 'flex', flexDirection: 'column', maxWidth: '100vw' }}>
          <div className={`${showPaymentMethods ? 'max-w-lg' : 'max-w-2xl'} mx-auto w-full flex-1 flex flex-col overflow-x-hidden`}>
            {/* Header - Compact for no-scroll design - Hide when hero image is shown */}
            {false && (
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
            )}
            
            {/* Step Indicator - Show below hero image when hero is present - Compact on mobile */}
            {!showPaymentMethods && (
              <div className="text-center mb-1 sm:mb-3 md:mb-4 lg:mb-6">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <div className={`h-1 sm:h-1.5 rounded-full transition-all ${currentStep >= 1 ? 'bg-white w-6 sm:w-8' : 'bg-white/30 w-1.5 sm:w-2'}`}></div>
                  <div className={`h-1 sm:h-1.5 rounded-full transition-all ${currentStep >= 2 ? 'bg-white w-6 sm:w-8' : 'bg-white/30 w-1.5 sm:w-2'}`}></div>
                </div>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-white/80 mt-0.5 sm:mt-1 md:mt-2">
                  {currentStep === 1 && (organizationData?.requests_step_1_text || 'Step 1 of 2: Choose your request')}
                  {currentStep === 2 && (organizationData?.requests_step_2_text || 'Step 2 of 2: Payment')}
                </p>
              </div>
            )}

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

            {/* On /bid page, always show form first, then bidding interface below */}
            {(forceBiddingMode || biddingEnabled) && requestType === 'song_request' ? (
              <div className="space-y-6">
                {/* Bidding Context Banner - Explain the bidding system */}
                {!biddingRequestId && (
                  <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>🎯 Bidding System Active</span>
                        </h3>
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                          Your song request will enter the current bidding round. The highest bidder's song plays first. You can increase your bid later if someone outbids you.
                        </p>
                        {currentWinningBid > 0 ? (
                          <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-700">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                Current Winning Bid:
                              </p>
                              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                ${(currentWinningBid / 100).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-blue-700 dark:text-blue-300">
                                Minimum to win:
                              </p>
                              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                ${((currentWinningBid + 500) / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
                            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                              🎉 No bids yet! Be the first with a minimum bid of $5.00
                            </p>
                          </div>
                        )}
                        {roundTimeRemaining > 0 && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-300 dark:border-purple-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${
                                  roundTimeRemaining > 600 ? 'text-green-600 dark:text-green-400' :
                                  roundTimeRemaining > 300 ? 'text-yellow-600 dark:text-yellow-400' :
                                  roundTimeRemaining > 60 ? 'text-orange-600 dark:text-orange-400' :
                                  'text-red-600 dark:text-red-400 animate-pulse'
                                }`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Round Ends In</span>
                              </div>
                              <span className={`text-lg font-bold font-mono ${
                                roundTimeRemaining > 600 ? 'text-green-700 dark:text-green-300' :
                                roundTimeRemaining > 300 ? 'text-yellow-700 dark:text-yellow-300' :
                                roundTimeRemaining > 60 ? 'text-orange-700 dark:text-orange-300' :
                                'text-red-700 dark:text-red-300'
                              }`}>
                                {Math.floor(roundTimeRemaining / 60)}:{(roundTimeRemaining % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                            {roundTimeRemaining < 300 && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                ⚠️ Round ending soon! Place your bid now!
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Song Request Form - Always show on bid page (unless user already submitted) */}
                {!biddingRequestId && (
                  <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col space-y-3 sm:space-y-4 overflow-y-auto">
                    {/* Request Type Selection - Hidden on bid page since only song_request is allowed */}
                    
                    {/* Song Request Fields */}
                    {requestType === 'song_request' && (
                      <div className="bg-white/70 dark:bg-black/70 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-3 sm:p-4 md:p-5 flex-shrink-0 space-y-2 sm:space-y-3 md:space-y-4">
                        <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 md:mb-4 flex items-center gap-2 sm:gap-3">
                          <div className="w-1 h-5 sm:h-6 md:h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full hidden sm:block"></div>
                          <span className="leading-tight">Submit Your Song Request</span>
                        </h2>
                        
                        {/* Music Link Input */}
                        {showLinkField ? (
                          <>
                            <div>
                              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                                <Music className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                {organizationData?.requests_music_link_label || 'Paste Music Link (Optional)'}
                              </label>
                              <div className="relative">
                                <input
                                  type="url"
                                  value={songUrl}
                                  onChange={handleSongUrlChange}
                                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200 touch-manipulation ${
                                    extractingSong ? 'pr-20 sm:pr-24 md:pr-28' : 'pr-3 sm:pr-4'
                                  }`}
                                  placeholder={organizationData?.requests_music_link_placeholder || "Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link"}
                                  autoComplete="off"
                                />
                                {extractingSong && (
                                  <div className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2 pointer-events-none">
                                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-purple-500 flex-shrink-0" />
                                    <span className="text-xs text-purple-600 dark:text-purple-400 hidden sm:inline whitespace-nowrap">Extracting...</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {organizationData?.requests_music_link_help_text || "We'll automatically fill in the song title and artist name"}
                              </p>
                            </div>

                            <div className="relative my-2 sm:my-3">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-800"></div>
                              </div>
                              <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                                <span className="bg-white dark:bg-black px-2 text-gray-500 dark:text-gray-400">
                                  {organizationData?.requests_manual_entry_divider || 'Or enter manually'}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="mb-2 sm:mb-3">
                            <button
                              type="button"
                              onClick={handleShareAnotherSong}
                              className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                            >
                              <Music className="w-3 h-3 sm:w-4 sm:h-4" />
                              {organizationData?.requests_start_over_text || 'Start over'}
                            </button>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                            {organizationData?.requests_song_title_label || 'Song Title'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            ref={songTitleInputRef}
                            type="text"
                            name="songTitle"
                            value={formData.songTitle}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200 touch-manipulation"
                            placeholder={organizationData?.requests_song_title_placeholder || "Enter song title"}
                            autoComplete="off"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                            {organizationData?.requests_artist_name_label || 'Artist Name'}
                            {!isExtractedFromLink && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            name="songArtist"
                            value={formData.songArtist}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200"
                            placeholder={organizationData?.requests_artist_name_placeholder || "Enter artist name"}
                            autoComplete="off"
                          />
                        </div>

                        {/* Current Winning Bid Display - Show prominently above amount selector */}
                        {shouldUseBidding && currentWinningBid > 0 && (
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Current Winning Bid</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
                                  ${(currentWinningBid / 100).toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Minimum to Win</p>
                                <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                                  ${((currentWinningBid + 500) / 100).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                              💡 Bid at least ${((currentWinningBid + 500) / 100).toFixed(2)} to take the lead
                            </p>
                          </div>
                        )}

                        {/* Bid Amount Selector - Always show on bid page with dynamic amounts based on winning bid */}
                        <div data-payment-section className="mt-4">
                          <PaymentAmountSelector
                            amountType={amountType}
                            setAmountType={setAmountType}
                            presetAmount={presetAmount}
                            setPresetAmount={setPresetAmount}
                            customAmount={customAmount}
                            setCustomAmount={setCustomAmount}
                            presetAmounts={dynamicBidPresets || presetAmounts}
                            minimumAmount={dynamicMinimumAmount || minimumAmount}
                            requestType={requestType}
                            isFastTrack={false}
                            setIsFastTrack={() => {}}
                            isNext={false}
                            setIsNext={() => {}}
                            fastTrackFee={0}
                            nextFee={0}
                            getBaseAmount={getBaseAmount}
                            getPaymentAmount={getPaymentAmount}
                            hidePriorityOptions={true} // Hide fast track and next options on bid page
                            isBiddingMode={shouldUseBidding} // Pass bidding mode flag
                            currentWinningBid={currentWinningBid} // Pass current winning bid for display
                          />
                        </div>

                        {/* Bid Amount Required Notification - Show when bid amount is missing */}
                        {shouldUseBidding && (() => {
                          const bidAmount = getPaymentAmount();
                          const minBid = dynamicMinimumAmount || 500;
                          if (!bidAmount || bidAmount < minBid) {
                            return (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-3 mb-3">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                                      Bid Amount Required
                                    </p>
                                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                      Please select a bid amount above. Minimum bid is <span className="font-bold">${((minBid || 500) / 100).toFixed(2)}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={(() => {
                            if (submitting) return true;
                            if (!formData.songTitle.trim()) return true;
                            // In bidding mode, also check if a bid amount is selected
                            if (shouldUseBidding) {
                              const bidAmount = getPaymentAmount();
                              const minBid = dynamicMinimumAmount || 500;
                              if (!bidAmount || bidAmount < minBid) return true;
                            }
                            return false;
                          })()}
                          className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                          title={(() => {
                            if (!formData.songTitle.trim()) return 'Please enter a song title';
                            if (shouldUseBidding) {
                              const bidAmount = getPaymentAmount();
                              const minBid = dynamicMinimumAmount || 500;
                              if (!bidAmount || bidAmount < minBid) {
                                return `Please select a bid amount. Minimum bid is $${((minBid || 500) / 100).toFixed(2)}`;
                              }
                            }
                            return '';
                          })()}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>
                                {shouldUseBidding 
                                  ? (() => {
                                      const bidAmount = getPaymentAmount();
                                      return bidAmount > 0 
                                        ? `Place $${(bidAmount / 100).toFixed(2)} Bid & Enter Round`
                                        : 'Place Bid & Enter Round';
                                    })()
                                  : 'Submit Song Request'
                                }
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                )}
                {/* Bid Success Modal */}
                {showBidSuccessModal && (
                  <BidSuccessModal
                    isOpen={showBidSuccessModal}
                    onClose={() => {
                      setShowBidSuccessModal(false);
                      // Scroll to bidding interface after closing
                      setTimeout(() => {
                        const biddingElement = document.querySelector('[data-bidding-interface]');
                        if (biddingElement) {
                          biddingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100);
                    }}
                    bidAmount={submittedBidAmount}
                    songTitle={formData.songTitle}
                    songArtist={formData.songArtist}
                    isWinning={(() => {
                      // User is winning if:
                      // 1. No bids exist yet (currentWinningBid === 0), OR
                      // 2. Their submitted bid is higher than the previous winning bid
                      // Note: After submission, their bid becomes the new currentWinningBid, but we check against the previous value
                      const previousWinningBid = currentWinningBid;
                      return previousWinningBid === 0 || submittedBidAmount > previousWinningBid;
                    })()}
                    currentWinningBid={currentWinningBid}
                    timeRemaining={roundTimeRemaining}
                    roundNumber={roundNumber}
                    onIncreaseBid={() => {
                      setShowBidSuccessModal(false);
                      // Scroll to bidding interface to increase bid
                      setTimeout(() => {
                        const biddingElement = document.querySelector('[data-bidding-interface]');
                        if (biddingElement) {
                          biddingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100);
                    }}
                    onViewAllBids={() => {
                      setShowBidSuccessModal(false);
                      // Scroll to bidding interface
                      setTimeout(() => {
                        const biddingElement = document.querySelector('[data-bidding-interface]');
                        if (biddingElement) {
                          biddingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100);
                    }}
                    onShare={() => {
                      // Share functionality
                      const shareUrl = typeof window !== 'undefined' 
                        ? `${window.location.origin}/bid`
                        : '';
                      if (navigator.share) {
                        navigator.share({
                          title: `I just bid $${(submittedBidAmount / 100).toFixed(2)} on ${formData.songTitle}!`,
                          text: `Beat my bid and get your song played first!`,
                          url: shareUrl
                        }).catch(() => {});
                      } else if (navigator.clipboard) {
                        navigator.clipboard.writeText(shareUrl);
                        alert('Link copied to clipboard!');
                      }
                    }}
                    onGetNotifications={async () => {
                      // Request notification permission
                      if ('Notification' in window && Notification.permission === 'default') {
                        await Notification.requestPermission();
                      }
                      // Could also collect email/phone here
                      alert('Notifications enabled! You\'ll be notified if you\'re outbid.');
                    }}
                    organizationId={organizationId}
                  />
                )}

                <div data-bidding-interface>
                  <BiddingInterface
                    organizationId={organizationId}
                    requestId={biddingRequestId} // Can be null on /bid page initially
                    requestType={requestType}
                    songTitle={formData.songTitle}
                    songArtist={formData.songArtist}
                    recipientName={formData.recipientName}
                    recipientMessage={formData.recipientMessage}
                  />
                </div>
              </div>
            ) : success ? (
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
                additionalSongs={additionalSongs}
                setAdditionalSongs={setAdditionalSongs}
                bundleDiscount={bundleDiscountPercent}
                    bundleDiscountEnabled={organizationData?.requests_show_bundle_discount !== false ? bundleDiscountEnabled : false}
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
                <div className="bg-white/70 dark:bg-black/70 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-3 sm:p-4 md:p-5 flex-shrink-0">
                  <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 md:mb-4 lg:mb-6 flex items-center gap-2 sm:gap-3">
                    <div className="w-1 h-5 sm:h-6 md:h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full hidden sm:block"></div>
                    <span className="leading-tight">{organizationData?.requests_main_heading || 'What would you like to request?'}</span>
                  </h2>
                  
                  {/* Request Type Selection - Hide if only one type is allowed */}
                  {(!allowedRequestTypes || allowedRequestTypes.length > 1) && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                      {(!allowedRequestTypes || allowedRequestTypes.includes('song_request')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('song_request')}
                          className={`group relative p-3 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 touch-manipulation overflow-hidden ${
                            requestType === 'song_request'
                              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/20 shadow-lg shadow-purple-500/20 scale-105'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 hover:border-purple-300 hover:scale-[1.02] hover:shadow-md'
                          }`}
                        >
                          {requestType === 'song_request' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl mb-2 sm:mb-4 transition-all duration-300 ${
                              requestType === 'song_request'
                                ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/50'
                                : 'bg-gray-100 dark:bg-black/50 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30'
                            }`}>
                              <Music className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-colors ${
                                requestType === 'song_request' ? 'text-white' : 'text-gray-400 group-hover:text-purple-500'
                              }`} />
                            </div>
                            <h3 className="font-bold text-xs sm:text-base md:text-lg text-gray-900 dark:text-white text-center leading-tight">{organizationData?.requests_song_request_label || 'Song Request'}</h3>
                          </div>
                        </button>
                      )}
                      
                      {(!allowedRequestTypes || allowedRequestTypes.includes('shoutout')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('shoutout')}
                          className={`group relative p-3 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 touch-manipulation overflow-hidden ${
                            requestType === 'shoutout'
                              ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/30 dark:to-pink-800/20 shadow-lg shadow-pink-500/20 scale-105'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 hover:border-pink-300 hover:scale-[1.02] hover:shadow-md'
                          }`}
                        >
                          {requestType === 'shoutout' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl mb-2 sm:mb-4 transition-all duration-300 ${
                              requestType === 'shoutout'
                                ? 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-lg shadow-pink-500/50'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30'
                            }`}>
                              <Mic className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-colors ${
                                requestType === 'shoutout' ? 'text-white' : 'text-gray-400 group-hover:text-pink-500'
                              }`} />
                            </div>
                            <h3 className="font-bold text-xs sm:text-base md:text-lg text-gray-900 dark:text-white text-center leading-tight">{organizationData?.requests_shoutout_label || 'Shoutout'}</h3>
                          </div>
                        </button>
                      )}

                      {(!allowedRequestTypes || allowedRequestTypes.includes('tip')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('tip')}
                          className={`group relative p-3 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 touch-manipulation overflow-hidden ${
                            requestType === 'tip'
                              ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-800/20 shadow-lg shadow-yellow-500/20 scale-105'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 hover:border-yellow-300 hover:scale-[1.02] hover:shadow-md'
                          }`}
                        >
                          {requestType === 'tip' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center">
                            <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg sm:rounded-xl mb-2 sm:mb-4 transition-all duration-300 ${
                              requestType === 'tip'
                                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30'
                            }`}>
                              <Gift className={`w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-colors ${
                                requestType === 'tip' ? 'text-white' : 'text-gray-400 group-hover:text-yellow-500'
                              }`} />
                            </div>
                            <h3 className="font-bold text-xs sm:text-base md:text-lg text-gray-900 dark:text-white text-center leading-tight">Tip Me</h3>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Song Request Fields */}
                  {requestType === 'song_request' && (
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      {/* Music Link Input - Show only when showLinkField is true */}
                      {showLinkField ? (
                        <>
                          <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                              <Music className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                              {organizationData?.requests_music_link_label || 'Paste Music Link (Optional)'}
                            </label>
                            <div className="relative">
                              <input
                                type="url"
                                value={songUrl}
                                onChange={handleSongUrlChange}
                                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200 touch-manipulation ${
                                  extractingSong ? 'pr-20 sm:pr-24 md:pr-28' : 'pr-3 sm:pr-4'
                                }`}
                                placeholder={organizationData?.requests_music_link_placeholder || "Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link"}
                                autoComplete="off"
                              />
                              {extractingSong && (
                                <div className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2 pointer-events-none">
                                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-purple-500 flex-shrink-0" />
                                  <span className="text-xs text-purple-600 dark:text-purple-400 hidden sm:inline whitespace-nowrap">Extracting...</span>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {organizationData?.requests_music_link_help_text || "We'll automatically fill in the song title and artist name"}
                            </p>
                          </div>

                          <div className="relative my-2 sm:my-3">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300 dark:border-gray-800"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                              <span className="bg-white dark:bg-black px-2 text-gray-500 dark:text-gray-400">
                                {organizationData?.requests_manual_entry_divider || 'Or enter manually'}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Show "Start over" button when link field is hidden */
                        <div className="mb-2 sm:mb-3">
                          <button
                            type="button"
                            onClick={handleShareAnotherSong}
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                          >
                            <Music className="w-3 h-3 sm:w-4 sm:h-4" />
                            {organizationData?.requests_start_over_text || 'Start over'}
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          {organizationData?.requests_song_title_label || 'Song Title'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          ref={songTitleInputRef}
                          type="text"
                          name="songTitle"
                          value={formData.songTitle}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200 touch-manipulation"
                          placeholder={organizationData?.requests_song_title_placeholder || "Enter song title"}
                          required
                          autoComplete="off"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          {organizationData?.requests_artist_name_label || 'Artist Name'}
                        </label>
                        <input
                          type="text"
                          name="songArtist"
                          value={formData.songArtist}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200"
                          placeholder={organizationData?.requests_artist_name_placeholder || "Enter artist name"}
                          required
                          autoComplete="off"
                        />
                      </div>

                      {/* Audio File Upload Section - Collapsible */}
                      {organizationData?.requests_show_audio_upload !== false && (
                      <Collapsible open={audioUploadExpanded} onOpenChange={setAudioUploadExpanded} className="mt-2">
                        <div className={`rounded-lg border overflow-hidden transition-colors ${
                          audioUploadExpanded 
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
                            : 'bg-transparent border-gray-200 dark:border-gray-800'
                        }`}>
                          <CollapsibleTrigger className={`w-full py-2 px-3 flex items-center justify-between gap-2 transition-colors ${
                            audioUploadExpanded
                              ? 'hover:bg-purple-100/50 dark:hover:bg-purple-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'
                          }`}>
                            <div className="flex items-center gap-1.5 flex-1">
                              <Music className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                                audioUploadExpanded 
                                  ? 'text-purple-600 dark:text-purple-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} />
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Upload your own audio
                              </span>
                        </div>
                            <ChevronDown 
                              className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 ${
                                audioUploadExpanded 
                                  ? 'transform rotate-180 text-purple-600 dark:text-purple-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`} 
                            />
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="px-4 pb-4 space-y-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 pt-2">
                          {organizationData?.requests_audio_upload_description || 'Upload your own audio file to be played. This is perfect for upcoming artists or custom tracks. ($100 per file)'}
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
                                    // Auto-expand section when file is uploaded
                                    setAudioUploadExpanded(true);
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
                              <div className="space-y-2">
                            <label className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={artistRightsConfirmed}
                                onChange={(e) => setArtistRightsConfirmed(e.target.checked)}
                                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                required={!!audioFileUrl}
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {organizationData?.requests_artist_rights_text || 'I confirm that I own the rights to this music or have permission to use it'}
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
                                {organizationData?.requests_is_artist_text || 'I am the artist (this is for promotion, not just a play)'}
                              </span>
                            </label>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-2">
                              {organizationData?.requests_audio_fee_text || '+$100.00 for audio upload'}
                            </p>
                          </div>
                        )}
                          </CollapsibleContent>
                      </div>
                      </Collapsible>
                      )}
                    </div>
                  )}

                  {/* Shoutout Fields */}
                  {requestType === 'shoutout' && (
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          {organizationData?.requests_recipient_name_label || 'Recipient Name'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="recipientName"
                          value={formData.recipientName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder={organizationData?.requests_recipient_name_placeholder || "Who is this shoutout for?"}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          {organizationData?.requests_message_label || 'Message'} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="recipientMessage"
                          value={formData.recipientMessage}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                          placeholder={organizationData?.requests_message_placeholder || "What would you like to say?"}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Tip Fields - Show payment amount selector immediately */}
                  {requestType === 'tip' && (
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      <div className="text-center py-2 sm:py-4">
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                          Show your appreciation with a tip!
                        </p>
                      </div>
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
                        isFastTrack={false}
                        setIsFastTrack={() => {}}
                        isNext={false}
                        setIsNext={() => {}}
                        fastTrackFee={0}
                        nextFee={0}
                        getBaseAmount={getBaseAmount}
                        getPaymentAmount={getPaymentAmount}
                      />
                    </div>
                  )}

                  {/* Additional Message */}
                  {currentStep === 1 && (
                  <div className="mt-2 sm:mt-3 md:mt-4">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Any additional information..."
                    />
                  </div>
                  )}

                </div>

                {/* Payment Amount - Show when fields are visible (step 1 for song requests, immediately for shoutouts) or after song selection is complete (not for tip, which shows inline) */}
                {/* In bidding mode, show payment selector for song requests as soon as title is filled (for initial bid) */}
                {requestType !== 'tip' && (() => {
                  // Calculate bidding mode status inline to ensure it's always available
                  const isBiddingMode = (forceBiddingMode || biddingEnabled) && requestType === 'song_request';
                  const hasSongTitle = formData?.songTitle?.trim();
                  
                  // In bidding mode, show as soon as title is filled
                  if (isBiddingMode && hasSongTitle) {
                    return (
                      <div data-payment-section className="mt-4">
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
                          isFastTrack={false}
                          setIsFastTrack={() => {}}
                          isNext={false}
                          setIsNext={() => {}}
                          fastTrackFee={0}
                          nextFee={0}
                          getBaseAmount={getBaseAmount}
                          getPaymentAmount={getPaymentAmount}
                        />
                      </div>
                    );
                  }
                  
                  // Regular mode - show when appropriate
                  if (!isBiddingMode && (requestType === 'shoutout' || 
                    (requestType === 'song_request' && (currentStep === 1 || (isSongSelectionComplete() && currentStep >= 2))))) {
                    return (
                      <div data-payment-section>
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
                          isFastTrack={organizationData?.requests_show_fast_track !== false ? isFastTrack : false}
                          setIsFastTrack={organizationData?.requests_show_fast_track !== false ? setIsFastTrack : () => {}}
                          isNext={organizationData?.requests_show_next_song !== false ? isNext : false}
                          setIsNext={organizationData?.requests_show_next_song !== false ? setIsNext : () => {}}
                          fastTrackFee={fastTrackFee}
                          nextFee={nextFee}
                          getBaseAmount={getBaseAmount}
                          getPaymentAmount={getPaymentAmount}
                        />
                      </div>
                    );
                  }
                  
                  return null;
                })()}


                {/* Submit Button - Sticky at bottom, appears when selection is complete */}
                {((requestType === 'tip') || isSongSelectionComplete()) && (
                <div 
                  className="sticky bottom-0 left-0 right-0 z-50 bg-white dark:bg-black pt-2 sm:pt-3 pb-3 sm:pb-4 border-t border-gray-200 dark:border-gray-800 shadow-lg flex-shrink-0 mt-auto focus:outline-none focus:ring-0"
                  style={{ 
                    paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
                    position: 'sticky',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <button
                    type={currentStep === 1 ? "button" : "submit"}
                    disabled={submitting || (currentStep >= 2 && getPaymentAmount() < (presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount))}
                    className="group relative w-full py-3 sm:py-4 md:py-5 lg:py-6 text-sm sm:text-base md:text-lg font-bold inline-flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px] md:min-h-[64px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    onClick={(e) => {
                      if (currentStep === 1) {
                        e.preventDefault();
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
                              <Music className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                              <span className="whitespace-nowrap relative z-10">{organizationData?.requests_submit_button_text || 'Submit Request'}</span>
                            </>
                          )}
                        </button>

                        {currentStep >= 2 && (
                          <p className="text-[10px] sm:text-xs text-center text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
                            You&apos;ll choose your payment method after submitting.
                          </p>
                        )}
                      </div>
                      )}
              </form>
            )}
          </div>
        </main>

        {/* Inconspicuous "Create Your Page" link for new DJs */}
        <footer className="mt-8 mb-4 text-center">
          <Link 
            href="/onboarding/request-page" 
            className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors inline-flex items-center gap-1"
          >
            <span>Are you a DJ?</span>
            <span className="underline">Create your request page</span>
          </Link>
        </footer>
      </div>


      {/* Social Account Selector */}
      {selectedSocialPlatform && (
        <SocialAccountSelector
          platform={selectedSocialPlatform}
          isOpen={socialSelectorOpen}
          onClose={() => {
            setSocialSelectorOpen(false);
            setSelectedSocialPlatform(null);
          }}
          onSelect={handleAccountSelect}
        />
      )}
    </>
  );
}

