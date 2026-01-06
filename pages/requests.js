import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Header from '../components/company/Header';
import { Music, Mic, Loader2, AlertCircle, Gift, Zap, Facebook, Instagram, Twitter, Youtube, Linkedin, Link2, DollarSign, ChevronDown, Clock, X, CheckCircle } from 'lucide-react';
import SocialAccountSelector from '../components/ui/SocialAccountSelector';
import PaymentMethodSelection from '../components/crowd-request/PaymentMethodSelection';
import PaymentSuccessScreen from '../components/crowd-request/PaymentSuccessScreen';
import PaymentAmountSelector from '../components/crowd-request/PaymentAmountSelector';
import BiddingAmountSelector from '../components/bidding/BiddingAmountSelector';
import { usePaymentSettings } from '../hooks/usePaymentSettings';
import { useSongExtraction } from '../hooks/useSongExtraction';
import { useSongSearch } from '../hooks/useSongSearch';
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
import FullScreenLoader from '@/components/ui/FullScreenLoader';

const logger = createLogger('GeneralRequestsPage');

const DEFAULT_COVER_PHOTO = '/assets/DJ-Ben-Murray-Dodge-Poster.png';

// localStorage key for persisting requester info
const REQUESTER_INFO_KEY = 'm10_requester_info';

