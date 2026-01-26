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
import { parseCombinedSongInput, formatCombinedDisplay } from '../utils/song-field-parser';
import { useCrowdRequestPayment } from '../hooks/useCrowdRequestPayment';
import { useCrowdRequestValidation } from '../hooks/useCrowdRequestValidation';
import { crowdRequestAPI } from '../utils/crowd-request-api';
import { createLogger } from '../utils/logger';
import { CROWD_REQUEST_CONSTANTS } from '../constants/crowd-request';
import { createClient } from '@/utils/supabase/client';
import { getCoverPhotoUrl } from '../utils/cover-photo-helper';
import { useQRScanTracking } from '../hooks/useQRScanTracking';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import BiddingInterface from '../components/bidding/BiddingInterface';
import BidSuccessModal from '../components/bidding/BidSuccessModal';
import FullScreenLoader from '@/components/ui/FullScreenLoader';
import ContactFormModal from '@/components/company/ContactFormModal';

const logger = createLogger('GeneralRequestsPage');

const DEFAULT_COVER_PHOTO = '/assets/DJ-Ben-Murray-Dodge-Poster.png';

// localStorage key for persisting requester info
const REQUESTER_INFO_KEY = 'm10_requester_info';

// Wrapper component for /requests route that loads organization data
export default function RequestsPageWrapper() {
  const router = useRouter();
  // Use singleton client to prevent multiple GoTrueClient instances
  const supabase = createClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    let isMounted = true;
    
    async function loadOrganizationByContext() {
      try {
        // Detect which domain we're on
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const isTipJarDomain = hostname.includes('tipjar.live') || hostname.includes('localhost');
        const isM10Domain = hostname.includes('m10djcompany.com');
        
        console.log('🔄 [REQUESTS] Loading organization for /requests route...', {
          hostname,
          isTipJarDomain,
          isM10Domain
        });
        
        let targetSlug = null;
        
        if (isM10Domain) {
          // On m10djcompany.com - always show M10 DJ Company
          targetSlug = 'm10djcompany';
          console.log('🏢 [REQUESTS] M10 domain detected, loading m10djcompany');
        } else if (isTipJarDomain) {
          // On tipjar.live - check for logged in user's organization
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Find the user's organization
            const { data: membership } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .single();
            
            if (membership) {
              const { data: org } = await supabase
                .from('organizations')
                .select('slug')
                .eq('id', membership.organization_id)
                .single();
              
              if (org?.slug && isMounted) {
                // Prevent redirect loops - check if we're already on the target page
                const currentPath = router.asPath;
                const targetPath = `/${org.slug}/requests`;
                
                if (currentPath !== targetPath) {
                  // Redirect to their specific page
                  console.log('🔀 [REQUESTS] TipJar user detected, redirecting to their page:', org.slug);
                  router.replace(targetPath);
                  return;
                }
              }
            }
            
            // Check if user owns an organization directly
            const { data: ownedOrg } = await supabase
              .from('organizations')
              .select('slug')
              .eq('owner_id', user.id)
              .single();
            
            if (ownedOrg?.slug && isMounted) {
              // Prevent redirect loops - check if we're already on the target page
              const currentPath = router.asPath;
              const targetPath = `/${ownedOrg.slug}/requests`;
              
              if (currentPath !== targetPath) {
                console.log('🔀 [REQUESTS] TipJar owner detected, redirecting to their page:', ownedOrg.slug);
                router.replace(targetPath);
                return;
              }
            }
          }
          
          // No logged in user or no organization - show a landing/signup page or default
          console.log('👤 [REQUESTS] TipJar domain, no user org found, showing default');
          // For now, fall back to m10djcompany as demo, but ideally show a signup prompt
          targetSlug = 'm10djcompany';
        } else {
          // Unknown domain - default to m10djcompany
          targetSlug = 'm10djcompany';
        }
        
        if (!targetSlug || !isMounted) {
          if (isMounted) setLoading(false);
          return;
        }
        
        // Load the target organization
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', targetSlug)
          .single();

        if (error) {
          console.error('❌ [REQUESTS] Error loading organization:', error);
          if (isMounted) setLoading(false);
          return;
        }

        if (org && (org.subscription_status === 'active' || org.subscription_status === 'trial') && isMounted) {
          // Auto-fix: If requests_header_artist_name is missing, set it to organization name
          if (!org.requests_header_artist_name && org.name) {
            try {
              const { error: updateError } = await supabase
                .from('organizations')
                .update({ requests_header_artist_name: org.name })
                .eq('id', org.id);
              
              if (!updateError && isMounted) {
                org.requests_header_artist_name = org.name;
                console.log('✅ [REQUESTS] Auto-set requests_header_artist_name to:', org.name);
              }
            } catch (updateError) {
              console.error('❌ [REQUESTS] Error auto-setting requests_header_artist_name:', updateError);
            }
          }
          
          if (isMounted) {
            setOrganization(org);
            console.log('✅ [REQUESTS] Organization loaded:', {
              id: org.id,
              name: org.name,
              slug: org.slug,
              artist_name: org.requests_header_artist_name
            });
          }
        }
      } catch (err) {
        console.error('❌ [REQUESTS] Error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrganizationByContext();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
    
    // Note: We don't set up a polling interval here because it would cause
    // redirect loops. The slug-based page ([slug]/requests.js) handles its own polling.
    // For the /requests page, data is loaded once on mount.
    // CRITICAL: Don't include supabase or router in deps - supabase is a singleton,
    // and router changes can cause infinite loops. Only run once on mount.
  }, []); // Empty dependency array - only run once on mount

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
  
  // State for tab visibility settings
  const [tabVisibilitySettings, setTabVisibilitySettings] = useState(null);
  const [effectiveAllowedTypes, setEffectiveAllowedTypes] = useState(allowedRequestTypes);
  const [songRequestsDisabled, setSongRequestsDisabled] = useState(false);
  
  // Fetch tab visibility settings when organizationId is available
  useEffect(() => {
    async function fetchTabSettings() {
      // If allowedRequestTypes is explicitly provided (e.g., from /bid page), use that
      if (allowedRequestTypes !== null) {
        setEffectiveAllowedTypes(allowedRequestTypes);
        return;
      }

      // Only fetch if we have an organizationId
      if (!organizationId) {
        // Default to all types if no org
        setEffectiveAllowedTypes(['song_request', 'shoutout', 'tip']);
        setSongRequestsDisabled(false);
        return;
      }

      try {
        const { getAllowedRequestTypes } = await import('@/lib/requests/tab-visibility');
        const allowed = await getAllowedRequestTypes(organizationId);
        setEffectiveAllowedTypes(allowed);
        
        // Check if song requests are disabled via master toggle
        // This is separate from tab visibility - master toggle takes precedence
        if (organizationData?.product_context === 'tipjar') {
          const isDisabled = organizationData?.requests_song_requests_enabled === false;
          setSongRequestsDisabled(isDisabled);
        } else {
          setSongRequestsDisabled(false);
        }
        
        console.log('[Requests] Tab visibility settings loaded:', allowed, 'Song requests disabled:', organizationData?.requests_song_requests_enabled === false);
      } catch (error) {
        console.warn('[Requests] Error fetching tab visibility settings:', error);
        // Default to all types on error
        setEffectiveAllowedTypes(['song_request', 'shoutout', 'tip']);
        setSongRequestsDisabled(false);
      }
    }

    fetchTabSettings();
  }, [organizationId, allowedRequestTypes, organizationData]);
  // CRITICAL: Initialize router FIRST before any other code to prevent TDZ errors
  const router = useRouter();
  
  // CRITICAL: All hooks (useState, useRef, useMemo, etc.) must be declared BEFORE any useEffect hooks
  // that use them to prevent Temporal Dead Zone (TDZ) errors
  
  // Video-related refs and state (used in early useEffect hooks)
  const desktopVideoRef = useRef(null); // Ref for desktop video background
  const mobileVideoRef = useRef(null); // Ref for mobile video background
  const desktopVideoTimeoutRef = useRef(null); // Ref for desktop video timeout
  const mobileVideoTimeoutRef = useRef(null); // Ref for mobile video timeout
  const [videoFailed, setVideoFailed] = useState(false); // Track if video autoplay failed
  const [videoLoadingTimeout, setVideoLoadingTimeout] = useState(null); // Timeout for video loading
  const VIDEO_LOAD_TIMEOUT = 10000; // 10 seconds timeout for video loading
  
  // Request type state (used early in component)
  const [requestType, setRequestType] = useState(() => {
    return allowedRequestTypes && allowedRequestTypes.length > 0
      ? allowedRequestTypes[0]
      : (organizationData?.requests_default_request_type || 'song_request');
  }); // 'song_request', 'shoutout', or 'tip'
  
  // Form data and amount state (used in handleRequestTypeChange and other early functions)
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
  const [showBookingModal, setShowBookingModal] = useState(false); // Booking form modal
  const [customAmount, setCustomAmount] = useState('');
  const [initialPresetSet, setInitialPresetSet] = useState(false); // Track if initial preset amount has been set
  const [initialCalculatedMax, setInitialCalculatedMax] = useState(null); // Track the initial max preset we calculated
  const [userSelectedPreset, setUserSelectedPreset] = useState(false); // Track if user has manually selected a preset amount
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
  const [songInput, setSongInput] = useState(''); // Combined song input field (e.g., "Song Title - Artist Name")
  const songTitleInputRef = useRef(null); // Ref for scrolling to song title field
  const bundleSongsRef = useRef(null); // Ref for scrolling to bundle songs section
  
  // Read preview parameters from URL (for admin preview)
  const previewAccentColor = router.query.accentColor ? decodeURIComponent(router.query.accentColor) : null;
  const previewSecondaryColor1 = router.query.secondaryColor1 ? decodeURIComponent(router.query.secondaryColor1) : null;
  const previewSecondaryColor2 = router.query.secondaryColor2 ? decodeURIComponent(router.query.secondaryColor2) : null;
  const previewButtonStyle = router.query.buttonStyle || null;
  const previewThemeMode = router.query.themeMode || null;
  
  // Read display name styling parameters from URL (for admin preview)
  const previewArtistNameFont = router.query.artistNameFont ? decodeURIComponent(router.query.artistNameFont) : null;
  const previewArtistNameTextTransform = router.query.artistNameTextTransform || null;
  const previewArtistNameColor = router.query.artistNameColor || null;
  const previewArtistNameKerning = router.query.artistNameKerning ? parseFloat(router.query.artistNameKerning) : null;
  const previewArtistNameStrokeEnabled = router.query.artistNameStrokeEnabled === 'true';
  const previewArtistNameStrokeWidth = router.query.artistNameStrokeWidth ? parseInt(router.query.artistNameStrokeWidth) : null;
  const previewArtistNameStrokeColor = router.query.artistNameStrokeColor || null;
  const previewArtistNameShadowEnabled = router.query.artistNameShadowEnabled !== 'false'; // Default to true if not specified
  const previewArtistNameShadowXOffset = router.query.artistNameShadowXOffset ? parseInt(router.query.artistNameShadowXOffset) : null;
  const previewArtistNameShadowYOffset = router.query.artistNameShadowYOffset ? parseInt(router.query.artistNameShadowYOffset) : null;
  const previewArtistNameShadowBlur = router.query.artistNameShadowBlur ? parseInt(router.query.artistNameShadowBlur) : null;
  const previewArtistNameShadowColor = router.query.artistNameShadowColor || null;
  
  // Use preview values if available, otherwise use organization data
  // Default accent color based on product context: TipJar = green, others = gold
  // Use useMemo to avoid TDZ issues during bundling
  const defaultAccentColor = useMemo(() => 
    organizationData?.product_context === 'tipjar' ? '#10b981' : '#fcba00',
    [organizationData?.product_context]
  );
  const effectiveAccentColor = useMemo(() => 
    previewAccentColor || organizationData?.requests_accent_color || defaultAccentColor,
    [previewAccentColor, organizationData?.requests_accent_color, defaultAccentColor]
  );
  // Secondary colors default to accent color if not set
  const effectiveSecondaryColor1 = useMemo(() => 
    previewSecondaryColor1 || organizationData?.requests_secondary_color_1 || effectiveAccentColor,
    [previewSecondaryColor1, organizationData?.requests_secondary_color_1, effectiveAccentColor]
  );
  const effectiveSecondaryColor2 = useMemo(() => 
    previewSecondaryColor2 || organizationData?.requests_secondary_color_2 || effectiveAccentColor,
    [previewSecondaryColor2, organizationData?.requests_secondary_color_2, effectiveAccentColor]
  );
  
  // Helper function to convert hex to rgba
  const hexToRgba = (hex, alpha) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const effectiveButtonStyle = previewButtonStyle || organizationData?.requests_button_style || 'gradient';
  const effectiveThemeMode = previewThemeMode || organizationData?.requests_theme_mode || 'dark';
  
  // Use preview values for display name styling if available, otherwise use organization data
  const effectiveArtistNameFont = previewArtistNameFont || organizationData?.requests_artist_name_font || 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif';
  const effectiveArtistNameTextTransform = previewArtistNameTextTransform || organizationData?.requests_artist_name_text_transform || 'uppercase';
  const effectiveArtistNameColor = previewArtistNameColor || organizationData?.requests_artist_name_color || '#ffffff';
  const effectiveArtistNameKerning = previewArtistNameKerning !== null ? previewArtistNameKerning : (organizationData?.requests_artist_name_kerning || 0);
  const effectiveArtistNameStrokeEnabled = previewArtistNameStrokeWidth !== null ? previewArtistNameStrokeEnabled : (organizationData?.requests_artist_name_stroke_enabled || false);
  const effectiveArtistNameStrokeWidth = previewArtistNameStrokeWidth !== null ? previewArtistNameStrokeWidth : (organizationData?.requests_artist_name_stroke_width || 2);
  const effectiveArtistNameStrokeColor = previewArtistNameStrokeColor || organizationData?.requests_artist_name_stroke_color || '#000000';
  const effectiveArtistNameShadowEnabled = previewArtistNameShadowXOffset !== null ? previewArtistNameShadowEnabled : (organizationData?.requests_artist_name_shadow_enabled !== false);
  const effectiveArtistNameShadowXOffset = previewArtistNameShadowXOffset !== null ? previewArtistNameShadowXOffset : (organizationData?.requests_artist_name_shadow_x_offset || 3);
  const effectiveArtistNameShadowYOffset = previewArtistNameShadowYOffset !== null ? previewArtistNameShadowYOffset : (organizationData?.requests_artist_name_shadow_y_offset || 3);
  const effectiveArtistNameShadowBlur = previewArtistNameShadowBlur !== null ? previewArtistNameShadowBlur : (organizationData?.requests_artist_name_shadow_blur || 6);
  const effectiveArtistNameShadowColor = previewArtistNameShadowColor || organizationData?.requests_artist_name_shadow_color || 'rgba(0, 0, 0, 0.8)';
  
  // Read subtitle styling parameters from URL (for admin preview)
  const previewSubtitleFont = router.query.subtitleFont ? decodeURIComponent(router.query.subtitleFont) : null;
  const previewSubtitleTextTransform = router.query.subtitleTextTransform || null;
  const previewSubtitleColor = router.query.subtitleColor || null;
  const previewSubtitleKerning = router.query.subtitleKerning ? parseFloat(router.query.subtitleKerning) : null;
  const previewSubtitleStrokeEnabled = router.query.subtitleStrokeEnabled === 'true';
  const previewSubtitleStrokeWidth = router.query.subtitleStrokeWidth ? parseInt(router.query.subtitleStrokeWidth) : null;
  const previewSubtitleStrokeColor = router.query.subtitleStrokeColor || null;
  const previewSubtitleShadowEnabled = router.query.subtitleShadowEnabled !== 'false';
  const previewSubtitleShadowXOffset = router.query.subtitleShadowXOffset ? parseInt(router.query.subtitleShadowXOffset) : null;
  const previewSubtitleShadowYOffset = router.query.subtitleShadowYOffset ? parseInt(router.query.subtitleShadowYOffset) : null;
  const previewSubtitleShadowBlur = router.query.subtitleShadowBlur ? parseInt(router.query.subtitleShadowBlur) : null;
  const previewSubtitleShadowColor = router.query.subtitleShadowColor || null;
  
  // Read payment amount sort order from URL (for admin preview)
  const previewAmountsSortOrder = router.query.amountsSortOrder || null;
  
  // Read background type from URL (for admin preview)
  const previewBackgroundType = router.query.backgroundType || null;
  
  // Read header background color settings from URL (for admin preview)
  const previewHeaderBackgroundType = router.query.headerBackgroundType || null;
  const previewHeaderBackgroundColor = router.query.headerBackgroundColor || null;
  const previewHeaderBackgroundGradientStart = router.query.headerBackgroundGradientStart || null;
  const previewHeaderBackgroundGradientEnd = router.query.headerBackgroundGradientEnd || null;
  
  // Read preview social links from URL (for admin preview)
  let previewSocialLinks = null;
  if (router.query.socialLinks && typeof router.query.socialLinks === 'string') {
    try {
      previewSocialLinks = JSON.parse(router.query.socialLinks);
      // Ensure it's an array
      if (!Array.isArray(previewSocialLinks)) {
        previewSocialLinks = null;
      }
    } catch (e) {
      console.error('Error parsing preview social links:', e);
      previewSocialLinks = null;
    }
  }
  
  // Use preview values for header background if available, otherwise use organization data
  const effectiveHeaderBackgroundType = previewHeaderBackgroundType !== null 
    ? previewHeaderBackgroundType 
    : (organizationData?.requests_header_background_type || 'solid');
  const effectiveHeaderBackgroundColor = previewHeaderBackgroundColor !== null
    ? previewHeaderBackgroundColor
    : (organizationData?.requests_header_background_color || '#000000');
  const effectiveHeaderBackgroundGradientStart = previewHeaderBackgroundGradientStart !== null
    ? previewHeaderBackgroundGradientStart
    : (organizationData?.requests_header_background_gradient_start || '#000000');
  const effectiveHeaderBackgroundGradientEnd = previewHeaderBackgroundGradientEnd !== null
    ? previewHeaderBackgroundGradientEnd
    : (organizationData?.requests_header_background_gradient_end || '#1a1a1a');
  
  // Read header field values from URL (for admin preview)
  const previewHeaderArtistName = router.query.headerArtistName ? decodeURIComponent(router.query.headerArtistName) : null;
  const previewHeaderLocation = router.query.headerLocation ? decodeURIComponent(router.query.headerLocation) : null;
  const previewHeaderDate = router.query.headerDate ? decodeURIComponent(router.query.headerDate) : null;
  
  // Use preview values for header fields if available, otherwise use organization data
  const effectiveHeaderArtistName = previewHeaderArtistName !== null ? previewHeaderArtistName : (organizationData?.requests_header_artist_name || organizationData?.name || '');
  const effectiveHeaderLocation = previewHeaderLocation !== null ? previewHeaderLocation : (() => {
    // Compute subtitle text based on type (for non-preview mode)
    if (previewHeaderLocation !== null) return previewHeaderLocation;
    const subtitleType = organizationData?.requests_subtitle_type || 'location';
    if (subtitleType === 'venue') {
      return organizationData?.requests_subtitle_venue || '';
    } else if (subtitleType === 'custom') {
      return organizationData?.requests_subtitle_custom_text || '';
    } else {
      // Location - use saved city/state
      return organizationData?.requests_header_location || '';
    }
  })();
  const effectiveHeaderDate = previewHeaderDate !== null ? previewHeaderDate : (organizationData?.requests_header_date || '');
  
  // Use preview values for subtitle styling if available, otherwise use organization data
  // Subtitle font defaults to artist name font if not set (unless manually changed)
  const artistNameFont = organizationData?.requests_artist_name_font || 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif';
  const effectiveSubtitleFont = previewSubtitleFont || (organizationData?.requests_subtitle_font || artistNameFont);
  const effectiveSubtitleTextTransform = previewSubtitleTextTransform || organizationData?.requests_subtitle_text_transform || 'none';
  const effectiveSubtitleColor = previewSubtitleColor || organizationData?.requests_subtitle_color || '#ffffff';
  const effectiveSubtitleKerning = previewSubtitleKerning !== null ? previewSubtitleKerning : (organizationData?.requests_subtitle_kerning || 0);
  const effectiveSubtitleStrokeEnabled = previewSubtitleStrokeWidth !== null ? previewSubtitleStrokeEnabled : (organizationData?.requests_subtitle_stroke_enabled || false);
  const effectiveSubtitleStrokeWidth = previewSubtitleStrokeWidth !== null ? previewSubtitleStrokeWidth : (organizationData?.requests_subtitle_stroke_width || 2);
  const effectiveSubtitleStrokeColor = previewSubtitleStrokeColor || organizationData?.requests_subtitle_stroke_color || '#000000';
  const effectiveSubtitleShadowEnabled = previewSubtitleShadowXOffset !== null ? previewSubtitleShadowEnabled : (organizationData?.requests_subtitle_shadow_enabled !== false);
  const effectiveSubtitleShadowXOffset = previewSubtitleShadowXOffset !== null ? previewSubtitleShadowXOffset : (organizationData?.requests_subtitle_shadow_x_offset || 3);
  const effectiveSubtitleShadowYOffset = previewSubtitleShadowYOffset !== null ? previewSubtitleShadowYOffset : (organizationData?.requests_subtitle_shadow_y_offset || 3);
  const effectiveSubtitleShadowBlur = previewSubtitleShadowBlur !== null ? previewSubtitleShadowBlur : (organizationData?.requests_subtitle_shadow_blur || 6);
  const effectiveSubtitleShadowColor = previewSubtitleShadowColor || organizationData?.requests_subtitle_shadow_color || 'rgba(0, 0, 0, 0.8)';
  
  // Helper function to generate text-shadow outline effect (preserves fill color)
  const generateTextShadowOutline = (strokeEnabled, strokeWidth, strokeColor, shadowEnabled, shadowX, shadowY, shadowBlur, shadowColor) => {
    const shadows = [];
    
    // If stroke is enabled, create outline using multiple text-shadows in all directions
    if (strokeEnabled && strokeWidth > 0) {
      const outlineShadows = [];
      // Create shadows in 8 directions (every 45 degrees) plus intermediate positions for smoother outline
      const directions = [
        { x: 0, y: -strokeWidth },      // top
        { x: strokeWidth, y: -strokeWidth }, // top-right
        { x: strokeWidth, y: 0 },       // right
        { x: strokeWidth, y: strokeWidth },  // bottom-right
        { x: 0, y: strokeWidth },       // bottom
        { x: -strokeWidth, y: strokeWidth }, // bottom-left
        { x: -strokeWidth, y: 0 },      // left
        { x: -strokeWidth, y: -strokeWidth }, // top-left
      ];
      
      // Add more directions for thicker strokes (every 30 degrees for strokeWidth >= 3)
      if (strokeWidth >= 3) {
        const angle45 = Math.PI / 4;
        directions.push(
          { x: Math.round(Math.cos(angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 2 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 2 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 3 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 3 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 4 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 4 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 5 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 5 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 6 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 6 + angle45 / 2) * strokeWidth) },
          { x: Math.round(Math.cos(angle45 * 7 + angle45 / 2) * strokeWidth), y: -Math.round(Math.sin(angle45 * 7 + angle45 / 2) * strokeWidth) }
        );
      }
      
      directions.forEach(dir => {
        outlineShadows.push(`${dir.x}px ${dir.y}px 0 ${strokeColor}`);
      });
      shadows.push(...outlineShadows);
    }
    
    // Add regular shadow if enabled (and not overridden by stroke outline)
    if (shadowEnabled && (shadows.length === 0 || !strokeEnabled)) {
      shadows.push(`${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`);
    } else if (shadowEnabled && strokeEnabled) {
      // If both stroke and shadow are enabled, add shadow after outline (on top)
      shadows.push(`${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`);
    }
    
    return shadows.length > 0 ? shadows.join(', ') : 'none';
  };
  
  // Generate combined text-shadow for artist name and subtitle
  const artistNameTextShadow = generateTextShadowOutline(
    effectiveArtistNameStrokeEnabled,
    effectiveArtistNameStrokeWidth,
    effectiveArtistNameStrokeColor,
    effectiveArtistNameShadowEnabled,
    effectiveArtistNameShadowXOffset,
    effectiveArtistNameShadowYOffset,
    effectiveArtistNameShadowBlur,
    effectiveArtistNameShadowColor
  );
  
  const subtitleTextShadow = generateTextShadowOutline(
    effectiveSubtitleStrokeEnabled,
    effectiveSubtitleStrokeWidth,
    effectiveSubtitleStrokeColor,
    effectiveSubtitleShadowEnabled,
    effectiveSubtitleShadowXOffset,
    effectiveSubtitleShadowYOffset,
    effectiveSubtitleShadowBlur,
    effectiveSubtitleShadowColor
  );
  
  // CRITICAL: Declare all variables used in useEffect hooks BEFORE the hooks
  // Use useMemo to ensure proper initialization order and prevent TDZ errors
  // Detect domain context - check both client-side hostname and organization product_context for SSR compatibility
  const isTipJarDomain = useMemo(() => {
    // Check client-side hostname if available
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('tipjar.live') || hostname.includes('tipjar.com')) {
        return true;
      }
    }
    // Fallback to organization product_context for SSR
    return organizationData?.product_context === 'tipjar';
  }, [organizationData?.product_context]);
  const isM10Domain = useMemo(() => 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'm10djcompany.com' || window.location.hostname === 'www.m10djcompany.com'),
    []
  );
  const isM10Organization = useMemo(() => 
    organizationData?.slug === 'm10djcompany' || organizationData?.name?.toLowerCase().includes('m10'),
    [organizationData?.slug, organizationData?.name]
  );
  const allowSocialAccountSelector = useMemo(() => 
    isM10Domain || isM10Organization,
    [isM10Domain, isM10Organization]
  );
  
  // Get the video URL from organization data (if set) with security checks
  // This allows each organization to have their own animated header
  // CRITICAL: Only use video URL if it's explicitly set for THIS organization
  // Reject any video URLs that look like M10 defaults (djbenmurray, m10djcompany, etc.)
  const headerVideoUrl = useMemo(() => {
    let videoUrl = organizationData?.requests_header_video_url || null;
    
    // Security check: Block M10-specific video URLs from appearing on other organizations' pages
    if (videoUrl) {
      const videoUrlLower = videoUrl.toLowerCase();
      const isM10Video = videoUrlLower.includes('djbenmurray') || 
                         videoUrlLower.includes('m10djcompany') ||
                         videoUrlLower.includes('m10-dj-company') ||
                         videoUrlLower.includes('ben-murray') ||
                         videoUrlLower.includes('dj-ben-murray');
      
      // Only allow M10 videos on M10 domains OR if this is actually the M10 organization
      const shouldBlockM10Video = isM10Video && !isM10Domain && !isM10Organization;
      
      // On TipJar domain, never show M10 videos unless it's actually the M10 organization
      const shouldBlockOnTipJar = isTipJarDomain && isM10Video && !isM10Organization;
      
      if (shouldBlockM10Video || shouldBlockOnTipJar) {
        console.warn('🚫 [REQUESTS] Blocked M10-specific video URL from non-M10 organization:', {
          videoUrl: videoUrl,
          organizationId: organizationData?.id,
          organizationName: organizationData?.name,
          organizationSlug: organizationData?.slug,
          isTipJarDomain,
          isM10Domain,
          isM10Organization
        });
        videoUrl = null; // Force fallback to animated gradient
      }
    }
    
    return videoUrl;
  }, [organizationData?.requests_header_video_url, organizationData?.id, organizationData?.name, organizationData?.slug, isTipJarDomain, isM10Domain, isM10Organization]);
  
  // Use preview value if available, otherwise use organization data, default to 'gradient'
  const backgroundType = useMemo(() => 
    previewBackgroundType || organizationData?.requests_background_type || 'gradient',
    [previewBackgroundType, organizationData?.requests_background_type]
  );
  
  // Only use cover photo if it's actually a custom one (not the default)
  // If backgroundType is 'none', don't use the default fallback image
  const hasCustomCoverPhoto = useMemo(() => 
    organizationCoverPhoto && 
    organizationCoverPhoto !== DEFAULT_COVER_PHOTO && 
    !organizationCoverPhoto.includes('DJ-Ben-Murray'),
    [organizationCoverPhoto]
  );
  const coverPhoto = useMemo(() => 
    hasCustomCoverPhoto ? organizationCoverPhoto : null,
    [hasCustomCoverPhoto, organizationCoverPhoto]
  );
  
  // Determine what to show as background:
  // 1. Custom video if set (and not blocked)
  // 2. Custom cover photo if set (not the default placeholder)
  // 3. Animated background based on background type (only if not 'none')
  // 4. Solid color background if backgroundType is 'none' and no custom media
  const hasCustomVideo = useMemo(() => !!headerVideoUrl, [headerVideoUrl]);
  const showVideo = useMemo(() => hasCustomVideo, [hasCustomVideo]);
  const showAnimatedGradient = useMemo(() => 
    !hasCustomVideo && !hasCustomCoverPhoto && backgroundType !== 'none',
    [hasCustomVideo, hasCustomCoverPhoto, backgroundType]
  );
  const showSolidBackground = useMemo(() => 
    !hasCustomVideo && !hasCustomCoverPhoto && backgroundType === 'none',
    [hasCustomVideo, hasCustomCoverPhoto, backgroundType]
  );
  
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
  
  // Log cover photo and video for debugging
  useEffect(() => {
    console.log('🖼️ [GENERAL REQUESTS] Cover photo & video:', {
      organizationCoverPhoto,
      coverPhoto,
      hasCustomCoverPhoto,
      headerVideoUrl,
      showVideo,
      showAnimatedGradient,
      showSolidBackground,
      backgroundType,
      rawVideoUrl: organizationData?.requests_header_video_url,
      fromOrganizationData: organizationData?.requests_cover_photo_url || organizationData?.requests_artist_photo_url || organizationData?.requests_venue_photo_url,
      primaryCoverSource: organizationData?.requests_primary_cover_source,
      hasArtist: !!organizationData?.requests_artist_photo_url,
      hasVenue: !!organizationData?.requests_venue_photo_url,
      artistUrl: organizationData?.requests_artist_photo_url,
      venueUrl: organizationData?.requests_venue_photo_url,
      allOrgKeys: organizationData ? Object.keys(organizationData) : []
    });
  }, [organizationCoverPhoto, coverPhoto, hasCustomCoverPhoto, headerVideoUrl, showVideo, showAnimatedGradient, showSolidBackground, backgroundType, organizationData]);

  // Video loading timeout and error handling
  useEffect(() => {
    if (!showVideo || videoFailed) {
      // Clear any existing timeouts if video is not showing or already failed
      if (desktopVideoTimeoutRef.current) {
        clearTimeout(desktopVideoTimeoutRef.current);
        desktopVideoTimeoutRef.current = null;
      }
      if (mobileVideoTimeoutRef.current) {
        clearTimeout(mobileVideoTimeoutRef.current);
        mobileVideoTimeoutRef.current = null;
      }
      return;
    }

    // Set timeout for desktop video
    if (desktopVideoRef.current) {
      desktopVideoTimeoutRef.current = setTimeout(() => {
        // Check if video still hasn't loaded after timeout
        if (desktopVideoRef.current && desktopVideoRef.current.readyState < 2) {
          console.warn('⚠️ [VIDEO] Desktop video loading timeout, falling back to poster/background');
          setVideoFailed(true);
        }
      }, VIDEO_LOAD_TIMEOUT);
    }

    // Set timeout for mobile video
    if (mobileVideoRef.current) {
      mobileVideoTimeoutRef.current = setTimeout(() => {
        // Check if video still hasn't loaded after timeout
        if (mobileVideoRef.current && mobileVideoRef.current.readyState < 2) {
          console.warn('⚠️ [VIDEO] Mobile video loading timeout, falling back to poster/background');
          setVideoFailed(true);
        }
      }, VIDEO_LOAD_TIMEOUT);
    }

    // Cleanup timeouts on unmount or when dependencies change
    return () => {
      if (desktopVideoTimeoutRef.current) {
        clearTimeout(desktopVideoTimeoutRef.current);
        desktopVideoTimeoutRef.current = null;
      }
      if (mobileVideoTimeoutRef.current) {
        clearTimeout(mobileVideoTimeoutRef.current);
        mobileVideoTimeoutRef.current = null;
      }
    };
  }, [showVideo, videoFailed, headerVideoUrl]);

  // Reset video failed state when video URL changes
  useEffect(() => {
    if (headerVideoUrl) {
      setVideoFailed(false);
    }
  }, [headerVideoUrl]);

  // Lock request type if only one type is allowed (e.g., on /bid page)
  useEffect(() => {
    if (effectiveAllowedTypes && effectiveAllowedTypes.length === 1) {
      setRequestType(effectiveAllowedTypes[0]);
    } else if (effectiveAllowedTypes && effectiveAllowedTypes.length > 0 && !effectiveAllowedTypes.includes(requestType)) {
      // If current request type is not allowed, switch to first allowed type
      setRequestType(effectiveAllowedTypes[0]);
    }
  }, [effectiveAllowedTypes, requestType]);
  
  // Wrapper for setRequestType that respects effectiveAllowedTypes
  const handleRequestTypeChange = (newType) => {
    if (!effectiveAllowedTypes || effectiveAllowedTypes.includes(newType)) {
      setRequestType(newType);
      // When switching to "Tip Me", default to custom amount input
      if (newType === 'tip') {
        setAmountType('custom');
      }
    }
  };
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
    defaultPresetAmount,
    amountsSortOrder: apiAmountsSortOrder,
    bundleDiscountEnabled,
    bundleDiscount: bundleDiscountPercent,
    loading: settingsLoading
  } = usePaymentSettings({ 
    organizationId: organizationId ? String(organizationId) : null,
    organizationSlug: organizationData?.slug ? String(organizationData.slug) : null
  });
  
  // Use preview sort order if available, otherwise use API sort order
  const amountsSortOrder = previewAmountsSortOrder || apiAmountsSortOrder || 'desc';

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
      // Use functional update to read current bundleSongs without adding it to deps
      setBundleSongs(prev => {
        const newBundleSongs = [];
        for (let i = 0; i < bundleSize - 1; i++) {
          newBundleSongs.push(prev[i] || { songTitle: '', songArtist: '' });
        }
        return newBundleSongs;
      });
    } else {
      setBundleSongs([]);
    }
  }, [bundleSize]); // Only depend on bundleSize to avoid infinite loop


  // Check if bidding is enabled for this organization
  // /requests page: Only enable if organization setting is true
  // /bid page: Always enabled via forceBiddingMode prop
  useEffect(() => {
    if (forceBiddingMode) {
      // /bid page - always enable bidding
      setBiddingEnabled(true);
    } else {
      // /requests page - only enable if organization setting is true
      const biddingValue = organizationData?.requests_bidding_enabled === true;
      console.log('[REQUESTS] Setting bidding enabled:', biddingValue, 'from:', organizationData?.requests_bidding_enabled);
      setBiddingEnabled(biddingValue);
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

  // Apply theme mode on requests page - respect user's theme selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Apply theme mode based on effectiveThemeMode setting
      const applyThemeMode = () => {
        if (effectiveThemeMode === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          document.documentElement.setAttribute('data-force-dark', 'true');
          document.documentElement.removeAttribute('data-force-light');
        } else if (effectiveThemeMode === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          document.documentElement.setAttribute('data-force-light', 'true');
          document.documentElement.removeAttribute('data-force-dark');
        }
      };
      
      // Apply immediately
      applyThemeMode();
      
      // Also apply after a short delay to override any theme provider changes
      const timeoutId = setTimeout(applyThemeMode, 100);
      
      // Monitor for theme changes and re-apply theme mode
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            // Only re-apply if the class doesn't match our desired theme
            const hasDark = document.documentElement.classList.contains('dark');
            const hasLight = document.documentElement.classList.contains('light');
            if ((effectiveThemeMode === 'dark' && !hasDark) || 
                (effectiveThemeMode === 'light' && !hasLight)) {
              applyThemeMode();
            }
          }
        });
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Cleanup: remove theme classes when component unmounts (user navigates away)
      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.removeAttribute('data-force-dark');
        document.documentElement.removeAttribute('data-force-light');
      };
    }
  }, [effectiveThemeMode]);

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

  // Set initial preset amount when settings load (only once)
  // Use organization's default preset amount if set, otherwise use max preset amount
  // Only apply on initial load, not when user manually selects an amount
  useEffect(() => {
    // Skip if presetAmounts haven't loaded yet
    if (presetAmounts.length === 0) return;
    
    // CRITICAL: Don't override user selection - only apply default on initial load
    if (userSelectedPreset) {
      return; // User has manually selected an amount, don't reset it
    }
    
    // Check if organization has a default preset amount set
    if (defaultPresetAmount !== null && defaultPresetAmount !== undefined) {
      // Verify the default preset amount exists in the preset amounts array
      const defaultExists = presetAmounts.some(p => p.value === defaultPresetAmount);
      if (defaultExists) {
        // Only apply default if we haven't set it yet (initial load only)
        const shouldApplyDefault = !initialPresetSet;
        
        if (shouldApplyDefault && presetAmount !== defaultPresetAmount) {
          setPresetAmount(defaultPresetAmount);
          setInitialPresetSet(true);
          setInitialCalculatedMax(null); // Clear this since we're using the default
          return;
        }
      }
    }
    
    // No default set or default doesn't exist in presets, use the maximum preset amount
    // Only do this if we haven't set it yet (to avoid overriding a user selection)
    if (!initialPresetSet && presetAmount === CROWD_REQUEST_CONSTANTS.DEFAULT_PRESET_AMOUNT) {
      const sortedByValue = [...presetAmounts].sort((a, b) => b.value - a.value);
      const maxPreset = sortedByValue[0];
      setPresetAmount(maxPreset.value);
      setInitialCalculatedMax(maxPreset.value);
      setInitialPresetSet(true);
    }
  }, [presetAmounts, presetAmount, defaultPresetAmount, initialPresetSet, initialCalculatedMax, userSelectedPreset]);

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

  // Wrapper function to track user selection of preset amount
  const handlePresetAmountChange = (newAmount) => {
    setPresetAmount(newAmount);
    setUserSelectedPreset(true); // Mark that user has manually selected an amount
  };

  // Reset bundle size to 1 when custom amount is entered or amount doesn't equal minimum
  // Must be after getBaseAmount is defined
  // Only reset if user actively changes away from minimum amount
  // CRITICAL: Don't include bundleSize in dependencies - only reset when amount/amountType changes, not when bundleSize changes
  useEffect(() => {
    // Skip if presetAmounts haven't loaded yet (avoid false triggers on initial load)
    if (presetAmounts.length === 0 || !initialPresetSet) return;
    
    // Only reset if bundle is currently > 1 (don't reset unnecessarily)
    if (bundleSize > 1) {
      const baseAmount = getBaseAmount();
      // Reset bundle if:
      // 1. Using custom amount (always reset for custom)
      // 2. Using preset amount AND amount doesn't equal minimum (bundle only works with minimum)
      if (amountType === 'custom' || (amountType === 'preset' && baseAmount !== minimumAmount)) {
        setBundleSize(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountType, customAmount, presetAmount, minimumAmount, getBaseAmount, presetAmounts.length, initialPresetSet]); // Watch for amount changes, NOT bundleSize

  // Scroll to bundle songs section when bundle is selected and min bid is selected
  // Must be after getBaseAmount is defined
  useEffect(() => {
    if (bundleSize > 1) {
      // Check if min bid is selected
      const baseAmount = getBaseAmount();
      const isMinBidSelected = baseAmount === minimumAmount;
      
      if (isMinBidSelected) {
        // Check if first song is filled in (check both combined input and separate fields for backward compatibility)
        const parsed = parseCombinedSongInput(songInput);
        const isFirstSongFilled = (songInput && parsed.title && parsed.artist) || 
                                  (formData.songTitle?.trim() && formData.songArtist?.trim());
        
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
  }, [bundleSize, getBaseAmount, minimumAmount, songInput, formData.songTitle, formData.songArtist]);

  // Calculate minimum bid amount based on current winning bid (only for bidding mode)
  const dynamicMinimumAmount = useMemo(() => {
    if (!shouldUseBidding) return null;
    
    // Get the organization's minimum bid setting, default to 500 cents ($5) if not set
    const orgMinimumBid = organizationData?.requests_bidding_minimum_bid || 500;
    
    // Minimum bid must be at least the organization's minimum bid above winning bid
    // If no winning bid, use the organization's minimum bid
    // If there's a winning bid, add the organization's minimum bid increment to it
    const minAmount = currentWinningBid > 0 ? currentWinningBid + orgMinimumBid : orgMinimumBid;
    
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[requests.js] dynamicMinimumAmount calculated:', {
        shouldUseBidding,
        currentWinningBid: currentWinningBid / 100,
        orgMinimumBid: orgMinimumBid / 100,
        minAmount: minAmount / 100
      });
    }
    return minAmount;
  }, [shouldUseBidding, currentWinningBid, organizationData?.requests_bidding_minimum_bid]);

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
    
    // Get the organization's minimum bid setting, default to 500 cents ($5) if not set
    const orgMinimumBid = organizationData?.requests_bidding_minimum_bid || 500;
    
    // CRITICAL: Ensure minBid is always >= currentWinningBid + orgMinimumBid
    // This prevents buttons from showing amounts lower than the winning bid
    const safeMinBid = Math.max(
      dynamicMinimumAmount || orgMinimumBid,
      currentWinningBid > 0 ? currentWinningBid + orgMinimumBid : orgMinimumBid
    );
    
    const presets = [
      { value: safeMinBid, label: `$${(safeMinBid / 100).toFixed(2)}` },
      { value: safeMinBid + orgMinimumBid, label: `$${((safeMinBid + orgMinimumBid) / 100).toFixed(2)}` }, // +orgMinimumBid
      { value: safeMinBid + (orgMinimumBid * 2), label: `$${((safeMinBid + (orgMinimumBid * 2)) / 100).toFixed(2)}` }, // +2x orgMinimumBid
      { value: safeMinBid + (orgMinimumBid * 4), label: `$${((safeMinBid + (orgMinimumBid * 4)) / 100).toFixed(2)}` }, // +4x orgMinimumBid
      { value: safeMinBid + (orgMinimumBid * 10), label: `$${((safeMinBid + (orgMinimumBid * 10)) / 100).toFixed(2)}` } // +10x orgMinimumBid
    ];
    
    // CRITICAL: Filter out any amounts that are less than or equal to the winning bid
    // This is a double-check to ensure no buttons show amounts <= winning bid
    const filtered = presets.filter(preset => preset.value > currentWinningBid);
    
    // Ensure we always have at least one preset option
    if (filtered.length === 0) {
      // If all presets were filtered out, add one that's definitely above the winning bid
      const minValidBid = currentWinningBid > 0 ? currentWinningBid + orgMinimumBid : orgMinimumBid;
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
  }, [shouldUseBidding, currentWinningBid, dynamicMinimumAmount, organizationData?.requests_bidding_minimum_bid]);
  
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
  // Search on title portion of combined input or formData.songTitle (for backward compatibility)
  const searchQuery = songInput ? parseCombinedSongInput(songInput).title : formData.songTitle;
  const shouldSearch = searchQuery && 
                       !detectUrl(songInput || formData.songTitle) && 
                       !isExtractedFromLink && 
                       searchQuery.trim().length >= 2;
  const { suggestions, loading: searchingSongs } = useSongSearch(
    shouldSearch ? searchQuery : '', 
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
    
    // Handle combined song input field
    if (name === 'songInput') {
      setSongInput(value);
      
      // Detect URLs in combined input
      if (value) {
        const isUrl = detectUrl(value);
        
        if (isUrl) {
          // URL detected - trigger extraction
          const url = value.trim();
          setSongUrl(url); // Store for submission
          setExtractedSongUrl(url);
          
          // Clear the input field immediately (don't show the URL)
          setSongInput('');
          
          // Extract song info (this will populate songTitle and songArtist via extractSongInfo)
          const extractedData = await extractSongInfo(url);
          
          // Store album art if available
          if (extractedData?.albumArt) {
            setAlbumArtUrl(extractedData.albumArt);
          }
          
          // Don't set the URL as the field value - extraction will populate the combined field
          return;
        }
      }
      
      // Parse combined input to extract title and artist
      const parsed = parseCombinedSongInput(value);
      
      // Update internal formData with parsed values
      setFormData(prev => ({
        ...prev,
        songTitle: parsed.title,
        songArtist: parsed.artist
      }));
      
      // Clear audio upload when user manually enters song info
      if (value?.trim() && (parsed.title || parsed.artist)) {
        if (audioFileUrl || audioFile) {
          setAudioFile(null);
          setAudioFileUrl('');
          setArtistRightsConfirmed(false);
          setIsArtist(false);
          setAudioUploadExpanded(false);
        }
      }
      
      // Show autocomplete when typing (not URLs, not extracted, search on title portion)
      const isUrl = detectUrl(value);
      const titlePortion = parsed.title || value.split(/\s+[-–—byBY]\s+/)[0] || value;
      if (!isUrl && !isExtractedFromLink && titlePortion.trim().length >= 2) {
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
      
      // Clear album art if user manually edits after extraction
      if (albumArtUrl && value !== songInput) {
        setAlbumArtUrl(null);
        setIsExtractedFromLink(false);
        setExtractedSongUrl('');
      }
      
      return;
    }
    
    // Handle other fields normally (legacy support for any remaining separate fields)
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
  };

  // Handle autocomplete suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    // Update internal formData
    setFormData(prev => ({
      ...prev,
      songTitle: suggestion.title,
      songArtist: suggestion.artist
    }));
    
    // Update combined input field to show "Title - Artist" format
    const combined = formatCombinedDisplay(suggestion.title, suggestion.artist);
    setSongInput(combined);
    
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
  const handleSongInputBlur = async (e) => {
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
    const extractedData = await extractSongInfoHook(url, (updater) => {
      if (typeof updater === 'function') {
        const newData = updater(formData);
        setFormData(prev => ({ ...prev, ...newData }));
        // Update combined input field to reflect extracted data
        if (newData.songTitle || newData.songArtist) {
          const combined = formatCombinedDisplay(newData.songTitle || '', newData.songArtist || '');
          setSongInput(combined);
        }
        return newData;
      } else {
        setFormData(prev => ({ ...prev, ...updater }));
        // Update combined input field
        if (updater.songTitle || updater.songArtist) {
          const combined = formatCombinedDisplay(updater.songTitle || '', updater.songArtist || '');
          setSongInput(combined);
        }
      }
    });
    
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
    
    // Parse combined input to extract title and artist
    const parsed = parseCombinedSongInput(value);
    
    // Update bundle song with parsed values
    newSongs[bundleIndex] = {
      ...newSongs[bundleIndex],
      songTitle: parsed.title || '',
      songArtist: parsed.artist || ''
    };
    setBundleSongs(newSongs);
    
    // Update search query if this is the active bundle song (use title portion for search)
    if (activeBundleSongIndex === bundleIndex) {
      const searchQuery = parsed.title || value.split(/\s+[-–—byBY]\s+/)[0] || value;
      setBundleSongSearchQuery(searchQuery);
    }
    
    // Check if it's a URL
    const isUrl = detectUrl(value);
    
    if (isUrl) {
      // URL detected - trigger extraction
      const url = value.trim();
      // Clear the input field immediately (extraction will populate it)
      newSongs[bundleIndex] = { ...newSongs[bundleIndex], songTitle: '', songArtist: '' };
      setBundleSongs(newSongs);
      setBundleSongSearchQuery('');
      
      // Extract song info
      await extractBundleSongInfo(url, bundleIndex);
      return;
    }
    
    // Show autocomplete when typing (not URLs, not extracted, search on title portion)
    const titlePortion = parsed.title || value.split(/\s+[-–—byBY]\s+/)[0] || value;
    if (!isUrl && !bundleIsExtractedFromLink[bundleIndex] && titlePortion.trim().length >= 2) {
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
      // Clear both fields (extraction will populate them)
      newSongs[bundleIndex] = { ...newSongs[bundleIndex], songTitle: '', songArtist: '' };
      setBundleSongs(newSongs);
      
      await extractBundleSongInfo(url, bundleIndex);
    }
  };

  // Handle bundle song suggestion selection
  const handleBundleSuggestionSelect = (suggestion, bundleIndex) => {
    const newSongs = [...bundleSongs];
    // Store both title and artist (for submission)
    newSongs[bundleIndex] = {
      ...newSongs[bundleIndex],
      songTitle: suggestion.title,
      songArtist: suggestion.artist
    };
    setBundleSongs(newSongs);
    setBundleShowAutocomplete(prev => ({ ...prev, [bundleIndex]: false }));
    setBundleSelectedSuggestionIndex(prev => ({ ...prev, [bundleIndex]: -1 }));
    setBundleIsExtractedFromLink(prev => ({ ...prev, [bundleIndex]: false }));
    // Note: The combined display format will be handled by the input field's value prop using formatCombinedDisplay
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
    // Clear both fields
    newSongs[bundleIndex] = { ...newSongs[bundleIndex], songTitle: '', songArtist: '' };
    setBundleSongs(newSongs);
    setBundleIsExtractedFromLink(prev => ({ ...prev, [bundleIndex]: false }));
    setBundleExtractedSongUrls(prev => ({ ...prev, [bundleIndex]: '' }));
    setBundleExtractionErrors(prev => ({ ...prev, [bundleIndex]: null }));
    // Combined field will be cleared via the formatCombinedDisplay('', '') call
  };

  // Clear extraction state
  const handleClearExtraction = () => {
    setFormData(prev => ({ ...prev, songTitle: '', songArtist: '' }));
    setSongInput(''); // Clear combined input field
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

  // Sync combined input field when formData changes externally (e.g., from extraction)
  // Only sync if the change came from extraction or external source, not from user typing
  useEffect(() => {
    // If we have title and artist in formData but songInput is empty or different, sync it
    if (formData.songTitle || formData.songArtist) {
      const currentCombined = formatCombinedDisplay(formData.songTitle || '', formData.songArtist || '');
      const parsed = parseCombinedSongInput(songInput);
      
      // Only sync if:
      // 1. songInput is empty but we have formData, OR
      // 2. The parsed songInput doesn't match formData (external change like extraction)
      if (!songInput || (parsed.title !== formData.songTitle || parsed.artist !== formData.songArtist)) {
        // Only update if the change is significant (avoid sync loops)
        if (currentCombined && (currentCombined !== songInput || isExtractedFromLink)) {
          setSongInput(currentCombined);
        }
      }
    } else if (!formData.songTitle && !formData.songArtist && songInput) {
      // Clear songInput if formData is cleared
      const parsed = parseCombinedSongInput(songInput);
      if (!parsed.title && !parsed.artist) {
        // Only clear if parsed is also empty (avoid clearing when user is typing)
        // This handles clear extraction case
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.songTitle, formData.songArtist, isExtractedFromLink]); // Don't include songInput to avoid loop

  // getBaseAmount and getPaymentAmount are now provided by useCrowdRequestPayment hook
  // isSongSelectionComplete is now provided by useCrowdRequestValidation hook

  // Track previous extraction state to detect when extraction completes
  const prevExtractingSong = useRef(extractingSong);
  const hasAutoFocusedNameField = useRef(false); // Track if we've already auto-focused the name field
  
  // Auto-focus removed - requester name is now collected at payment step
  // No need to auto-focus since field is not on step 1 anymore
  
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
    logger.info('[handleSubmit] Form submission started', { currentStep, requestType, submitting });
    
    // Always prevent default form submission - we handle it manually
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // CRITICAL FIX: Prevent double submission - check FIRST before any other logic
    // This must be the very first check to prevent race conditions
    if (submitting) {
      logger.warn('[handleSubmit] Already submitting, ignoring duplicate call');
      return;
    }
    
    // CRITICAL FIX: Set submitting state IMMEDIATELY and SYNCHRONOUSLY
    // This prevents double-clicks and race conditions
    // Must be set before any async operations or validation
    setSubmitting(true);
    
    // Prevent submission if song requests are disabled
    if (requestType === 'song_request' && songRequestsDisabled) {
      logger.warn('[handleSubmit] Song requests are disabled, preventing submission');
      setError('Song requests are currently unavailable. Please use Shoutout or Tip instead.');
      setSubmitting(false); // Reset since we're not actually submitting
      return;
    }
    
    setError('');

    const isValid = validateForm();
    logger.info('[handleSubmit] Validation result', { isValid, requestType, formData: { 
      requesterName: formData.requesterName?.trim() || '', 
      songTitle: formData.songTitle?.trim() || '',
      songArtist: formData.songArtist?.trim() || '',
      recipientName: formData.recipientName?.trim() || '',
      recipientMessage: formData.recipientMessage?.trim() || ''
    }});
    
    if (!isValid) {
      logger.warn('[handleSubmit] Validation failed, showing error');
      // Reset submitting state since validation failed
      setSubmitting(false);
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
    
    logger.info('[handleSubmit] Validation passed, proceeding with submission');
    
    // Note: submitting state is already set above, no need to set it again

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
      } else {
        // In bidding mode, ensure a bid amount is selected
        if (!biddingSelectedAmount || biddingSelectedAmount <= 0) {
          throw new Error('Please select a bid amount');
        }

        // Validate bidding amount meets minimum requirements
        const minBid = dynamicMinimumAmount || 500;
        const winningBid = currentWinningBid || 0;
        if (biddingSelectedAmount < minBid) {
          throw new Error(`Minimum bid is $${(minBid / 100).toFixed(2)}`);
        }
        if (biddingSelectedAmount <= winningBid) {
          throw new Error(`Your bid must be greater than the current winning bid of $${(winningBid / 100).toFixed(2)}`);
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
        // Use placeholder "Guest" if name not provided - will be updated at payment step
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
                  // Use placeholder "Guest" if name not provided - will be updated at payment step
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
            // Use placeholder "Guest" if name not provided - will be updated at payment step
            requesterName: formData?.requesterName?.trim() || 'Guest',
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
            // Use placeholder "Guest" if name not provided - will be updated at payment step
            requesterName: formData?.requesterName?.trim() || 'Guest',
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
      console.error('[handleSubmit] Submission error:', err);
      logger.error('Submission error', err);
      const errorMessage = err?.message || err?.toString() || 'Failed to submit request. Please try again.';
      setError(errorMessage);
      setSubmitting(false);
      
      // Always scroll to error on mobile, and also on desktop if error element exists
      setTimeout(() => {
        const errorEl = document.querySelector('.bg-red-50, .bg-red-900, [class*="bg-red"]');
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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
  
  // Determine default OG image based on domain
  // Check both isTipJarDomain and organizationData for SSR compatibility
  const getDefaultOGImage = () => {
    const isTipJar = isTipJarDomain || organizationData?.product_context === 'tipjar';
    if (isTipJar) {
      // Use TipJar public requests OG image for TipJar public request pages
      // This is different from the general TipJar OG image to show it's a request page
      return 'https://tipjar.live/assets/tipjar-public-requests-og.png';
    } else if (typeof window !== 'undefined' && window.location.hostname.includes('djdash.net')) {
      // Use DJ Dash OG image for DJ Dash pages
      return 'https://djdash.net/assets/djdash-og-image.png';
    }
    // Default to M10 DJ Company cover photo
    return `${siteUrl}${DEFAULT_COVER_PHOTO}`;
  };
  
  // Convert cover photo to absolute URL if it's relative
  // For TipJar pages, always use TipJar OG image unless there's a truly custom cover photo
  // (not the default M10 DJ Company image)
  const getAbsoluteImageUrl = (imageUrl) => {
    // For TipJar domains, always use TipJar OG image unless there's a custom cover photo
    // that's not the default M10 DJ Company image
    // Check both isTipJarDomain and organizationData for SSR compatibility
    const isTipJar = isTipJarDomain || organizationData?.product_context === 'tipjar';
    if (isTipJar) {
      // If no cover photo or it's the M10 default, use TipJar OG image
      if (!imageUrl || 
          imageUrl === DEFAULT_COVER_PHOTO || 
          imageUrl.includes('DJ-Ben-Murray') ||
          imageUrl === `${siteUrl}${DEFAULT_COVER_PHOTO}` ||
          imageUrl.includes('m10djcompany.com')) {
        return 'https://tipjar.live/assets/tipjar-public-requests-og.png';
      }
      // If there's a custom cover photo, use it
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      // If it starts with /, it's a relative path
      if (imageUrl.startsWith('/')) {
        return `${siteUrl}${imageUrl}`;
      }
      // Otherwise, assume it's a relative path
      return `${siteUrl}/${imageUrl}`;
    }
    
    // For non-TipJar domains, use the standard logic
    if (!imageUrl) {
      // No cover photo - use domain-appropriate default OG image
      return getDefaultOGImage();
    }
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
  
  // Determine default page title based on domain and organization
  const getDefaultPageTitle = () => {
    const isTipJar = isTipJarDomain || organizationData?.product_context === 'tipjar';
    if (isTipJar) {
      // For TipJar pages, use "TipJar.Live | Display Name" format
      const displayName = organizationData?.requests_header_artist_name || organizationData?.name || 'Requests';
      return `TipJar.Live | ${displayName}`;
    } else {
      // For M10 DJ Company and other pages, use "Request a Song or Shoutout | Display Name" format
      const displayName = organizationData?.requests_header_artist_name || organizationData?.name || 'M10 DJ Company';
      return `Request a Song or Shoutout | ${displayName}`;
    }
  };
  
  // Use custom page title if set (and not empty), otherwise use default
  const pageTitle = (organizationData?.requests_page_title?.trim()) || getDefaultPageTitle();
  const pageDescription = organizationData?.requests_page_description || 
    (organizationData?.requests_header_artist_name 
      ? `Request a song or shoutout for ${organizationData.requests_header_artist_name}`
      : 'Request a song or shoutout for your event');
  const currentUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `${siteUrl}/requests`;

  // Map font names to Google Fonts links
  const getGoogleFontLink = (fontFamily) => {
    const fontMap = {
      '"Oswald", sans-serif': 'Oswald:wght@400;500;600;700',
      '"Montserrat", sans-serif': 'Montserrat:wght@400;500;600;700;800;900',
      '"Poppins", sans-serif': 'Poppins:wght@400;500;600;700;800;900',
      '"Roboto", sans-serif': 'Roboto:wght@400;500;700;900',
      '"Open Sans", sans-serif': 'Open+Sans:wght@400;600;700;800',
      '"Lato", sans-serif': 'Lato:wght@400;700;900',
      '"Nunito", sans-serif': 'Nunito:wght@400;600;700;800;900',
      '"Ubuntu", sans-serif': 'Ubuntu:wght@400;500;700',
      '"Source Sans Pro", sans-serif': 'Source+Sans+Pro:wght@400;600;700;900',
      '"Inter", sans-serif': 'Inter:wght@400;500;600;700;800;900',
      '"Work Sans", sans-serif': 'Work+Sans:wght@400;500;600;700;800;900',
      '"DM Sans", sans-serif': 'DM+Sans:wght@400;500;700',
      '"Space Grotesk", sans-serif': 'Space+Grotesk:wght@400;500;600;700',
      '"Bebas Neue", sans-serif': 'Bebas+Neue',
      '"Anton", sans-serif': 'Anton',
      '"Raleway", sans-serif': 'Raleway:wght@400;500;600;700;800;900',
      '"PT Sans", sans-serif': 'PT+Sans:wght@400;700',
      '"Josefin Sans", sans-serif': 'Josefin+Sans:wght@400;600;700',
      '"Libre Franklin", sans-serif': 'Libre+Franklin:wght@400;600;700;800;900',
      '"Quicksand", sans-serif': 'Quicksand:wght@400;500;600;700',
      '"Rubik", sans-serif': 'Rubik:wght@400;500;700;900',
      '"Fira Sans", sans-serif': 'Fira+Sans:wght@400;500;600;700;800;900',
      '"Manrope", sans-serif': 'Manrope:wght@400;500;600;700;800',
      '"Comfortaa", sans-serif': 'Comfortaa:wght@400;500;600;700',
      '"Kanit", sans-serif': 'Kanit:wght@400;500;600;700;800;900',
      '"Titillium Web", sans-serif': 'Titillium+Web:wght@400;600;700;900',
      '"Muli", sans-serif': 'Muli:wght@400;600;700;800;900',
      '"Exo 2", sans-serif': 'Exo+2:wght@400;500;600;700;800;900',
      '"Rajdhani", sans-serif': 'Rajdhani:wght@400;500;600;700',
      '"Orbitron", sans-serif': 'Orbitron:wght@400;500;600;700;800;900',
      '"Righteous", sans-serif': 'Righteous',
      '"Fredoka One", sans-serif': 'Fredoka+One',
      '"Bungee", sans-serif': 'Bungee',
      '"Russo One", sans-serif': 'Russo+One',
      '"Playfair Display", serif': 'Playfair+Display:wght@400;500;600;700;800;900',
      '"Lora", serif': 'Lora:wght@400;500;600;700',
      '"Merriweather", serif': 'Merriweather:wght@400;700;900',
      '"Libre Baskerville", serif': 'Libre+Baskerville:wght@400;700',
      '"Crimson Text", serif': 'Crimson+Text:wght@400;600;700',
      '"Georgia", serif': '', // System font, no Google Fonts link needed
      '"PT Serif", serif': 'PT+Serif:wght@400;700',
      '"Bitter", serif': 'Bitter:wght@400;700;900',
      '"Arvo", serif': 'Arvo:wght@400;700',
      '"Space Mono", monospace': 'Space+Mono:wght@400;700',
      '"Roboto Mono", monospace': 'Roboto+Mono:wght@400;500;700',
      '"Fira Code", monospace': 'Fira+Code:wght@400;500;600;700',
    };
    
    const selectedFont = fontFamily || effectiveArtistNameFont;
    const fontKey = Object.keys(fontMap).find(key => selectedFont.includes(key.replace(/"/g, '')));
    
    if (fontKey) {
      return `https://fonts.googleapis.com/css2?family=${fontMap[fontKey]}&display=swap`;
    }
    return null;
  };

  // Get Google Font links for both display name and subtitle
  const artistNameFontLink = getGoogleFontLink(effectiveArtistNameFont);
  const subtitleFontLink = getGoogleFontLink(effectiveSubtitleFont);
  // Combine unique font links
  const googleFontLinks = [artistNameFontLink, subtitleFontLink].filter((link, index, self) => link && self.indexOf(link) === index);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {googleFontLinks.length > 0 && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            {googleFontLinks.map((link, index) => (
              <link key={index} href={link} rel="stylesheet" />
            ))}
          </>
        )}
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
        <meta property="og:site_name" content={(isTipJarDomain || organizationData?.product_context === 'tipjar') ? (organizationData?.requests_header_artist_name || organizationData?.name || 'TipJar.Live') : (organizationName || 'M10 DJ Company')} />
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
          /* On desktop/tablet, keep header transparent even when scrolled */
          @media (min-width: 768px) {
            header[data-transparent="true"] {
              background-color: transparent !important;
              background: transparent !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              box-shadow: none !important;
              border: none !important;
              border-bottom: none !important;
            }
            /* Override any scroll-based background classes */
            header[data-transparent="true"].bg-white\\/80,
            header[data-transparent="true"].dark\\:bg-black\\/80 {
              background-color: transparent !important;
              background: transparent !important;
            }
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
      <style 
        dangerouslySetInnerHTML={{ 
          __html: `
            :root {
              --accent-color: ${effectiveAccentColor};
              --accent-color-hover: ${effectiveAccentColor}dd;
              --accent-color-light: ${effectiveAccentColor}20;
              --secondary-color-1: ${effectiveSecondaryColor1};
              --secondary-color-1-hover: ${effectiveSecondaryColor1}dd;
              --secondary-color-1-light: ${effectiveSecondaryColor1}20;
              --secondary-color-2: ${effectiveSecondaryColor2};
              --secondary-color-2-hover: ${effectiveSecondaryColor2}dd;
              --secondary-color-2-light: ${effectiveSecondaryColor2}20;
            }
            
            .bg-brand { background-color: var(--accent-color) !important; }
            .bg-\\[\\#fcba00\\] { background-color: var(--accent-color) !important; }
            .text-brand { color: var(--accent-color) !important; }
            .text-\\[\\#fcba00\\] { color: var(--accent-color) !important; }
            .border-brand { border-color: var(--secondary-color-1) !important; }
            .border-\\[\\#fcba00\\] { border-color: var(--secondary-color-1) !important; }
            .ring-brand { --tw-ring-color: var(--secondary-color-1) !important; }
            .ring-\\[\\#fcba00\\] { --tw-ring-color: var(--secondary-color-1) !important; }
            .focus\\:ring-brand:focus { --tw-ring-color: var(--secondary-color-1) !important; }
            .focus\\:ring-\\[\\#fcba00\\]:focus { --tw-ring-color: var(--secondary-color-1) !important; }
            .hover\\:bg-\\[\\#d99f00\\]:hover { background-color: var(--accent-color-hover) !important; }
            
            .from-\\[\\#fcba00\\] { --tw-gradient-from: var(--accent-color) !important; }
            .to-\\[\\#fcba00\\] { --tw-gradient-to: var(--accent-color) !important; }
            .via-\\[\\#fcba00\\] { --tw-gradient-via: var(--accent-color) !important; }
            
            /* Brand color variants - all mapped to accent color */
            .bg-brand-50 { background-color: ${effectiveAccentColor}10 !important; }
            .bg-brand-100 { background-color: ${effectiveAccentColor}20 !important; }
            .bg-brand-200 { background-color: ${effectiveAccentColor}30 !important; }
            .bg-brand-300 { background-color: ${effectiveAccentColor}50 !important; }
            .bg-brand-400 { background-color: ${effectiveAccentColor}80 !important; }
            .bg-brand-500 { background-color: var(--accent-color) !important; }
            .bg-brand-600 { background-color: var(--accent-color) !important; }
            .bg-brand-700 { background-color: var(--accent-color-hover) !important; }
            .bg-brand-800 { background-color: var(--accent-color-hover) !important; }
            .bg-brand-900 { background-color: ${effectiveAccentColor}ee !important; }
            
            .text-brand-300 { color: ${effectiveAccentColor}90 !important; }
            .text-brand-400 { color: ${effectiveAccentColor}bb !important; }
            .text-brand-500 { color: var(--accent-color) !important; }
            .text-brand-600 { color: var(--accent-color) !important; }
            .text-brand-700 { color: var(--accent-color-hover) !important; }
            .text-brand-800 { color: var(--accent-color-hover) !important; }
            
            .border-brand-200 { border-color: ${effectiveSecondaryColor1}30 !important; }
            .border-brand-300 { border-color: ${effectiveSecondaryColor1}50 !important; }
            .border-brand-500 { border-color: var(--secondary-color-1) !important; }
            .border-brand-600 { border-color: var(--secondary-color-1) !important; }
            .border-brand-700 { border-color: var(--secondary-color-1-hover) !important; }
            
            /* Border variants with opacity */
            .border-brand-200\\/50 { border-color: ${effectiveSecondaryColor1}80 !important; }
            .border-brand-300\\/50 { border-color: ${effectiveSecondaryColor1}80 !important; }
            .border-brand-700\\/30 { border-color: ${effectiveSecondaryColor1}4d !important; }
            
            /* Border variants without -200/-300/-700 suffix (used by request type buttons) */
            .border-brand\\/30 { border-color: ${effectiveSecondaryColor1}4d !important; }
            .border-brand\\/50 { border-color: ${effectiveSecondaryColor1}80 !important; }
            
            .ring-brand-500 { --tw-ring-color: var(--secondary-color-1) !important; }
            .focus\\:ring-brand-500:focus { --tw-ring-color: var(--secondary-color-1) !important; }
            .focus\\:border-brand-500:focus { border-color: var(--secondary-color-1) !important; }
            
            .shadow-brand-500\\/20 { --tw-shadow-color: ${effectiveSecondaryColor2}33 !important; }
            .shadow-brand-500\\/40 { --tw-shadow-color: ${effectiveSecondaryColor2}66 !important; }
            .shadow-brand-500\\/60 { --tw-shadow-color: ${effectiveSecondaryColor2}99 !important; }
            .focus\\:shadow-brand-500\\/20:focus { --tw-shadow-color: ${effectiveSecondaryColor2}33 !important; }
            
            /* Shadow variants without -500 suffix (used by request type buttons) */
            .shadow-brand\\/10 { --tw-shadow-color: ${effectiveSecondaryColor2}1a !important; }
            .shadow-brand\\/20 { --tw-shadow-color: ${effectiveSecondaryColor2}33 !important; }
            .shadow-brand\\/30 { --tw-shadow-color: ${effectiveSecondaryColor2}4d !important; }
            .shadow-brand\\/40 { --tw-shadow-color: ${effectiveSecondaryColor2}66 !important; }
            .shadow-brand\\/50 { --tw-shadow-color: ${effectiveSecondaryColor2}80 !important; }
            .shadow-brand\\/60 { --tw-shadow-color: ${effectiveSecondaryColor2}99 !important; }
            
            /* Gradient classes with brand colors */
            .from-brand-50 { --tw-gradient-from: ${effectiveAccentColor}10 !important; }
            .from-brand-100 { --tw-gradient-from: ${effectiveAccentColor}20 !important; }
            .from-brand-200 { --tw-gradient-from: ${effectiveAccentColor}30 !important; }
            .from-brand-500 { --tw-gradient-from: var(--accent-color) !important; }
            .from-brand-600 { --tw-gradient-from: var(--accent-color) !important; }
            .from-brand-700 { --tw-gradient-from: var(--accent-color-hover) !important; }
            .from-brand-800 { --tw-gradient-from: var(--accent-color-hover) !important; }
            .from-brand-900 { --tw-gradient-from: ${effectiveAccentColor}ee !important; }
            .via-brand-100 { --tw-gradient-via: ${effectiveAccentColor}20 !important; }
            .via-brand-500 { --tw-gradient-via: var(--accent-color) !important; }
            .via-brand-600 { --tw-gradient-via: var(--accent-color) !important; }
            .to-brand-200 { --tw-gradient-to: ${effectiveAccentColor}30 !important; }
            .to-brand-500 { --tw-gradient-to: var(--accent-color) !important; }
            .to-brand-600 { --tw-gradient-to: var(--accent-color) !important; }
            .to-brand-700 { --tw-gradient-to: var(--accent-color-hover) !important; }
            
            /* Gradient variants with opacity */
            .from-brand-50\\/50 { --tw-gradient-from: ${effectiveAccentColor}80 !important; }
            .from-brand-100\\/50 { --tw-gradient-from: ${effectiveAccentColor}80 !important; }
            .from-brand-200\\/30 { --tw-gradient-from: ${effectiveAccentColor}4d !important; }
            .from-brand-800\\/20 { --tw-gradient-from: ${effectiveAccentColor}33 !important; }
            .from-brand-900\\/20 { --tw-gradient-from: ${effectiveAccentColor}33 !important; }
            .via-brand-100\\/50 { --tw-gradient-via: ${effectiveAccentColor}80 !important; }
            .to-brand-200\\/30 { --tw-gradient-to: ${effectiveAccentColor}4d !important; }
            .to-brand-700\\/20 { --tw-gradient-to: ${effectiveAccentColor}33 !important; }
            
            /* Hover variants */
            .hover\\:bg-brand:hover { background-color: var(--accent-color-hover) !important; }
            .hover\\:bg-brand-500:hover { background-color: var(--accent-color-hover) !important; }
            .hover\\:bg-brand-600:hover { background-color: var(--accent-color-hover) !important; }
            .hover\\:bg-brand-700:hover { background-color: var(--accent-color) !important; }
            .hover\\:text-brand:hover { color: var(--accent-color-hover) !important; }
            .hover\\:border-brand:hover { border-color: var(--secondary-color-1) !important; }
            .hover\\:border-brand\\/50:hover { border-color: ${effectiveSecondaryColor1}80 !important; }
            .hover\\:shadow-brand-500\\/60:hover { --tw-shadow-color: ${effectiveSecondaryColor2}99 !important; }
            
            .hover\\:from-brand-500:hover { --tw-gradient-from: var(--accent-color) !important; }
            .hover\\:from-brand-600:hover { --tw-gradient-from: var(--accent-color) !important; }
            .hover\\:via-brand-400:hover { --tw-gradient-via: ${effectiveAccentColor}cc !important; }
            .hover\\:to-brand-600:hover { --tw-gradient-to: var(--accent-color) !important; }
            
            /* Background highlights - use secondary color 2 for subtle highlights */
            .bg-brand\\/5 { background-color: ${effectiveSecondaryColor2}0d !important; }
            .bg-brand\\/10 { background-color: ${effectiveSecondaryColor2}1a !important; }
            .bg-brand\\/20 { background-color: ${effectiveSecondaryColor2}33 !important; }
            .bg-brand\\/30 { background-color: ${effectiveSecondaryColor2}4d !important; }
            .bg-brand\\/50 { background-color: ${effectiveSecondaryColor2}80 !important; }
            .bg-brand\\/90 { background-color: ${effectiveSecondaryColor2}e6 !important; }
            .group-hover\\:bg-brand\\/10 { background-color: ${effectiveSecondaryColor2}1a !important; }
            .group-hover\\:text-brand { color: var(--accent-color) !important; }
            
            /* File input styling */
            .file\\:bg-brand-600::file-selector-button { background-color: var(--accent-color) !important; }
            .file\\:bg-brand-700::file-selector-button { background-color: var(--accent-color-hover) !important; }
            .hover\\:file\\:bg-brand-700:hover::file-selector-button { background-color: var(--accent-color-hover) !important; }
            .hover\\:file\\:bg-brand-600:hover::file-selector-button { background-color: var(--accent-color) !important; }
            
            /* Animated gradient background */
            @keyframes gradient-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            
            @keyframes pulse-glow {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 0.9; }
            }
            
            .animated-gradient-bg {
              background: linear-gradient(
                135deg,
                ${effectiveAccentColor}22 0%,
                ${effectiveAccentColor}44 25%,
                #000 50%,
                ${effectiveAccentColor}33 75%,
                ${effectiveAccentColor}22 100%
              );
              background-size: 400% 400%;
              animation: gradient-shift 15s ease infinite;
            }
            
            .animated-gradient-bg::before {
              content: '';
              position: absolute;
              inset: 0;
              background: radial-gradient(
                ellipse at 30% 20%,
                ${effectiveAccentColor}30 0%,
                transparent 50%
              );
              animation: pulse-glow 4s ease-in-out infinite;
            }
            
            .animated-gradient-bg::after {
              content: '';
              position: absolute;
              inset: 0;
              background: radial-gradient(
                ellipse at 70% 80%,
                ${effectiveAccentColor}25 0%,
                transparent 45%
              );
              animation: pulse-glow 4s ease-in-out infinite 2s;
            }
            
            /* Button styles */
            ${effectiveButtonStyle === 'flat' ? `
              .requests-page-container .btn-primary,
              .requests-page-container button[type="submit"],
              .requests-page-container .bg-gradient-to-r {
                background: var(--accent-color) !important;
                background-image: none !important;
                box-shadow: none !important;
              }
              .requests-page-container .btn-primary:hover,
              .requests-page-container button[type="submit"]:hover {
                background: var(--accent-color-hover) !important;
                filter: brightness(0.9);
              }
            ` : `
              .requests-page-container .btn-primary,
              .requests-page-container button[type="submit"] {
                background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-color-hover) 50%, ${effectiveAccentColor}99 100%) !important;
                box-shadow: 0 4px 14px ${effectiveSecondaryColor2}40 !important;
              }
              .requests-page-container .btn-primary:hover,
              .requests-page-container button[type="submit"]:hover {
                box-shadow: 0 6px 20px ${effectiveSecondaryColor2}60 !important;
                transform: translateY(-1px);
              }
            `}
            
            /* Remove any focus rings or borders from submit/continue payment buttons only */
            .requests-page-container button[type="submit"]:focus-visible,
            .requests-page-container button[type="submit"]:focus,
            .requests-page-container button.group.relative.w-full:focus-visible,
            .requests-page-container button.group.relative.w-full:focus {
              outline: none !important;
              border: none !important;
            }
            
            ${effectiveThemeMode === 'light' ? `
              .requests-page-container, .requests-page-container * { color-scheme: light; }
              .requests-page-container { background-color: white !important; }
              @media (min-width: 768px) {
                .requests-page-container { background-color: transparent !important; }
              }
              .requests-page-container .dark\\:bg-black { background-color: transparent !important; }
              .requests-page-container input[data-dark-bg="black"],
              .requests-page-container textarea[data-dark-bg="black"] {
                background-color: #000000 !important;
              }
              .requests-page-container .dark\\:from-black { --tw-gradient-from: rgb(249, 250, 251) !important; }
              .requests-page-container .dark\\:via-black { --tw-gradient-via: rgb(249, 250, 251) !important; }
              .requests-page-container .dark\\:to-black { --tw-gradient-to: rgb(249, 250, 251) !important; }
              .requests-page-container .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
              .requests-page-container .bg-white { background-color: white !important; }
              .requests-page-container .bg-white\\/80 { background-color: rgba(255, 255, 255, 0.8) !important; }
              .requests-page-container .from-gray-50 { --tw-gradient-from: rgb(249, 250, 251) !important; }
              .requests-page-container .via-brand\\/5 { --tw-gradient-via: rgba(252, 186, 0, 0.05) !important; }
              .requests-page-container .to-gray-50 { --tw-gradient-to: rgb(249, 250, 251) !important; }
              .requests-page-container .dark\\:bg-gray-900 { background-color: rgb(249, 250, 251) !important; }
              .requests-page-container .dark\\:bg-gray-800 { background-color: white !important; }
              .requests-page-container .dark\\:bg-black\\/80 { background-color: rgba(255, 255, 255, 0.8) !important; }
              .requests-page-container .dark\\:text-white { color: rgb(17, 24, 39) !important; }
              .requests-page-container .dark\\:text-gray-100 { color: rgb(31, 41, 55) !important; }
              .requests-page-container .dark\\:text-gray-200 { color: rgb(55, 65, 81) !important; }
              .requests-page-container .dark\\:text-gray-300 { color: rgb(75, 85, 99) !important; }
              .requests-page-container .dark\\:text-gray-400 { color: rgb(107, 114, 128) !important; }
              .requests-page-container .text-gray-900 { color: rgb(17, 24, 39) !important; }
              .requests-page-container .text-gray-800 { color: rgb(31, 41, 55) !important; }
              .requests-page-container .text-gray-700 { color: rgb(55, 65, 81) !important; }
              .requests-page-container .text-gray-600 { color: rgb(75, 85, 99) !important; }
              .requests-page-container .text-gray-500 { color: rgb(107, 114, 128) !important; }
              .requests-page-container .border-gray-200 { border-color: rgb(229, 231, 235) !important; }
              .requests-page-container .border-gray-300 { border-color: rgb(209, 213, 219) !important; }
              .requests-page-container .dark\\:border-gray-700 { border-color: rgb(229, 231, 235) !important; }
              .requests-page-container .dark\\:border-gray-800 { border-color: rgb(229, 231, 235) !important; }
            ` : ''}
            ${effectiveThemeMode === 'dark' ? `
              .requests-page-container, .requests-page-container * { color-scheme: dark; }
              .requests-page-container { background-color: black !important; }
              @media (min-width: 768px) {
                .requests-page-container { background-color: transparent !important; }
              }
              .requests-page-container .bg-gray-50 { background-color: rgb(17, 24, 39) !important; }
              .requests-page-container .bg-white { background-color: rgb(31, 41, 55) !important; }
              .requests-page-container input[data-dark-bg="black"],
              .requests-page-container textarea[data-dark-bg="black"] {
                background-color: #000000 !important;
              }
              .requests-page-container .bg-white\\/80 { background-color: rgba(0, 0, 0, 0.8) !important; }
              .requests-page-container .from-gray-50 { --tw-gradient-from: black !important; }
              .requests-page-container .via-brand\\/5 { --tw-gradient-via: black !important; }
              .requests-page-container .to-gray-50 { --tw-gradient-to: black !important; }
              .requests-page-container .text-gray-900 { color: white !important; }
              .requests-page-container .text-gray-800 { color: rgb(243, 244, 246) !important; }
              .requests-page-container .text-gray-700 { color: rgb(209, 213, 219) !important; }
              .requests-page-container .text-gray-600 { color: rgb(156, 163, 175) !important; }
              .requests-page-container .text-gray-500 { color: rgb(156, 163, 175) !important; }
              .requests-page-container .border-gray-200 { border-color: rgb(55, 65, 81) !important; }
              .requests-page-container .border-gray-300 { border-color: rgb(55, 65, 81) !important; }
            ` : ''}
          ` 
        }} 
      />

      <div 
        className={`requests-page-container min-h-screen relative overflow-x-hidden md:flex ${
          effectiveThemeMode === 'dark' 
            ? 'bg-gradient-to-br from-black via-black to-black force-dark'
            : effectiveThemeMode === 'light'
            ? 'bg-gradient-to-br from-gray-50 via-brand/5 to-gray-50 force-light'
            : 'bg-gradient-to-br from-gray-50 via-brand/5 to-gray-50 dark:from-black dark:via-black dark:to-black'
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' },
          '--accent-color': effectiveAccentColor,
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
          <div className="hidden md:block desktop-video-sidebar md:fixed md:left-0 md:top-0 md:w-[400px] lg:w-[450px] xl:w-[500px] md:h-screen md:overflow-hidden bg-black z-40">
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
                preload="metadata"
                poster={coverPhoto}
                style={{ objectPosition: 'center 35%' }}
                onLoadStart={() => {
                  // Clear timeout when video starts loading
                  if (desktopVideoTimeoutRef.current) {
                    clearTimeout(desktopVideoTimeoutRef.current);
                    desktopVideoTimeoutRef.current = null;
                  }
                }}
                onCanPlay={() => {
                  // Clear timeout when video can play
                  if (desktopVideoTimeoutRef.current) {
                    clearTimeout(desktopVideoTimeoutRef.current);
                    desktopVideoTimeoutRef.current = null;
                  }
                }}
                onLoadedData={() => {
                  if (desktopVideoRef.current) {
                    desktopVideoRef.current.play().catch((error) => {
                      console.warn('⚠️ [VIDEO] Desktop video autoplay failed:', error);
                      setVideoFailed(true);
                    });
                  }
                }}
                onError={(e) => {
                  console.error('❌ [VIDEO] Desktop video error:', e);
                  setVideoFailed(true);
                }}
                onStalled={() => {
                  console.warn('⚠️ [VIDEO] Desktop video stalled, may be loading slowly');
                }}
              >
                <source src={headerVideoUrl} type="video/mp4" />
                <p className="text-white text-center p-4">Video unavailable</p>
              </video>
            ) : (showVideo && videoFailed && coverPhoto) ? (
              // Show poster image as fallback when video fails
              <img
                src={coverPhoto}
                alt="Header background"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: 'center 35%' }}
                onError={(e) => {
                  console.warn('⚠️ [VIDEO] Poster image also failed to load');
                  // Fall through to animated gradient
                }}
              />
            ) : showAnimatedGradient ? (
              backgroundType === 'smoke' ? (
                /* Smoke animation background */
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
                  {typeof window !== 'undefined' && (() => {
                    // Dynamic import to avoid SSR issues
                    try {
                      const Smoke = require('@/components/ui/shadcn-io/smoke').default;
                      return (
                        <Smoke
                          density={75}
                          color="#cccccc"
                          opacity={0.7}
                          enableRotation={true}
                          enableWind={true}
                          windStrength={[0.02, 0.01, 0.01]}
                          enableTurbulence={true}
                          turbulenceStrength={[0.02, 0.02, 0.01]}
                        />
                      );
                    } catch (e) {
                      console.warn('Smoke component not available:', e);
                      return null;
                    }
                  })()}
                </div>
              ) : backgroundType === 'smooth-spiral' ? (
                /* Smooth Spiral animation background */
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
                  {typeof window !== 'undefined' && (() => {
                    // Dynamic import to avoid SSR issues
                    try {
                      const PsychedelicSpiral = require('@/components/ui/shadcn-io/psychedelic-spiral').default;
                      return (
                        <PsychedelicSpiral
                          spinRotation={-2.0}
                          spinSpeed={7.0}
                          offset={[0.0, 0.0]}
                          color1="#871d87"
                          color2="#b2dfdf"
                          color3="#0c204e"
                          contrast={3.5}
                          lighting={0.4}
                          spinAmount={0.25}
                          pixelFilter={745.0}
                          spinEase={1.0}
                          isRotate={true}
                        />
                      );
                    } catch (e) {
                      console.warn('PsychedelicSpiral component not available:', e);
                      return null;
                    }
                  })()}
                </div>
              ) : backgroundType === 'vortex' ? (
                /* Vortex animation background */
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
                  {typeof window !== 'undefined' && (() => {
                    try {
                      const Vortex = require('@/components/ui/shadcn-io/vortex').default;
                      return (
                        <Vortex
                          backgroundColor="black"
                          rangeY={800}
                          particleCount={500}
                          baseHue={120}
                        />
                      );
                    } catch (e) {
                      console.warn('Vortex component not available:', e);
                      return null;
                    }
                  })()}
                </div>
              ) : backgroundType === 'fireflies' ? (
                /* Fireflies animation background */
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black" style={{ zIndex: 0 }}>
                  {typeof window !== 'undefined' && (() => {
                    try {
                      const Fireflies = require('@/components/ui/shadcn-io/fireflies').default;
                      return (
                        <Fireflies
                          count={50}
                          speed={0.5}
                          size={2}
                          color={effectiveAccentColor}
                          backgroundColor="black"
                        />
                      );
                    } catch (e) {
                      console.warn('Fireflies component not available:', e);
                      return null;
                    }
                  })()}
                </div>
              ) : backgroundType === 'wavy' ? (
                /* Wavy animation background */
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black" style={{ zIndex: 0 }}>
                  {typeof window !== 'undefined' && (() => {
                    try {
                      const WavyBackground = require('@/components/ui/shadcn-io/wavy-background').default;
                      // Get wavy configuration from URL params or organization data
                      const wavyColorsParam = router.query.wavyColors;
                      const wavyColors = wavyColorsParam ? JSON.parse(wavyColorsParam) : (organizationData?.requests_wavy_colors || [effectiveAccentColor, effectiveSecondaryColor1 || effectiveAccentColor, effectiveSecondaryColor2 || effectiveAccentColor]);
                      const wavyWaveWidth = router.query.wavyWaveWidth ? Number(router.query.wavyWaveWidth) : (organizationData?.requests_wavy_wave_width || 50);
                      const wavyBackgroundFill = router.query.wavyBackgroundFill || organizationData?.requests_wavy_background_fill || 'black';
                      const wavyBlur = router.query.wavyBlur ? Number(router.query.wavyBlur) : (organizationData?.requests_wavy_blur || 10);
                      const wavySpeed = router.query.wavySpeed || organizationData?.requests_wavy_speed || 'fast';
                      const wavyWaveOpacity = router.query.wavyWaveOpacity ? Number(router.query.wavyWaveOpacity) : (organizationData?.requests_wavy_wave_opacity || 0.5);
                      
                      return (
                        <WavyBackground
                          backgroundFill={wavyBackgroundFill}
                          colors={wavyColors.length >= 2 ? wavyColors : [effectiveAccentColor, effectiveSecondaryColor1 || effectiveAccentColor, effectiveSecondaryColor2 || effectiveAccentColor]}
                          waveWidth={wavyWaveWidth}
                          blur={wavyBlur}
                          speed={wavySpeed}
                          waveOpacity={wavyWaveOpacity}
                        />
                      );
                    } catch (e) {
                      console.warn('WavyBackground component not available:', e);
                      return null;
                    }
                  })()}
                </div>
              ) : (
                /* Animated gradient with artist name - Default TipJar background */
                <div className="absolute inset-0 w-full h-full animated-gradient-bg overflow-hidden">
                  {/* Artist name as centered watermark */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="text-white/[0.08] text-[12rem] font-black tracking-wider select-none pointer-events-none"
                      style={{
                        fontFamily: effectiveArtistNameFont,
                        textTransform: effectiveArtistNameTextTransform,
                        color: effectiveArtistNameColor,
                        letterSpacing: `${effectiveArtistNameKerning}px`,
                        textShadow: artistNameTextShadow,
                        transform: 'rotate(-12deg) scale(1.5)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {(() => {
                        const artistName = organizationData?.requests_header_artist_name || organizationData?.name || 'TipJar';
                        
                        // Apply text transform
                        if (effectiveArtistNameTextTransform === 'uppercase') {
                          return artistName.toUpperCase();
                        } else if (effectiveArtistNameTextTransform === 'lowercase') {
                          return artistName.toLowerCase();
                        }
                        return artistName; // Normal case
                      })()}
                    </div>
                  </div>
                </div>
              )
            ) : showSolidBackground ? (
              /* Custom background color or gradient when animation is disabled and no custom media */
              effectiveHeaderBackgroundType === 'gradient' ? (
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${effectiveHeaderBackgroundGradientStart} 0%, ${effectiveHeaderBackgroundGradientEnd} 100%)`
                  }}
                />
              ) : (
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{ backgroundColor: effectiveHeaderBackgroundColor }}
                />
              )
            ) : coverPhoto ? (
              /* Custom cover photo */
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${coverPhoto})` }}
              />
            ) : (
              /* No background - transparent/black fallback */
              <div className="absolute inset-0 w-full h-full bg-black" />
            )}
            {/* Subtle gradient overlay on right edge for seamless blend */}
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/40 to-transparent pointer-events-none z-10"></div>
            
            {/* Gradient overlay at bottom for social links */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black via-black/30 to-transparent z-20 pointer-events-none"></div>
            
            {/* Social Links at bottom of video sidebar */}
            {((previewSocialLinks && previewSocialLinks.length > 0) || (organizationData?.social_links && Array.isArray(organizationData.social_links) && organizationData.social_links.length > 0)) && (
              <div className="absolute bottom-0.5 left-0 right-0 flex items-center justify-center gap-3 z-30">
                {(previewSocialLinks || organizationData?.social_links || [])
                  .filter(link => link.enabled !== false)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((link, index) => {
                    const getSocialIcon = (platform) => {
                      const iconProps = { className: "w-4 h-4", strokeWidth: 1.5, fill: "none" };
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
                    
                    // Only use account selector for M10 domains/organizations
                    // For TipJar users, use the actual URL from social_links directly
                    if (isSelectable && allowSocialAccountSelector) {
                      return (
                        <button
                          key={`desktop-social-${index}`}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSocialClick(e, platform);
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:text-white hover:bg-white/25 transition-all cursor-pointer border border-white/20 p-0"
                          aria-label={link.label || link.platform}
                        >
                          {getSocialIcon(link.platform)}
                        </button>
                      );
                    }
                    
                    // For TipJar users or non-selectable platforms, use direct link
                    return (
                      <a
                        key={`desktop-social-${index}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white hover:text-white hover:bg-white/25 transition-all border border-white/20"
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
        
        {/* Main Content Area - Centered on desktop with animated background */}
        <div className="flex-1 min-w-0 relative desktop-content-wrapper">
          {/* Header - Inside content wrapper so it appears in iPhone frame on desktop */}
          {!embedMode && !showPaymentMethods && !minimalHeader && (
            <>
              <style jsx global>{`
                /* Override Header positioning on desktop for requests page */
                @media (min-width: 768px) {
                  /* Position header inside iPhone frame - properly constrained and visible */
                  /* Account for phone frame border (10px) + notch area (~50px) to prevent overflow */
                  .desktop-content-wrapper [data-requests-header-wrapper] {
                    position: absolute !important;
                    width: 100% !important;
                    max-width: 359px !important;
                    left: 0 !important;
                    right: 0 !important;
                    top: 0 !important;
                    z-index: 20 !important;
                    overflow: hidden !important; /* Prevent content from overflowing outside phone frame */
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    padding-top: 3.5rem !important; /* Add top padding to account for phone frame border + notch (approx 50px + border) */
                    min-height: auto !important;
                    max-height: 5rem !important; /* Constrain header wrapper height */
                  }
                  /* Override ALL header positioning - force it to be relative and visible */
                  .desktop-content-wrapper [data-requests-header-wrapper] header,
                  .desktop-content-wrapper [data-requests-header-wrapper] header[data-transparent],
                  .desktop-content-wrapper header,
                  header.fixed,
                  header[data-transparent] {
                    position: relative !important;
                    width: 100% !important;
                    max-width: 359px !important;
                    left: auto !important;
                    right: auto !important;
                    top: auto !important;
                    bottom: auto !important;
                    transform: none !important;
                    scale: 1 !important;
                    padding: 0.25rem 1rem 0.25rem 1rem !important; /* Minimal padding to prevent overflow */
                    margin: 0 !important;
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    background: transparent !important;
                    z-index: 20 !important;
                    height: auto !important;
                    min-height: auto !important;
                    max-height: 4rem !important; /* Constrain header height to prevent overflow */
                    overflow: hidden !important; /* Prevent content from overflowing */
                    align-items: center !important; /* Center align content vertically */
                  }
                  /* Override the fixed positioning that Header component applies */
                  .desktop-content-wrapper header.fixed,
                  .desktop-content-wrapper [data-requests-header-wrapper] header.fixed {
                    position: relative !important;
                    top: auto !important;
                  }
                  /* Ensure logo and header elements are properly sized - CRITICAL - override all logo sizes */
                  .desktop-content-wrapper [data-requests-header-wrapper] header img,
                  .desktop-content-wrapper [data-requests-header-wrapper] header svg,
                  .desktop-content-wrapper [data-requests-header-wrapper] header a img,
                  .desktop-content-wrapper [data-requests-header-wrapper] header a > div > img,
                  .desktop-content-wrapper [data-requests-header-wrapper] header a > div > svg,
                  .desktop-content-wrapper header img,
                  .desktop-content-wrapper header svg,
                  .desktop-content-wrapper header a img {
                    max-width: 100px !important;
                    width: auto !important;
                    height: auto !important;
                    max-height: 32px !important;
                    min-width: unset !important;
                    min-height: unset !important;
                    object-fit: contain !important;
                    transform: none !important;
                    scale: 1 !important;
                    flex-shrink: 1 !important;
                  }
                  
                  /* Ensure all header text and content is constrained within bounds */
                  .desktop-content-wrapper [data-requests-header-wrapper] header *,
                  .desktop-content-wrapper header * {
                    max-height: 100% !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                  }
                  /* Constrain the logo container div */
                  .desktop-content-wrapper [data-requests-header-wrapper] header a > div,
                  .desktop-content-wrapper header a > div {
                    max-width: 100px !important;
                    max-height: 32px !important;
                    width: auto !important;
                    height: auto !important;
                  }
                  .desktop-content-wrapper [data-requests-header-wrapper] header *,
                  .desktop-content-wrapper header * {
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                    transform: none !important;
                  }
                  .desktop-content-wrapper [data-requests-header-wrapper] header a,
                  .desktop-content-wrapper header a {
                    display: inline-flex !important;
                    max-width: 100px !important;
                    align-items: center !important;
                    justify-content: flex-start !important;
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
                  socialLinks={previewSocialLinks || organizationData?.social_links} 
                  isOwner={isOwner} 
                  organizationSlug={organizationData?.slug} 
                  organizationId={organizationId}
                  hideM10Logo={organizationData?.requests_hide_m10_logo === true}
                  m10LogoHeightMobile={organizationData?.requests_m10_logo_height_mobile || 54}
                  m10LogoHeightDesktop={organizationData?.requests_m10_logo_height_desktop || 68}
                  m10LogoMinWidthMobile={organizationData?.requests_m10_logo_min_width_mobile || 120}
                  m10LogoMinWidthDesktop={organizationData?.requests_m10_logo_min_width_desktop || 150}
                  m10LogoPosition={organizationData?.requests_m10_logo_position || 'left'}
                  companyLogoUrl={organizationData?.requests_company_logo_url || null}
                />
              </div>
            </>
          )}
          {/* Desktop Animated Background and Centered Layout with Floating iPhone Frame */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes gradientShiftDesktop {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @media (min-width: 768px) {
              /* Hide video sidebar on desktop */
              .desktop-video-sidebar {
                display: none !important;
              }
              
              /* Animated gradient background applied directly to iPhone frame container */
              /* This creates the animated background behind the floating iPhone - separate from header gradient */
              .desktop-iphone-frame-container.desktop-preview-bg {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                z-index: -1 !important;
              }
              /* Ensure html and body allow gradient to show through - WHITE BACKGROUND FOR DEBUGGING */
              html {
                background: #ffffff !important;
                background-color: #ffffff !important;
              }
              body {
                background: #ffffff !important;
                background-color: #ffffff !important;
                overflow-x: hidden !important;
              }
              /* Make sure nothing covers the gradient background */
              #__next {
                background: #ffffff !important;
                background-color: #ffffff !important;
                position: relative !important;
                z-index: 1 !important;
              }
              /* Ensure requests page container doesn't block gradient */
              .requests-page-container {
                background: transparent !important;
              }
              
              /* Subtle glow effect behind phone - removed */
              .desktop-phone-glow {
                display: none !important;
              }
              
              /* Make animated gradient background full screen on desktop */
              .animated-gradient-bg {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 0 !important;
              }
              
              /* Ensure container background is transparent so gradient animation shows through */
              .requests-page-container {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
                position: relative !important;
                z-index: 1 !important;
                overflow: visible !important;
              }
              
              /* Override all background gradients and colors on desktop - make transparent */
              .requests-page-container.bg-gradient-to-br,
              .requests-page-container[class*="bg-gradient"],
              .requests-page-container[class*="from-"],
              .requests-page-container[class*="via-"],
              .requests-page-container[class*="to-"] {
                background: transparent !important;
                background-color: transparent !important;
                background-image: none !important;
              }
              
              /* Ensure body background is clean */
              body {
                background: #ffffff !important;
                background-color: #ffffff !important;
              }
              
              /* iPhone frame wrapper - centered and floating - creates stacking context */
              .desktop-iphone-frame-wrapper {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) scale(1) !important;
                z-index: 15 !important;
                animation: float 3s ease-in-out infinite !important;
                width: 375px !important;
                height: 812px !important;
                max-width: min(375px, 90vw) !important;
                max-height: min(812px, 90vh) !important;
                pointer-events: none !important;
                isolation: isolate !important;
                transform-origin: center center !important;
              }
              
              /* Scale down frame proportionally on smaller desktop windows */
              @media (max-height: 900px) {
                .desktop-iphone-frame-wrapper {
                  transform: translate(-50%, -50%) scale(0.85) !important;
                }
              }
              
              @media (max-height: 800px) {
                .desktop-iphone-frame-wrapper {
                  transform: translate(-50%, -50%) scale(0.75) !important;
                }
              }
              
              @media (max-height: 700px) {
                .desktop-iphone-frame-wrapper {
                  transform: translate(-50%, -50%) scale(0.65) !important;
                }
              }
              
              @media (max-width: 1200px) and (max-height: 1000px) {
                .desktop-iphone-frame-wrapper {
                  transform: translate(-50%, -50%) scale(0.9) !important;
                }
              }
              
              /* iPhone frame styling - realistic iPhone appearance with metallic finish */
              .desktop-iphone-frame {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%) !important;
                border-radius: 47px !important;
                padding: 10px !important;
                box-shadow: 
                  0 30px 100px rgba(0, 0, 0, 0.7),
                  0 15px 40px rgba(0, 0, 0, 0.5),
                  0 0 0 0.5px rgba(255, 255, 255, 0.08) inset,
                  0 0 40px rgba(0, 0, 0, 0.4),
                  0 2px 4px rgba(0, 0, 0, 0.3) inset !important;
                border: 5px solid #1f1f1f !important;
                pointer-events: none !important;
                z-index: 1 !important;
              }
              
              /* iPhone screen content area - hidden */
              .desktop-iphone-content {
                display: none !important;
              }
              
              /* Position content wrapper inside iPhone frame on desktop - properly constrained */
              .requests-page-container > div.desktop-content-wrapper {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) scale(1) !important;
                width: 355px !important;
                max-width: 355px !important;
                height: 792px !important;
                max-height: 792px !important;
                z-index: 14 !important;
                background: #000000 !important;
                border-radius: 37px !important;
                overflow-x: hidden !important;
                overflow-y: hidden !important;
                -webkit-overflow-scrolling: touch !important;
                pointer-events: auto !important;
                box-shadow: 
                  0 0 0 1px rgba(255, 255, 255, 0.1) inset,
                  0 0 30px rgba(0, 0, 0, 0.8) inset !important;
                margin: 0 !important;
                padding: 0 !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                animation: none !important;
                display: flex !important;
                flex-direction: column !important;
                transform-origin: center center !important;
              }
              
              /* Scale down content wrapper proportionally on smaller desktop windows */
              @media (max-height: 900px) {
                .requests-page-container > div.desktop-content-wrapper {
                  transform: translate(-50%, -50%) scale(0.85) !important;
                }
              }
              
              @media (max-height: 800px) {
                .requests-page-container > div.desktop-content-wrapper {
                  transform: translate(-50%, -50%) scale(0.75) !important;
                }
              }
              
              @media (max-height: 700px) {
                .requests-page-container > div.desktop-content-wrapper {
                  transform: translate(-50%, -50%) scale(0.65) !important;
                }
              }
              
              @media (max-width: 1200px) and (max-height: 1000px) {
                .requests-page-container > div.desktop-content-wrapper {
                  transform: translate(-50%, -50%) scale(0.9) !important;
                }
              }
              
              /* Make main content area fit within frame without scrolling */
              .desktop-content-wrapper > main {
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                min-height: 0 !important;
                max-height: 100% !important;
                height: 100% !important;
              }
              
              /* Reduce padding on desktop to fit content - match mobile exactly */
              .desktop-content-wrapper > main.section-container {
                padding-top: 0.75rem !important;
                padding-bottom: 0.75rem !important;
                padding-left: 0.75rem !important;
                padding-right: 0.75rem !important;
              }
              
              /* Ensure form container fits within viewport */
              .desktop-content-wrapper > main > div {
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                overflow: hidden !important;
                min-height: 0 !important;
                max-height: 100% !important;
                height: 100% !important;
              }
              
              /* Make form scrollable if needed, but within the frame */
              .desktop-content-wrapper form {
                flex: 1 !important;
                display: flex !important;
                flex-direction: column !important;
                overflow-y: auto !important;
                overflow-x: hidden !important;
                min-height: 0 !important;
                max-height: 100% !important;
                -webkit-overflow-scrolling: touch !important;
              }
              
              /* Reduce hero section height on desktop to fit in frame */
              .desktop-content-wrapper > div[class*="relative w-full"]:not([data-requests-header-wrapper]) {
                max-height: 140px !important;
                height: 140px !important;
                min-height: 140px !important;
              }
              
              /* Ensure step indicator is compact on desktop */
              .desktop-content-wrapper .text-center.mb-1 {
                margin-bottom: 0.25rem !important;
              }
              
              /* Match mobile spacing exactly - no special desktop overrides */
              /* Let the natural mobile spacing flow through */
              
              /* Ensure sticky elements inside desktop-content-wrapper stick to the bottom */
              .desktop-content-wrapper .sticky {
                position: sticky !important;
                bottom: 0 !important;
                margin-top: auto !important;
              }
              
              /* Winning bid banner - ensure it stays at bottom of iPhone frame on desktop */
              .desktop-content-wrapper [class*="sticky"][class*="bottom-0"] {
                position: sticky !important;
                bottom: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                left: 0 !important;
                right: 0 !important;
                margin-left: 0 !important;
                margin-right: 0 !important;
              }
              
              /* Reset scroll position to top on desktop */
              .desktop-content-wrapper {
                scroll-padding-top: 0 !important;
              }
              /* Ensure all content inside wrapper is visible and properly positioned */
              .desktop-content-wrapper > *:first-child {
                margin-top: 0 !important;
                padding-top: 0 !important;
              }
              
              /* Make sure content has proper z-index and is visible */
              .desktop-content-wrapper > * {
                position: relative !important;
                z-index: 1 !important;
              }
              
              /* Header is absolutely positioned, so hero section can start at top */
              .desktop-content-wrapper > div[class*="relative w-full"]:not([data-requests-header-wrapper]):first-of-type,
              .desktop-content-wrapper > div[class*="relative w-full"]:not([data-requests-header-wrapper]) {
                margin-top: 0 !important;
                padding-top: 0 !important;
                top: 0 !important;
              }
              
              /* Show iPhone frame wrapper on desktop */
              .desktop-iphone-frame-container {
                display: block !important;
              }
              
              /* Constrain all content inside the iPhone frame - CRITICAL for boundaries */
              .desktop-content-wrapper > * {
                max-width: 100% !important;
                width: 100% !important;
                box-sizing: border-box !important;
              }
              
              /* Prevent horizontal overflow but allow vertical scrolling */
              .desktop-content-wrapper {
                overscroll-behavior-y: contain !important;
                overscroll-behavior-x: none !important;
              }
              
              /* Ensure direct children respect width constraints */
              .desktop-content-wrapper > * {
                box-sizing: border-box !important;
              }
              
              /* Images and media must respect boundaries */
              .desktop-content-wrapper img,
              .desktop-content-wrapper video,
              .desktop-content-wrapper iframe {
                max-width: 100% !important;
                height: auto !important;
                box-sizing: border-box !important;
              }
              
              /* Hero section - must respect boundaries but allow content to flow */
              .desktop-content-wrapper > div[class*="relative w-full"] {
                width: 100% !important;
                max-width: 100% !important;
                position: relative !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                margin-top: 0 !important;
                padding-top: 0 !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
              }
              
              /* Make hero section start at absolute top, header overlays it */
              .desktop-content-wrapper > div[class*="relative w-full"]:not([data-requests-header-wrapper]) {
                margin-top: 0 !important;
                padding-top: 0 !important;
                position: relative !important;
                top: 0 !important;
              }
              
              /* Ensure hero section video/background starts at the very top and is properly aligned */
              .desktop-content-wrapper > div[class*="relative w-full"] > video {
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                position: absolute !important;
                object-position: center 35% !important;
                transform: none !important;
              }
              
              /* Ensure background divs (gradients, cover photos) are properly aligned */
              .desktop-content-wrapper > div[class*="relative w-full"] > div[class*="absolute"][class*="inset-0"] {
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              
              /* Ensure hero section container itself is aligned at top */
              .desktop-content-wrapper > div[class*="relative w-full"][class*="top-0"] {
                margin-top: 0 !important;
                padding-top: 0 !important;
                top: 0 !important;
              }
              
              /* Content overlay - must respect boundaries but allow content to flow */
              .desktop-content-wrapper > div[class*="relative w-full"] > div[class*="relative z-20"] {
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                overflow: visible !important;
              }
              
              /* Buttons and interactive elements should respect bounds */
              .desktop-content-wrapper button,
              .desktop-content-wrapper a,
              .desktop-content-wrapper input,
              .desktop-content-wrapper textarea,
              .desktop-content-wrapper select {
                max-width: 100% !important;
                box-sizing: border-box !important;
              }
              
              /* Dynamic Island / Notch - realistic iPhone 14/15 style */
              .desktop-iphone-notch {
                position: absolute !important;
                top: 10px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                width: 126px !important;
                height: 37px !important;
                background: #000000 !important;
                border-radius: 19px !important;
                z-index: 20 !important;
                pointer-events: none !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
              }
              
              /* Home indicator - realistic iPhone home bar */
              .desktop-iphone-home-indicator {
                position: absolute !important;
                bottom: 8px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                width: 134px !important;
                height: 5px !important;
                background: rgba(255, 255, 255, 0.4) !important;
                border-radius: 3px !important;
                z-index: 30 !important;
                pointer-events: none !important;
                backdrop-filter: blur(10px) !important;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
              }
            }
            
            /* Hide iPhone frame on mobile and restore normal layout */
            @media (max-width: 767px) {
              .desktop-iphone-frame-container {
                display: none !important;
              }
              .requests-page-container > div.desktop-content-wrapper {
                display: block !important;
                position: relative !important;
                top: auto !important;
                left: auto !important;
                transform: none !important;
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
                background: transparent !important;
                border-radius: 0 !important;
                overflow: visible !important;
                animation: none !important;
                z-index: auto !important;
              }
            }
          `}} />
        
        {/* Desktop iPhone Frame Container - Only visible on desktop */}
        {/* Note: Content wrapper is positioned separately but aligned with frame */}
        <div className="hidden md:block desktop-iphone-frame-container fixed inset-0 pointer-events-none desktop-preview-bg" style={{ zIndex: -1 }}>
          {/* Floating iPhone frame wrapper */}
          <div className="desktop-iphone-frame-wrapper">
            <div className="desktop-iphone-frame">
              {/* iPhone screen content area - placeholder */}
              <div className="desktop-iphone-content" />
            </div>
            {/* Dynamic Island / Notch - moves with frame animation */}
            <div className="desktop-iphone-notch" />
            {/* Home indicator - moves with frame animation */}
            <div className="desktop-iphone-home-indicator" />
          </div>
        </div>
        
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
                  : `${effectiveAccentColor}20`
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
            className={`relative w-full overflow-visible top-0 bg-black ${
              minimalHeader 
                ? 'h-[80px] sm:h-[100px] min-h-[70px] sm:min-h-[90px]' 
                : 'h-[25vh] sm:h-[30vh] md:min-h-[180px] lg:min-h-[200px] min-h-[150px] sm:min-h-[200px] max-h-[350px]'
            }`}
            style={{ 
              zIndex: 0
            }}
          >
            {/* Background - video, animated gradient, or cover photo (visible on both mobile and desktop within iPhone frame) */}
            {showVideo && !videoFailed ? (
              <video
                ref={mobileVideoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                webkit-playsinline="true"
                x-webkit-airplay="deny"
                disablePictureInPicture
                preload="metadata"
                poster={coverPhoto}
                style={{ zIndex: 0, objectPosition: 'center 35%' }}
                onLoadStart={() => {
                  // Clear timeout when video starts loading
                  if (mobileVideoTimeoutRef.current) {
                    clearTimeout(mobileVideoTimeoutRef.current);
                    mobileVideoTimeoutRef.current = null;
                  }
                }}
                onCanPlay={() => {
                  // Clear timeout when video can play
                  if (mobileVideoTimeoutRef.current) {
                    clearTimeout(mobileVideoTimeoutRef.current);
                    mobileVideoTimeoutRef.current = null;
                  }
                }}
                onLoadedData={() => {
                  if (mobileVideoRef.current) {
                    mobileVideoRef.current.play().catch((error) => {
                      console.warn('⚠️ [VIDEO] Mobile video autoplay failed:', error);
                      setVideoFailed(true);
                    });
                  }
                }}
                onError={(e) => {
                  console.error('❌ [VIDEO] Mobile video error:', e);
                  setVideoFailed(true);
                }}
                onStalled={() => {
                  console.warn('⚠️ [VIDEO] Mobile video stalled, may be loading slowly');
                }}
              >
                <source src={headerVideoUrl} type="video/mp4" />
                <p className="text-white text-center p-4">Video unavailable</p>
              </video>
            ) : (showVideo && videoFailed && coverPhoto) ? (
              // Show poster image as fallback when video fails
              <img
                src={coverPhoto}
                alt="Header background"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 0, objectPosition: 'center 35%' }}
                onError={(e) => {
                  console.warn('⚠️ [VIDEO] Poster image also failed to load');
                  // Fall through to animated gradient
                }}
              />
            ) : showAnimatedGradient ? (
              backgroundType === 'smoke' ? (
                /* Smoke animation background */
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black" style={{ zIndex: 0 }}>
                  {typeof window !== 'undefined' && (() => {
                    // Dynamic import to avoid SSR issues
                    try {
                      const Smoke = require('@/components/ui/shadcn-io/smoke').default;
                      return (
                        <Smoke
                          density={75}
                          color="#cccccc"
                          opacity={0.7}
                          enableRotation={true}
                          enableWind={true}
                          windStrength={[0.02, 0.01, 0.01]}
                          enableTurbulence={true}
                          turbulenceStrength={[0.02, 0.02, 0.01]}
                        />
                      );
                    } catch (e) {
                      console.warn('Smoke component not available:', e);
                      return null;
                    }
                  })()}
                </div>
              ) : backgroundType === 'smooth-spiral' ? (
                /* Smooth Spiral animation background */
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black" style={{ zIndex: 0 }}>
                  {typeof window !== 'undefined' && (() => {
                    // Dynamic import to avoid SSR issues
                    try {
                      const PsychedelicSpiral = require('@/components/ui/shadcn-io/psychedelic-spiral').default;
                      return (
                        <PsychedelicSpiral
                          spinRotation={-2.0}
                          spinSpeed={7.0}
                          offset={[0.0, 0.0]}
                          color1="#871d87"
                          color2="#b2dfdf"
                          color3="#0c204e"
                          contrast={3.5}
                          lighting={0.4}
                          spinAmount={0.25}
                          pixelFilter={745.0}
                          spinEase={1.0}
                          isRotate={true}
                        />
                      );
                    } catch (e) {
                      console.warn('PsychedelicSpiral component not available:', e);
                      return null;
                    }
                  })()}
                </div>
              ) : backgroundType === 'vortex' ? (
                /* Vortex animation background */
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-black" style={{ zIndex: 0 }}>
                  {typeof window !== 'undefined' && (() => {
                    // Dynamic import to avoid SSR issues
                    try {
                      const Vortex = require('@/components/ui/shadcn-io/vortex').default;
                      return (
                        <Vortex
                          backgroundColor="black"
                          rangeY={800}
                          particleCount={500}
                          baseHue={120}
                        />
                      );
                    } catch (e) {
                      console.warn('Vortex component not available:', e);
                      return null;
                    }
                  })()}
                </div>
              ) : (
                /* Animated gradient - Default TipJar background for mobile and desktop */
                <div className="absolute inset-0 w-full h-full animated-gradient-bg overflow-hidden" style={{ zIndex: 0 }} />
              )
            ) : showSolidBackground ? (
              /* Custom background color or gradient when animation is disabled and no custom media */
              effectiveHeaderBackgroundType === 'gradient' ? (
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{
                    zIndex: 0,
                    background: `linear-gradient(135deg, ${effectiveHeaderBackgroundGradientStart} 0%, ${effectiveHeaderBackgroundGradientEnd} 100%)`
                  }}
                />
              ) : (
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    zIndex: 0,
                    backgroundColor: effectiveHeaderBackgroundColor 
                  }}
                />
              )
            ) : coverPhoto ? (
              /* Custom cover photo */
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${coverPhoto})`, objectPosition: 'center 40%', zIndex: 0 }}
              />
            ) : (
              /* No background - transparent/black fallback */
              <div className="absolute inset-0 w-full h-full bg-black" style={{ zIndex: 0 }} />
            )}
            
            {/* Desktop Background - removed black gradient to show animated background */}
            {/* Content overlay */}
            <div             className={`relative z-20 h-full flex flex-col justify-between items-center text-center px-4 ${
              minimalHeader ? 'justify-center' : ''
            }`} style={{ paddingTop: minimalHeader ? '60px' : '80px', paddingBottom: minimalHeader ? '10px' : '4px', overflow: 'visible' }}>
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
                      className={`font-black text-white tracking-tight ${
                        minimalHeader
                          ? 'text-xl sm:text-2xl mb-1'
                          : shouldHideName
                            ? 'sr-only'
                            : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-4'
                      }`}
                      style={{
                        fontFamily: effectiveArtistNameFont,
                        textTransform: effectiveArtistNameTextTransform,
                        color: effectiveArtistNameColor,
                        letterSpacing: `${effectiveArtistNameKerning}px`,
                        textShadow: artistNameTextShadow
                      }}
                    >
                      {(() => {
                        const artistName = organizationData?.requests_header_artist_name || organizationData?.name || 'DJ';
                        
                        console.log('🎨 Rendering artist name:', artistName, 'from organizationData:', {
                          requests_header_artist_name: organizationData?.requests_header_artist_name,
                          name: organizationData?.name,
                          textTransform: effectiveArtistNameTextTransform,
                          showVideo,
                          showArtistNameOverVideo,
                          shouldHideName
                        });
                        
                        // Apply text transform
                        if (effectiveArtistNameTextTransform === 'uppercase') {
                          return artistName.toUpperCase();
                        } else if (effectiveArtistNameTextTransform === 'lowercase') {
                          return artistName.toLowerCase();
                        }
                        return artistName; // Normal case
                      })()}
                    </h1>
                  );
                })()}
                
                {/* Location - Only show if value exists, show subtitle is enabled, and not minimal header */}
                {!minimalHeader && effectiveHeaderLocation && organizationData?.requests_show_subtitle !== false && (
                  <p 
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-3 sm:mb-4"
                    style={{
                      fontFamily: effectiveSubtitleFont,
                      textTransform: effectiveSubtitleTextTransform,
                      color: effectiveSubtitleColor,
                      letterSpacing: `${effectiveSubtitleKerning}px`,
                      textShadow: subtitleTextShadow
                    }}
                  >
                    {(() => {
                      const locationText = effectiveHeaderLocation;
                      // Apply text transform
                      if (effectiveSubtitleTextTransform === 'uppercase') {
                        return locationText.toUpperCase();
                      } else if (effectiveSubtitleTextTransform === 'lowercase') {
                        return locationText.toLowerCase();
                      }
                      return locationText; // Normal case
                    })()}
                  </p>
                )}
                
                {/* Date - Only show if value exists and not minimal header */}
                {!minimalHeader && effectiveHeaderDate && (
                  <p className="text-lg sm:text-xl md:text-2xl text-white/80 drop-shadow-md">
                    {effectiveHeaderDate}
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
              <div className="w-full flex flex-col items-center gap-2 mt-0.5 sm:mt-1">
                {/* Social Links - Positioned at bottom */}
                {((previewSocialLinks && previewSocialLinks.length > 0) || (organizationData?.social_links && Array.isArray(organizationData.social_links) && organizationData.social_links.length > 0)) ? (
                  <div className="flex items-center justify-center gap-3">
                    {(previewSocialLinks || organizationData?.social_links || [])
                      .filter(link => link.enabled !== false)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((link, index) => {
                        const getSocialIcon = (platform) => {
                          const iconProps = { className: "w-4 h-4", strokeWidth: 1.5, fill: "none" };
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
                        
                        // Only allow the “account selector” behavior on M10; for TipJar/DJDash SaaS pages,
                        // social links should always follow the admin-configured URL.
                        if (isSelectable && allowSocialAccountSelector) {
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSocialClick(e, platform);
                              }}
                              className="flex items-center justify-center w-7 h-7 text-white hover:text-white transition-opacity hover:opacity-90 cursor-pointer border-0 bg-transparent p-0"
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
                            className="flex items-center justify-center w-7 h-7 text-white hover:text-white transition-opacity hover:opacity-90"
                            aria-label={link.label || link.platform}
                          >
                            {getSocialIcon(link.platform)}
                          </a>
                        );
                      })}
                  </div>
                ) : (
                  // No fallback social links for SaaS pages (prevents cross-brand leaks).
                  // If user hasn't configured links, hide the section.
                  (allowSocialAccountSelector ? (
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
                  ) : null)
                )}
              </div>
              )}
            </div>
          </div>
        )}
        
        <main className={`section-container relative z-10 ${showPaymentMethods ? 'py-4 sm:py-6 md:py-8' : 'py-2 sm:py-3 md:py-4'} px-3 sm:px-4 md:px-8 lg:px-12 overflow-x-hidden`} style={{ minHeight: embedMode ? '100vh' : (showPaymentMethods ? '100vh' : 'auto'), display: 'flex', flexDirection: 'column', maxWidth: '100vw', height: embedMode ? '100vh' : (showPaymentMethods ? '100vh' : '100%'), maxHeight: embedMode ? '100vh' : (showPaymentMethods ? '100vh' : '100%') }}>
          <div className={`${showPaymentMethods ? 'max-w-lg' : 'max-w-xl md:max-w-2xl lg:max-w-3xl'} mx-auto w-full flex-1 flex flex-col overflow-x-hidden ${showPaymentMethods ? 'overflow-y-auto' : ''}`} style={{ minHeight: 0, maxHeight: '100%', overflow: showPaymentMethods ? 'auto' : 'hidden' }}>
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
              <div className="text-center mb-1 sm:mb-2">
                <div className="flex items-center justify-center gap-1">
                  <div className={`h-1 rounded-full transition-all ${currentStep >= 1 ? 'bg-white w-5 sm:w-6' : 'bg-white/30 w-1.5'}`}></div>
                  <div className={`h-1 rounded-full transition-all ${currentStep >= 2 ? 'bg-white w-5 sm:w-6' : 'bg-white/30 w-1.5'}`}></div>
                </div>
                <p className="text-[9px] sm:text-[10px] text-white/70 mt-0.5">
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
                  <div className="bg-brand/5 dark:!bg-black/40 border-2 border-brand/30 dark:border-brand/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg">
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
                          <div className="mt-3 p-3 bg-white/70 dark:!bg-black/50 rounded-lg border border-gray-200 dark:border-gray-800">
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
                          <div className="mt-3 p-3 bg-white/70 dark:!bg-black/50 rounded-lg border border-gray-200 dark:border-gray-800">
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
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // CRITICAL FIX: Only handle Enter key presses, not button clicks
                    // Button clicks are handled by button's onClick which properly prevents form submission
                    // This prevents double-handling and race conditions
                    // Only process if triggered by Enter key (not by button click)
                    const target = e.target;
                    const isEnterKey = e.nativeEvent?.type === 'submit' && !e.isTrusted === false;
                    
                    // If this was triggered by a button click (not Enter key), ignore it
                    // The button's onClick handler will handle it properly
                    if (e.nativeEvent?.submitter?.type === 'button') {
                      return;
                    }
                    
                    // Only handle if not already submitting and this is an Enter key press
                    if (!submitting) {
                      // For step 1, navigate to payment step
                      if (currentStep === 1) {
                        setError('');
                        setCurrentStep(2);
                        setTimeout(() => {
                          const paymentElement = document.querySelector('[data-payment-section]');
                          if (paymentElement) {
                            paymentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 100);
                        return;
                      }
                      // For step 2, call handleSubmit (only for Enter key)
                      handleSubmit(e);
                    }
                  }} noValidate className="flex-1 flex flex-col space-y-3 sm:space-y-4 overflow-y-auto">
                    {/* Request Type Selection - Hidden on bid page since only song_request is allowed */}
                    
                    {/* Song Request Fields */}
                    {requestType === 'song_request' && (
                      <div className="bg-white/70 dark:!bg-black/70 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-3 sm:p-4 md:p-5 flex-shrink-0 space-y-2 sm:space-y-3 md:space-y-4">
                        <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 md:mb-4 flex items-center gap-2 sm:gap-3">
                          <div className="w-1 h-5 sm:h-6 md:h-8 bg-brand rounded-full hidden sm:block"></div>
                          <span className="leading-tight">Submit Your Song Request</span>
                        </h2>
                        
                        {/* Combined Song Title & Artist Input */}
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                            <Music className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                            {organizationData?.requests_song_title_label || 'Enter a Song'} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              ref={songTitleInputRef}
                              type="text"
                              name="songInput"
                              value={songInput}
                              onChange={handleInputChange}
                              onFocus={() => {
                                const parsed = parseCombinedSongInput(songInput);
                                const titlePortion = parsed.title || songInput.split(/\s+[-–—byBY]\s+/)[0] || songInput;
                                if (titlePortion && !detectUrl(songInput) && !isExtractedFromLink && titlePortion.trim().length >= 2) {
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
                                handleSongInputBlur(e);
                              }}
                              className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:!bg-black backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200 touch-manipulation ${
                                extractingSong ? 'pr-20 sm:pr-24 md:pr-28' : isExtractedFromLink ? 'pr-20 sm:pr-24' : 'pr-3 sm:pr-4'
                              }`}
                              placeholder={organizationData?.requests_song_title_placeholder || "Song Name - Artist Name"}
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
                          {/* Autocomplete suggestions */}
                          {showAutocomplete && suggestions.length > 0 && (
                            <div className="mt-2 bg-white dark:!bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                              {suggestions.map((suggestion, index) => (
                                <button
                                  key={suggestion.id}
                                  type="button"
                                  onClick={() => handleSuggestionSelect(suggestion)}
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-black/80 transition-colors flex items-center gap-3 ${
                                    index === selectedSuggestionIndex ? 'bg-gray-100 dark:!bg-black/80' : ''
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
                            <div className="mt-2 p-3 bg-white dark:!bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-brand" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                            </div>
                          )}
                        </div>

                        {/* Bundle Songs Input (only show when bundle size > 1) */}
                        {bundleSize > 1 && bundleSongs.length > 0 && (
                          <div ref={bundleSongsRef} className="mt-4 p-4 bg-white/70 dark:!bg-black/50 rounded-lg border border-gray-200/50 dark:border-gray-800/50">
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
                                  <div key={index} className="bg-white/50 dark:!bg-black/30 rounded-lg p-3 sm:p-4 border border-gray-200/50 dark:border-gray-700/50">
                                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
                                      Song {index + 2} of {bundleSize}
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                                          <Music className="w-3 h-3 inline mr-1" />
                                          Enter a Song <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            value={formatCombinedDisplay(song.songTitle || '', song.songArtist || '')}
                                            onChange={(e) => handleBundleSongInputChange(e, index)}
                                            onFocus={() => {
                                              setActiveBundleSongIndex(index);
                                              const parsed = parseCombinedSongInput(formatCombinedDisplay(song.songTitle || '', song.songArtist || ''));
                                              const searchQuery = parsed.title || song.songTitle || '';
                                              setBundleSongSearchQuery(searchQuery);
                                              if (searchQuery && !detectUrl(formatCombinedDisplay(song.songTitle || '', song.songArtist || '')) && !bundleIsExtractedFromLink[index] && searchQuery.trim().length >= 2) {
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
                                            className={`w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:!bg-black backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200 ${
                                              bundleExtractingSong[index] ? 'pr-20' : bundleIsExtractedFromLink[index] ? 'pr-20' : 'pr-3'
                                            }`}
                                            placeholder="Song Name - Artist Name"
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
                                        {/* Autocomplete suggestions */}
                                        {bundleShowAutocomplete[index] && currentSuggestions.length > 0 && (
                                          <div className="mt-2 bg-white dark:!bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                                            {currentSuggestions.map((suggestion, sugIndex) => (
                                              <button
                                                key={suggestion.id}
                                                type="button"
                                                onClick={() => handleBundleSuggestionSelect(suggestion, index)}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-black/80 transition-colors flex items-center gap-3 ${
                                                  sugIndex === (bundleSelectedSuggestionIndex[index] || -1) ? 'bg-gray-100 dark:!bg-black/80' : ''
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
                                          <div className="mt-2 p-3 bg-white dark:!bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex items-center gap-2">
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
                                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:!bg-black backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200"
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
                          <div className="bg-white/70 dark:!bg-black/50 border-2 border-brand/30 dark:border-brand/30 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3">
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
                              <div className="rounded-lg p-4 text-center" style={{
                                backgroundColor: effectiveThemeMode === 'dark' ? `${effectiveAccentColor}20` : `${effectiveAccentColor}10`,
                                border: `1px solid ${effectiveAccentColor}40`
                              }}>
                                <p className="text-sm" style={{ 
                                  color: effectiveThemeMode === 'dark' ? `${effectiveAccentColor}` : `${effectiveAccentColor}dd`
                                }}>
                                  Loading bidding options...
                                </p>
                              </div>
                            )
                          ) : (
                            <PaymentAmountSelector
                              key={`payment-selector-${shouldUseBidding ? 'bidding' : 'normal'}-${presetAmounts.length}-${amountsSortOrder}`}
                              amountType={amountType}
                              setAmountType={setAmountType}
                              presetAmount={presetAmount}
                              setPresetAmount={handlePresetAmountChange}
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
                              calculateBundlePrice={calculateBundlePrice}
                              hidePriorityOptions={false}
                              showFastTrack={organizationData?.requests_show_fast_track !== false}
                              showNextSong={organizationData?.requests_show_next_song !== false}
                              isBiddingMode={false}
                              currentWinningBid={0}
                              bundleSize={bundleSize}
                              setBundleSize={setBundleSize}
                              amountsSortOrder={amountsSortOrder}
                            />
                          )}
                        </div>

                        {/* Bid Amount Required Notification - Show when bid amount is missing */}
                        {shouldUseBidding && (() => {
                          const bidAmount = getPaymentAmount();
                          const minBid = dynamicMinimumAmount || 500;
                          if (!bidAmount || bidAmount < minBid) {
                            return (
                              <div className="rounded-lg p-3 mb-3" style={{
                                backgroundColor: effectiveThemeMode === 'dark' ? `${effectiveAccentColor}20` : `${effectiveAccentColor}10`,
                                border: `2px solid ${effectiveAccentColor}`
                              }}>
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: effectiveAccentColor }} />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold mb-1" style={{ 
                                      color: effectiveThemeMode === 'dark' ? '#fff' : '#000'
                                    }}>
                                      Bid Amount Required
                                    </p>
                                    <p className="text-xs" style={{ 
                                      color: effectiveThemeMode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
                                    }}>
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
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!submitting) {
                              handleSubmit(e);
                            }
                          }}
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
                onRequesterNameChange={(name) => {
                  setFormData(prev => ({ ...prev, requesterName: name }));
                }}
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
              <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // CRITICAL FIX: Only handle Enter key presses, not button clicks
                // Button clicks are handled by button's onClick which properly prevents form submission
                // This prevents double-handling and race conditions
                // If this was triggered by a button click (not Enter key), ignore it
                if (e.nativeEvent?.submitter?.type === 'button') {
                  return;
                }
                
                // Only handle if not already submitting and this is an Enter key press
                if (!submitting) {
                  // For step 1, navigate to payment step
                  if (currentStep === 1) {
                    setError('');
                    setCurrentStep(2);
                    setTimeout(() => {
                      const paymentElement = document.querySelector('[data-payment-section]');
                      if (paymentElement) {
                        paymentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                    return;
                  }
                  // For step 2, call handleSubmit (only for Enter key)
                  handleSubmit(e);
                }
              }} className="flex-1 flex flex-col space-y-2 sm:space-y-3 overflow-y-auto" style={{ minHeight: 0, maxHeight: '100%' }}>
                {/* Request Type Selection */}
                <div className="bg-white/70 dark:!bg-black/70 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 p-2.5 sm:p-3 md:p-4 flex-shrink-0">
                  {(() => {
                    const mainHeading = organizationData?.requests_main_heading;
                    const defaultHeading = 'What would you like to request?';
                    // Only show heading if it exists, is not empty, and is NOT the default value
                    if (mainHeading && mainHeading.trim() && mainHeading.trim() !== defaultHeading) {
                      return (
                        <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-2.5 flex items-center gap-1.5 sm:gap-2">
                          <div className="w-1 h-4 sm:h-5 bg-brand rounded-full hidden sm:block"></div>
                          <span className="leading-tight">{mainHeading}</span>
                        </h2>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Request Type Selection - Hide if only one type is allowed */}
                  {(!allowedRequestTypes || allowedRequestTypes.length > 1) && (
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
                      {(!effectiveAllowedTypes || effectiveAllowedTypes.includes('song_request')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('song_request')}
                          className={`group relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all duration-200 touch-manipulation overflow-hidden ${
                            requestType === 'song_request'
                              ? 'border-brand bg-brand/10 dark:bg-brand/10 shadow-md shadow-brand/20'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:!bg-black/50 hover:border-brand/50 hover:shadow-sm'
                          }`}
                        >
                          {requestType === 'song_request' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center gap-1">
                            <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md transition-all duration-200 ${
                              requestType === 'song_request'
                                ? 'bg-brand shadow-sm shadow-brand/20'
                                : 'bg-gray-100 dark:!bg-black/50 group-hover:bg-brand/10'
                            }`}>
                              <Music className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                                requestType === 'song_request' ? 'text-black' : 'text-gray-400 group-hover:text-brand'
                              }`} />
                            </div>
                            <h3 className="font-semibold text-[10px] sm:text-[11px] text-gray-900 dark:text-white text-center leading-tight">{organizationData?.requests_song_request_label || 'Song Request'}</h3>
                          </div>
                        </button>
                      )}
                      
                      {(!effectiveAllowedTypes || effectiveAllowedTypes.includes('shoutout')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('shoutout')}
                          className={`group relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all duration-200 touch-manipulation overflow-hidden ${
                            requestType === 'shoutout'
                              ? 'border-brand bg-brand/10 dark:bg-brand/10 shadow-md shadow-brand/20'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:!bg-black/50 hover:border-brand/50 hover:shadow-sm'
                          }`}
                        >
                          {requestType === 'shoutout' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center gap-1">
                            <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md transition-all duration-200 ${
                              requestType === 'shoutout'
                                ? 'bg-brand shadow-sm shadow-brand/20'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-brand/10'
                            }`}>
                              <Mic className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                                requestType === 'shoutout' ? 'text-black' : 'text-gray-400 group-hover:text-brand'
                              }`} />
                            </div>
                            <h3 className="font-semibold text-[10px] sm:text-[11px] text-gray-900 dark:text-white text-center leading-tight">{organizationData?.requests_shoutout_label || 'Shoutout'}</h3>
                          </div>
                        </button>
                      )}

                      {(!effectiveAllowedTypes || effectiveAllowedTypes.includes('tip')) && (
                        <button
                          type="button"
                          onClick={() => handleRequestTypeChange('tip')}
                          className={`group relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 transition-all duration-200 touch-manipulation overflow-hidden ${
                            requestType === 'tip'
                              ? 'border-brand bg-brand/10 dark:bg-brand/10 shadow-md shadow-brand/20'
                              : 'border-gray-200 dark:border-gray-800 bg-white/50 dark:!bg-black/50 hover:border-brand/50 hover:shadow-sm'
                          }`}
                        >
                          {requestType === 'tip' && (
                            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent"></div>
                          )}
                          <div className="relative flex flex-col items-center justify-center gap-1">
                            <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md transition-all duration-200 ${
                              requestType === 'tip'
                                ? 'bg-brand shadow-sm shadow-brand/20'
                                : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-brand/10'
                            }`}>
                              <Gift className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                                requestType === 'tip' ? 'text-black' : 'text-gray-400 group-hover:text-brand'
                              }`} />
                            </div>
                            <h3 className="font-semibold text-[10px] sm:text-[11px] text-gray-900 dark:text-white text-center leading-tight">{organizationData?.requests_tip_label || 'Tip'}</h3>
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Song Request Fields */}
                  {requestType === 'song_request' && (
                    <div className="space-y-2 sm:space-y-2.5">
                      {/* Notice when song requests are disabled */}
                      {songRequestsDisabled && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 sm:p-5 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm sm:text-base font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                Song Requests Currently Unavailable
                              </h3>
                              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                Song requests have been temporarily disabled. Please use the <strong>Shoutout</strong> or <strong>Tip</strong> options instead, or check back later.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Combined Song Title & Artist Input */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          <Music className="w-3 h-3 inline mr-1" />
                          {organizationData?.requests_song_title_label || 'Enter a Song'} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            ref={songTitleInputRef}
                            type="text"
                            name="songInput"
                            value={songInput}
                            onChange={handleInputChange}
                            onFocus={() => {
                              const parsed = parseCombinedSongInput(songInput);
                              const titlePortion = parsed.title || songInput.split(/\s+[-–—byBY]\s+/)[0] || songInput;
                              if (titlePortion && !detectUrl(songInput) && !isExtractedFromLink && titlePortion.trim().length >= 2) {
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
                              handleSongInputBlur(e);
                            }}
                            className={`w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:!bg-black backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-md focus:shadow-brand/20 transition-all duration-200 touch-manipulation ${
                              extractingSong ? 'pr-20 sm:pr-24' : isExtractedFromLink ? 'pr-20 sm:pr-24' : 'pr-3'
                            }`}
                            placeholder={organizationData?.requests_song_title_placeholder || "Song Name - Artist Name"}
                            required
                            autoComplete="off"
                          />
                          {extractingSong && (
                            <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-brand flex-shrink-0" />
                              <span className="text-xs text-gray-700 dark:text-gray-300 hidden sm:inline whitespace-nowrap">Extracting...</span>
                            </div>
                          )}
                          {isExtractedFromLink && !extractingSong && (
                            <button
                              type="button"
                              onClick={handleClearExtraction}
                              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Clear and start over"
                            >
                              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          )}
                        </div>
                        {extractionError && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {extractionError}
                          </p>
                        )}
                        {isExtractedFromLink && !extractionError && (
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Song info extracted successfully
                          </p>
                        )}
                         {/* Autocomplete suggestions */}
                         {showAutocomplete && suggestions.length > 0 && (
                           <div className="mt-2 bg-white dark:!bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                             {suggestions.map((suggestion, index) => (
                               <button
                                 key={suggestion.id}
                                 type="button"
                                 onClick={() => handleSuggestionSelect(suggestion)}
                                 className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-black/80 transition-colors flex items-center gap-3 ${
                                   index === selectedSuggestionIndex ? 'bg-gray-100 dark:!bg-black/80' : ''
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
                           <div className="mt-2 p-3 bg-white dark:!bg-black border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                             <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                           </div>
                         )}
                       </div>

                      {/* Bundle Songs Input (only show when bundle size > 1) */}
                      {bundleSize > 1 && bundleSongs.length > 0 && (
                        <div ref={bundleSongsRef} className="mt-4 p-4 bg-white/70 dark:!bg-black/50 rounded-lg border border-gray-200/50 dark:border-gray-800/50">
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
                              <div key={index} className="bg-white/50 dark:!bg-black/30 rounded-lg p-3 sm:p-4 border border-gray-200/50 dark:border-gray-700/50">
                                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">
                                  Song {index + 2} of {bundleSize}
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                                      Song Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={formatCombinedDisplay(song.songTitle || '', song.songArtist || '')}
                                      onChange={(e) => {
                                        const combinedValue = e.target.value;
                                        const parsed = parseCombinedSongInput(combinedValue);
                                        const newSongs = [...bundleSongs];
                                        newSongs[index] = {
                                          ...newSongs[index],
                                          songTitle: parsed.title || '',
                                          songArtist: parsed.artist || ''
                                        };
                                        setBundleSongs(newSongs);
                                      }}
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white/80 dark:!bg-black backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand focus:shadow-lg focus:shadow-brand/20 transition-all duration-200"
                                      placeholder="Song Name - Artist Name"
                                      required
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
                      {organizationData?.requests_show_audio_upload !== false && !songInput?.trim() && !formData.songTitle?.trim() && !formData.songArtist?.trim() && (
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
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          {organizationData?.requests_recipient_name_label || 'Recipient Name'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="recipientName"
                          value={formData.recipientName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-800 bg-white text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                          style={{ 
                            backgroundColor: 'var(--input-bg, white)',
                          }}
                          data-dark-bg="black"
                          placeholder={organizationData?.requests_recipient_name_placeholder || "Who is this shoutout for?"}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          {organizationData?.requests_message_label || 'Message'} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="recipientMessage"
                          value={formData.recipientMessage}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-800 bg-white text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                          style={{ 
                            backgroundColor: 'var(--input-bg, white)',
                          }}
                          data-dark-bg="black"
                          placeholder={organizationData?.requests_message_placeholder || "What would you like to say?"}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Tip Fields - Show payment amount selector immediately */}
                  {requestType === 'tip' && (
                    <div className="space-y-2">
                      <div className="text-center py-1">
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
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
                        calculateBundlePrice={calculateBundlePrice}
                        showFastTrack={false}
                        showNextSong={false}
                        bundleSize={bundleSize}
                        setBundleSize={setBundleSize}
                        amountsSortOrder={amountsSortOrder}
                      />
                      {/* Fallback payment options for tips only */}
                      {((paymentSettings?.cashAppTag && paymentSettings.cashAppTag.trim()) || (paymentSettings?.venmoUsername && paymentSettings.venmoUsername.trim())) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
                            Having trouble with card payment? You can also tip via:
                          </p>
                          <div className="flex flex-col gap-2 w-full">
                            {paymentSettings?.cashAppTag && paymentSettings.cashAppTag.trim() && (() => {
                              // Clean the CashApp tag (remove $ if present, we'll add it back in the URL)
                              const cleanTag = paymentSettings.cashAppTag.replace(/^\$/, '').trim();
                              const cashAppUrl = `https://cash.app/$${cleanTag}`;
                              return (
                                <a
                                  href={cashAppUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 w-full min-w-0 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer"
                                >
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap flex-shrink-0">CashApp:</span>
                                  <span className="text-sm font-bold text-green-600 dark:text-green-400 truncate min-w-0 flex-1">{paymentSettings.cashAppTag}</span>
                                </a>
                              );
                            })()}
                            {paymentSettings?.venmoUsername && paymentSettings.venmoUsername.trim() && (() => {
                              // Clean the Venmo username (remove @ if present)
                              const cleanUsername = paymentSettings.venmoUsername.replace(/^@/, '').trim();
                              const venmoUrl = `https://venmo.com/${cleanUsername}`;
                              return (
                                <a
                                  href={venmoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 w-full min-w-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                >
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap flex-shrink-0">Venmo:</span>
                                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate min-w-0 flex-1">{paymentSettings.venmoUsername}</span>
                                </a>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Requester Information - Collected at payment step */}
                  {/* Name will be collected during checkout/payment step */}

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
                      <div data-payment-section className="mt-2 sm:mt-3">
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
                          calculateBundlePrice={calculateBundlePrice}
                          showFastTrack={false}
                          showNextSong={false}
                          bundleSize={bundleSize}
                          setBundleSize={setBundleSize}
                          amountsSortOrder={amountsSortOrder}
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
                          calculateBundlePrice={calculateBundlePrice}
                          showFastTrack={organizationData?.requests_show_fast_track !== false}
                          showNextSong={organizationData?.requests_show_next_song !== false}
                          bundleSize={bundleSize}
                          setBundleSize={setBundleSize}
                          amountsSortOrder={amountsSortOrder}
                        />
                      </div>
                    );
                  }
                  
                  return null;
                })()}


                {/* Submit Button - Sticky at bottom, appears when selection is complete */}
                {((requestType === 'tip') || isSongSelectionComplete()) && (
                <div 
                  className="sticky bottom-0 left-0 right-0 z-50 bg-transparent dark:bg-transparent pt-1.5 sm:pt-2 pb-2 sm:pb-3 border-0 shadow-none flex-shrink-0 mt-auto focus:outline-none focus:ring-0"
                  style={{ 
                    paddingBottom: 'max(0.5rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))',
                    position: 'sticky',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none'
                  }}
                >
                  <button
                    type="button"
                    disabled={submitting}
                    className="group relative w-full py-2.5 sm:py-3 text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[48px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 hover:from-brand-500 hover:via-brand-400 hover:to-brand-600 text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-[0.98] transition-all duration-200 overflow-hidden focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none border-0 outline-none !border-0 !outline-none"
                    style={{ border: 'none', outline: 'none' }}
                    onClick={async (e) => {
                      // CRITICAL: Always prevent default and stop propagation FIRST
                      // This prevents the form's onSubmit from firing
                      e.preventDefault();
                      e.stopPropagation();
                      e.stopImmediatePropagation?.(); // Stop all event handlers if available
                      
                      // Always log the click for debugging
                      console.log('[Submit Button] onClick fired', {
                        currentStep,
                        submitting,
                        requestType,
                        timestamp: new Date().toISOString()
                      });
                      
                      logger.info('[Submit Button] onClick fired', {
                        currentStep,
                        submitting,
                        requestType,
                        buttonType: currentStep === 1 ? 'button' : 'submit'
                      });
                      
                      // Prevent double-submission - check BEFORE any async operations
                      if (submitting) {
                        console.warn('[Submit Button] Already submitting, preventing click');
                        logger.warn('[Submit Button] Already submitting, preventing click');
                        return;
                      }
                      
                      try {
                        if (currentStep === 1) {
                          console.log('[Submit Button] Step 1: Navigating to payment step');
                          logger.info('[Submit Button] Step 1: Navigating to payment step');
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
                        
                        // For step 2, explicitly call handleSubmit
                        console.log('[Submit Button] Step 2: Calling handleSubmit');
                        logger.info('[Submit Button] Step 2: Calling handleSubmit');
                        
                        // Call handleSubmit - it will set submitting state synchronously at the start
                        await handleSubmit(e);
                      } catch (error) {
                        console.error('[Submit Button] onClick error:', error);
                        logger.error('[Submit Button] onClick error:', error);
                        setError('An unexpected error occurred. Please try again.');
                        setSubmitting(false);
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

        {/* Booking Button - Show if enabled by super admin or TipJar user */}
        {organizationData?.requests_show_booking_button && (
          <div className="mt-8 mb-4 text-center">
            <button
              onClick={() => setShowBookingModal(true)}
              className={`w-full max-w-sm mx-auto px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                effectiveButtonStyle === 'gradient'
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 dark:from-brand-400 dark:to-brand-500 hover:from-brand-600 hover:to-brand-700 dark:hover:from-brand-500 dark:hover:to-brand-600'
                  : effectiveButtonStyle === 'solid'
                  ? 'bg-brand-500 hover:bg-brand-600 dark:bg-brand-400 dark:hover:bg-brand-500'
                  : 'border-2 border-brand-500 bg-transparent text-brand-500 hover:bg-brand-500 hover:text-white dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-400'
              }`}
              style={
                effectiveButtonStyle === 'gradient' || effectiveButtonStyle === 'solid'
                  ? { background: effectiveButtonStyle === 'solid' ? effectiveAccentColor : undefined }
                  : { borderColor: effectiveAccentColor, color: effectiveAccentColor }
              }
            >
              Get Your Free Quote
            </button>
          </div>
        )}

        {/* Footer: "Create Your Page" link for new DJs OR "Claim Your Page" for unclaimed orgs */}
        <footer className="mt-8 mb-4 text-center">
          {organizationData && (organizationData.is_claimed === false || organizationData.owner_id === null) && organizationData.claim_token ? (
            // Unclaimed organization - show "Claim it now" link with token
            <a 
              href={`/tipjar/claim?token=${organizationData.claim_token}`}
              className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Is this your page?</span>
              <span className="underline">Claim it now</span>
            </a>
          ) : (
            // Claimed organization - show normal "Create your page" link
            <a 
              href="https://tipjar.live" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors inline-flex items-center gap-1"
            >
              <span>Are you a DJ?</span>
              <span className="underline">Create your request page</span>
            </a>
          )}
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

      {/* Booking Form Modal */}
      <ContactFormModal 
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        organizationId={organizationId}
      />
    </>
  );
}