// Wrapper component for /requests route that loads organization data
export default function RequestsPageWrapper() {
  const router = useRouter();
  // Don't use useMemo for client component - causes hooks violation
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    async function loadDefaultOrganization() {
      try {
        console.log('🔄 [REQUESTS] Loading default organization for /requests route...');
        
        // Load the default organization (M10 DJ Company with slug 'm10djcompany')
        // You can change this to load a different default organization
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', 'm10djcompany')
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
    
    // Set up interval to refresh organization data every 5 seconds
    // This ensures live page updates are visible within 5 seconds after admin changes
    const refreshInterval = setInterval(() => {
      loadDefaultOrganization();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [supabase]);

  // Ensure loader shows for minimum time to prevent flash
  useEffect(() => {
    if (!loading) {
      const elapsed = Date.now() - startTime;
      const minLoadTime = 400; // Minimum 400ms to prevent flash
      const remaining = Math.max(0, minLoadTime - elapsed);
      
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, remaining);
      
      return () => clearTimeout(timer);
    } else {
      setShowLoader(true);
    }
  }, [loading, startTime]);

  if (showLoader) {
    return (
      <FullScreenLoader 
        isOpen={true} 
        message="Loading requests page..." 
        />
    );
  }

  // Use a stable key that doesn't change on every render to prevent duplicate headers
  const stableKey = organization?.id || 'default';
  
  return (
    <GeneralRequestsPage
      key={stableKey}
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
  
  // Get the video URL from organization data (if set)
  // This allows each organization to have their own animated header
  const headerVideoUrl = organizationData?.requests_header_video_url || null;
  
  // Show video if the organization has a custom video URL set
  // If no video URL is set, fall back to showing the cover photo
  const showVideo = !!headerVideoUrl;
  
  // Log cover photo and video for debugging
  useEffect(() => {
    console.log('🖼️ [GENERAL REQUESTS] Cover photo & video:', {
      organizationCoverPhoto,
      coverPhoto,
      headerVideoUrl,
      showVideo,
      rawVideoUrl: organizationData?.requests_header_video_url,
      fromOrganizationData: organizationData?.requests_cover_photo_url || organizationData?.requests_artist_photo_url || organizationData?.requests_venue_photo_url,
      primaryCoverSource: organizationData?.requests_primary_cover_source,
      hasArtist: !!organizationData?.requests_artist_photo_url,
      hasVenue: !!organizationData?.requests_venue_photo_url,
      artistUrl: organizationData?.requests_artist_photo_url,
      venueUrl: organizationData?.requests_venue_photo_url,
      allOrgKeys: organizationData ? Object.keys(organizationData) : []
    });
  }, [organizationCoverPhoto, coverPhoto, headerVideoUrl, showVideo, organizationData]);
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
  const [biddingSelectedAmount, setBiddingSelectedAmount] = useState(null); // Amount selected via BiddingAmountSelector (in cents)
  const [isFastTrack, setIsFastTrack] = useState(false);
  const [isNext, setIsNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [songUrl, setSongUrl] = useState(''); // Keep for submission payload
  const [extractedSongUrl, setExtractedSongUrl] = useState(''); // Store the URL that was used for extraction
  const [isExtractedFromLink, setIsExtractedFromLink] = useState(false); // Track if song was extracted from link
  const [albumArtUrl, setAlbumArtUrl] = useState(null); // Store album art URL from extraction
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false); // Show/hide autocomplete suggestions
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1); // Keyboard navigation
  const songTitleInputRef = useRef(null); // Ref for scrolling to song title field
  const bundleSongsRef = useRef(null); // Ref for scrolling to bundle songs section
  const desktopVideoRef = useRef(null); // Ref for desktop video background
  const mobileVideoRef = useRef(null); // Ref for mobile video background
  const [videoFailed, setVideoFailed] = useState(false); // Track if video autoplay failed
  const [requestId, setRequestId] = useState(null);
  const [paymentCode, setPaymentCode] = useState(null);
  const [additionalRequestIds, setAdditionalRequestIds] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Song/Shoutout, 2: Payment (Step 2 removed - contact info collected after payment)
  const [additionalSongs, setAdditionalSongs] = useState([]); // Array of {songTitle, songArtist}
  const [bundleSize, setBundleSize] = useState(1); // Bundle size: 1, 2, or 3
  const [bundleSongs, setBundleSongs] = useState([]); // Array of {songTitle, songArtist} for bundle songs
  // State for bundle song extraction and autocomplete (per song index)
  const [bundleExtractingSong, setBundleExtractingSong] = useState({}); // {index: boolean}
  const [bundleExtractedSongUrls, setBundleExtractedSongUrls] = useState({}); // {index: string}
  const [bundleIsExtractedFromLink, setBundleIsExtractedFromLink] = useState({}); // {index: boolean}
  const [bundleExtractionErrors, setBundleExtractionErrors] = useState({}); // {index: string}
  const [bundleShowAutocomplete, setBundleShowAutocomplete] = useState({}); // {index: boolean}
  const [bundleSelectedSuggestionIndex, setBundleSelectedSuggestionIndex] = useState({}); // {index: number}
  const [activeBundleSongIndex, setActiveBundleSongIndex] = useState(null); // Track which bundle song is being searched
  const [bundleSongSearchQuery, setBundleSongSearchQuery] = useState(''); // Current search query for bundle songs
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

  // Load saved requester info from localStorage on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      try {
        const savedInfo = localStorage.getItem(REQUESTER_INFO_KEY);
        console.log('🔍 [requests.js] Checking localStorage for saved requester info:', savedInfo);
        
        if (savedInfo) {
          const parsed = JSON.parse(savedInfo);
          const { requesterName, requesterEmail, requesterPhone } = parsed;
          console.log('✅ [requests.js] Found saved info:', { requesterName, requesterEmail, requesterPhone });
          
          setFormData(prev => {
            // Only update if fields are currently empty to avoid overwriting user input
            const updated = {
              ...prev,
              requesterName: prev.requesterName || requesterName || '',
              requesterEmail: prev.requesterEmail || requesterEmail || '',
              requesterPhone: prev.requesterPhone || requesterPhone || ''
            };
            console.log('📝 [requests.js] Updated formData:', updated);
            return updated;
          });
          logger.info('Loaded saved requester info from localStorage', { requesterName, requesterEmail, requesterPhone });
        } else {
          console.log('❌ [requests.js] No saved requester info found in localStorage');
          logger.info('No saved requester info found in localStorage');
        }
      } catch (e) {
        console.error('❌ [requests.js] Error loading requester info from localStorage:', e);
        logger.error('Error loading requester info from localStorage:', e);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
              setCurrentWinningBid(prev => {
                // Only update if the value actually changed to prevent unnecessary re-renders
                if (prev !== highestBid) {
                  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                    console.log('[requests.js] currentWinningBid updated:', {
                      previous: prev / 100,
                      new: highestBid / 100,
                      change: (highestBid - prev) / 100
                    });
                  }
                  return highestBid;
                }
                return prev;
              });
            } else {
              setCurrentWinningBid(prev => {
                if (prev !== 0) {
                  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                    console.log('[requests.js] currentWinningBid reset to 0');
                  }
                  return 0;
                }
                return prev;
              });
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
    // Poll every 2 seconds to keep winning bid and timer updated (more frequent for better UX)
    const interval = setInterval(fetchRoundInfo, 2000);
    
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

  // Force video autoplay for Safari - Safari requires programmatic play() call
  useEffect(() => {
    const playVideo = async (videoRef) => {
      if (videoRef.current) {
        try {
          // Ensure video is muted (required for autoplay)
          videoRef.current.muted = true;
          await videoRef.current.play();
        } catch (error) {
          console.warn('Video autoplay failed:', error);
          // If autoplay fails, show poster image instead
          setVideoFailed(true);
        }
      }
    };

    // Attempt to play both videos when component mounts
    const timer = setTimeout(() => {
      playVideo(desktopVideoRef);
      playVideo(mobileVideoRef);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Set initial preset amount when settings load - default to max (first) amount
  // Note: presetAmounts array is now reversed in PaymentAmountSelector, so max is first
  useEffect(() => {
    if (presetAmounts.length > 0 && presetAmount === CROWD_REQUEST_CONSTANTS.DEFAULT_PRESET_AMOUNT) {
      // Set to the maximum preset amount (first one in array, since array is reversed in UI)
      const maxPreset = presetAmounts[presetAmounts.length - 1];
      setPresetAmount(maxPreset.value);
    }
  }, [presetAmounts, presetAmount]);

  // Use song extraction hook
  const { extractingSong, extractionError, extractedData, extractSongInfo: extractSongInfoHook } = useSongExtraction();

  // Check if bidding mode is enabled - use useMemo to make it reactive to state changes
  // MUST be defined before getBaseAmount/getPaymentAmount callbacks that use it
  const shouldUseBidding = useMemo(() => {
    return (forceBiddingMode || biddingEnabled) && requestType === 'song_request';
  }, [forceBiddingMode, biddingEnabled, requestType]);

  // Debug: Log when bidding mode state changes
  useEffect(() => {
    console.log('[requests.js] Bidding mode state:', {
      shouldUseBidding,
      forceBiddingMode,
      biddingEnabled,
      requestType,
      organizationId,
      willUseBiddingSelector: shouldUseBidding && organizationId
    });
  }, [shouldUseBidding, forceBiddingMode, biddingEnabled, requestType, organizationId]);

  // Use payment calculation hook
  const { getBaseAmount: getBaseAmountHook, getPaymentAmount: getPaymentAmountHook, calculateBundlePrice } = useCrowdRequestPayment({
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

  // Wrapper functions that use bidding amount when in bidding mode
  const getBaseAmount = useCallback(() => {
    if (shouldUseBidding && biddingSelectedAmount !== null) {
      return biddingSelectedAmount;
    }
    return getBaseAmountHook();
  }, [shouldUseBidding, biddingSelectedAmount, getBaseAmountHook]);

  const getPaymentAmount = useCallback(() => {
    if (shouldUseBidding && biddingSelectedAmount !== null) {
      return biddingSelectedAmount; // In bidding mode, amount is just the bid amount (no fees)
    }
    return getPaymentAmountHook();
  }, [shouldUseBidding, biddingSelectedAmount, getPaymentAmountHook]);

  // Reset bundle size to 1 when custom amount is entered or amount doesn't equal minimum
  // Must be after getBaseAmount is defined
  useEffect(() => {
    const baseAmount = getBaseAmount();
    // If using custom amount OR amount doesn't equal minimum, reset bundle to 1
    if (amountType === 'custom' || (baseAmount > 0 && baseAmount !== minimumAmount)) {
      if (bundleSize > 1) {
        setBundleSize(1);
      }
    }
  }, [amountType, customAmount, presetAmount, minimumAmount, getBaseAmount, bundleSize]); // Watch for amount changes

  // Scroll to bundle songs section when bundle is selected and min bid is selected
  // Must be after getBaseAmount is defined
  useEffect(() => {
    if (bundleSize > 1) {
      // Check if min bid is selected
      const baseAmount = getBaseAmount();
      const isMinBidSelected = baseAmount === minimumAmount;
      
      if (isMinBidSelected) {
        // Check if first song is filled in
        const isFirstSongFilled = formData.songTitle?.trim() && formData.songArtist?.trim();
        
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          if (!isFirstSongFilled && songTitleInputRef.current) {
            // First song not filled - scroll to first song input
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
          } else if (isFirstSongFilled && bundleSongsRef.current) {
            // First song filled - scroll to bundle songs section
            bundleSongsRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 100);
      }
    }
  }, [bundleSize, getBaseAmount, minimumAmount, formData.songTitle, formData.songArtist]);

  // Calculate minimum bid amount based on current winning bid (only for bidding mode)
  const dynamicMinimumAmount = useMemo(() => {
    if (!shouldUseBidding) return null;
    // Minimum bid must be at least $5 above winning bid (or $5 if no bids yet)
    // Always add $5 to the winning bid, even if it's 0
    const minAmount = currentWinningBid > 0 ? currentWinningBid + 500 : 500;
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[requests.js] dynamicMinimumAmount calculated:', {
        shouldUseBidding,
        currentWinningBid: currentWinningBid / 100,
        minAmount: minAmount / 100
      });
    }
    return minAmount;
  }, [shouldUseBidding, currentWinningBid]);

  // Debug log when values change for BiddingAmountSelector
  useEffect(() => {
    if (shouldUseBidding && organizationId && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[requests.js] BiddingAmountSelector props:', {
        organizationId,
        currentWinningBid: currentWinningBid / 100,
        dynamicMinimumAmount: dynamicMinimumAmount ? dynamicMinimumAmount / 100 : null,
        biddingSelectedAmount: biddingSelectedAmount ? biddingSelectedAmount / 100 : null
      });
    }
  }, [shouldUseBidding, organizationId, currentWinningBid, dynamicMinimumAmount, biddingSelectedAmount]);

  // Generate dynamic preset amounts based on current winning bid (only for bidding mode)
  const dynamicBidPresets = useMemo(() => {
    if (!shouldUseBidding) return null;
    
    // CRITICAL: Ensure minBid is always >= currentWinningBid + $5
    // This prevents buttons from showing amounts lower than the winning bid
    const safeMinBid = Math.max(
      dynamicMinimumAmount || 500,
      currentWinningBid > 0 ? currentWinningBid + 500 : 500
    );
    
    const presets = [
      { value: safeMinBid, label: `$${(safeMinBid / 100).toFixed(2)}` },
      { value: safeMinBid + 500, label: `$${((safeMinBid + 500) / 100).toFixed(2)}` }, // +$5
      { value: safeMinBid + 1000, label: `$${((safeMinBid + 1000) / 100).toFixed(2)}` }, // +$10
      { value: safeMinBid + 2000, label: `$${((safeMinBid + 2000) / 100).toFixed(2)}` }, // +$20
      { value: safeMinBid + 5000, label: `$${((safeMinBid + 5000) / 100).toFixed(2)}` } // +$50
    ];
    
    // CRITICAL: Filter out any amounts that are less than or equal to the winning bid
    // This is a double-check to ensure no buttons show amounts <= winning bid
    const filtered = presets.filter(preset => preset.value > currentWinningBid);
    
    // Ensure we always have at least one preset option
    if (filtered.length === 0) {
      // If all presets were filtered out, add one that's definitely above the winning bid
      const minValidBid = currentWinningBid > 0 ? currentWinningBid + 100 : 500; // At least $1 above winning bid, or $5 if no bids yet
      filtered.push({ value: minValidBid, label: `$${(minValidBid / 100).toFixed(2)}` });
    }
    
    // Debug log to verify preset amounts update
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[requests.js] dynamicBidPresets updated:', {
        shouldUseBidding,
        currentWinningBid: currentWinningBid / 100,
        safeMinBid: safeMinBid / 100,
        dynamicMinimumAmount: dynamicMinimumAmount ? dynamicMinimumAmount / 100 : null,
        filteredPresets: filtered.map(p => ({ value: p.value / 100, label: p.label })),
        filteredCount: filtered.length
      });
    }
    
    return filtered;
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

  // Helper function to detect if input is a URL
  const detectUrl = (value) => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    // Check if it starts with http:// or https://
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const urlPattern = /^(https?:\/\/)?([\w-]+\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|tidal\.com|music\.apple\.com|itunes\.apple\.com)/i;
      return urlPattern.test(trimmed);
    }
    // Also check for URLs without protocol (user might paste without http://)
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|tidal\.com|music\.apple\.com|itunes\.apple\.com)/i;
    return urlPattern.test(trimmed);
  };

  // Use song search hook for autocomplete (only when not a URL and not extracted from link)
  // Must be after detectUrl is defined
  const shouldSearch = formData.songTitle && 
                       !detectUrl(formData.songTitle) && 
                       !isExtractedFromLink && 
                       formData.songTitle.trim().length >= 2;
  const { suggestions, loading: searchingSongs } = useSongSearch(
    shouldSearch ? formData.songTitle : '', 
    organizationId
  );
  
  // Search hook for bundle songs (only active when a bundle song is being edited)
  const shouldSearchBundle = activeBundleSongIndex !== null && 
    bundleSongSearchQuery && 
    !detectUrl(bundleSongSearchQuery) && 
    !bundleIsExtractedFromLink[activeBundleSongIndex] && 
    bundleSongSearchQuery.trim().length >= 2;
  const { suggestions: bundleSuggestions, loading: bundleSearching } = useSongSearch(
    shouldSearchBundle ? bundleSongSearchQuery : '', 
    organizationId
  );
  
  // Reset selected suggestion index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // For unified song title field, detect URLs and extract
    if (name === 'songTitle' && value) {
      const isUrl = detectUrl(value);
      
      if (isUrl) {
        // URL detected - trigger extraction
        const url = value.trim();
        setSongUrl(url); // Store for submission
        setExtractedSongUrl(url);
        
        // Clear the input field immediately (don't show the URL)
        setFormData(prev => ({ ...prev, songTitle: '' }));
        
        // Extract song info (this will populate songTitle and songArtist)
        const extractedData = await extractSongInfo(url);
        
        // Store album art if available
        if (extractedData?.albumArt) {
          setAlbumArtUrl(extractedData.albumArt);
        }
        
        // Don't set the URL as the field value - extraction will populate the title
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
        setAudioUploadExpanded(false);
      }
    }
    
    // Show autocomplete when typing (not URLs, not extracted)
    if (name === 'songTitle') {
      const isUrl = detectUrl(value);
      if (!isUrl && !isExtractedFromLink && value.trim().length >= 2) {
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    }
    
    // Clear album art if user manually edits after extraction
    if (name === 'songTitle' && albumArtUrl) {
      setAlbumArtUrl(null);
      setIsExtractedFromLink(false);
      setExtractedSongUrl('');
    }
  };

  // Handle autocomplete suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      songTitle: suggestion.title,
      songArtist: suggestion.artist
    }));
    if (suggestion.albumArt) {
      setAlbumArtUrl(suggestion.albumArt);
    }
    setShowAutocomplete(false);
    setSelectedSuggestionIndex(-1);
    setIsExtractedFromLink(false); // Not from link, but from search
    
    // Clear audio upload when selecting from autocomplete (user wants an existing song)
    if (audioFileUrl || audioFile) {
      setAudioFile(null);
      setAudioFileUrl('');
      setArtistRightsConfirmed(false);
      setIsArtist(false);
      setAudioUploadExpanded(false);
    }
  };

  // Handle keyboard navigation in autocomplete
  const handleSongTitleKeyDown = (e) => {
    if (!showAutocomplete || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle blur event for URL detection (when user finishes typing)
  const handleSongTitleBlur = async (e) => {
    const value = e.target.value;
    if (!value || extractingSong) return;
    
    // Check if it's a URL that wasn't detected on change
    const isUrl = detectUrl(value);
    if (isUrl && !isExtractedFromLink) {
      const url = value.trim();
      setSongUrl(url);
      setExtractedSongUrl(url);
      
      // Clear the input field immediately (don't show the URL)
      setFormData(prev => ({ ...prev, songTitle: '' }));
      
      const extractedData = await extractSongInfo(url);
      if (extractedData?.albumArt) {
        setAlbumArtUrl(extractedData.albumArt);
      }
    }
  };

  const extractSongInfo = async (url) => {
    const extractedData = await extractSongInfoHook(url, setFormData);
    
    if (extractedData) {
      // Store the URL that was used for extraction and mark as extracted
      setExtractedSongUrl(url);
      setIsExtractedFromLink(true);
      setSongUrl(url); // Keep for submission
      
      // Store album art
      if (extractedData.albumArt) {
        setAlbumArtUrl(extractedData.albumArt);
      }
      
      // Clear audio upload when song is extracted from URL (user wants an existing song)
      if (audioFileUrl || audioFile) {
        setAudioFile(null);
        setAudioFileUrl('');
        setArtistRightsConfirmed(false);
        setIsArtist(false);
        setAudioUploadExpanded(false);
      }
    }
    
    return extractedData;
  };

  // Extract song info for bundle songs
  const extractBundleSongInfo = async (url, bundleIndex) => {
    setBundleExtractingSong(prev => ({ ...prev, [bundleIndex]: true }));
    setBundleExtractionErrors(prev => ({ ...prev, [bundleIndex]: null }));
    
    try {
      const extractedData = await extractSongInfoHook(url, (updater) => {
        // Custom updater for bundle songs
        if (typeof updater === 'function') {
          const newData = updater({ songTitle: '', songArtist: '' });
          setBundleSongs(prev => {
            const newSongs = [...prev];
            newSongs[bundleIndex] = {
              ...newSongs[bundleIndex],
              songTitle: newData.songTitle || '',
              songArtist: newData.songArtist || ''
            };
            return newSongs;
          });
        } else {
          setBundleSongs(prev => {
            const newSongs = [...prev];
            newSongs[bundleIndex] = {
              ...newSongs[bundleIndex],
              songTitle: updater.songTitle || '',
              songArtist: updater.songArtist || ''
            };
            return newSongs;
          });
        }
      });
      
      if (extractedData) {
        setBundleExtractedSongUrls(prev => ({ ...prev, [bundleIndex]: url }));
        setBundleIsExtractedFromLink(prev => ({ ...prev, [bundleIndex]: true }));
      }
      
      return extractedData;
    } catch (error) {
      setBundleExtractionErrors(prev => ({ ...prev, [bundleIndex]: error.message || 'Failed to extract song info' }));
      return null;
    } finally {
      setBundleExtractingSong(prev => ({ ...prev, [bundleIndex]: false }));
    }
  };

  // Handle bundle song input change
  const handleBundleSongInputChange = async (e, bundleIndex) => {
    const value = e.target.value;
    const newSongs = [...bundleSongs];
    
    // Update the song title
    newSongs[bundleIndex] = { ...newSongs[bundleIndex], songTitle: value };
    setBundleSongs(newSongs);
    
    // Update search query if this is the active bundle song
    if (activeBundleSongIndex === bundleIndex) {
      setBundleSongSearchQuery(value);
    }
    
    // Check if it's a URL
    const isUrl = detectUrl(value);
    
    if (isUrl) {
      // URL detected - trigger extraction
      const url = value.trim();
      // Clear the input field immediately
      newSongs[bundleIndex] = { ...newSongs[bundleIndex], songTitle: '' };
      setBundleSongs(newSongs);
      setBundleSongSearchQuery('');
      
      // Extract song info
      await extractBundleSongInfo(url, bundleIndex);
      return;
    }
    
    // Show autocomplete when typing (not URLs, not extracted)
    if (!isUrl && !bundleIsExtractedFromLink[bundleIndex] && value.trim().length >= 2) {
      setBundleShowAutocomplete(prev => ({ ...prev, [bundleIndex]: true }));
    } else {
      setBundleShowAutocomplete(prev => ({ ...prev, [bundleIndex]: false }));
    }
    
    // Clear extraction state if user manually edits after extraction
    if (bundleIsExtractedFromLink[bundleIndex]) {
      setBundleIsExtractedFromLink(prev => ({ ...prev, [bundleIndex]: false }));
      setBundleExtractedSongUrls(prev => ({ ...prev, [bundleIndex]: '' }));
    }
  };

  // Handle bundle song blur (for URL detection)
  const handleBundleSongBlur = async (e, bundleIndex) => {
    const value = e.target.value;
    if (!value || bundleExtractingSong[bundleIndex]) return;
    
    const isUrl = detectUrl(value);
    if (isUrl && !bundleIsExtractedFromLink[bundleIndex]) {
      const url = value.trim();
      const newSongs = [...bundleSongs];
      newSongs[bundleIndex] = { ...newSongs[bundleIndex], songTitle: '' };
      setBundleSongs(newSongs);
      
      await extractBundleSongInfo(url, bundleIndex);
    }
  };

  // Handle bundle song suggestion selection
  const handleBundleSuggestionSelect = (suggestion, bundleIndex) => {
    const newSongs = [...bundleSongs];
    newSongs[bundleIndex] = {
      ...newSongs[bundleIndex],
      songTitle: suggestion.title,
      songArtist: suggestion.artist
    };
    setBundleSongs(newSongs);
    setBundleShowAutocomplete(prev => ({ ...prev, [bundleIndex]: false }));
    setBundleSelectedSuggestionIndex(prev => ({ ...prev, [bundleIndex]: -1 }));
    setBundleIsExtractedFromLink(prev => ({ ...prev, [bundleIndex]: false }));
  };

  // Handle keyboard navigation for bundle songs
  const handleBundleSongKeyDown = (e, bundleIndex) => {
    // Only handle if this is the active bundle song
    if (activeBundleSongIndex !== bundleIndex) return;
    
    const suggestions = bundleSuggestions;
    const showAutocomplete = bundleShowAutocomplete[bundleIndex];
    const selectedIndex = bundleSelectedSuggestionIndex[bundleIndex] || -1;
    
    if (!showAutocomplete || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setBundleSelectedSuggestionIndex(prev => ({
        ...prev,
        [bundleIndex]: selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : selectedIndex
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setBundleSelectedSuggestionIndex(prev => ({
        ...prev,
        [bundleIndex]: selectedIndex > 0 ? selectedIndex - 1 : -1
      }));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleBundleSuggestionSelect(suggestions[selectedIndex], bundleIndex);
    } else if (e.key === 'Escape') {
      setBundleShowAutocomplete(prev => ({ ...prev, [bundleIndex]: false }));
      setBundleSelectedSuggestionIndex(prev => ({ ...prev, [bundleIndex]: -1 }));
    }
  };

  // Handle clear extraction for bundle songs
  const handleClearBundleExtraction = (bundleIndex) => {
    const newSongs = [...bundleSongs];
    newSongs[bundleIndex] = { ...newSongs[bundleIndex], songTitle: '', songArtist: '' };
    setBundleSongs(newSongs);
    setBundleIsExtractedFromLink(prev => ({ ...prev, [bundleIndex]: false }));
    setBundleExtractedSongUrls(prev => ({ ...prev, [bundleIndex]: '' }));
    setBundleExtractionErrors(prev => ({ ...prev, [bundleIndex]: null }));
  };

  // Clear extraction state
  const handleClearExtraction = () => {
    setFormData(prev => ({ ...prev, songTitle: '', songArtist: '' }));
    setSongUrl('');
    setExtractedSongUrl('');
    setIsExtractedFromLink(false);
    setAlbumArtUrl(null);
  };


  // Auto-expand audio upload section if file is already uploaded
  useEffect(() => {
    if (audioFileUrl && !audioUploadExpanded) {
      setAudioUploadExpanded(true);
    }
  }, [audioFileUrl, audioUploadExpanded]);

  // Reset form to clean slate when "Share another song" is clicked
  const handleShareAnotherSong = () => {
    handleClearExtraction();
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
      // Scroll to error message after a brief delay to allow state to update
      // Note: Don't check `error` here - it's stale (React state updates are async)
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
      return;
    }

    setSubmitting(true);

    // Save requester info to localStorage for future requests
    try {
      const requesterInfo = {
        requesterName: formData.requesterName?.trim() || '',
        requesterEmail: formData.requesterEmail?.trim() || '',
        requesterPhone: formData.requesterPhone?.trim() || ''
      };
      if (requesterInfo.requesterName) {
        localStorage.setItem(REQUESTER_INFO_KEY, JSON.stringify(requesterInfo));
        logger.info('Saved requester info to localStorage');
      }
    } catch (e) {
      logger.error('Error saving requester info to localStorage:', e);
    }

    try {
      // shouldUseBidding is already defined at component level via useMemo
      // In bidding mode, payment happens when placing a bid, not at submission
      let amount = 0; // Default to 0 for bidding mode
      
      // Only validate and get payment amount if NOT in bidding mode
      if (!shouldUseBidding) {
        amount = getPaymentAmount();
        
        // For tips, allow any amount > 0 (no minimum)
        if (requestType === 'tip') {
          if (!amount || amount <= 0) {
            throw new Error('Please enter a tip amount');
          }
        } else {
          // For song requests and shoutouts, validate amount before submission - must be at least minimum preset amount
          const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
          if (!amount || amount < minPresetAmount) {
            throw new Error(`Minimum payment is $${(minPresetAmount / 100).toFixed(2)}`);
          }
        }
      }

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
      
      // Note: We allow payment even if additional songs don't have titles yet (legacy support)
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

      // Extract source domain from current location
      const getSourceDomain = () => {
        if (typeof window === 'undefined') return null;
        try {
          const hostname = window.location.hostname.replace('www.', '');
          return hostname;
        } catch (e) {
          return null;
        }
      };

      const mainRequestBody = {
        eventCode: 'general',
        requestType: requestType || 'song_request',
        songArtist: (requestType === 'song_request' ? formData?.songArtist?.trim() : null) || null,
        songTitle: (requestType === 'song_request' ? formData?.songTitle?.trim() : null) || null,
        recipientName: (requestType === 'shoutout' ? formData?.recipientName?.trim() : null) || null,
        recipientMessage: (requestType === 'shoutout' ? formData?.recipientMessage?.trim() : null) || null,
        requesterName: formData?.requesterName?.trim(),
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
        isArtist: (requestType === 'song_request' ? isArtist : false) || false,
        albumArtUrl: (requestType === 'song_request' ? albumArtUrl : null) || null, // Pass album art URL if available
        sourceDomain: getSourceDomain() // Track where the request originated from
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
                  bidderName: formData.requesterName?.trim(),
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
            eventCode: 'general',
            requestType: 'song_request',
            songArtist: song.songArtist?.trim() || null,
            songTitle: song.songTitle?.trim() || null,
            requesterName: formData?.requesterName?.trim(),
            requesterEmail: formData?.requesterEmail?.trim() || null,
            requesterPhone: formData?.requesterPhone?.trim() || null,
            amount: pricePerSong, // Each song gets equal share of bundle price
            isFastTrack: false, // Bundle songs don't get fast track (only main song can)
            isNext: false,
            fastTrackFee: 0,
            nextFee: 0,
            organizationId: organizationId || null,
            message: `Bundle deal - ${bundleSize} songs for $${(bundlePrice / 100).toFixed(2)}`,
            sourceDomain: getSourceDomain() // Track where the request originated from
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
        const baseAmount = getBaseAmount();
        
        for (let i = 0; i < additionalSongs.length; i++) {
          const song = additionalSongs[i] || {};
          const additionalRequestBody = {
            eventCode: 'general',
            requestType: 'song_request',
            songArtist: song.songArtist?.trim() || null,
            songTitle: song.songTitle?.trim() || null,
            requesterName: formData?.requesterName?.trim(),
            requesterEmail: formData?.requesterEmail?.trim() || null,
            requesterPhone: formData?.requesterPhone?.trim() || null,
            amount: 0, // Bundled with main request - payment already included in main request
            isFastTrack: false,
            isNext: false,
            fastTrackFee: 0,
            nextFee: 0,
            message: `Bundled with main request - ${Math.round(bundleDiscountPercent * 100)}% discount applied. ${song.songTitle?.trim() ? '' : 'Song details to be added after payment.'}`,
            organizationId: organizationId || null,
            sourceDomain: getSourceDomain() // Track where the request originated from
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
  // Always use main domain for assets to ensure they load across all domains (tipjar.live, m10djcompany.com, etc.)
  const mainDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.m10djcompany.com';
  const siteUrl = mainDomain;
  
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

      {/* Accent Color CSS Variables - Available to all users */}
      <style jsx global>{`
        :root {
          --accent-color: ${organizationData?.requests_accent_color || '#fcba00'};
          --accent-color-hover: ${organizationData?.requests_accent_color ? `${organizationData.requests_accent_color}dd` : '#d99f00'};
          --accent-color-light: ${organizationData?.requests_accent_color ? `${organizationData.requests_accent_color}20` : '#fcba0020'};
        }
        
        /* Override brand color with accent color */
        .bg-brand { background-color: var(--accent-color) !important; }
        .bg-\\[\\#fcba00\\] { background-color: var(--accent-color) !important; }
        .text-brand { color: var(--accent-color) !important; }
        .text-\\[\\#fcba00\\] { color: var(--accent-color) !important; }
        .border-brand { border-color: var(--accent-color) !important; }
        .border-\\[\\#fcba00\\] { border-color: var(--accent-color) !important; }
        .ring-brand { --tw-ring-color: var(--accent-color) !important; }
        .ring-\\[\\#fcba00\\] { --tw-ring-color: var(--accent-color) !important; }
        .focus\\:ring-brand:focus { --tw-ring-color: var(--accent-color) !important; }
        .focus\\:ring-\\[\\#fcba00\\]:focus { --tw-ring-color: var(--accent-color) !important; }
        .hover\\:bg-\\[\\#d99f00\\]:hover { background-color: var(--accent-color-hover) !important; }
        
        /* Gradient overrides */
        .from-\\[\\#fcba00\\] { --tw-gradient-from: var(--accent-color) !important; }
        .to-\\[\\#fcba00\\] { --tw-gradient-to: var(--accent-color) !important; }
        .via-\\[\\#fcba00\\] { --tw-gradient-via: var(--accent-color) !important; }
      `}</style>

      <div 
        className="min-h-screen bg-gradient-to-br from-gray-50 via-brand/5 to-gray-50 dark:from-black dark:via-black dark:to-black relative overflow-x-hidden md:flex"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' },
          '--accent-color': organizationData?.requests_accent_color || '#fcba00',
          ...(customBranding?.whiteLabelEnabled ? {
            backgroundColor: customBranding.backgroundColor,
            color: customBranding.textColor,
            '--brand-primary': customBranding.primaryColor,
            '--brand-secondary': customBranding.secondaryColor,
            fontFamily: customBranding.fontFamily,
          } : {})
        }}
      >
        {/* Desktop Video Sidebar - Fixed position, stays stationary while content scrolls */}
        {/* Shows video only if no custom cover photo is set, otherwise shows the cover photo */}
        {!embedMode && !showPaymentMethods && (
          <div className="hidden md:block md:fixed md:left-0 md:top-0 md:w-[400px] lg:w-[450px] xl:w-[500px] md:h-screen md:overflow-hidden bg-black z-40">
            {showVideo && !videoFailed ? (
            <video
                ref={desktopVideoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
                webkit-playsinline="true"
                x-webkit-airplay="deny"
                disablePictureInPicture
              poster={coverPhoto}
              style={{ objectPosition: 'center center' }}
                onLoadedData={() => {
                  // Programmatically play when video data is loaded (Safari fix)
                  if (desktopVideoRef.current) {
                    desktopVideoRef.current.play().catch(() => setVideoFailed(true));
                  }
                }}
            >
              <source src={headerVideoUrl} type="video/mp4" />
              {/* Fallback message if video fails to load */}
              <p className="text-white text-center p-4">Video unavailable</p>
            </video>
            ) : (
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${coverPhoto})` }}
              />
            )}
            {/* Subtle gradient overlay on right edge for seamless blend */}
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10"></div>
            
            {/* Gradient overlay at bottom for social links */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/60 to-transparent z-20 pointer-events-none"></div>
            
            {/* Social Links at bottom of video sidebar */}
            {organizationData?.social_links && Array.isArray(organizationData.social_links) && organizationData.social_links.length > 0 && (
              <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-5 z-30">
                {organizationData.social_links
                  .filter(link => link.enabled !== false)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((link, index) => {
                    const getSocialIcon = (platform) => {
                      const iconProps = { className: "w-6 h-6", strokeWidth: 2, fill: "none" };
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
                          key={`desktop-social-${index}`}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSocialClick(e, platform);
                          }}
                          className="flex items-center justify-center w-11 h-11 rounded-full bg-white/20 backdrop-blur-md text-white hover:text-white hover:bg-white/30 transition-all cursor-pointer border border-white/20 p-0"
                          aria-label={link.label || link.platform}
                        >
                          {getSocialIcon(link.platform)}
                        </button>
                      );
                    }
                    
                    return (
                      <a
                        key={`desktop-social-${index}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-11 h-11 rounded-full bg-white/20 backdrop-blur-md text-white hover:text-white hover:bg-white/30 transition-all border border-white/20"
                        aria-label={link.label || link.platform}
                      >
                        {getSocialIcon(link.platform)}
                      </a>
                    );
                  })}
              </div>
            )}
          </div>
        )}
        
        {/* Header - Fixed position overlaying video sidebar on desktop */}
        {/* Header component is already fixed w-full, use CSS to override positioning on desktop */}
        {/* Use a unique key to prevent duplicate renders when organizationData changes */}
        {!embedMode && !showPaymentMethods && !minimalHeader && (
          <>
            <style jsx global>{`
              /* Override Header positioning on desktop for requests page */
              @media (min-width: 768px) {
                body:has([data-requests-header-wrapper]) header[data-transparent] {
                  width: auto !important;
                  left: 1rem !important;
                  right: auto !important;
                  top: 1rem !important;
                  max-width: calc(100vw - 2rem) !important;
                }
              }
            `}</style>
            <div data-requests-header-wrapper key={`header-${organizationId || 'default'}`}>
              <Header 
                key={`header-component-${organizationId || 'default'}`}
                customLogoUrl={
                  // Use requests page custom logo if set and user can customize
                  (organizationData?.can_customize_header_logo && organizationData?.requests_header_logo_url) 
                    ? organizationData.requests_header_logo_url 
                    : customBranding?.customLogoUrl
                } 
                transparent={true} 
                socialLinks={organizationData?.social_links} 
                isOwner={isOwner} 
                organizationSlug={organizationData?.slug} 
                organizationId={organizationId} 
              />
            </div>
          </>
        )}
        
        {/* Main Content Area - Add left margin on desktop to account for fixed video sidebar */}
        <div className="flex-1 min-w-0 relative md:ml-[400px] lg:ml-[450px] xl:ml-[500px]">
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
                  : `${organizationData?.requests_accent_color || '#fcba00'}20`
              }}
            ></div>
            <div 
              className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse" 
              style={{ 
                animationDelay: '1s',
                backgroundColor: customBranding?.whiteLabelEnabled 
                  ? `${customBranding.secondaryColor}20` 
                  : 'rgba(255, 255, 255, 0.06)'
              }}
            ></div>
          </div>
        )}
        
        {/* Hero Section with Text Fallback */}
        {!embedMode && !showPaymentMethods && (
          <div 
            className={`relative w-full overflow-hidden top-0 bg-gradient-to-b from-gray-900 via-black to-black ${
              minimalHeader 
                ? 'h-[120px] sm:h-[140px] min-h-[100px] sm:min-h-[120px]' 
                : 'h-[40vh] sm:h-[50vh] md:h-[200px] lg:h-[220px] min-h-[250px] sm:min-h-[350px] md:min-h-[180px] max-h-[600px] md:max-h-[250px]'
            }`}
            style={{ 
              zIndex: 0
            }}
          >
            {/* Mobile Video Background - Only shown on mobile */}
            {/* Shows video only if no custom cover photo is set, otherwise shows the cover photo */}
            {showVideo && !videoFailed ? (
            <video
                ref={mobileVideoRef}
              className="absolute inset-0 w-full h-full object-cover md:hidden"
              autoPlay
              loop
              muted
              playsInline
                webkit-playsinline="true"
                x-webkit-airplay="deny"
                disablePictureInPicture
              poster={coverPhoto}
              style={{ zIndex: 0, objectPosition: 'center 40%' }}
                onLoadedData={() => {
                  // Programmatically play when video data is loaded (Safari fix)
                  if (mobileVideoRef.current) {
                    mobileVideoRef.current.play().catch(() => setVideoFailed(true));
                  }
                }}
            >
              <source src={headerVideoUrl} type="video/mp4" />
              {/* Fallback message if video fails to load */}
              <p className="text-white text-center p-4">Video unavailable</p>
            </video>
            ) : (
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center md:hidden"
                style={{ backgroundImage: `url(${coverPhoto})`, objectPosition: 'center 40%' }}
              />
            )}
            
            {/* Desktop Background - Simplified since video is in sidebar */}
            <div 
              className="absolute inset-0 hidden md:block bg-gradient-to-b from-gray-900 via-black to-black"
              style={{ zIndex: 0 }}
            />
            {/* Content overlay */}
            <div className={`relative z-20 h-full flex flex-col justify-between items-center text-center px-4 ${
              minimalHeader ? 'justify-center' : ''
            }`} style={{ paddingTop: minimalHeader ? '60px' : '80px', paddingBottom: minimalHeader ? '10px' : '20px' }}>
              {/* Top content section */}
              <div className={`flex flex-col items-center justify-center ${minimalHeader ? '' : 'flex-1'}`}>
                {/* Artist Name - Show based on settings. If video playing and showArtistNameOverVideo is false, hide it */}
                {(() => {
                  // Determine if we should show the artist name
                  // Default to true - show name unless explicitly disabled AND video is playing
                  const showArtistNameOverVideo = organizationData?.requests_show_artist_name_over_video !== false;
                  const shouldHideName = showVideo && !showArtistNameOverVideo;
                  
                  return (
                    <h1 
                      className={`font-black text-white drop-shadow-2xl uppercase tracking-tight ${
                        minimalHeader
                          ? 'text-xl sm:text-2xl mb-1'
                          : shouldHideName
                            ? 'sr-only'
                            : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-4'
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
                          name: organizationData?.name,
                          showVideo,
                          showArtistNameOverVideo,
                          shouldHideName
                        });
                        return artistName.toUpperCase();
                      })()}
                    </h1>
                  );
                })()}
                
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
        
        <main className={`section-container relative z-10 ${showPaymentMethods ? 'py-8 sm:py-12 md:py-16' : 'py-3 sm:py-6 md:py-8 lg:py-12'} px-3 sm:px-4 md:px-8 lg:px-12 overflow-x-hidden`} style={{ minHeight: embedMode ? '100vh' : (showPaymentMethods ? '100vh' : 'auto'), display: 'flex', flexDirection: 'column', maxWidth: '100vw' }}>
          <div className={`${showPaymentMethods ? 'max-w-lg' : 'max-w-xl md:max-w-lg'} mx-auto w-full flex-1 flex flex-col overflow-x-hidden`}>
            {/* Header - Compact for no-scroll design - Hide when hero image is shown */}
            {false && (
              <div className="text-center mb-2 sm:mb-3">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 mb-2 shadow-md shadow-brand-500/40 dark:shadow-brand-500/20">
                  <Music className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-brand-800 to-brand-700 dark:from-white dark:via-brand-300 dark:to-brand-400 bg-clip-text text-transparent mb-1 sm:mb-2 px-2">
                  Request a Song or Shoutout
                </h1>
                
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`h-1.5 rounded-full transition-all ${currentStep >= 1 ? 'bg-brand-500 w-8' : 'bg-gray-300 dark:bg-gray-600 w-2'}`}></div>
                  <div className={`h-1.5 rounded-full transition-all ${currentStep >= 2 ? 'bg-brand-500 w-8' : 'bg-gray-300 dark:bg-gray-600 w-2'}`}></div>
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
                  <div className="bg-brand/5 dark:bg-black/40 border-2 border-brand/30 dark:border-brand/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0">
                        <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-brand" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>🎯 Bidding System Active</span>
                        </h3>
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                          Your song request will enter the current bidding round. The highest bidder&apos;s song plays first. You can increase your bid later if someone outbids you.
                        </p>
                        {currentWinningBid > 0 ? (
                          <div className="mt-3 p-3 bg-white/70 dark:bg-black/50 rounded-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Current Winning Bid:
                              </p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                ${(currentWinningBid / 100).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                Minimum to win:
                              </p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
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
                          <div className="mt-3 p-3 bg-white/70 dark:bg-black/50 rounded-lg border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${
                                  roundTimeRemaining > 60 ? 'text-brand' : 'text-red-600 dark:text-red-400 animate-pulse'
                                }`} />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Round Ends In</span>
                              </div>
                              <span className={`text-lg font-bold font-mono ${
                                roundTimeRemaining > 60 ? 'text-gray-900 dark:text-white' : 'text-red-700 dark:text-red-300'
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
                          <div className="w-1 h-5 sm:h-6 md:h-8 bg-brand rounded-full hidden sm:block"></div>
                          <span className="leading-tight">Submit Your Song Request</span>
                        </h2>
                        
                        {/* Unified Song Name/URL Input */}
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                            <Music className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                            {organizationData?.requests_song_title_label || 'Song Name or Link'} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              ref={songTitleInputRef}
                              type="text"
                              name="songTitle"
                              value={formData.songTitle}
                              onChange={handleInputChange}
                              onFocus={() => {
                                if (formData.songTitle && !detectUrl(formData.songTitle) && !isExtractedFromLink && formData.songTitle.trim().length >= 2) {
                                  setShowAutocomplete(true);
                                }
                              }}
                              onKeyDown={handleSongTitleKeyDown}
                              onBlur={(e) => {
                                // Delay hiding autocomplete to allow click events
                                setTimeout(() => {
                                  setShowAutocomplete(false);
                                  setSelectedSuggestionIndex(-1);
                                }, 200);
                                handleSongTitleBlur(e);
                              }}
                              className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200 touch-manipulation ${
                                extractingSong ? 'pr-20 sm:pr-24 md:pr-28' : isExtractedFromLink ? 'pr-20 sm:pr-24' : 'pr-3 sm:pr-4'
                              }`}
                              placeholder={organizationData?.requests_song_title_placeholder || "Type song name or paste a link"}
                              autoComplete="off"
                            />
                            {extractingSong && (
                              <div className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2 pointer-events-none">
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-brand flex-shrink-0" />
                                <span className="text-xs text-gray-700 dark:text-gray-300 hidden sm:inline whitespace-nowrap">Extracting...</span>
                              </div>
                            )}
                            {isExtractedFromLink && !extractingSong && (
                              <button
                                type="button"
                                onClick={handleClearExtraction}
                                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="Clear and start over"
                              >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                              </button>
                            )}
                          </div>
                          {extractionError && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              {extractionError}
                            </p>
                          )}
                          {isExtractedFromLink && !extractionError && (
                            <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              Song info extracted successfully
                            </p>
                          )}
                          {/* Subtle hint always visible when empty */}
                          {!formData.songTitle && !isExtractedFromLink && !extractingSong && (
                            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                              <Link2 className="w-3 h-3 flex-shrink-0" />
                              <span>Type a song name or paste a music link</span>
                            </p>
                          )}
                          {/* Autocomplete suggestions */}
                          {showAutocomplete && suggestions.length > 0 && (
                            <div className="mt-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                              {suggestions.map((suggestion, index) => (
                                <button
                                  key={suggestion.id}
                                  type="button"
                                  onClick={() => handleSuggestionSelect(suggestion)}
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-black/80 transition-colors flex items-center gap-3 ${
                                    index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-black/80' : ''
                                  }`}
                                >
                                  {suggestion.albumArt && (
                                    <img
                                      src={suggestion.albumArt}
                                      alt=""
                                      className="w-10 h-10 rounded flex-shrink-0 object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {suggestion.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {suggestion.artist}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          {showAutocomplete && searchingSongs && suggestions.length === 0 && (
                            <div className="mt-2 p-3 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-brand" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                            {organizationData?.requests_artist_name_label || 'Artist Name'}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="songArtist"
                            value={formData.songArtist}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200"
                            placeholder={organizationData?.requests_artist_name_placeholder || "Enter artist name"}
                            required
                            autoComplete="off"
                          />
                        </div>

                        {/* Bundle Songs Input (only show when bundle size > 1) */}
                        {bundleSize > 1 && bundleSongs.length > 0 && (
                          <div ref={bundleSongsRef} className="mt-4 p-4 bg-white/70 dark:bg-black/50 rounded-lg border border-gray-200/50 dark:border-gray-800/50">
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
                              {bundleSongs.map((song, index) => {
                                // Get suggestions for this bundle song (only if it's the active one)
                                const currentSuggestions = activeBundleSongIndex === index ? bundleSuggestions : [];
                                const currentSearching = activeBundleSongIndex === index ? bundleSearching : false;
                                
                                return (
                                  <div key={index} className="bg-white/50 dark:bg-black/30 rounded-lg p-3 sm:p-4 border border-gray-200/50 dark:border-gray-700/50">
                                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
                                      Song {index + 2} of {bundleSize}
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                                          <Music className="w-3 h-3 inline mr-1" />
                                          Song Title <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={song.songTitle || ''}
                                            onChange={(e) => handleBundleSongInputChange(e, index)}
                                            onFocus={() => {
                                              setActiveBundleSongIndex(index);
                                              setBundleSongSearchQuery(song.songTitle || '');
                                              if (song.songTitle && !detectUrl(song.songTitle) && !bundleIsExtractedFromLink[index] && song.songTitle.trim().length >= 2) {
                                                setBundleShowAutocomplete(prev => ({ ...prev, [index]: true }));
                                              }
                                            }}
                                            onKeyDown={(e) => handleBundleSongKeyDown(e, index)}
                                            onBlur={(e) => {
                                              setTimeout(() => {
                                                setBundleShowAutocomplete(prev => ({ ...prev, [index]: false }));
                                                setBundleSelectedSuggestionIndex(prev => ({ ...prev, [index]: -1 }));
                                              }, 200);
                                              handleBundleSongBlur(e, index);
                                            }}
                                            className={`w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200 ${
                                              bundleExtractingSong[index] ? 'pr-20' : bundleIsExtractedFromLink[index] ? 'pr-20' : 'pr-3'
                                            }`}
                                            placeholder={organizationData?.requests_song_title_placeholder || "Type song name or paste a link"}
                                            required
                                            autoComplete="off"
                                          />
                                          {bundleExtractingSong[index] && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                              <Loader2 className="w-4 h-4 animate-spin text-brand flex-shrink-0" />
                                              <span className="text-xs text-gray-700 dark:text-gray-300 hidden sm:inline whitespace-nowrap">Extracting...</span>
                                            </div>
                                          )}
                                          {bundleIsExtractedFromLink[index] && !bundleExtractingSong[index] && (
                                            <button
                                              type="button"
                                              onClick={() => handleClearBundleExtraction(index)}
                                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                              title="Clear and start over"
                                            >
                                              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                          )}
                                        </div>
                                        {bundleExtractionErrors[index] && (
                                          <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {bundleExtractionErrors[index]}
                                          </p>
                                        )}
                                        {bundleIsExtractedFromLink[index] && !bundleExtractionErrors[index] && (
                                          <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Song info extracted successfully
                                          </p>
                                        )}
                                        {!song.songTitle && !bundleIsExtractedFromLink[index] && !bundleExtractingSong[index] && (
                                          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                            <Link2 className="w-3 h-3 flex-shrink-0" />
                                            <span>Type a song name or paste a music link</span>
                                          </p>
                                        )}
                                        {/* Autocomplete suggestions */}
                                        {bundleShowAutocomplete[index] && currentSuggestions.length > 0 && (
                                          <div className="mt-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                                            {currentSuggestions.map((suggestion, sugIndex) => (
                                              <button
                                                key={suggestion.id}
                                                type="button"
                                                onClick={() => handleBundleSuggestionSelect(suggestion, index)}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-black/80 transition-colors flex items-center gap-3 ${
                                                  sugIndex === (bundleSelectedSuggestionIndex[index] || -1) ? 'bg-gray-100 dark:bg-black/80' : ''
                                                }`}
                                              >
                                                {suggestion.albumArt && (
                                                  <img
                                                    src={suggestion.albumArt}
                                                    alt=""
                                                    className="w-10 h-10 rounded flex-shrink-0 object-cover"
                                                  />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {suggestion.title}
                                                  </p>
                                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {suggestion.artist}
                                                  </p>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                        {bundleShowAutocomplete[index] && currentSearching && currentSuggestions.length === 0 && (
                                          <div className="mt-2 p-3 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-brand" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                                          </div>
                                        )}
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
                                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200"
                                          placeholder={organizationData?.requests_artist_name_placeholder || "Enter artist name"}
                                          autoComplete="off"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Album Art Display */}
                        {albumArtUrl && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
                            <img
                              src={albumArtUrl}
                              alt="Album art"
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                              onError={(e) => {
                                // Hide image if it fails to load
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Album Art</p>
                              <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                {formData.songTitle && formData.songArtist 
                                  ? `${formData.songTitle} by ${formData.songArtist}`
                                  : 'Song information'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Current Winning Bid Display - Show prominently above amount selector */}
                        {shouldUseBidding && currentWinningBid > 0 && (
                          <div className="bg-white/70 dark:bg-black/50 border-2 border-brand/30 dark:border-brand/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Current Winning Bid</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                  ${(currentWinningBid / 100).toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Minimum to Win</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                  ${((currentWinningBid + 500) / 100).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                              💡 Bid at least ${((currentWinningBid + 500) / 100).toFixed(2)} to take the lead
                            </p>
                          </div>
                        )}

                        {/* Bid Amount Selector - Use dedicated BiddingAmountSelector in bidding mode */}
                        <div data-payment-section className="mt-4" key={`bid-selector-${shouldUseBidding ? 'bidding' : 'normal'}-${organizationId || 'no-org'}`}>
                          {shouldUseBidding ? (
                            organizationId ? (
                              <BiddingAmountSelector
                                key={`bidding-selector-${organizationId}`}
                                organizationId={organizationId}
                                selectedAmount={biddingSelectedAmount}
                                onAmountChange={setBiddingSelectedAmount}
                                amountType={amountType}
                                setAmountType={setAmountType}
                                currentWinningBid={currentWinningBid}
                                minimumBid={dynamicMinimumAmount || 500}
                              />
                            ) : (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  Loading bidding options...
                                </p>
                              </div>
                            )
                          ) : (
                            <PaymentAmountSelector
                              key={`payment-selector-${shouldUseBidding ? 'bidding' : 'normal'}-${presetAmounts.length}`}
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
                              hidePriorityOptions={false}
                              isBiddingMode={false}
                              currentWinningBid={0}
                              bundleSize={bundleSize}
                              setBundleSize={setBundleSize}
                            />
                          )}
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
                            // In bidding mode, also check if a bid amount is selected and greater than winning bid
                            if (shouldUseBidding) {
                              const bidAmount = getPaymentAmount();
                              const minBid = dynamicMinimumAmount || 500;
                              const winningBid = currentWinningBid || 0;
                              console.log('[requests.js] Submit button check:', {
                                bidAmount: bidAmount ? bidAmount / 100 : null,
                                minBid: minBid / 100,
                                winningBid: winningBid / 100,
                                biddingSelectedAmount: biddingSelectedAmount ? biddingSelectedAmount / 100 : null,
                                shouldUseBidding,
                                meetsMinimum: bidAmount >= minBid,
                                beatsWinning: bidAmount > winningBid,
                                disabled: !bidAmount || bidAmount < minBid || bidAmount <= winningBid
                              });
                              // Must have a bid amount, meet minimum, AND be greater than current winning bid
                              if (!bidAmount || bidAmount < minBid || bidAmount <= winningBid) return true;
                            }
                            return false;
                          })()}
                          className="w-full py-3 sm:py-4 bg-brand text-black font-semibold rounded-lg sm:rounded-xl hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                          title={(() => {
                            if (!formData.songTitle.trim()) return 'Please enter a song title';
                            if (shouldUseBidding) {
                              const bidAmount = getPaymentAmount();
                              const minBid = dynamicMinimumAmount || 500;
                              const winningBid = currentWinningBid || 0;
                              if (!bidAmount || bidAmount < minBid || bidAmount <= winningBid) {
                                if (winningBid > 0) {
                                  return `Your bid must be greater than $${(winningBid / 100).toFixed(2)}. Minimum bid is $${((minBid || 500) / 100).toFixed(2)}`;
                                } else {
                                  return `Please select a bid amount. Minimum bid is $${((minBid || 500) / 100).toFixed(2)}`;
                                }
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
                requesterName={formData.requesterName}
                additionalSongs={additionalSongs}
                setAdditionalSongs={setAdditionalSongs}
                bundleSongs={bundleSongs} // New: Pass bundle songs
                bundleSize={bundleSize} // New: Pass bundle size
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
                <div className="bg-white/70 dark:bg-black/70 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-3 sm:p-4 md:p-5 flex-shrink-0">
                  <h2 className="text-base sm:text-xl md:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 md:mb-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-1 h-5 sm:h-6 bg-brand rounded-full hidden sm:block"></div>
                    <span className="leading-tight">{organizationData?.requests_main_heading || 'What would you like to request?'}</span>
                  </h2>
                  
                  {/* Request Type Selection - Hide if only one type is allowed */}
                  {(!allowedRequestTypes || allowedRequestTypes.length > 1) && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
                      {(!allowedRequestTypes || allowedRequestTypes.includes('song_request')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('song_request')}
                          className={`group relative p-2.5 sm:p-3 rounded-xl sm:rounded-xl border-2 transition-all duration-300 touch-manipulation overflow-hidden ${
                            requestType === 'song_request'
                              ? 'border-brand bg-brand/10 dark:bg-brand/10 shadow-lg shadow-brand/20 scale-105'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 hover:border-brand/50 hover:scale-[1.02] hover:shadow-md'
                          }`}
                        >
                          {requestType === 'song_request' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center">
                            <div className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg mb-1.5 sm:mb-2 transition-all duration-300 ${
                              requestType === 'song_request'
                                ? 'bg-brand shadow-lg shadow-brand/30'
                                : 'bg-gray-100 dark:bg-black/50 group-hover:bg-brand/10'
                            }`}>
                              <Music className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                                requestType === 'song_request' ? 'text-black' : 'text-gray-400 group-hover:text-brand'
                              }`} />
                            </div>
                            <h3 className="font-bold text-[11px] sm:text-xs text-gray-900 dark:text-white text-center leading-tight">{organizationData?.requests_song_request_label || 'Song Request'}</h3>
                          </div>
                        </button>
                      )}
                      
                      {(!allowedRequestTypes || allowedRequestTypes.includes('shoutout')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('shoutout')}
                          className={`group relative p-2.5 sm:p-3 rounded-xl sm:rounded-xl border-2 transition-all duration-300 touch-manipulation overflow-hidden ${
                            requestType === 'shoutout'
                              ? 'border-brand bg-brand/10 dark:bg-brand/10 shadow-lg shadow-brand/20 scale-105'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 hover:border-brand/50 hover:scale-[1.02] hover:shadow-md'
                          }`}
                        >
                          {requestType === 'shoutout' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center">
                            <div className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg mb-1.5 sm:mb-2 transition-all duration-300 ${
                              requestType === 'shoutout'
                                ? 'bg-brand shadow-lg shadow-brand/30'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-brand/10'
                            }`}>
                              <Mic className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                                requestType === 'shoutout' ? 'text-black' : 'text-gray-400 group-hover:text-brand'
                              }`} />
                            </div>
                            <h3 className="font-bold text-[11px] sm:text-xs text-gray-900 dark:text-white text-center leading-tight">{organizationData?.requests_shoutout_label || 'Shoutout'}</h3>
                          </div>
                        </button>
                      )}

                      {(!allowedRequestTypes || allowedRequestTypes.includes('tip')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('tip')}
                          className={`group relative p-2.5 sm:p-3 rounded-xl sm:rounded-xl border-2 transition-all duration-300 touch-manipulation overflow-hidden ${
                            requestType === 'tip'
                              ? 'border-brand bg-brand/10 dark:bg-brand/10 shadow-lg shadow-brand/20 scale-105'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50 hover:border-brand/50 hover:scale-[1.02] hover:shadow-md'
                          }`}
                        >
                          {requestType === 'tip' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center">
                            <div className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg mb-1.5 sm:mb-2 transition-all duration-300 ${
                              requestType === 'tip'
                                ? 'bg-brand shadow-lg shadow-brand/30'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-brand/10'
                            }`}>
                              <Gift className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                                requestType === 'tip' ? 'text-black' : 'text-gray-400 group-hover:text-brand'
                              }`} />
                            </div>
                            <h3 className="font-bold text-[11px] sm:text-xs text-gray-900 dark:text-white text-center leading-tight">Tip Me</h3>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Song Request Fields */}
                  {requestType === 'song_request' && (
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      {/* Unified Song Name/URL Input */}
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          <Music className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                          {organizationData?.requests_song_title_label || 'Song Name or Link'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            ref={songTitleInputRef}
                            type="text"
                            name="songTitle"
                            value={formData.songTitle}
                            onChange={handleInputChange}
                            onFocus={() => {
                              if (formData.songTitle && !detectUrl(formData.songTitle) && !isExtractedFromLink && formData.songTitle.trim().length >= 2) {
                                setShowAutocomplete(true);
                              }
                            }}
                            onKeyDown={handleSongTitleKeyDown}
                            onBlur={(e) => {
                              // Delay hiding autocomplete to allow click events
                              setTimeout(() => {
                                setShowAutocomplete(false);
                                setSelectedSuggestionIndex(-1);
                              }, 200);
                              handleSongTitleBlur(e);
                            }}
                            className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200 touch-manipulation ${
                              extractingSong ? 'pr-20 sm:pr-24 md:pr-28' : isExtractedFromLink ? 'pr-20 sm:pr-24' : 'pr-3 sm:pr-4'
                            }`}
                            placeholder={organizationData?.requests_song_title_placeholder || "Type song name or paste a link"}
                            required
                            autoComplete="off"
                          />
                          {extractingSong && (
                            <div className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2 pointer-events-none">
                              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-brand flex-shrink-0" />
                              <span className="text-xs text-gray-700 dark:text-gray-300 hidden sm:inline whitespace-nowrap">Extracting...</span>
                            </div>
                          )}
                          {isExtractedFromLink && !extractingSong && (
                            <button
                              type="button"
                              onClick={handleClearExtraction}
                              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Clear and start over"
                            >
                              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                          )}
                        </div>
                        {extractionError && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            {extractionError}
                          </p>
                        )}
                        {isExtractedFromLink && !extractionError && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            Song info extracted successfully
                          </p>
                        )}
                         {/* Subtle hint always visible when empty */}
                         {!formData.songTitle && !isExtractedFromLink && !extractingSong && (
                           <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                             <Link2 className="w-3 h-3 flex-shrink-0" />
                             <span>Type a song name or paste a music link</span>
                           </p>
                         )}
                         {/* Autocomplete suggestions */}
                         {showAutocomplete && suggestions.length > 0 && (
                           <div className="mt-2 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                             {suggestions.map((suggestion, index) => (
                               <button
                                 key={suggestion.id}
                                 type="button"
                                 onClick={() => handleSuggestionSelect(suggestion)}
                                 className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-black/80 transition-colors flex items-center gap-3 ${
                                   index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-black/80' : ''
                                 }`}
                               >
                                 {suggestion.albumArt && (
                                   <img
                                     src={suggestion.albumArt}
                                     alt=""
                                     className="w-10 h-10 rounded flex-shrink-0 object-cover"
                                   />
                                 )}
                                 <div className="flex-1 min-w-0">
                                   <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                     {suggestion.title}
                                   </p>
                                   <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                     {suggestion.artist}
                                   </p>
                                 </div>
                               </button>
                             ))}
                           </div>
                         )}
                         {showAutocomplete && searchingSongs && suggestions.length === 0 && (
                           <div className="mt-2 p-3 bg-white dark:bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                             <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                           </div>
                         )}
                       </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                          {organizationData?.requests_artist_name_label || 'Artist Name'}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="songArtist"
                          value={formData.songArtist}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:shadow-lg focus:shadow-brand-500/20 transition-all duration-200"
                          placeholder={organizationData?.requests_artist_name_placeholder || "Enter artist name"}
                          required
                          autoComplete="off"
                        />
                      </div>

                      {/* Bundle Songs Input (only show when bundle size > 1) */}
                      {bundleSize > 1 && bundleSongs.length > 0 && (
                        <div ref={bundleSongsRef} className="mt-4 p-4 bg-white/70 dark:bg-black/50 rounded-lg border border-gray-200/50 dark:border-gray-800/50">
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
                              <div key={index} className="bg-white/50 dark:bg-black/30 rounded-lg p-3 sm:p-4 border border-gray-200/50 dark:border-gray-700/50">
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
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200"
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
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200"
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

                      {/* Album Art Display */}
                      {albumArtUrl && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
                          <img
                            src={albumArtUrl}
                            alt="Album art"
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              // Hide image if it fails to load
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Album Art</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                              {formData.songTitle && formData.songArtist 
                                ? `${formData.songTitle} by ${formData.songArtist}`
                                : 'Song information'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Audio File Upload Section - Collapsible (subtle by default) */}
                      {/* Hide when user manually enters song title or artist name (they're requesting an existing song) */}
                      {organizationData?.requests_show_audio_upload !== false && !formData.songTitle?.trim() && !formData.songArtist?.trim() && (
                      <Collapsible open={audioUploadExpanded} onOpenChange={setAudioUploadExpanded} className="mt-3">
                          <div className={`rounded-md overflow-hidden transition-colors ${
                          audioUploadExpanded 
                            ? 'bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800' 
                            : 'bg-transparent'
                        }`}>
                          <CollapsibleTrigger className={`w-full py-1.5 px-2 flex items-center justify-center gap-1.5 transition-colors ${
                            audioUploadExpanded
                              ? 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'
                              : 'hover:text-gray-600 dark:hover:text-gray-300'
                          }`}>
                            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                              <Music className={`w-3 h-3 flex-shrink-0 transition-colors ${
                                audioUploadExpanded 
                                  ? 'text-gray-600 dark:text-gray-400' 
                                  : 'text-gray-400 dark:text-gray-500'
                              }`} />
                              <span className="text-[10px] text-gray-500 dark:text-gray-500">
                                Have your own track? Upload audio
                              </span>
                              <ChevronDown 
                                className={`w-3 h-3 flex-shrink-0 transition-all duration-200 ${
                                  audioUploadExpanded 
                                    ? 'transform rotate-180 text-gray-500 dark:text-gray-400' 
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}
                              />
                        </div>
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
                              className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700 dark:file:bg-brand-700 dark:hover:file:bg-brand-600"
                              disabled={audioUploading}
                            />
                            {audioUploading && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400">
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
                                className="mt-1 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600"
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
                                className="mt-1 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {organizationData?.requests_is_artist_text || 'I am the artist (this is for promotion, not just a play)'}
                              </span>
                            </label>
                            <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-2">
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
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
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
                        bundleSize={bundleSize}
                        setBundleSize={setBundleSize}
                      />
                      {/* Fallback payment options for tips only */}
                      {(paymentSettings?.cashAppTag || paymentSettings?.venmoUsername) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
                            Having trouble with card payment? You can also tip via:
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                            {paymentSettings?.cashAppTag && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">CashApp:</span>
                                <span className="text-base font-bold text-green-600 dark:text-green-400">{paymentSettings.cashAppTag}</span>
                              </div>
                            )}
                            {paymentSettings?.venmoUsername && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Venmo:</span>
                                <span className="text-base font-bold text-blue-600 dark:text-blue-400">{paymentSettings.venmoUsername}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Requester Information - Required for payment verification */}
                  {/* Always show name field - it's required for all request types and must remain visible after auto-advance to step 2 */}
                  <div className="mt-2 sm:mt-3 md:mt-4 space-y-2 sm:space-y-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="requesterName"
                        value={formData.requesterName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
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
                      <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                        Additional Notes (optional)
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-800 bg-white dark:bg-black/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                        placeholder="Any additional information..."
                      />
                    </div>
                  </div>

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
                          bundleSize={bundleSize}
                          setBundleSize={setBundleSize}
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
                          bundleSize={bundleSize}
                          setBundleSize={setBundleSize}
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
                    disabled={(() => {
                      if (submitting) return true;
                      if (currentStep >= 2) {
                        const amount = getPaymentAmount();
                        // In bidding mode, check against dynamic minimum bid
                        if (shouldUseBidding) {
                          const minBid = dynamicMinimumAmount || 500;
                          const isDisabled = !amount || amount < minBid;
                          console.log('[requests.js] Continue button check (bidding):', {
                            amount: amount ? amount / 100 : null,
                            minBid: minBid / 100,
                            biddingSelectedAmount: biddingSelectedAmount ? biddingSelectedAmount / 100 : null,
                            disabled: isDisabled
                          });
                          return isDisabled;
                        }
                        // Regular payment mode
                        const minAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
                        return !amount || amount < minAmount;
                      }
                      return false;
                    })()}
                    className="group relative w-full py-3 sm:py-4 md:py-5 lg:py-6 text-sm sm:text-base md:text-lg font-bold inline-flex items-center justify-center gap-2 sm:gap-3 min-h-[48px] sm:min-h-[56px] md:min-h-[64px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 hover:from-brand-500 hover:via-brand-400 hover:to-brand-600 text-white shadow-2xl shadow-brand-500/40 hover:shadow-brand-500/60 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    onClick={(e) => {
                      // Prevent double-submission
                      if (submitting) {
                        e.preventDefault();
                        return;
                      }
                      
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
                      // Don't scroll - let form submit immediately if valid
                      // Validation errors will handle scrolling in handleSubmit
                      // Only scroll for step 1 (Continue to Payment) which is handled above
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
          <a 
            href="https://tipjar.live" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors inline-flex items-center gap-1"
          >
            <span>Are you a DJ?</span>
            <span className="underline">Create your request page</span>
          </a>
        </footer>
        </div>{/* End Main Content Area */}
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

