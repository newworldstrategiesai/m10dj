'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { 
  QrCode, 
  Music, 
  Mic, 
  Download, 
  Copy, 
  CheckCircle,
  CheckCircle2,
  AlertCircle, 
  Plus,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  Trash2,
  Eye,
  Edit3,
  Printer,
  XCircle,
  Zap,
  X,
  Settings,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  MoreVertical,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Gift,
  Minimize2,
  Maximize2,
  Globe,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { getCoverPhotoUrl } from '@/utils/cover-photo-helper';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import StripeConnectRequirementBanner from '@/components/subscription/StripeConnectRequirementBanner';
import StripeConnectSetup from '@/components/subscription/StripeConnectSetup';
import UsageLimitBanner from '@/components/subscription/UsageLimitBanner';
import { getCurrentOrganization } from '@/utils/organization-context';
import OnboardingReminder from '@/components/tipjar/OnboardingReminder';
import SongRecognition from '@/components/audio/SongRecognition';
import MusicServiceLinks from '@/components/admin/MusicServiceLinks';
import { DecoratedQRCode } from '@/components/ui/DecoratedQRCode';

interface CrowdRequest {
  id: string;
  event_qr_code: string;
  request_type: 'song_request' | 'shoutout' | 'tip';
  song_artist: string | null;
  song_title: string | null;
  recipient_name: string | null;
  recipient_message: string | null;
  request_message: string | null; // Message field (used for bundle deals)
  requester_name: string;
  requester_email: string | null;
  requester_venmo_username?: string | null;
  requester_phone: string | null;
  amount_requested: number;
  amount_paid: number;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  payment_code: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  status: string;
  event_name: string | null;
  event_date: string | null;
  is_fast_track: boolean;
  fast_track_fee: number;
  priority_order: number;
  created_at: string;
  paid_at: string | null;
  played_at: string | null;
  organization_id: string | null;
  // New fields for audio uploads
  audio_file_url: string | null;
  is_custom_audio: boolean;
  audio_upload_fee: number;
  artist_rights_confirmed: boolean;
  is_artist: boolean;
  // Charity donation fields (from organization)
  charity_donation_enabled?: boolean;
  charity_donation_percentage?: number;
  charity_name?: string;
  charity_url?: string;
  // Audio tracking fields
  matched_song_detection?: {
    id: string;
    song_title: string;
    song_artist: string;
    recognition_confidence: number | null;
    recognition_timestamp: string;
    auto_marked_as_played: boolean;
  } | null;
  // Music service links
  music_service_links?: {
    spotify: string | null;
    youtube: string | null;
    tidal: string | null;
    apple_music: string | null;
    found_at: string | null;
    search_method: string;
  } | null;
  posted_link?: string | null;
  source_domain?: string | null; // Domain where the request originated from
  // YouTube audio download fields (super admin only)
  downloaded_audio_url?: string | null;
  audio_download_status?: 'pending' | 'processing' | 'completed' | 'failed';
  audio_download_error?: string | null;
  audio_downloaded_at?: string | null;
  // Bidding fields
  bidding_enabled?: boolean;
  bidding_round_id?: string | null;
  current_bid_amount?: number;
  highest_bidder_name?: string | null;
  highest_bidder_email?: string | null;
  is_auction_winner?: boolean;
  auction_won_at?: string | null;
}

export default function CrowdRequestsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [requests, setRequests] = useState<CrowdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('payment');
  const [qrType, setQrType] = useState<'event' | 'public'>('public');
  
  // New feature states
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CrowdRequest | null>(null);
  const [successPageViews, setSuccessPageViews] = useState<any[]>([]);
  const [loadingSuccessViews, setLoadingSuccessViews] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>('all');
  const [eventCodeFilter, setEventCodeFilter] = useState<string>('');
  const [audioUploadFilter, setAudioUploadFilter] = useState<string>('all'); // 'all', 'custom', 'standard'
  const [viewMode, setViewMode] = useState<'all' | 'requests' | 'bids'>('all'); // 'all', 'requests', 'bids'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10000); // Show all requests by default
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [syncingPayments, setSyncingPayments] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showOrphanedDialog, setShowOrphanedDialog] = useState(false);
  const [orphanedPaymentsData, setOrphanedPaymentsData] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [showAudioTrackingModal, setShowAudioTrackingModal] = useState(false);
  const [isAudioModalMinimized, setIsAudioModalMinimized] = useState(false);
  const [selectedEventCode, setSelectedEventCode] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loadingEventId, setLoadingEventId] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Helper function to determine product context for placeholders
  const getProductContext = (): string => {
    // Check organization product context first
    let productContext = organization?.product_context || null;
    
    // If product context is not set or might be wrong, try to detect from hostname
    if (!productContext || productContext === 'm10dj') {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname.includes('tipjar.live')) {
          productContext = 'tipjar';
        } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
          productContext = 'djdash';
        } else if (hostname.includes('m10djcompany.com')) {
          productContext = 'm10dj';
        }
      }
      
      // For localhost, default to tipjar
      if ((!productContext || productContext === 'm10dj') && typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
          productContext = 'tipjar';
        }
      }
    }
    
    // Final fallback: default to tipjar if still not detected
    return productContext || 'tipjar';
  };

  // Helper function to get page title placeholder based on product context
  const getPageTitlePlaceholder = (): string => {
    const productContext = getProductContext();
    
    if (productContext === 'tipjar') {
      return 'Request a Song or Shoutout | TipJar.Live';
    } else if (productContext === 'djdash') {
      return 'Request a Song or Shoutout | DJ Dash';
    } else {
      return 'Request a Song or Shoutout | M10 DJ Company';
    }
  };
  const [headerSettings, setHeaderSettings] = useState({
    artistName: '',
    location: '',
    date: ''
  });
  const [coverPhotoSettings, setCoverPhotoSettings] = useState({
    requests_cover_photo_url: '',
    requests_artist_photo_url: '',
    requests_venue_photo_url: '',
    requests_primary_cover_source: 'artist' as 'artist' | 'venue', // Which to use as primary when both artist and venue are set
  });
  const [coverPhotoHistory, setCoverPhotoHistory] = useState<string[]>([]);
  const [artistPhotoHistory, setArtistPhotoHistory] = useState<string[]>([]);
  const [venuePhotoHistory, setVenuePhotoHistory] = useState<string[]>([]);
  const [pageSettings, setPageSettings] = useState({
    pageTitle: '',
    pageDescription: '',
    mainHeading: '',
    songRequestLabel: '',
    shoutoutLabel: '',
    musicLinkLabel: '',
    musicLinkPlaceholder: '',
    musicLinkHelpText: '',
    manualEntryDivider: '',
    startOverText: '',
    songTitleLabel: '',
    songTitlePlaceholder: '',
    artistNameLabel: '',
    artistNamePlaceholder: '',
    audioUploadLabel: '',
    audioUploadDescription: '',
    artistRightsText: '',
    isArtistText: '',
    audioFeeText: '',
    recipientNameLabel: '',
    recipientNamePlaceholder: '',
    messageLabel: '',
    messagePlaceholder: '',
    submitButtonText: '',
    step1Text: '',
    step2Text: '',
    defaultRequestType: 'song_request',
    showAudioUpload: true,
    showFastTrack: true,
    showNextSong: true,
    showBundleDiscount: true
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [stripeDetails, setStripeDetails] = useState<any>(null);
  const [loadingStripeDetails, setLoadingStripeDetails] = useState(false);
  const [stripeCustomerNames, setStripeCustomerNames] = useState<Record<string, string>>({});
  const [showLinkPaymentModal, setShowLinkPaymentModal] = useState(false);
  const [linkPaymentIntentId, setLinkPaymentIntentId] = useState('');
  const [linkPaymentRequestId, setLinkPaymentRequestId] = useState<string | null>(null);
  const [editingSongDetails, setEditingSongDetails] = useState(false);
  const [editedSongTitle, setEditedSongTitle] = useState('');
  const [editedSongArtist, setEditedSongArtist] = useState('');
  const [savingSongDetails, setSavingSongDetails] = useState(false);
  
  // QR Code Generator State
  const [qrEventCode, setQrEventCode] = useState('');
  const [qrEventName, setQrEventName] = useState('');
  const [qrEventDate, setQrEventDate] = useState('');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [generatedPublicQR, setGeneratedPublicQR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>('');
  const [pdfArtistName, setPdfArtistName] = useState<string>('');
  const [showArtistNameInput, setShowArtistNameInput] = useState(false);
  const [pdfType, setPdfType] = useState<'full-page' | 'table-tent'>('full-page');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    cashAppTag: '$DJbenmurray',
    venmoUsername: '@djbenmurray',
    venmoPhoneNumber: '' // Venmo phone number (digits only) for deep link fallback
  });
  const [requestSettings, setRequestSettings] = useState({
    fastTrackFee: 1000, // in cents ($10.00)
    minimumAmount: 100, // in cents ($1.00)
    presetAmounts: [500, 1000, 2000, 5000], // in cents: $5, $10, $20, $50
    bundleDiscountEnabled: true, // Enable/disable bundle discount feature
    bundleDiscountPercent: 10 // Percentage discount (e.g., 10 = 10%)
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundRequest, setRefundRequest] = useState<CrowdRequest | null>(null);
  // Social Links state
  const [socialLinks, setSocialLinks] = useState<Array<{
    platform: string;
    url: string;
    label: string;
    enabled: boolean;
    order: number;
  }>>([]);
  // Bidding settings state
  const [biddingSettings, setBiddingSettings] = useState({
    enabled: false,
    minimumBid: 500, // in cents
    startingBid: 500 // in cents
  });
  // Bidding state
  const [showBidHistoryModal, setShowBidHistoryModal] = useState(false);
  const [bidHistory, setBidHistory] = useState<any[]>([]);
  const [biddingRound, setBiddingRound] = useState<any>(null);
  const [loadingBidHistory, setLoadingBidHistory] = useState(false);
  const [selectedRequestForBids, setSelectedRequestForBids] = useState<string | null>(null);
  // YouTube audio download state (super admin only)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [downloadingAudio, setDownloadingAudio] = useState<string | null>(null); // requestId being downloaded

  useEffect(() => {
    // Check if user is super admin
    const checkSuperAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { isSuperAdminEmail } = await import('@/utils/auth-helpers/super-admin');
          setIsSuperAdmin(isSuperAdminEmail(user.email));
        }
      } catch (error) {
        console.error('Error checking super admin:', error);
      }
    };
    checkSuperAdmin();
  }, [supabase]);

  useEffect(() => {
    fetchRequests();
    fetchPaymentSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle openRequest query parameter to open request detail modal
  useEffect(() => {
    const { openRequest } = router.query;
    if (openRequest && typeof openRequest === 'string' && requests.length > 0) {
      const request = requests.find(r => r.id === openRequest);
      if (request) {
        openDetailModal(request);
        // Remove the query parameter from URL without reloading
        router.replace('/admin/crowd-requests', undefined, { shallow: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.openRequest, requests]);

  // Reset editing state when modal closes or different request is selected
  useEffect(() => {
    if (!showDetailModal || !selectedRequest) {
      setEditingSongDetails(false);
      setEditedSongTitle('');
      setEditedSongArtist('');
    }
  }, [showDetailModal, selectedRequest?.id]);

  // Fetch available events for audio tracking
  const fetchAvailableEvents = async () => {
    if (!organization?.id) return;
    
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, event_name, event_date, event_qr_code, client_name, venue_name, organization_id')
        .eq('organization_id', organization.id)
        .order('event_date', { ascending: false })
        .limit(100); // Limit to most recent 100 events
      
      if (error) throw error;
      
      setAvailableEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch events when modal opens
  useEffect(() => {
    if (showAudioTrackingModal && organization?.id) {
      fetchAvailableEvents();
    }
  }, [showAudioTrackingModal, organization?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showEventDropdown) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.event-dropdown-container')) {
        setShowEventDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEventDropdown]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchRequests();
      }, 30000); // Refresh every 30 seconds
      setAutoRefreshInterval(interval);
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  const fetchPaymentSettings = async () => {
    try {
      // Get auth token for API calls
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Not authenticated when fetching payment settings');
        return;
      }

      const authToken = session.access_token;

      const response = await fetch('/api/admin-settings', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        const data = result.settings ? Object.entries(result.settings).map(([key, value]) => ({ setting_key: key, setting_value: value })) : [];
        const cashAppSetting = data.find((s: any) => s.setting_key === 'crowd_request_cashapp_tag');
        const venmoSetting = data.find((s: any) => s.setting_key === 'crowd_request_venmo_username');
        const venmoPhoneSetting = data.find((s: any) => s.setting_key === 'crowd_request_venmo_phone_number');
        const fastTrackFeeSetting = data.find((s: any) => s.setting_key === 'crowd_request_fast_track_fee');
        const minimumAmountSetting = data.find((s: any) => s.setting_key === 'crowd_request_minimum_amount');
        const presetAmountsSetting = data.find((s: any) => s.setting_key === 'crowd_request_preset_amounts');
        const bundleDiscountEnabledSetting = data.find((s: any) => s.setting_key === 'crowd_request_bundle_discount_enabled');
        const bundleDiscountPercentSetting = data.find((s: any) => s.setting_key === 'crowd_request_bundle_discount_percent');
        
        if (cashAppSetting) {
          setPaymentSettings(prev => ({ ...prev, cashAppTag: String(cashAppSetting.setting_value ?? '') }));
        }
        if (venmoSetting) {
          setPaymentSettings(prev => ({ ...prev, venmoUsername: String(venmoSetting.setting_value ?? '') }));
        }
        if (venmoPhoneSetting) {
          setPaymentSettings(prev => ({ ...prev, venmoPhoneNumber: String(venmoPhoneSetting.setting_value ?? '') }));
        }
        if (fastTrackFeeSetting) {
          setRequestSettings(prev => ({ ...prev, fastTrackFee: parseInt(String(fastTrackFeeSetting.setting_value || '1000')) || 1000 }));
        }
        if (minimumAmountSetting) {
          setRequestSettings(prev => ({ ...prev, minimumAmount: parseInt(String(minimumAmountSetting.setting_value || '100')) || 100 }));
        }
        if (presetAmountsSetting) {
          try {
            const amounts = JSON.parse(String(presetAmountsSetting.setting_value || '[]'));
            if (Array.isArray(amounts)) {
              setRequestSettings(prev => ({ ...prev, presetAmounts: amounts }));
            }
          } catch (e) {
            console.error('Error parsing preset amounts:', e);
          }
        }
        if (bundleDiscountEnabledSetting) {
          setRequestSettings(prev => ({ ...prev, bundleDiscountEnabled: String(bundleDiscountEnabledSetting.setting_value) === 'true' }));
        }
        if (bundleDiscountPercentSetting) {
          setRequestSettings(prev => ({ ...prev, bundleDiscountPercent: parseInt(String(bundleDiscountPercentSetting.setting_value || '10')) || 10 }));
        }
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      // Get auth token for API calls
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please sign in again.');
      }

      const authToken = session.access_token;

      // Helper function to save admin setting
      const saveAdminSetting = async (settingKey: string, settingValue: string) => {
        const response = await fetch('/api/admin-settings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            settingKey,
            settingValue
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to save ${settingKey}`);
        }

        return response.json();
      };

      // Save CashApp tag
      await saveAdminSetting('crowd_request_cashapp_tag', paymentSettings.cashAppTag);

      // Save Venmo username
      await saveAdminSetting('crowd_request_venmo_username', paymentSettings.venmoUsername);

      // Save Venmo phone number (for deep link fallback - prevents phone verification)
      if (paymentSettings.venmoPhoneNumber) {
        await saveAdminSetting('crowd_request_venmo_phone_number', paymentSettings.venmoPhoneNumber);
      }

      // Save fast-track fee
      await saveAdminSetting('crowd_request_fast_track_fee', requestSettings.fastTrackFee.toString());

      // Save minimum amount
      await saveAdminSetting('crowd_request_minimum_amount', requestSettings.minimumAmount.toString());

      // Save preset amounts
      await saveAdminSetting('crowd_request_preset_amounts', JSON.stringify(requestSettings.presetAmounts));

      // Save bundle discount enabled
      await saveAdminSetting('crowd_request_bundle_discount_enabled', requestSettings.bundleDiscountEnabled.toString());

      // Save bundle discount percentage
      await saveAdminSetting('crowd_request_bundle_discount_percent', requestSettings.bundleDiscountPercent.toString());

      // Save header and page settings to organization
      if (organization?.id) {
        // Only save fields that we know exist in the organizations table
        // Store detailed page settings in a JSONB field if available
        const updateData: any = {
          // Header settings (confirmed to exist)
          requests_header_artist_name: headerSettings.artistName || null,
          requests_header_location: headerSettings.location || null,
          requests_header_date: headerSettings.date || null,
          // Cover photo settings (confirmed to exist)
          requests_cover_photo_url: coverPhotoSettings.requests_cover_photo_url || null,
          requests_artist_photo_url: coverPhotoSettings.requests_artist_photo_url || null,
          requests_venue_photo_url: coverPhotoSettings.requests_venue_photo_url || null,
          requests_primary_cover_source: coverPhotoSettings.requests_primary_cover_source || 'artist',
        };

        // Helper function to update photo history
        const updatePhotoHistory = (
          currentUrl: string | undefined,
          currentHistory: string[],
          orgHistoryField: any
        ): string[] => {
          const url = currentUrl?.trim();
          if (!url || !url.startsWith('http')) {
            // Keep existing history if no valid URL
            return currentHistory.length > 0 
              ? currentHistory 
              : (orgHistoryField 
                  ? (Array.isArray(orgHistoryField) 
                      ? orgHistoryField
                      : (typeof orgHistoryField === 'string'
                          ? JSON.parse(orgHistoryField)
                          : []))
                  : []);
          }
          
          // Start with existing history from state, or from organization if state is empty
          const baseHistory = currentHistory.length > 0 
            ? [...currentHistory] 
            : (orgHistoryField 
                ? (Array.isArray(orgHistoryField) 
                    ? [...orgHistoryField]
                    : (typeof orgHistoryField === 'string'
                        ? JSON.parse(orgHistoryField)
                        : []))
                : []);
          
          const updatedHistory = [...baseHistory];
          // Remove if already exists (to move to front)
          const existingIndex = updatedHistory.indexOf(url);
          if (existingIndex > -1) {
            updatedHistory.splice(existingIndex, 1);
          }
          // Add to front (most recent first)
          updatedHistory.unshift(url);
          // Keep only last 20 URLs
          return updatedHistory.slice(0, 20);
        };

        // Update cover photo history
        const updatedCoverHistory = updatePhotoHistory(
          coverPhotoSettings.requests_cover_photo_url,
          coverPhotoHistory,
          organization?.requests_cover_photo_history
        );
        updateData.requests_cover_photo_history = updatedCoverHistory;
        setCoverPhotoHistory(updatedCoverHistory);

        // Update artist photo history
        const updatedArtistHistory = updatePhotoHistory(
          coverPhotoSettings.requests_artist_photo_url,
          artistPhotoHistory,
          organization?.requests_artist_photo_history
        );
        updateData.requests_artist_photo_history = updatedArtistHistory;
        setArtistPhotoHistory(updatedArtistHistory);

        // Update venue photo history
        const updatedVenueHistory = updatePhotoHistory(
          coverPhotoSettings.requests_venue_photo_url,
          venuePhotoHistory,
          organization?.requests_venue_photo_history
        );
        updateData.requests_venue_photo_history = updatedVenueHistory;
        setVenuePhotoHistory(updatedVenueHistory);

        // Log the primary cover source being saved
        console.log('🎯 Saving primary cover source:', {
          requests_primary_cover_source: coverPhotoSettings.requests_primary_cover_source,
          hasArtist: !!coverPhotoSettings.requests_artist_photo_url,
          artistUrl: coverPhotoSettings.requests_artist_photo_url,
          hasVenue: !!coverPhotoSettings.requests_venue_photo_url,
          venueUrl: coverPhotoSettings.requests_venue_photo_url,
          primaryCoverUrl: coverPhotoSettings.requests_cover_photo_url
        });

        // Add all page settings fields (after migration, all should exist)
        updateData.requests_page_title = pageSettings.pageTitle || null;
        updateData.requests_page_description = pageSettings.pageDescription || null;
        updateData.requests_main_heading = pageSettings.mainHeading || null;
        updateData.requests_song_request_label = pageSettings.songRequestLabel || null;
        updateData.requests_shoutout_label = pageSettings.shoutoutLabel || null;
        updateData.requests_music_link_label = pageSettings.musicLinkLabel || null;
        updateData.requests_music_link_placeholder = pageSettings.musicLinkPlaceholder || null;
        updateData.requests_music_link_help_text = pageSettings.musicLinkHelpText || null;
        updateData.requests_manual_entry_divider = pageSettings.manualEntryDivider || null;
        updateData.requests_start_over_text = pageSettings.startOverText || null;
        updateData.requests_song_title_label = pageSettings.songTitleLabel || null;
        updateData.requests_song_title_placeholder = pageSettings.songTitlePlaceholder || null;
        updateData.requests_artist_name_label = pageSettings.artistNameLabel || null;
        updateData.requests_artist_name_placeholder = pageSettings.artistNamePlaceholder || null;
        updateData.requests_audio_upload_label = pageSettings.audioUploadLabel || null;
        updateData.requests_audio_upload_description = pageSettings.audioUploadDescription || null;
        updateData.requests_artist_rights_text = pageSettings.artistRightsText || null;
        updateData.requests_is_artist_text = pageSettings.isArtistText || null;
        updateData.requests_audio_fee_text = pageSettings.audioFeeText || null;
        updateData.requests_recipient_name_label = pageSettings.recipientNameLabel || null;
        updateData.requests_recipient_name_placeholder = pageSettings.recipientNamePlaceholder || null;
        updateData.requests_message_label = pageSettings.messageLabel || null;
        updateData.requests_message_placeholder = pageSettings.messagePlaceholder || null;
        updateData.requests_submit_button_text = pageSettings.submitButtonText || null;
        updateData.requests_step_1_text = pageSettings.step1Text || null;
        updateData.requests_step_2_text = pageSettings.step2Text || null;
        updateData.requests_default_request_type = pageSettings.defaultRequestType || 'song_request';
        updateData.requests_show_audio_upload = pageSettings.showAudioUpload;
        updateData.requests_show_fast_track = pageSettings.showFastTrack;
        updateData.requests_show_next_song = pageSettings.showNextSong;
        updateData.requests_show_bundle_discount = pageSettings.showBundleDiscount;
        
        // Save social links (filter out empty ones)
        const validSocialLinks = socialLinks
          .filter(link => link.url.trim() !== '' && link.label.trim() !== '')
          .map(link => ({
            ...link,
            url: link.url.trim(),
            label: link.label.trim(),
          }));
        updateData.social_links = validSocialLinks;
        
        // Save bidding settings
        updateData.requests_bidding_enabled = biddingSettings.enabled;
        updateData.requests_bidding_minimum_bid = biddingSettings.minimumBid;
        updateData.requests_bidding_starting_bid = biddingSettings.startingBid;

        const { data: updatedOrg, error: orgError } = await (supabase
          .from('organizations') as any)
          .update(updateData)
          .eq('id', organization.id)
          .select()
          .single();

        if (orgError) {
          console.error('Error updating organization:', orgError);
          
          // If error is about missing columns, try updating with only basic fields
          if (orgError.message?.includes('column') && orgError.message?.includes('does not exist')) {
            console.warn('Some columns do not exist, retrying with basic fields only');
            
            // Remove JSONB field and any other potentially missing fields
            const basicUpdateData: any = {
              requests_header_artist_name: headerSettings.artistName || null,
              requests_header_location: headerSettings.location || null,
              requests_header_date: headerSettings.date || null,
              requests_cover_photo_url: coverPhotoSettings.requests_cover_photo_url || null,
              requests_artist_photo_url: coverPhotoSettings.requests_artist_photo_url || null,
              requests_venue_photo_url: coverPhotoSettings.requests_venue_photo_url || null,
            };
            
            // Only add page fields that we're confident exist
            if (organization.requests_page_title !== undefined) {
              basicUpdateData.requests_page_title = pageSettings.pageTitle || null;
            }
            if (organization.requests_page_description !== undefined) {
              basicUpdateData.requests_page_description = pageSettings.pageDescription || null;
            }
            if (organization.requests_main_heading !== undefined) {
              basicUpdateData.requests_main_heading = pageSettings.mainHeading || null;
            }
            
            const { data: retryOrg, error: retryError } = await (supabase
              .from('organizations') as any)
              .update(basicUpdateData)
              .eq('id', organization.id)
              .select()
              .single();
              
            if (retryError) {
              throw new Error(`Failed to save organization settings: ${retryError.message}`);
            }
            
            // Update local state with retry result
            if (retryOrg) {
              setOrganization(retryOrg);
            }
            
            // Show warning that some settings couldn't be saved
            toast({
              title: 'Settings Partially Saved',
              description: 'Basic settings saved successfully. Some advanced page settings could not be saved as the database columns do not exist yet.',
              variant: 'default',
            });
            return; // Exit early since we handled the error
          }
          
          throw new Error(`Failed to save organization settings: ${orgError.message}`);
        }

        // Update local organization state with new data
        if (updatedOrg) {
          setOrganization(updatedOrg);
          console.log('✅ Organization updated successfully:', updatedOrg);
        }
      }

      console.log('✅ All settings saved successfully');
      
      // Refresh organization data to show updated values
      if (organization?.id) {
        const { data: refreshedOrg, error: refreshError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organization.id)
          .single() as any;
        
        if (refreshError) {
          console.error('Error refreshing organization:', refreshError);
        } else if (refreshedOrg) {
          const org = refreshedOrg as any;
          setOrganization(org);
          // Update cover photo history from refreshed org
          let history: string[] = [];
          if (org.requests_cover_photo_history) {
            if (Array.isArray(org.requests_cover_photo_history)) {
              history = org.requests_cover_photo_history;
            } else if (typeof org.requests_cover_photo_history === 'string') {
              try {
                history = JSON.parse(org.requests_cover_photo_history);
              } catch (e) {
                console.warn('Failed to parse cover photo history:', e);
                history = [];
              }
            }
          }
          setCoverPhotoHistory(history);
          setHeaderSettings({
            artistName: org.requests_header_artist_name || '',
            location: org.requests_header_location || '',
            date: org.requests_header_date || ''
          });
          setCoverPhotoSettings({
            requests_cover_photo_url: org.requests_cover_photo_url || '',
            requests_artist_photo_url: org.requests_artist_photo_url || '',
            requests_venue_photo_url: org.requests_venue_photo_url || '',
            requests_primary_cover_source: (org.requests_primary_cover_source as 'artist' | 'venue') || 'artist',
          });
          // Helper to load photo history
          const loadPhotoHistory = (historyData: any): string[] => {
            if (!historyData) return [];
            if (Array.isArray(historyData)) return historyData;
            if (typeof historyData === 'string') {
              try {
                return JSON.parse(historyData);
              } catch (e) {
                console.warn('Failed to parse photo history:', e);
                return [];
              }
            }
            return [];
          };

          // Update all photo histories from refreshed org
          setCoverPhotoHistory(loadPhotoHistory(org.requests_cover_photo_history));
          setArtistPhotoHistory(loadPhotoHistory(org.requests_artist_photo_history));
          setVenuePhotoHistory(loadPhotoHistory(org.requests_venue_photo_history));
          
          // Update social links
          if (org.social_links && Array.isArray(org.social_links)) {
            setSocialLinks(org.social_links.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
          }
          
          // Update bidding settings
          setBiddingSettings({
            enabled: org.requests_bidding_enabled || false,
            minimumBid: org.requests_bidding_minimum_bid || 500,
            startingBid: org.requests_bidding_starting_bid || 500
          });
          
          console.log('✅ Organization data refreshed:', org);
          console.log('🎯 Primary cover source after refresh:', {
            requests_primary_cover_source: org.requests_primary_cover_source,
            requests_artist_photo_url: org.requests_artist_photo_url,
            requests_venue_photo_url: org.requests_venue_photo_url,
            requests_cover_photo_url: org.requests_cover_photo_url
          });
        }
      }

      // Show success toast
      console.log('📢 Showing success toast...');
      toast({
        title: 'Settings Saved',
        description: 'All settings have been saved successfully. Changes will appear on the public requests page within 10 seconds.',
      });
      console.log('✅ Toast called');
      
      // Force a small delay to ensure database write is complete
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Sync payment status from Stripe for requests that might be out of sync
  const syncPaymentStatusFromStripe = async (requests: CrowdRequest[], showToast = true) => {
    if (requests.length === 0) {
      if (showToast) {
        toast({
          title: 'No Requests to Sync',
          description: 'No requests found that need payment status sync',
        });
      }
      return;
    }
    
    setSyncingPayments(true);
    const updates: Array<{ id: string; payment_status: string; amount_paid: number; paid_at: string | null; payment_intent_id?: string }> = [];
    
    // Check payment status in parallel (limit to 10 at a time to avoid rate limits)
    const batches = [];
    for (let i = 0; i < requests.length; i += 10) {
      batches.push(requests.slice(i, i + 10));
    }
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (request) => {
          try {
            if (!request.payment_intent_id && !(request as any).stripe_session_id) return;
            
            const params = new URLSearchParams();
            if (request.payment_intent_id) {
              params.append('paymentIntentId', request.payment_intent_id);
            }
            if ((request as any).stripe_session_id) {
              params.append('sessionId', (request as any).stripe_session_id);
            }
            if (request.id) {
              params.append('requestId', request.id);
            }
            
            const response = await fetch(`/api/crowd-request/stripe-details?${params.toString()}`);
            if (response.ok) {
              const data = await response.json();
              const paymentIntent = data.stripe?.paymentIntent;
              const session = data.stripe?.session;
              
              // Check if payment succeeded in Stripe
              const paymentSucceeded = paymentIntent?.status === 'succeeded' || 
                                      session?.payment_status === 'paid' ||
                                      data.stripe?.charge?.paid === true;
              
              // If payment succeeded in Stripe but status is not 'paid' in DB, or amount mismatch, update it
              const needsUpdate = paymentSucceeded && (
                request.payment_status !== 'paid' || 
                request.amount_paid === 0 ||
                (paymentIntent && request.amount_paid !== paymentIntent.amount) ||
                (session && request.amount_paid !== session.amount_total)
              );
              
              if (needsUpdate) {
                const amount = paymentIntent?.amount || session?.amount_total || request.amount_paid || 0;
                const paymentIntentId = paymentIntent?.id || request.payment_intent_id;
                const paidAt = paymentIntent?.created 
                  ? new Date(paymentIntent.created * 1000).toISOString() 
                  : session?.created 
                  ? new Date(session.created * 1000).toISOString()
                  : null;
                
                updates.push({
                  id: request.id,
                  payment_status: 'paid',
                  amount_paid: amount,
                  paid_at: paidAt,
                  payment_intent_id: paymentIntentId
                });
              }
            }
          } catch (error) {
            console.error(`Error syncing payment status for request ${request.id}:`, error);
          }
        })
      );
    }
    
    // Update database for all requests that need status updates
    if (updates.length > 0) {
      try {
        const updatePromises = updates.map(async (update) => {
          const updateData: any = {
            payment_status: update.payment_status,
            amount_paid: update.amount_paid,
            paid_at: update.paid_at,
            updated_at: new Date().toISOString()
          };
          
          // Also update payment_intent_id if we found it and it wasn't set
          if (update.payment_intent_id) {
            updateData.payment_intent_id = update.payment_intent_id;
          }
          
          const { error } = await (supabase
            .from('crowd_requests') as any)
            .update(updateData)
            .eq('id', update.id);
          
          if (error) {
            console.error(`Error updating payment status for request ${update.id}:`, error);
          }
        });
        
        await Promise.all(updatePromises);
        
        // Update local state to reflect the changes without full refresh
        setRequests(prevRequests => 
          prevRequests.map(req => {
            const update = updates.find(u => u.id === req.id);
            if (update) {
              return {
                ...req,
                payment_status: update.payment_status as any,
                amount_paid: update.amount_paid,
                paid_at: update.paid_at,
                payment_intent_id: update.payment_intent_id || req.payment_intent_id
              };
            }
            return req;
          })
        );
        
        if (updates.length > 0 && showToast) {
          toast({
            title: 'Payment Status Synced',
            description: `Updated ${updates.length} request(s) to paid status from Stripe`,
          });
        }
        console.log(`✅ Synced payment status for ${updates.length} request(s)`);
      } catch (error) {
        console.error('Error updating payment statuses:', error);
        if (showToast) {
          toast({
            title: 'Sync Error',
            description: 'Failed to sync payment statuses',
            variant: 'destructive',
          });
        }
      }
    } else {
      if (showToast) {
        toast({
          title: 'Sync Complete',
          description: 'All payment statuses are up to date',
        });
      }
      console.log('ℹ️ No payment status updates needed');
    }
    
    setSyncingPayments(false);
  };
  
  // Manual sync button handler
  const handleManualSync = async () => {
    setSyncingPayments(true);
    
    try {
      // First, try to find orphaned payments (payments in Stripe but no payment_intent_id in DB)
      try {
        const orphanedResponse = await fetch('/api/crowd-request/sync-orphaned-payments', {
          method: 'POST',
        });
        
        if (orphanedResponse.ok) {
          const orphanedData = await orphanedResponse.json();
          if (orphanedData.synced > 0) {
            toast({
              title: 'Orphaned Payments Found',
              description: `Found and synced ${orphanedData.synced} payment(s) from Stripe`,
            });
          }
        }
      } catch (error) {
        console.error('Error syncing orphaned payments:', error);
        // Continue with regular sync even if orphaned sync fails
      }
      
      // Then sync all requests that have payment_intent_id or stripe_session_id
      const requestsToSync = requests.filter(
        (req: CrowdRequest) => 
          (req.payment_intent_id || (req as any).stripe_session_id) && 
          req.payment_status !== 'paid'
      );
      
      if (requestsToSync.length > 0) {
        await syncPaymentStatusFromStripe(requestsToSync, true);
      }
      
      // Refresh the requests list to show updated statuses
      await fetchRequests();
    } finally {
      setSyncingPayments(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Get current user's organization using the helper function
      // This handles both owner and team member cases
      const org = await getCurrentOrganization(supabase) as any;

      if (!org) {
        throw new Error('No organization found');
      }

      setOrganization(org);
      
      // Set brand colors for admin UI (with black fallback for TipJar if not set)
      const isTipJar = org.product_context === 'tipjar';
      const defaultAccent = isTipJar ? '#000000' : '#fcba00';
      const accent = org.requests_accent_color || defaultAccent;
      const secondary1 = org.requests_secondary_color_1 || accent || defaultAccent;
      const secondary2 = org.requests_secondary_color_2 || accent || defaultAccent;
      
      // Apply brand colors to CSS variables (will be used in style tag below)
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--admin-brand-color', accent);
        document.documentElement.style.setProperty('--admin-brand-color-hover', `${accent}dd`);
        document.documentElement.style.setProperty('--admin-secondary-color-1', secondary1);
        document.documentElement.style.setProperty('--admin-secondary-color-2', secondary2);
      }
      
      setHeaderSettings({
        artistName: org.requests_header_artist_name || '',
        location: org.requests_header_location || '',
        date: org.requests_header_date || ''
      });
      setCoverPhotoSettings({
        requests_cover_photo_url: org.requests_cover_photo_url || '',
        requests_artist_photo_url: org.requests_artist_photo_url || '',
        requests_venue_photo_url: org.requests_venue_photo_url || '',
        requests_primary_cover_source: (org.requests_primary_cover_source as 'artist' | 'venue') || 'artist',
      });
      // Load cover photo history - handle both JSONB array and string array
      const loadPhotoHistory = (historyData: any): string[] => {
        if (!historyData) return [];
        if (Array.isArray(historyData)) return historyData;
        if (typeof historyData === 'string') {
          try {
            return JSON.parse(historyData);
          } catch (e) {
            console.warn('Failed to parse photo history:', e);
            return [];
          }
        }
        return [];
      };
      
      setCoverPhotoHistory(loadPhotoHistory(org.requests_cover_photo_history));
      setArtistPhotoHistory(loadPhotoHistory(org.requests_artist_photo_history));
      setVenuePhotoHistory(loadPhotoHistory(org.requests_venue_photo_history));
      setPageSettings({
        pageTitle: org.requests_page_title || '',
        pageDescription: org.requests_page_description || '',
        mainHeading: org.requests_main_heading || '',
        songRequestLabel: org.requests_song_request_label || '',
        shoutoutLabel: org.requests_shoutout_label || '',
        musicLinkLabel: org.requests_music_link_label || '',
        musicLinkPlaceholder: org.requests_music_link_placeholder || '',
        musicLinkHelpText: org.requests_music_link_help_text || '',
        manualEntryDivider: org.requests_manual_entry_divider || '',
        startOverText: org.requests_start_over_text || '',
        songTitleLabel: org.requests_song_title_label || '',
        songTitlePlaceholder: org.requests_song_title_placeholder || '',
        artistNameLabel: org.requests_artist_name_label || '',
        artistNamePlaceholder: org.requests_artist_name_placeholder || '',
        audioUploadLabel: org.requests_audio_upload_label || '',
        audioUploadDescription: org.requests_audio_upload_description || '',
        artistRightsText: org.requests_artist_rights_text || '',
        isArtistText: org.requests_is_artist_text || '',
        audioFeeText: org.requests_audio_fee_text || '',
        recipientNameLabel: org.requests_recipient_name_label || '',
        recipientNamePlaceholder: org.requests_recipient_name_placeholder || '',
        messageLabel: org.requests_message_label || '',
        messagePlaceholder: org.requests_message_placeholder || '',
        submitButtonText: org.requests_submit_button_text || '',
        step1Text: org.requests_step_1_text || '',
        step2Text: org.requests_step_2_text || '',
        defaultRequestType: org.requests_default_request_type || 'song_request',
        showAudioUpload: org.requests_show_audio_upload !== false,
        showFastTrack: org.requests_show_fast_track !== false,
        showNextSong: org.requests_show_next_song !== false,
        showBundleDiscount: org.requests_show_bundle_discount !== false
      });

      // Filter by organization_id OR null (to catch orphaned requests that need assignment)
      // Also include requests from other organizations to catch any missing requests
      // Note: We'll handle sorting in the frontend to allow dynamic column sorting
      // 
      // IMPORTANT: Show ALL requests, not just current organization
      // This ensures Venmo payments from other orgs or orphaned requests are visible
      // The RLS policy allows admins to view all requests, so we don't filter by organization_id
      const { data, error } = await supabase
        .from('crowd_requests')
        .select(`
          *,
          organization:organization_id (
            id,
            name,
            slug
          )
        `)
        // Show ALL requests regardless of organization_id
        // This ensures we don't miss any requests that might have been created with a different org_id
        .order('created_at', { ascending: false })
        .limit(10000); // Large limit to show all requests (adjust if needed)

      if (error) throw error;
      
      // Fetch songs_played data for song requests that are marked as played
      const songRequestIds = (data || [])
        .filter((req: CrowdRequest) => req.request_type === 'song_request' && req.status === 'played')
        .map((req: CrowdRequest) => req.id);
      
      let songsDetectedMap: Record<string, any> = {};
      if (songRequestIds.length > 0) {
        try {
          const { data: songsDetected, error: songsError } = await supabase
            .from('songs_played')
            .select('id, song_title, song_artist, recognition_confidence, recognition_timestamp, auto_marked_as_played, matched_crowd_request_id')
            .in('matched_crowd_request_id', songRequestIds);
          
          if (songsError) {
            // Check if it's a table not found error (500) or permission issue
            if (songsError.code === 'PGRST116' || songsError.message?.includes('relation') || songsError.message?.includes('does not exist')) {
              console.warn('songs_played table not found or not accessible (non-critical):', songsError.message);
            } else if (songsError.message?.includes('infinite recursion') || songsError.message?.includes('policy')) {
              // Handle infinite recursion in RLS policies gracefully
              console.warn('songs_played table has policy recursion issue (non-critical):', songsError.message);
            } else {
              console.warn('Error fetching songs_played data (non-critical):', songsError);
            }
            // Don't throw - this is optional data
          } else if (songsDetected) {
            songsDetected.forEach((song: any) => {
              if (song.matched_crowd_request_id) {
                songsDetectedMap[song.matched_crowd_request_id] = song;
              }
            });
          }
        } catch (err) {
          console.warn('Error querying songs_played table (non-critical):', err);
          // Continue without songs_played data - this is optional
        }
      }
      
      // Attach detection data to requests
      const requestsWithDetection = (data || []).map((req: CrowdRequest) => ({
        ...req,
        matched_song_detection: songsDetectedMap[req.id] || null
      }));
      
      // Deduplicate requests by ID (RLS policies can sometimes return duplicates)
      const seenIds = new Set<string>();
      const deduplicatedRequests = requestsWithDetection.filter((req: CrowdRequest) => {
        if (seenIds.has(req.id)) {
          return false;
        }
        seenIds.add(req.id);
        return true;
      });
      
      setRequests(deduplicatedRequests);
      
      // Fetch Stripe customer names for requests that need them
      // NOTE: New requests (after making name mandatory) will always have a name.
      // This check is for legacy records that may still have "Guest" or empty names.
      const requestsNeedingNames = (data || []).filter(
        (req: CrowdRequest) => 
          (req.payment_intent_id || (req as any).stripe_session_id) && 
          (!req.requester_name || req.requester_name === 'Guest')
      );
      
      if (requestsNeedingNames.length > 0) {
        fetchStripeNamesForRequests(requestsNeedingNames);
      }
      
      // Sync payment status from Stripe for requests that might be out of sync
      // Check all requests with payment_intent_id or stripe_session_id that aren't already marked as paid
      const requestsNeedingStatusSync = (data || []).filter(
        (req: CrowdRequest) => 
          (req.payment_intent_id || (req as any).stripe_session_id) && 
          req.payment_status !== 'paid'
      );
      
      if (requestsNeedingStatusSync.length > 0) {
        syncPaymentStatusFromStripe(requestsNeedingStatusSync);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load crowd requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stripe customer names for multiple requests
  const fetchStripeNamesForRequests = async (requests: CrowdRequest[]) => {
    const nameMap: Record<string, string> = {};
    
    // Fetch names in parallel (limit to 10 at a time to avoid rate limits)
    const batches = [];
    for (let i = 0; i < requests.length; i += 10) {
      batches.push(requests.slice(i, i + 10));
    }
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (request) => {
          try {
            const params = new URLSearchParams();
            if (request.id) params.append('requestId', request.id);
            if (request.payment_intent_id) params.append('paymentIntentId', request.payment_intent_id);
            if ((request as any).stripe_session_id) params.append('sessionId', (request as any).stripe_session_id);
            
            const response = await fetch(`/api/crowd-request/stripe-details?${params.toString()}`);
            if (response.ok) {
              const data = await response.json();
              const stripe = data.stripe;
              // Try customer.name first, then billing_details.name
              const name = stripe?.customer?.name || 
                          stripe?.charge?.billing_details?.name ||
                          stripe?.session?.customer_details?.name;
              if (name && name !== 'Guest' && request.id) {
                nameMap[request.id] = name;
              }
            }
          } catch (error) {
            console.error(`Error fetching Stripe name for request ${request.id}:`, error);
          }
        })
      );
    }
    
    if (Object.keys(nameMap).length > 0) {
      setStripeCustomerNames(prev => ({ ...prev, ...nameMap }));
    }
  };

  const openVenmoRefund = (request: CrowdRequest) => {
    const amount = request.amount_paid / 100; // Convert cents to dollars
    const amountStr = amount.toFixed(2);
    
    // Build note for the refund
    const note = request.request_type === 'song_request' 
      ? `Refund: ${request.song_title || 'Song'}${request.song_artist ? ` by ${request.song_artist}` : ''}`
      : `Refund: Shoutout for ${request.recipient_name || 'Recipient'}`;
    const encodedNote = encodeURIComponent(note.substring(0, 200));
    
    // Try to use customer's phone number if available
    // Venmo deep links can accept phone numbers (digits only)
    let recipient = '';
    if (request.requester_phone) {
      // Remove any non-digit characters from phone number
      const phoneDigits = request.requester_phone.replace(/\D/g, '');
      if (phoneDigits.length >= 10) {
        recipient = phoneDigits;
      }
    }
    
    // Venmo URL format for sending payment (refund):
    // venmo://paycharge?txn=pay&recipients=phone_or_username&amount=5.00&note=Refund
    // If no recipient, just open Venmo with amount (admin will search for customer)
    let venmoUrl: string;
    let webUrl: string;
    
    if (recipient) {
      venmoUrl = `venmo://paycharge?txn=pay&recipients=${recipient}&amount=${amountStr}&note=${encodedNote}`;
      webUrl = `https://venmo.com/${recipient}?txn=pay&amount=${amountStr}&note=${encodedNote}`;
    } else {
      // No recipient - just open Venmo with amount pre-filled
      venmoUrl = `venmo://paycharge?txn=pay&amount=${amountStr}&note=${encodedNote}`;
      webUrl = `https://venmo.com/?txn=pay&amount=${amountStr}&note=${encodedNote}`;
    }
    
    // Try to open Venmo app, fallback to web
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobile = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    
    if (isMobile) {
      // Try to open Venmo app
      window.location.href = venmoUrl;
      // Fallback to web after a delay if app doesn't open
      setTimeout(() => {
        window.open(webUrl, '_blank');
      }, 500);
    } else {
      // Desktop - open web version
      window.open(webUrl, '_blank');
    }
  };

  const handleRefund = async (requestId: string, fullRefund: boolean = true, partialAmount?: number) => {
    if (!confirm(`Are you sure you want to ${fullRefund ? 'fully' : 'partially'} refund this payment?`)) {
      return;
    }

    try {
      const response = await fetch('/api/crowd-request/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          amount: fullRefund ? undefined : partialAmount,
          reason: 'requested_by_admin',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      toast({
        title: 'Success',
        description: data.message || 'Refund processed successfully',
      });

      // Refresh requests to show updated status
      fetchRequests();
      setShowRefundModal(false);
      setRefundRequest(null);
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process refund',
        variant: 'destructive',
      });
    }
  };

  const handleVenmoRefundClick = (request: CrowdRequest) => {
    setRefundRequest(request);
    setShowRefundModal(true);
  };

  const generateQRCode = () => {
    // Safety check: ensure organization is loaded
    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organization not loaded. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    // Determine base URL based on product context
    // Check multiple sources to ensure we get the correct product context
    let productContext = organization.product_context || null;
    
    // If product context is not set or might be wrong, try to detect from multiple sources
    if (!productContext || productContext === 'm10dj') {
      // Try to detect from current domain first
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname.includes('tipjar.live')) {
          productContext = 'tipjar';
        } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
          productContext = 'djdash';
        } else if (hostname.includes('m10djcompany.com')) {
          productContext = 'm10dj';
        }
      }
      
      // If on localhost and still not detected, check user metadata or environment
      if ((!productContext || productContext === 'm10dj') && typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
          // On localhost, check environment variables or default to tipjar
          // This helps with development when product_context might be incorrectly set
          if (process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT === 'tipjar') {
            productContext = 'tipjar';
          } else if (process.env.NEXT_PUBLIC_DJDASH_URL || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT === 'djdash') {
            productContext = 'djdash';
          } else {
            // For localhost development, default to tipjar if product_context was m10dj
            // This helps fix cases where organization was created with wrong product_context
            productContext = 'tipjar';
          }
        }
      }
    }
    
    // Final fallback: default to tipjar if still not detected
    productContext = productContext || 'tipjar';
    
    // Debug logging
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'))) {
      console.log('[QR Code] Product context detection:', {
        organization_product_context: organization.product_context,
        detected_product_context: productContext,
        hostname: window.location.hostname,
        organization_slug: organization.slug
      });
    }
    
    let baseUrl: string;
    switch (productContext) {
      case 'tipjar':
        baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://tipjar.live';
        break;
      case 'djdash':
        baseUrl = process.env.NEXT_PUBLIC_DJDASH_URL || 'https://djdash.net';
        break;
      case 'm10dj':
        baseUrl = process.env.NEXT_PUBLIC_M10DJ_URL || 'https://m10djcompany.com';
        break;
      default:
        // Fallback: check current domain
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname.toLowerCase();
          if (hostname.includes('tipjar.live')) {
            baseUrl = 'https://tipjar.live';
          } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
            baseUrl = 'https://djdash.net';
          } else {
            baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
          }
        } else {
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
        }
    }

    let requestUrl: string;
    let qrCodeUrl: string;

    if (qrType === 'public') {
      // Generate QR for public requests page
      // Always use slug-based URLs when slug is available (for all product contexts)
      if (organization.slug) {
        // Use slug-based URLs: {domain}/{slug}/requests?qr=1
        requestUrl = `${baseUrl}/${organization.slug}/requests?qr=1`;
      } else {
        // Fallback: use generic /requests path if no slug
        requestUrl = `${baseUrl}/requests?qr=1`;
      }
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(requestUrl)}`;
      setGeneratedPublicQR(qrCodeUrl);
      setGeneratedQR(null);
    } else {
      // Generate QR for event-specific page
      if (!qrEventCode.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter an event code',
          variant: 'destructive',
        });
        return;
      }
      // Add ?qr=1 to automatically mark scans as QR code scans
      requestUrl = `${baseUrl}/crowd-request/${encodeURIComponent(qrEventCode)}?qr=1`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(requestUrl)}`;
      setGeneratedQR(qrCodeUrl);
      setGeneratedPublicQR(null);
    }
    
    toast({
      title: 'QR Code Generated',
      description: 'Your QR code is ready!',
    });
  };

  const copyQRUrl = () => {
    // Safety check: ensure organization is loaded
    if (!organization) {
      toast({
        title: 'Error',
        description: 'Organization not loaded. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    // Determine base URL based on product context
    // Check multiple sources to ensure we get the correct product context
    let productContext = organization.product_context || null;
    
    // If product context is not set or might be wrong, try to detect from multiple sources
    if (!productContext || productContext === 'm10dj') {
      // Try to detect from current domain first
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname.includes('tipjar.live')) {
          productContext = 'tipjar';
        } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
          productContext = 'djdash';
        } else if (hostname.includes('m10djcompany.com')) {
          productContext = 'm10dj';
        }
      }
      
      // If on localhost and still not detected, check user metadata or environment
      if ((!productContext || productContext === 'm10dj') && typeof window !== 'undefined') {
        const hostname = window.location.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
          // On localhost, check environment variables or default to tipjar
          // This helps with development when product_context might be incorrectly set
          if (process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT === 'tipjar') {
            productContext = 'tipjar';
          } else if (process.env.NEXT_PUBLIC_DJDASH_URL || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT === 'djdash') {
            productContext = 'djdash';
          } else {
            // For localhost development, default to tipjar if product_context was m10dj
            // This helps fix cases where organization was created with wrong product_context
            productContext = 'tipjar';
          }
        }
      }
    }
    
    // Final fallback: default to tipjar if still not detected
    productContext = productContext || 'tipjar';
    
    let baseUrl: string;
    switch (productContext) {
      case 'tipjar':
        baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://tipjar.live';
        break;
      case 'djdash':
        baseUrl = process.env.NEXT_PUBLIC_DJDASH_URL || 'https://djdash.net';
        break;
      case 'm10dj':
        baseUrl = process.env.NEXT_PUBLIC_M10DJ_URL || 'https://m10djcompany.com';
        break;
      default:
        // Fallback: check current domain
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname.toLowerCase();
          if (hostname.includes('tipjar.live')) {
            baseUrl = 'https://tipjar.live';
          } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
            baseUrl = 'https://djdash.net';
          } else {
            baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
          }
        } else {
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
        }
    }

    let requestUrl: string;
    
    if (qrType === 'public') {
      // Always use slug-based URLs when slug is available (for all product contexts)
      if (organization.slug) {
        // Use slug-based URLs: {domain}/{slug}/requests?qr=1
        requestUrl = `${baseUrl}/${organization.slug}/requests?qr=1`;
      } else {
        // Fallback: use generic /requests path if no slug
        requestUrl = `${baseUrl}/requests?qr=1`;
      }
    } else {
      if (!qrEventCode.trim()) return;
      // Add ?qr=1 to automatically mark scans as QR code scans
      requestUrl = `${baseUrl}/crowd-request/${encodeURIComponent(qrEventCode)}?qr=1`;
    }
    
    navigator.clipboard.writeText(requestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Copied!',
      description: 'QR code URL copied to clipboard',
    });
  };

  const downloadQRCode = () => {
    const qrToDownload = qrType === 'public' ? generatedPublicQR : generatedQR;
    if (!qrToDownload) return;
    
    const link = document.createElement('a');
    link.href = qrToDownload;
    const filename = qrType === 'public' ? 'qr-code-public-requests.png' : `qr-code-${qrEventCode}.png`;
    link.download = filename;
    link.click();
  };

  const printQRCodeToPDF = async () => {
    const qrToPrint = qrType === 'public' ? generatedPublicQR : generatedQR;
    if (!qrToPrint) {
      toast({
        title: 'Error',
        description: 'Please generate a QR code first',
        variant: 'destructive',
      });
      return;
    }

    // Fetch organization name for artist name
    let artistName = qrEventName || '';
    if (!artistName) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('owner_id', user.id)
            .single() as any;
          if (org?.name) {
            artistName = org.name;
          }
        }
      } catch (err) {
        console.warn('Could not fetch organization name:', err);
      }
    }
    
    // Set initial artist name and show preview dialog
    setPdfArtistName(artistName);
    setPdfBlobUrl(null); // Clear any previous PDF
    setShowPDFPreview(true);
    
    toast({
      title: 'Configure PDF',
      description: 'Edit artist name and click "Generate PDF"',
    });
  };

  const generatePDFWithArtistName = async () => {
    const qrToPrint = qrType === 'public' ? generatedPublicQR : generatedQR;
    if (!qrToPrint) {
      toast({
        title: 'Error',
        description: 'Please generate a QR code first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingPDF(true);
      // Clear previous PDF while generating new one
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      
      toast({
        title: 'Generating PDF',
        description: 'Please wait...',
      });

      // Convert QR code image to data URL to avoid CORS issues
      // Try fetching as blob first, then fallback to image loading
      let qrImageDataUrl: string;
      try {
        // Try to fetch the image as a blob (works even with CORS restrictions in some cases)
        const response = await fetch(qrToPrint, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          qrImageDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          throw new Error('Fetch failed');
        }
      } catch (fetchError) {
        // Fallback: try loading as image with canvas
        qrImageDataUrl = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } else {
                reject(new Error('Could not get canvas context'));
              }
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = () => {
            // Last resort: use the original URL (might not work in PDF but worth trying)
            console.warn('Could not convert QR code to data URL, using original URL');
            resolve(qrToPrint);
          };
          img.src = qrToPrint;
        });
      }

      // Determine base URL based on product context (same logic as generateQRCode)
      let productContext = organization?.product_context || null;
      
      // If product context is not set or might be wrong, try to detect from multiple sources
      if (!productContext || productContext === 'm10dj') {
        // Try to detect from current domain first
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname.toLowerCase();
          if (hostname.includes('tipjar.live')) {
            productContext = 'tipjar';
          } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
            productContext = 'djdash';
          } else if (hostname.includes('m10djcompany.com')) {
            productContext = 'm10dj';
          }
        }
        
        // If on localhost and still not detected, check user metadata or environment
        if ((!productContext || productContext === 'm10dj') && typeof window !== 'undefined') {
          const hostname = window.location.hostname.toLowerCase();
          if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            // On localhost, check environment variables or default to tipjar
            if (process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT === 'tipjar') {
              productContext = 'tipjar';
            } else if (process.env.NEXT_PUBLIC_DJDASH_URL || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT === 'djdash') {
              productContext = 'djdash';
            } else {
              // For localhost development, default to tipjar if product_context was m10dj
              productContext = 'tipjar';
            }
          }
        }
      }
      
      // Final fallback: default to tipjar if still not detected
      productContext = productContext || 'tipjar';
      
      let baseUrl: string;
      switch (productContext) {
        case 'tipjar':
          baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://tipjar.live';
          break;
        case 'djdash':
          baseUrl = process.env.NEXT_PUBLIC_DJDASH_URL || 'https://djdash.net';
          break;
        case 'm10dj':
          baseUrl = process.env.NEXT_PUBLIC_M10DJ_URL || 'https://m10djcompany.com';
          break;
        default:
          // Fallback: check current domain
          if (typeof window !== 'undefined') {
            const hostname = window.location.hostname.toLowerCase();
            if (hostname.includes('tipjar.live')) {
              baseUrl = 'https://tipjar.live';
            } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
              baseUrl = 'https://djdash.net';
            } else {
              baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
            }
          } else {
            baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
          }
      }
      
      let requestUrl: string;
      
      if (qrType === 'public') {
        // Always use slug-based URLs when slug is available (for all product contexts)
        if (organization?.slug) {
          // Use slug-based URLs: {domain}/{slug}/requests?qr=1
          requestUrl = `${baseUrl}/${organization.slug}/requests?qr=1`;
        } else {
          // Fallback: use generic /requests path if no slug
          requestUrl = `${baseUrl}/requests?qr=1`;
        }
      } else {
        // Add ?qr=1 to automatically mark scans as QR code scans
        requestUrl = `${baseUrl}/crowd-request/${encodeURIComponent(qrEventCode)}?qr=1`;
      }

      // Escape HTML in event name and date for safe rendering
      const escapeHtml = (text: string) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      // Use artist name from preview input, fallback to event name
      const artistNameToUse = pdfArtistName.trim() || qrEventName || '';
      const eventNameHtml = artistNameToUse ? escapeHtml(artistNameToUse) : '';
      const eventDateHtml = qrEventDate 
        ? escapeHtml(new Date(qrEventDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }))
        : '';

      // Create container based on PDF type
      const isTableTent = pdfType === 'table-tent';
      // Table tent: 11" x 8.5" landscape, folded vertically in half (5.5" x 8.5" panels)
      // Full page: 8.5" x 11" portrait
      const containerWidth = isTableTent ? '11in' : '8.5in';
      const containerHeight = isTableTent ? '8.5in' : '11in';
      const panelWidth = isTableTent ? '50%' : '100%';
      
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'fixed';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      pdfContainer.style.width = containerWidth;
      pdfContainer.style.height = containerHeight;
      pdfContainer.style.padding = '0';
      pdfContainer.style.margin = '0';
      pdfContainer.style.backgroundColor = '#ffffff';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Helper function to generate decorated QR code HTML with festive corner brackets and confetti
      const createDecoratedQRCode = (qrImageUrl: string, size: string) => {
        const sizeNum = parseInt(size);
        const padding = 24;
        const totalSize = sizeNum + padding * 2;
        const cornerLength = isTableTent ? 30 : 45;
        const cornerThickness = isTableTent ? 3 : 4;
        const containerSize = totalSize + (isTableTent ? 40 : 60);
        const decorPadding = isTableTent ? 20 : 30;

        return `
          <div style="
            position: relative;
            display: inline-block;
            width: ${containerSize}px;
            height: ${containerSize}px;
            padding: ${decorPadding}px;
          ">
            <!-- Background confetti elements -->
            <!-- Top-left curved line (blue) -->
            <svg style="position: absolute; top: ${isTableTent ? 5 : 10}px; left: 0;" width="${isTableTent ? 40 : 60}" height="${isTableTent ? 55 : 80}" viewBox="0 0 60 80">
              <path d="M45 5 Q30 30, 10 75" stroke="#4285F4" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
            
            <!-- Top-left dots -->
            <svg style="position: absolute; top: ${isTableTent ? 30 : 45}px; left: ${isTableTent ? 5 : 8}px;" width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="${isTableTent ? 3 : 4}" fill="#FBBC04"/>
            </svg>
            <svg style="position: absolute; top: ${isTableTent ? 50 : 75}px; left: ${isTableTent ? 12 : 20}px;" width="12" height="12" viewBox="0 0 12 12">
              <circle cx="6" cy="6" r="${isTableTent ? 2 : 3}" fill="#EA4335"/>
            </svg>

            <!-- Top-right curved line (green) -->
            <svg style="position: absolute; top: 0; right: ${isTableTent ? 2 : 5}px;" width="${isTableTent ? 35 : 50}" height="${isTableTent ? 50 : 70}" viewBox="0 0 50 70">
              <path d="M5 60 Q20 30, 45 10" stroke="#34A853" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>

            <!-- Bottom-left curved line (purple) -->
            <svg style="position: absolute; bottom: ${isTableTent ? 5 : 10}px; left: ${isTableTent ? 2 : 5}px;" width="${isTableTent ? 40 : 60}" height="${isTableTent ? 50 : 70}" viewBox="0 0 60 70">
              <path d="M50 5 Q30 25, 10 65" stroke="#9B59B6" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
            
            <!-- Bottom-left dot -->
            <svg style="position: absolute; bottom: ${isTableTent ? 18 : 30}px; left: ${isTableTent ? 28 : 45}px;" width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="${isTableTent ? 2 : 3}" fill="#34A853"/>
            </svg>

            <!-- Bottom-right curved line (yellow) -->
            <svg style="position: absolute; bottom: ${isTableTent ? 2 : 5}px; right: 0;" width="${isTableTent ? 38 : 55}" height="${isTableTent ? 52 : 75}" viewBox="0 0 55 75">
              <path d="M5 10 Q25 40, 50 70" stroke="#FBBC04" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
            
            <!-- Bottom-right dot -->
            <svg style="position: absolute; bottom: ${isTableTent ? 35 : 55}px; right: ${isTableTent ? 10 : 15}px;" width="10" height="10" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="${isTableTent ? 2 : 3}" fill="#EA4335"/>
            </svg>

            <!-- Additional accent dot -->
            <svg style="position: absolute; top: ${isTableTent ? 12 : 20}px; right: ${isTableTent ? 22 : 35}px;" width="8" height="8" viewBox="0 0 8 8">
              <circle cx="4" cy="4" r="2.5" fill="#4285F4"/>
            </svg>
            
            <!-- QR Code Card with corner brackets -->
            <div style="
              position: relative;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
              width: ${totalSize}px;
              height: ${totalSize}px;
              padding: ${padding}px;
              box-sizing: border-box;
            ">
              <!-- Top-left corner (blue) -->
              <svg style="position: absolute; top: -2px; left: -2px;" width="${cornerLength + 10}" height="${cornerLength + 10}">
                <path d="M${cornerThickness} ${cornerLength} L${cornerThickness} ${cornerThickness} L${cornerLength} ${cornerThickness}" 
                      stroke="#4285F4" stroke-width="${cornerThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>

              <!-- Top-right corner (red) -->
              <svg style="position: absolute; top: -2px; right: -2px;" width="${cornerLength + 10}" height="${cornerLength + 10}">
                <path d="M10 ${cornerThickness} L${cornerLength + 6} ${cornerThickness} L${cornerLength + 6} ${cornerLength}" 
                      stroke="#EA4335" stroke-width="${cornerThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>

              <!-- Bottom-left corner (green) -->
              <svg style="position: absolute; bottom: -2px; left: -2px;" width="${cornerLength + 10}" height="${cornerLength + 10}">
                <path d="M${cornerThickness} 10 L${cornerThickness} ${cornerLength + 6} L${cornerLength} ${cornerLength + 6}" 
                      stroke="#34A853" stroke-width="${cornerThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>

              <!-- Bottom-right corner (blue) -->
              <svg style="position: absolute; bottom: -2px; right: -2px;" width="${cornerLength + 10}" height="${cornerLength + 10}">
                <path d="M10 ${cornerLength + 6} L${cornerLength + 6} ${cornerLength + 6} L${cornerLength + 6} 10" 
                      stroke="#4285F4" stroke-width="${cornerThickness}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              
              <!-- QR Code Image -->
              <img 
                src="${qrImageUrl}" 
                alt="QR Code"
                style="
                  display: block;
                  width: ${size};
                  height: ${size};
                  image-rendering: pixelated;
                "
              />
            </div>
          </div>
        `;
      };
      
      // Panel content template (reusable for both layouts)
      const createPanelContent = (side: 'left' | 'right' | 'single' = 'single') => {
        const qrSize = isTableTent ? '180px' : '400px';
        const titleSize = isTableTent ? '24px' : '32px';
        const artistSize = isTableTent ? '18px' : '24px';
        const padding = isTableTent ? '20px' : '40px';
        
        // Table tent: each panel gets identical content with horizontal layout
        const borderStyle = (isTableTent && side === 'left') ? 'border-right: 1px dashed #cccccc;' : '';
        
        // For table tent, create a horizontal layout optimized for wide canvas, rotated 90deg for readability when standing
        // Left panel rotates 90deg clockwise, right panel rotates -90deg (counter-clockwise) so both sides are readable
        if (isTableTent) {
          const rotation = side === 'left' ? '90deg' : '-90deg';
          return `
            <div style="
              width: ${panelWidth};
              height: 100%;
              padding: 0;
              box-sizing: border-box;
              display: flex;
              align-items: center;
              justify-content: center;
              ${borderStyle}
              position: relative;
            ">
              <div style="
                width: 100%;
                height: 100%;
                padding: ${padding};
                box-sizing: border-box;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                transform: rotate(${rotation});
                transform-origin: center center;
              ">
                <div style="
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  flex: 1;
                  text-align: center;
                ">
                <h1 style="
                  font-size: ${titleSize};
                  font-weight: bold;
                  color: #000000;
                  margin: 0 0 10px 0;
                ">Song Requests</h1>
                
                ${eventNameHtml ? `
                  <h2 style="
                    font-size: ${artistSize};
                    font-weight: bold;
                    color: #000000;
                    margin: 0 0 6px 0;
                  ">${eventNameHtml}</h2>
                ` : ''}
                
                ${eventDateHtml ? `
                  <p style="
                    font-size: 16px;
                    color: #000000;
                    margin: 0 0 15px 0;
                  ">${eventDateHtml}</p>
                ` : ''}
                
                <p style="
                  font-size: 16px;
                  font-weight: bold;
                  color: #000000;
                  margin: 15px 0 10px 0;
                ">Scan to Request Songs</p>
                
                <!-- Payment Methods -->
                <div style="
                  margin: 10px 0;
                  padding: 10px;
                  background: #f5f5f5;
                  border: 1px solid #cccccc;
                  border-radius: 4px;
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: center;
                  align-items: center;
                  gap: 8px;
                ">
                  <span style="
                    font-size: 11px;
                    font-weight: bold;
                    color: #000000;
                    margin-right: 6px;
                  ">We Accept:</span>
                  
                  <span style="
                    font-size: 11px;
                    font-weight: bold;
                    color: #00d632;
                    padding: 4px 8px;
                    background: #ffffff;
                    border: 1px solid #00d632;
                    border-radius: 3px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    line-height: 1.2;
                  ">
                    <svg viewBox="0 0 32 32" style="width: 14px; height: 14px; fill: #00d632; flex-shrink: 0; margin: 0; padding: 0;" xmlns="http://www.w3.org/2000/svg">
                      <path d="M31.453 4.625c-0.688-1.891-2.177-3.375-4.068-4.063-1.745-0.563-3.333-0.563-6.557-0.563h-9.682c-3.198 0-4.813 0-6.531 0.531-1.896 0.693-3.385 2.188-4.068 4.083-0.547 1.734-0.547 3.333-0.547 6.531v9.693c0 3.214 0 4.802 0.531 6.536 0.688 1.891 2.177 3.375 4.068 4.063 1.734 0.547 3.333 0.547 6.536 0.547h9.703c3.214 0 4.813 0 6.536-0.531 1.896-0.688 3.391-2.182 4.078-4.078 0.547-1.734 0.547-3.333 0.547-6.536v-9.667c0-3.214 0-4.813-0.547-6.547zM23.229 10.802l-1.245 1.24c-0.25 0.229-0.635 0.234-0.891 0.010-1.203-1.010-2.724-1.568-4.292-1.573-1.297 0-2.589 0.427-2.589 1.615 0 1.198 1.385 1.599 2.984 2.198 2.802 0.938 5.12 2.109 5.12 4.854 0 2.99-2.318 5.042-6.104 5.266l-0.349 1.604c-0.063 0.302-0.328 0.516-0.635 0.516h-2.391l-0.12-0.010c-0.354-0.078-0.578-0.432-0.505-0.786l0.375-1.693c-1.438-0.359-2.76-1.083-3.844-2.094v-0.016c-0.25-0.25-0.25-0.656 0-0.906l1.333-1.292c0.255-0.234 0.646-0.234 0.896 0 1.214 1.146 2.839 1.786 4.521 1.76 1.734 0 2.891-0.734 2.891-1.896s-1.172-1.464-3.385-2.292c-2.349-0.839-4.573-2.026-4.573-4.802 0-3.224 2.677-4.797 5.854-4.943l0.333-1.641c0.063-0.302 0.333-0.516 0.641-0.51h2.37l0.135 0.016c0.344 0.078 0.573 0.411 0.495 0.76l-0.359 1.828c1.198 0.396 2.333 1.026 3.302 1.849l0.031 0.031c0.25 0.266 0.25 0.667 0 0.906z"/>
                    </svg>
                    <span style="line-height: 1.2;">Cash App</span>
                  </span>
                  
                  <span style="
                    font-size: 11px;
                    font-weight: bold;
                    color: #3d95ce;
                    padding: 4px 8px;
                    background: #ffffff;
                    border: 1px solid #3d95ce;
                    border-radius: 3px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    line-height: 1.2;
                  ">
                    <svg viewBox="0 0 48 48" style="width: 14px; height: 14px; fill: #3d95ce; stroke: #3d95ce; flex-shrink: 0; margin: 0; padding: 0;" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z"/>
                    </svg>
                    <span style="line-height: 1.2;">Venmo</span>
                  </span>
                  
                  <span style="
                    font-size: 11px;
                    font-weight: bold;
                    color: #000000;
                    padding: 4px 8px;
                    background: #ffffff;
                    border: 1px solid #000000;
                    border-radius: 3px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    line-height: 1.2;
                  ">
                    <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: #000000; flex-shrink: 0; margin: 0; padding: 0;" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    <span style="line-height: 1.2;">Apple Pay</span>
                  </span>
                  
                  <span style="
                    font-size: 11px;
                    font-weight: bold;
                    color: #0066cc;
                    padding: 4px 8px;
                    background: #ffffff;
                    border: 1px solid #0066cc;
                    border-radius: 3px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    line-height: 1.2;
                  ">
                    <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: none; stroke: #0066cc; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; margin: 0; padding: 0;" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <span style="line-height: 1.2;">Card</span>
                  </span>
                </div>
                
                <p style="
                  font-size: 10px;
                  color: #999999;
                  margin-top: 15px;
                ">Powered by ${productContext === 'tipjar' ? 'TipJar.Live' : productContext === 'djdash' ? 'DJ Dash' : 'm10 dj company'}</p>
              </div>
              
                <!-- Decorated QR Code on the right side -->
                ${createDecoratedQRCode(qrImageDataUrl, qrSize)}
              </div>
            </div>
          `;
        }
        
        // Full page: vertical layout
        return `
          <div style="
            width: ${panelWidth};
            height: 100%;
            padding: ${padding};
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            position: relative;
          ">
            <h1 style="
              font-size: ${titleSize};
              font-weight: bold;
              color: #000000;
              margin: 0 0 15px 0;
            ">Song Requests</h1>
            
            ${eventNameHtml ? `
              <h2 style="
                font-size: ${artistSize};
                font-weight: bold;
                color: #000000;
                margin: 0 0 8px 0;
              ">${eventNameHtml}</h2>
            ` : ''}
            
            ${eventDateHtml ? `
              <p style="
                font-size: 18px;
                color: #000000;
                margin: 0 0 20px 0;
              ">${eventDateHtml}</p>
            ` : ''}
            
            <!-- Decorated QR Code -->
            ${createDecoratedQRCode(qrImageDataUrl, qrSize)}
            
            <p style="
              font-size: 18px;
              font-weight: bold;
              color: #000000;
              margin: 15px 0 8px 0;
            ">Scan to Request Songs</p>
            
            <p style="
              font-size: 12px;
              color: #666666;
              margin: 10px 0;
              word-break: break-all;
              font-family: monospace;
            ">${escapeHtml(requestUrl)}</p>
            
            <!-- Payment Methods -->
            <div style="
              margin: 20px 0;
              padding: 12px;
              background: #f5f5f5;
              border: 1px solid #cccccc;
              border-radius: 4px;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              align-items: center;
              gap: 10px;
            ">
              <span style="
                font-size: 11px;
                font-weight: bold;
                color: #000000;
                margin-right: 6px;
              ">We Accept:</span>
              
              <span style="
                font-size: 11px;
                font-weight: bold;
                color: #00d632;
                padding: 4px 8px;
                background: #ffffff;
                border: 1px solid #00d632;
                border-radius: 3px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                line-height: 1.2;
              ">
                <svg viewBox="0 0 32 32" style="width: 14px; height: 14px; fill: #00d632; flex-shrink: 0; margin: 0; padding: 0;" xmlns="http://www.w3.org/2000/svg">
                  <path d="M31.453 4.625c-0.688-1.891-2.177-3.375-4.068-4.063-1.745-0.563-3.333-0.563-6.557-0.563h-9.682c-3.198 0-4.813 0-6.531 0.531-1.896 0.693-3.385 2.188-4.068 4.083-0.547 1.734-0.547 3.333-0.547 6.531v9.693c0 3.214 0 4.802 0.531 6.536 0.688 1.891 2.177 3.375 4.068 4.063 1.734 0.547 3.333 0.547 6.536 0.547h9.703c3.214 0 4.813 0 6.536-0.531 1.896-0.688 3.391-2.182 4.078-4.078 0.547-1.734 0.547-3.333 0.547-6.536v-9.667c0-3.214 0-4.813-0.547-6.547zM23.229 10.802l-1.245 1.24c-0.25 0.229-0.635 0.234-0.891 0.010-1.203-1.010-2.724-1.568-4.292-1.573-1.297 0-2.589 0.427-2.589 1.615 0 1.198 1.385 1.599 2.984 2.198 2.802 0.938 5.12 2.109 5.12 4.854 0 2.99-2.318 5.042-6.104 5.266l-0.349 1.604c-0.063 0.302-0.328 0.516-0.635 0.516h-2.391l-0.12-0.010c-0.354-0.078-0.578-0.432-0.505-0.786l0.375-1.693c-1.438-0.359-2.76-1.083-3.844-2.094v-0.016c-0.25-0.25-0.25-0.656 0-0.906l1.333-1.292c0.255-0.234 0.646-0.234 0.896 0 1.214 1.146 2.839 1.786 4.521 1.76 1.734 0 2.891-0.734 2.891-1.896s-1.172-1.464-3.385-2.292c-2.349-0.839-4.573-2.026-4.573-4.802 0-3.224 2.677-4.797 5.854-4.943l0.333-1.641c0.063-0.302 0.333-0.516 0.641-0.51h2.37l0.135 0.016c0.344 0.078 0.573 0.411 0.495 0.76l-0.359 1.828c1.198 0.396 2.333 1.026 3.302 1.849l0.031 0.031c0.25 0.266 0.25 0.667 0 0.906z"/>
                </svg>
                <span style="line-height: 1.2;">Cash App</span>
              </span>
              
              <span style="
                font-size: 11px;
                font-weight: bold;
                color: #3d95ce;
                padding: 4px 8px;
                background: #ffffff;
                border: 1px solid #3d95ce;
                border-radius: 3px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                line-height: 1.2;
              ">
                <svg viewBox="0 0 48 48" style="width: 14px; height: 14px; fill: #3d95ce; stroke: #3d95ce; flex-shrink: 0; margin: 0; padding: 0;" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z"/>
                </svg>
                <span style="line-height: 1.2;">Venmo</span>
              </span>
              
              <span style="
                font-size: 11px;
                font-weight: bold;
                color: #000000;
                padding: 4px 8px;
                background: #ffffff;
                border: 1px solid #000000;
                border-radius: 3px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                line-height: 1.2;
              ">
                <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: #000000; flex-shrink: 0; margin: 0; padding: 0;" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span style="line-height: 1.2;">Apple Pay</span>
              </span>
              
              <span style="
                font-size: 11px;
                font-weight: bold;
                color: #0066cc;
                padding: 4px 8px;
                background: #ffffff;
                border: 1px solid #0066cc;
                border-radius: 3px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                line-height: 1.2;
              ">
                <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: none; stroke: #0066cc; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; margin: 0; padding: 0;" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                <span style="line-height: 1.2;">Card</span>
              </span>
            </div>
            
            ${(() => {
              // Use organization's payment settings first, then fall back to paymentSettings state
              const cashAppTag = organization?.requests_cashapp_tag || paymentSettings?.cashAppTag || null;
              const venmoUsername = organization?.requests_venmo_username || paymentSettings?.venmoUsername || null;
              
              return `
                ${cashAppTag ? `
                  <p style="
                    font-size: 10px;
                    color: #666666;
                    margin: 5px 0;
                  ">Cash App: ${escapeHtml(cashAppTag)}</p>
                ` : ''}
                
                ${venmoUsername ? `
                  <p style="
                    font-size: 10px;
                    color: #666666;
                    margin: 5px 0;
                  ">Venmo: ${escapeHtml(venmoUsername)}</p>
                ` : ''}
              `;
            })()}
            
            <p style="
              font-size: 10px;
              color: #999999;
              margin-top: 20px;
            ">Powered by ${productContext === 'tipjar' ? 'TipJar.Live' : productContext === 'djdash' ? 'DJ Dash' : 'm10 dj company'}</p>
          </div>
        `;
      };
      
      // Create HTML based on PDF type
      if (isTableTent) {
        // Table tent: portrait page with two panels side-by-side for vertical fold
        // When folded down the middle vertically, creates an A-frame that stands up
        pdfContainer.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: row;
            position: relative;
          ">
            ${createPanelContent('left')}
            ${createPanelContent('right')}
          </div>
          <!-- Fold line indicator (center of page) -->
          <div style="
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 2px;
            background: repeating-linear-gradient(
              to bottom,
              #cccccc 0px,
              #cccccc 5px,
              transparent 5px,
              transparent 10px
            );
            pointer-events: none;
            transform: translateX(-50%);
          "></div>
        `;
      } else {
        // Full page: single panel
        pdfContainer.innerHTML = createPanelContent('single');
      }

      document.body.appendChild(pdfContainer);

      // Wait for the image to load - since it's a data URL, it should load instantly
      await new Promise((resolve) => {
        const img = pdfContainer.querySelector('img') as HTMLImageElement;
        if (img) {
          // Data URLs load synchronously, so check if already loaded
          if (img.complete && img.naturalHeight > 0 && img.naturalWidth > 0) {
            console.log('QR code already loaded:', img.naturalWidth, 'x', img.naturalHeight);
            resolve(true);
          } else {
            const timeout = setTimeout(() => {
              console.warn('QR code image load timeout after 2 seconds');
              resolve(true);
            }, 2000);
            
            img.onload = () => {
              clearTimeout(timeout);
              console.log('QR code loaded successfully:', img.naturalWidth, 'x', img.naturalHeight);
              resolve(true);
            };
            img.onerror = (error) => {
              clearTimeout(timeout);
              console.error('QR code image failed to load:', error);
              console.error('Data URL length:', qrImageDataUrl?.substring(0, 50) || 'undefined');
              resolve(true); // Continue anyway
            };
          }
        } else {
          console.error('QR code img element not found!');
          resolve(true);
        }
      });

      // Give browser time to fully render the layout
      await new Promise(resolve => setTimeout(resolve, 300));

      // Dynamically import browser-only libraries (only in browser)
      if (typeof window === 'undefined') {
        throw new Error('PDF generation is only available in the browser');
      }

      // Lazy load browser-only libraries using dynamic import
      // These are only loaded when this function runs (client-side only)
      const loadPDFLibraries = async () => {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
        return { html2canvas, jsPDF };
      };

      const { html2canvas, jsPDF } = await loadPDFLibraries();

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: false, // Changed to false since we're using data URLs
        logging: true, // Enable logging to debug
        width: pdfContainer.offsetWidth,
        height: pdfContainer.offsetHeight,
        backgroundColor: '#ffffff',
        imageTimeout: 5000,
      });
      
      console.log('Canvas created:', canvas.width, 'x', canvas.height);

      // Remove the temporary container
      document.body.removeChild(pdfContainer);

      // Create PDF - table tent uses landscape, full page uses portrait
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: isTableTent ? 'landscape' : 'portrait',
        unit: 'in',
        format: 'letter',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / (imgWidth / 96), pdfHeight / (imgHeight / 96));
      const imgX = (pdfWidth - (imgWidth / 96) * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, (imgWidth / 96) * ratio, (imgHeight / 96) * ratio);
      
      const typeSuffix = isTableTent ? '-table-tent' : '';
      const filename = qrType === 'public' 
        ? `qr-code-public-requests${typeSuffix}.pdf` 
        : `qr-code-${qrEventCode || 'event'}${typeSuffix}.pdf`;
      
      // Generate PDF blob and show preview
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      setPdfBlobUrl(blobUrl);
      setPdfFilename(filename);
      setShowPDFPreview(true);
      setGeneratingPDF(false);

      toast({
        title: 'PDF Generated',
        description: 'Preview your PDF before downloading',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGeneratingPDF(false);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };
      
      // Set played_at timestamp when marking as played
      if (newStatus === 'played') {
        updateData.played_at = new Date().toISOString();
      }
      
      const { error } = await (supabase
        .from('crowd_requests') as any)
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Request status updated',
      });
      
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const markAsPlayed = async (requestId: string) => {
    await updateRequestStatus(requestId, 'played');
  };

  // Bidding handlers
  const handleViewBidHistory = async (requestId: string, biddingRoundId: string) => {
    setSelectedRequestForBids(requestId);
    setLoadingBidHistory(true);
    setShowBidHistoryModal(true);
    
    try {
      const response = await fetch(`/api/bidding/bid-history?requestId=${requestId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bid history');
      }
      
      setBidHistory(data.bids || []);
      setBiddingRound(data.round || null);
    } catch (error: any) {
      console.error('Error fetching bid history:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bid history',
        variant: 'destructive'
      });
      setBidHistory([]);
      setBiddingRound(null);
    } finally {
      setLoadingBidHistory(false);
    }
  };

  const handleChargeWinningBid = async (requestId: string) => {
    try {
      // First get the winning bid for this request
      const bidHistoryResponse = await fetch(`/api/bidding/bid-history?requestId=${requestId}`);
      const bidData = await bidHistoryResponse.json();
      
      if (!bidHistoryResponse.ok || !bidData.bids || bidData.bids.length === 0) {
        throw new Error('No bids found for this request');
      }
      
      // Find the highest bid (winning bid)
      const winningBid = bidData.bids.reduce((highest: any, bid: any) => 
        bid.bid_amount > (highest?.bid_amount || 0) ? bid : highest
      );
      
      if (!winningBid || winningBid.payment_status === 'charged') {
        toast({
          title: 'Error',
          description: 'Winning bid has already been charged or not found',
          variant: 'destructive'
        });
        return;
      }
      
      const response = await fetch('/api/bidding/charge-winning-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId: winningBid.id,
          requestId: requestId
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to charge bid');
      }
      
      toast({
        title: 'Success',
        description: `Bid of $${(winningBid.bid_amount / 100).toFixed(2)} charged successfully`
      });
      
      fetchRequests();
    } catch (error: any) {
      console.error('Error charging bid:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to charge bid',
        variant: 'destructive'
      });
    }
  };

  const handleCancelBidAuthorization = async (requestId: string) => {
    try {
      // Get the current highest bid for this request
      const bidHistoryResponse = await fetch(`/api/bidding/bid-history?requestId=${requestId}`);
      const bidData = await bidHistoryResponse.json();
      
      if (!bidHistoryResponse.ok || !bidData.bids || bidData.bids.length === 0) {
        throw new Error('No bids found for this request');
      }
      
      // Find the highest bid
      const highestBid = bidData.bids.reduce((highest: any, bid: any) => 
        bid.bid_amount > (highest?.bid_amount || 0) ? bid : highest
      );
      
      if (!highestBid || highestBid.payment_status !== 'pending') {
        toast({
          title: 'Error',
          description: 'No pending bid authorization found',
          variant: 'destructive'
        });
        return;
      }
      
      const response = await fetch('/api/bidding/cancel-bid-authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId: highestBid.id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel authorization');
      }
      
      toast({
        title: 'Success',
        description: 'Bid authorization cancelled successfully'
      });
      
      fetchRequests();
    } catch (error: any) {
      console.error('Error cancelling authorization:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel authorization',
        variant: 'destructive'
      });
    }
  };

  const updatePaymentStatus = async (requestId: string, paymentStatus: string, paymentMethod?: string) => {
    try {
      const response = await fetch('/api/crowd-request/update-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          paymentStatus,
          paymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment status');
      }
      
      toast({
        title: 'Success',
        description: `Payment status updated to ${paymentStatus}`,
      });
      
      fetchRequests();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  const fetchSuccessPageViews = async (requestId: string) => {
    if (!requestId) return;
    
    setLoadingSuccessViews(true);
    try {
      const response = await fetch(`/api/crowd-request/success-views?request_id=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setSuccessPageViews(data.views || []);
      }
    } catch (error) {
      console.error('Error fetching success page views:', error);
    } finally {
      setLoadingSuccessViews(false);
    }
  };

  const handleEditSongDetails = () => {
    if (selectedRequest) {
      setEditedSongTitle(selectedRequest.song_title || '');
      setEditedSongArtist(selectedRequest.song_artist || '');
      setEditingSongDetails(true);
    }
  };

  const handleCancelEditSongDetails = () => {
    setEditingSongDetails(false);
    setEditedSongTitle('');
    setEditedSongArtist('');
  };

  const handleSaveSongDetails = async () => {
    if (!selectedRequest) return;

    if (!editedSongTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Song title is required',
        variant: 'destructive',
      });
      return;
    }

    setSavingSongDetails(true);
    try {
      const response = await fetch('/api/crowd-request/update-song-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          songTitle: editedSongTitle.trim(),
          songArtist: editedSongArtist.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update song details');
      }

      toast({
        title: 'Success',
        description: 'Song details updated successfully',
      });

      // Update the selected request in local state
      setSelectedRequest(prev => prev ? {
        ...prev,
        song_title: editedSongTitle.trim(),
        song_artist: editedSongArtist.trim() || null,
      } : null);

      // Also update in requests list
      setRequests(prev => prev.map(r =>
        r.id === selectedRequest.id
          ? { ...r, song_title: editedSongTitle.trim(), song_artist: editedSongArtist.trim() || null }
          : r
      ));

      setEditingSongDetails(false);
    } catch (error: any) {
      console.error('Error updating song details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update song details',
        variant: 'destructive',
      });
    } finally {
      setSavingSongDetails(false);
    }
  };

  const updateVenmoUsername = async (requestId: string, venmoUsername: string) => {
    try {
      const response = await fetch('/api/crowd-request/update-venmo-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          venmoUsername: venmoUsername.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update Venmo username');
      }

      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, requester_venmo_username: venmoUsername.trim() }
          : r
      ));
      
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, requester_venmo_username: venmoUsername.trim() } : null);
      }
    } catch (error) {
      console.error('Error updating Venmo username:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update Venmo username',
        variant: 'destructive',
      });
    }
  };

  const updateRequesterName = async (requestId: string, requesterName: string) => {
    try {
      const response = await fetch('/api/crowd-request/update-requester-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          requesterName
        })
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        // Try to parse error message from JSON, but handle HTML error pages
        let errorMessage = 'Failed to update requester name';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, it's likely an HTML error page
          errorMessage = `Server error (${response.status}). Please try again.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: `Requester name updated to ${requesterName}`,
      });
      
      // Update the selected request in state
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, requester_name: requesterName });
      }
      
      fetchRequests();
    } catch (error: any) {
      console.error('Error updating requester name:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update requester name',
        variant: 'destructive',
      });
    }
  };

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(paginatedRequests.map(r => r.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(requestId);
    } else {
      newSelected.delete(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedRequests.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one request',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updates = Array.from(selectedRequests).map(id => 
        (supabase
          .from('crowd_requests') as any)
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      await Promise.all(updates);
      
      toast({
        title: 'Success',
        description: `Updated ${selectedRequests.size} request(s) to ${newStatus}`,
      });
      
      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error) {
      console.error('Error updating statuses:', error);
      toast({
        title: 'Error',
        description: 'Failed to update request statuses',
        variant: 'destructive',
      });
    }
  };

  const handleBulkPaymentStatusUpdate = async (paymentStatus: string) => {
    if (selectedRequests.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one request',
        variant: 'destructive',
      });
      return;
    }

    const requestsToUpdate = Array.from(selectedRequests)
      .map(id => requests.find(r => r.id === id))
      .filter((r): r is CrowdRequest => r !== undefined);

    // For bulk "paid" updates, check if any Venmo/CashApp payments need names
    if (paymentStatus === 'paid') {
      const venmoRequests = requestsToUpdate.filter(r => 
        (r.payment_method === 'venmo' || r.payment_method === 'cashapp') &&
        (!r.requester_name || r.requester_name === 'Guest')
      );

      if (venmoRequests.length > 0) {
        const proceed = confirm(
          `${venmoRequests.length} ${venmoRequests.length === 1 ? 'payment' : 'payments'} ${venmoRequests.length === 1 ? 'needs' : 'need'} a requester name.\n\n` +
          `You'll be prompted for each name when marking them as paid.\n\n` +
          `Continue?`
        );
        if (!proceed) return;
      }
    }

    try {
      for (const request of requestsToUpdate) {
        // For Venmo/CashApp payments being marked as paid, prompt for name if missing
        if (paymentStatus === 'paid' && 
            (request.payment_method === 'venmo' || request.payment_method === 'cashapp') &&
            (!request.requester_name || request.requester_name === 'Guest')) {
          const venmoName = prompt(
            `Request: ${request.song_title || request.recipient_name || 'Request'}\n` +
            `Payment Code: ${request.payment_code || 'N/A'}\n\n` +
            `Enter the requester's name from the ${request.payment_method === 'venmo' ? 'Venmo' : 'CashApp'} transaction:\n\n` +
            `(Leave blank to skip.)`,
            ''
          );
          
          // If name was provided, update it first
          if (venmoName && venmoName.trim()) {
            await updateRequesterName(request.id, venmoName.trim());
          }
        }

        // For Venmo payments, also prompt for Venmo username if not already set
        if (paymentStatus === 'paid' && 
            request.payment_method === 'venmo' &&
            !request.requester_venmo_username) {
          const venmoUsername = prompt(
            `Request: ${request.song_title || request.recipient_name || 'Request'}\n` +
            `Payment Code: ${request.payment_code || 'N/A'}\n\n` +
            `Enter the customer's Venmo username from the transaction (e.g., @username):\n\n` +
            `(Leave blank to skip.)`,
            ''
          );
          
          // If username was provided, update it
          if (venmoUsername && venmoUsername.trim()) {
            await updateVenmoUsername(request.id, venmoUsername.trim());
          }
        }

        await fetch('/api/crowd-request/update-payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: request.id,
            paymentStatus,
            paymentMethod: request.payment_method || 'manual'
          })
        });
      }
      
      toast({
        title: 'Success',
        description: `Updated payment status for ${selectedRequests.size} request(s)`,
      });
      
      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error) {
      console.error('Error updating payment statuses:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment statuses',
        variant: 'destructive',
      });
    }
  };

  // Delete single request
  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/crowd-request/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds: [requestId] })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete request');
      }

      toast({
        title: 'Success',
        description: 'Request deleted successfully',
      });

      // Remove from selected if it was selected
      const newSelected = new Set(selectedRequests);
      newSelected.delete(requestId);
      setSelectedRequests(newSelected);

      fetchRequests();
    } catch (error: any) {
      console.error('Error deleting request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete request',
        variant: 'destructive',
      });
    }
  };

  // Bulk delete requests
  const handleBulkDelete = async () => {
    if (selectedRequests.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one request to delete',
        variant: 'destructive',
      });
      return;
    }

    const count = selectedRequests.size;
    if (!confirm(`Are you sure you want to delete ${count} request(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/crowd-request/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds: Array.from(selectedRequests) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete requests');
      }

      toast({
        title: 'Success',
        description: `Successfully deleted ${count} request(s)`,
      });

      setSelectedRequests(new Set());
      fetchRequests();
    } catch (error: any) {
      console.error('Error deleting requests:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete requests',
        variant: 'destructive',
      });
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      'ID', 'Type', 'Song Title', 'Song Artist', 'Recipient Name', 'Recipient Message',
      'Requester Name', 'Requester Email', 'Requester Phone', 'Amount Requested', 'Amount Paid',
      'Payment Status', 'Payment Method', 'Status', 'Event Code', 'Event Name', 'Event Date',
      'Fast Track', 'Fast Track Fee', 'Created At', 'Paid At'
    ];

    const rows = filteredRequests.map(request => [
      request.id,
      request.request_type,
      request.song_title || '',
      request.song_artist || '',
      request.recipient_name || '',
      request.recipient_message || '',
      request.requester_name,
      request.requester_email || '',
      request.requester_phone || '',
      (request.amount_requested / 100).toFixed(2),
      (request.amount_paid / 100).toFixed(2),
      request.payment_status,
      request.payment_method || '',
      request.status,
      request.event_qr_code,
      request.event_name || '',
      request.event_date || '',
      request.is_fast_track ? 'Yes' : 'No',
      (request.fast_track_fee / 100).toFixed(2),
      new Date(request.created_at).toISOString(),
      request.paid_at ? new Date(request.paid_at).toISOString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `crowd-requests-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Complete',
      description: `Exported ${filteredRequests.length} requests to CSV`,
    });
  };

  // Open detail modal
  const openDetailModal = (request: CrowdRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
    setStripeDetails(null);
    setSuccessPageViews([]); // Reset success page views
    // Auto-fetch Stripe details if payment_intent_id or stripe_session_id exists
    if (request.payment_intent_id || (request as any).stripe_session_id) {
      fetchStripeDetails(request);
    }
    // Fetch success page views
    fetchSuccessPageViews(request.id);
  };

  // Fetch Stripe payment details
  const fetchStripeDetails = async (request: CrowdRequest) => {
    if (!request.payment_intent_id && !(request as any).stripe_session_id) {
      return;
    }

    setLoadingStripeDetails(true);
    try {
      const params = new URLSearchParams();
      if (request.id) params.append('requestId', request.id);
      if (request.payment_intent_id) params.append('paymentIntentId', request.payment_intent_id);
      if ((request as any).stripe_session_id) params.append('sessionId', (request as any).stripe_session_id);

      const response = await fetch(`/api/crowd-request/stripe-details?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setStripeDetails(data.stripe);
        
        // Auto-sync payment status in background if there's a mismatch
        const paymentIntent = data.stripe?.paymentIntent;
        const session = data.stripe?.session;
        
        if (paymentIntent || session) {
          const paymentSucceeded = paymentIntent?.status === 'succeeded' || 
                                   session?.payment_status === 'paid' ||
                                   data.stripe?.charge?.paid === true;
          
          // Check if sync is needed: payment succeeded in Stripe but not in DB, or amount mismatch
          const needsSync = paymentSucceeded && (
            request.payment_status !== 'paid' || 
            request.amount_paid === 0 ||
            (paymentIntent && request.amount_paid !== paymentIntent.amount) ||
            (session && request.amount_paid !== session.amount_total)
          );
          
          if (needsSync) {
            // Automatically sync in the background (no user notification)
            const amount = paymentIntent?.amount || session?.amount_total || request.amount_paid || 0;
            const paidAt = paymentIntent?.created 
              ? new Date(paymentIntent.created * 1000).toISOString()
              : session?.created
              ? new Date(session.created * 1000).toISOString()
              : new Date().toISOString();
            
            try {
              const syncResponse = await fetch('/api/crowd-request/update-payment-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  requestId: request.id,
                  paymentStatus: 'paid',
                  paymentMethod: 'card',
                  amountPaid: amount,
                  paidAt: paidAt,
                }),
              });
              
              if (syncResponse.ok) {
                // Update the selected request in state
                setSelectedRequest(prev => prev ? {
                  ...prev,
                  payment_status: 'paid',
                  amount_paid: amount,
                  paid_at: paidAt,
                } : null);
                
                // Refresh the requests list in the background
                fetchRequests();
                
                console.log(`✅ Auto-synced payment for request ${request.id} from Stripe`);
              }
            } catch (syncError) {
              console.error('Error auto-syncing payment:', syncError);
              // Silent failure - this is background sync
            }
          }
        }
      } else {
        console.error('Failed to fetch Stripe details');
      }
    } catch (error) {
      console.error('Error fetching Stripe details:', error);
    } finally {
      setLoadingStripeDetails(false);
    }
  };

  // Download YouTube audio (super admin only)
  const handleDownloadYouTubeAudio = async (request: CrowdRequest) => {
    // Extract YouTube URL from multiple possible sources:
    // 1. posted_link (if it's a YouTube URL)
    // 2. music_service_links.youtube (from the "Find Music Links" feature)
    let youtubeUrl: string | null = null;

    // Check if posted_link is a YouTube URL
    if (request.posted_link && (request.posted_link.includes('youtube.com') || request.posted_link.includes('youtu.be'))) {
      youtubeUrl = request.posted_link;
    }
    // Otherwise, check music_service_links for YouTube link
    else if (request.music_service_links?.youtube) {
      youtubeUrl = request.music_service_links.youtube;
    }

    if (!youtubeUrl) {
      toast({
        title: 'Error',
        description: 'No YouTube link found for this request. Please use "Find Music Links" to locate the YouTube URL first.',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingAudio(request.id);
    try {
      const response = await fetch('/api/crowd-request/download-youtube-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          youtubeUrl: youtubeUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to download audio');
      }

      toast({
        title: 'Success',
        description: 'Audio downloaded successfully',
      });

      // Update the request in state
      setSelectedRequest(prev => prev ? {
        ...prev,
        downloaded_audio_url: data.url,
        audio_download_status: 'completed',
        audio_downloaded_at: new Date().toISOString(),
      } : null);

      // Also update in requests list
      setRequests(prev => prev.map(r => 
        r.id === request.id 
          ? { 
              ...r, 
              downloaded_audio_url: data.url,
              audio_download_status: 'completed',
              audio_downloaded_at: new Date().toISOString(),
            }
          : r
      ));

      fetchRequests(); // Refresh to get updated data
    } catch (error: any) {
      console.error('Error downloading YouTube audio:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download audio',
        variant: 'destructive',
      });

      // Update status to failed
      setSelectedRequest(prev => prev ? {
        ...prev,
        audio_download_status: 'failed',
        audio_download_error: error.message || 'Unknown error',
      } : null);
    } finally {
      setDownloadingAudio(null);
    }
  };

  // Link Stripe payment to request
  const linkStripePayment = async (requestId: string, paymentIntentId: string) => {
    try {
      const response = await fetch('/api/crowd-request/link-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          paymentIntentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link payment');
      }

      toast({
        title: 'Success',
        description: 'Stripe payment linked successfully',
      });

      setShowLinkPaymentModal(false);
      setLinkPaymentIntentId('');
      setLinkPaymentRequestId(null);
      fetchRequests();
    } catch (error: any) {
      console.error('Error linking payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to link payment',
        variant: 'destructive',
      });
    }
  };

  // Search for request by Stripe payment intent
  const searchByPaymentIntent = async (paymentIntentId: string) => {
    try {
      // First try linking by metadata (most reliable - uses request_id from Stripe metadata)
      const metadataResponse = await fetch('/api/crowd-request/link-by-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (metadataResponse.ok) {
        const metadataData = await metadataResponse.json();
        if (metadataData.linked && metadataData.request) {
          setLinkPaymentRequestId(metadataData.request.id);
          toast({
            title: 'Payment Linked!',
            description: `Successfully linked payment to request: ${metadataData.request.song_title || metadataData.request.recipient_name || 'Request'}`,
          });
          fetchRequests(); // Refresh the list
          return;
        } else if (metadataData.alreadyLinked && metadataData.request) {
          setLinkPaymentRequestId(metadataData.request.id);
          toast({
            title: 'Already Linked',
            description: `This payment is already linked to a request.`,
          });
          fetchRequests(); // Refresh the list
          return;
        }
      }

      // If metadata link didn't work, try the find endpoint
      const response = await fetch(`/api/crowd-request/find-by-payment-intent?paymentIntentId=${paymentIntentId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.request) {
          setLinkPaymentRequestId(data.request.id);
          toast({
            title: 'Request Found',
            description: `Found request: ${data.request.song_title || data.request.recipient_name || 'Request'}`,
          });
        } else {
          toast({
            title: 'No Request Found',
            description: 'No request found with this payment intent. You can manually link it.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error searching by payment intent:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for payment intent',
        variant: 'destructive',
      });
    }
  };


  // Assign orphaned request to current organization
  const assignRequestToOrganization = async (requestId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single() as any;

      if (!org) {
        throw new Error('No organization found');
      }

      const { error } = await (supabase
        .from('crowd_requests') as any)
        .update({ 
          organization_id: org.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Request assigned to your organization',
      });
      
      fetchRequests();
    } catch (error: any) {
      console.error('Error assigning request:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign request',
        variant: 'destructive',
      });
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.song_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.song_artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.event_qr_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.payment_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter || 
                         (statusFilter === 'paid' && request.payment_status === 'paid');
    
    const matchesDateRange = (!dateRangeStart || new Date(request.created_at) >= new Date(dateRangeStart)) &&
                             (!dateRangeEnd || new Date(request.created_at) <= new Date(dateRangeEnd + 'T23:59:59'));
    
    const matchesPaymentMethod = paymentMethodFilter === 'all' || request.payment_method === paymentMethodFilter;
    
    const matchesRequestType = requestTypeFilter === 'all' || request.request_type === requestTypeFilter;
    
    const matchesEventCode = !eventCodeFilter || request.event_qr_code?.toLowerCase().includes(eventCodeFilter.toLowerCase());
    
    const matchesAudioUpload = audioUploadFilter === 'all' || 
      (audioUploadFilter === 'custom' && request.is_custom_audio) ||
      (audioUploadFilter === 'standard' && !request.is_custom_audio);
    
    // View mode filter: 'all', 'requests' (non-bidding), or 'bids' (bidding only)
    const matchesViewMode = viewMode === 'all' || 
      (viewMode === 'requests' && !request.bidding_enabled) ||
      (viewMode === 'bids' && request.bidding_enabled);
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesPaymentMethod && matchesRequestType && matchesEventCode && matchesAudioUpload && matchesViewMode;
  });

  // Helper function to determine if a request is paid
  const isPaid = (request: CrowdRequest) => {
    return request.payment_status === 'paid' || 
           (request.amount_paid > 0 && request.payment_intent_id);
  };

  // Helper function to detect if a request is part of a bundle
  // A request is part of a bundle if:
  // 1. It has a "Bundle deal" message, OR
  // 2. It's the main request (no bundle message) but there are other requests with bundle messages from the same requester created within 5 seconds
  const isBundleRequest = (request: CrowdRequest): boolean => {
    // Direct bundle request (has bundle message)
    if (request.request_message && request.request_message.includes('Bundle deal')) {
      return true;
    }
    
    // Check if this is the main request in a bundle (no bundle message, but other bundle requests exist)
    // Look for other requests with bundle messages from same requester created within 5 seconds
    const hasBundleSiblings = requests.some(r => 
      r.id !== request.id &&
      r.request_message?.includes('Bundle deal') &&
      (
        (request.requester_email && r.requester_email && request.requester_email === r.requester_email) ||
        (request.requester_phone && r.requester_phone && request.requester_phone === r.requester_phone)
      ) &&
      Math.abs(new Date(request.created_at).getTime() - new Date(r.created_at).getTime()) < 5000
    );
    
    return hasBundleSiblings;
  };

  // Helper function to extract bundle info from message
  const getBundleInfo = (request: CrowdRequest): { bundleSize: number; bundlePrice: number } | null => {
    if (!isBundleRequest(request)) return null;
    
    const message = request.request_message || '';
    // Extract bundle size and price from message like "Bundle deal - 2 songs for $20.00"
    const match = message.match(/Bundle deal - (\d+) songs? for \$([\d.]+)/);
    if (match) {
      return {
        bundleSize: parseInt(match[1], 10),
        bundlePrice: parseFloat(match[2]) * 100 // Convert to cents
      };
    }
    return null;
  };

  // Helper function to group bundle requests together
  // Bundle requests share: same requester (email/phone), same payment_code or payment_intent_id, created within 5 seconds
  const getBundleGroup = (request: CrowdRequest): string | null => {
    if (!isBundleRequest(request)) return null;
    
    // Try to find other bundle requests that share payment info
    const bundleRequests = requests.filter(r => 
      isBundleRequest(r) &&
      r.id !== request.id &&
      (
        // Same payment code
        (request.payment_code && r.payment_code && request.payment_code === r.payment_code) ||
        // Same payment intent ID
        (request.payment_intent_id && r.payment_intent_id && request.payment_intent_id === r.payment_intent_id) ||
        // Same requester and created within 5 seconds (fallback for manual payments)
        (
          (request.requester_email && r.requester_email && request.requester_email === r.requester_email) ||
          (request.requester_phone && r.requester_phone && request.requester_phone === r.requester_phone)
        ) &&
        Math.abs(new Date(request.created_at).getTime() - new Date(r.created_at).getTime()) < 5000
      )
    );

    if (bundleRequests.length > 0) {
      // Use the earliest request ID as the group identifier
      const allBundleIds = [request.id, ...bundleRequests.map(r => r.id)].sort();
      return allBundleIds[0]; // Use first ID as group key
    }
    
    return request.id; // Single bundle request (shouldn't happen, but handle gracefully)
  };

  // Sorting function
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    // ALWAYS prioritize paid requests over unpaid ones (unless sorting by payment_status column)
    if (sortColumn !== 'payment_status') {
      const aPaid = isPaid(a);
      const bPaid = isPaid(b);
      if (aPaid && !bPaid) return -1; // Paid comes first
      if (!aPaid && bPaid) return 1;  // Unpaid comes after
    }

    // Keep bundle requests together - if they share the same payment_code, group them
    // The main request (without "Bundle deal" message) comes first, then bundle songs by created_at
    if (a.payment_code && b.payment_code && a.payment_code === b.payment_code) {
      // Same bundle - sort main request first (doesn't have "Bundle deal" in message)
      const aIsBundle = a.request_message?.includes('Bundle deal');
      const bIsBundle = b.request_message?.includes('Bundle deal');
      if (!aIsBundle && bIsBundle) return -1; // Main request first
      if (aIsBundle && !bIsBundle) return 1;
      // Both are bundle songs - sort by created_at
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    // Don't prioritize fast-track when sorting by date - sort purely by date
    // Fast-track priority only applies when NOT sorting by date

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'created_at':
      case 'date':
        // For date sorting, use the earliest timestamp in the bundle group
        // This keeps bundles together while still sorting by date
        const aTime = a.payment_code 
          ? Math.min(...filteredRequests.filter(r => r.payment_code === a.payment_code).map(r => new Date(r.created_at).getTime()))
          : new Date(a.created_at).getTime();
        const bTime = b.payment_code 
          ? Math.min(...filteredRequests.filter(r => r.payment_code === b.payment_code).map(r => new Date(r.created_at).getTime()))
          : new Date(b.created_at).getTime();
        aValue = aTime;
        bValue = bTime;
        break;
      case 'requester_name':
        aValue = a.requester_name?.toLowerCase() || '';
        bValue = b.requester_name?.toLowerCase() || '';
        break;
      case 'amount':
        aValue = (a.amount_paid || a.amount_requested || 0);
        bValue = (b.amount_paid || b.amount_requested || 0);
        break;
      case 'status':
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
        break;
      case 'payment_status':
        // Sort payment status: paid > pending > failed
        const statusOrder = { 'paid': 0, 'pending': 1, 'failed': 2, 'refunded': 3, 'partially_refunded': 4 };
        aValue = statusOrder[a.payment_status as keyof typeof statusOrder] ?? 99;
        bValue = statusOrder[b.payment_status as keyof typeof statusOrder] ?? 99;
        break;
      case 'song_title':
        aValue = a.song_title?.toLowerCase() || '';
        bValue = b.song_title?.toLowerCase() || '';
        break;
      case 'event_code':
        aValue = a.event_qr_code?.toLowerCase() || '';
        bValue = b.event_qr_code?.toLowerCase() || '';
        break;
      default:
        aValue = a[sortColumn as keyof CrowdRequest];
        bValue = b[sortColumn as keyof CrowdRequest];
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, endIndex);

  // Handle column header click for sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending for dates, ascending for text
      setSortColumn(column);
      setSortDirection(column === 'created_at' || column === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRangeStart, dateRangeEnd, paymentMethodFilter, requestTypeFilter, eventCodeFilter, audioUploadFilter, viewMode]);

  const getStatusBadge = (status: string, paymentStatus: string, request?: CrowdRequest) => {
    // Handle bidding requests with authorized payments
    if (request?.bidding_enabled && request.current_bid_amount) {
      if (paymentStatus === 'pending' && !request.amount_paid) {
        return <Badge className="bg-yellow-600 text-white">Authorized</Badge>;
      } else if (paymentStatus === 'paid' || request.amount_paid > 0) {
        return <Badge className="bg-green-500 text-white">Charged</Badge>;
      } else if (paymentStatus === 'refunded') {
        return <Badge className="bg-gray-500 text-white">Cancelled</Badge>;
      }
    }
    
    // If we have a request object, check if payment is actually completed
    // (has payment_intent_id and amount_paid > 0) even if payment_status says pending
    if (request) {
      const isActuallyPaid = (request.payment_intent_id && request.amount_paid > 0);
      if (isActuallyPaid && paymentStatus !== 'refunded' && paymentStatus !== 'partially_refunded') {
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      }
    }
    
    if (paymentStatus === 'refunded') {
      return <Badge className="bg-red-600 text-white">Refunded</Badge>;
    } else if (paymentStatus === 'partially_refunded') {
      return <Badge className="bg-orange-600 text-white">Partially Refunded</Badge>;
    } else if (paymentStatus === 'paid') {
      return <Badge className="bg-green-500 text-white">Paid</Badge>;
    } else if (paymentStatus === 'pending') {
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
    } else if (paymentStatus === 'failed') {
      return <Badge className="bg-red-500 text-white">Failed</Badge>;
    }
    
    switch (status) {
      case 'new':
        return <Badge className="bg-gray-500 text-white">New</Badge>;
      case 'acknowledged':
        return <Badge className="bg-purple-500 text-white">Acknowledged</Badge>;
      case 'playing':
        return <Badge className="bg-orange-500 text-white">Playing</Badge>;
      case 'played':
        // Check if this was auto-detected
        const isAutoDetected = request?.matched_song_detection?.auto_marked_as_played;
        return (
          <Badge className="bg-green-600 text-white flex items-center gap-1">
            Played
            {isAutoDetected && (
              <span title="Auto-detected by audio recognition">
                <Mic className="w-3 h-3" />
              </span>
            )}
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Check subscription tier for upgrade prompts
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'cancelled' | 'past_due' | null>(null);
  const [usageStats, setUsageStats] = useState<{ currentUsage: number; limit: number } | null>(null);
  
  useEffect(() => {
    async function checkTier() {
      try {
        const org = await getCurrentOrganization(supabase);
        if (org) {
          setSubscriptionTier(org.subscription_tier);
          setSubscriptionStatus(org.subscription_status);
          setOrganization(org);
          
          // Load social links
          if ((org as any).social_links && Array.isArray((org as any).social_links)) {
            setSocialLinks((org as any).social_links.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
          }
          
          // Load bidding settings
          setBiddingSettings({
            enabled: (org as any).requests_bidding_enabled || false,
            minimumBid: (org as any).requests_bidding_minimum_bid || 500,
            startingBid: (org as any).requests_bidding_starting_bid || 500
          });

          // Load usage stats for Free tier
          if (org.subscription_tier === 'starter' && org.id) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const { count } = await supabase
              .from('crowd_requests')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', org.id)
              .in('request_type', ['song_request', 'shoutout'])
              .gte('created_at', startOfMonth.toISOString());

            const currentUsage = count || 0;
            const limit = 10; // Free tier limit

            setUsageStats({
              currentUsage,
              limit,
            });
          } else {
            // Pro+ tier has unlimited
            setUsageStats({
              currentUsage: 0,
              limit: -1, // Unlimited
            });
          }
        }
      } catch (error) {
        console.error('Error checking subscription tier:', error);
      }
    }
    checkTier();
  }, [supabase]);

  // Helper function to get effective brand colors with fallback
  const getEffectiveBrandColor = (colorType: 'accent' | 'secondary1' | 'secondary2'): string => {
    if (!organization) return '#000000';
    const isTipJar = organization?.product_context === 'tipjar';
    const defaultAccent = isTipJar ? '#000000' : '#fcba00';
    const accent = organization.requests_accent_color || defaultAccent;
    
    if (colorType === 'accent') return accent;
    if (colorType === 'secondary1') {
      return organization.requests_secondary_color_1 || accent || defaultAccent;
    }
    return organization.requests_secondary_color_2 || accent || defaultAccent;
  };

  const effectiveBrandColor = getEffectiveBrandColor('accent');
  const effectiveSecondaryColor1 = getEffectiveBrandColor('secondary1');
  const effectiveSecondaryColor2 = getEffectiveBrandColor('secondary2');
  const effectiveBrandColorHover = `${effectiveBrandColor}dd`;

  return (
    <AdminLayout>
      {/* Brand Color CSS Variables - Apply user's brand colors to admin UI */}
      <style 
        dangerouslySetInnerHTML={{ 
          __html: `
            :root {
              --admin-brand-color: ${effectiveBrandColor};
              --admin-brand-color-hover: ${effectiveBrandColorHover};
              --admin-secondary-color-1: ${effectiveSecondaryColor1};
              --admin-secondary-color-2: ${effectiveSecondaryColor2};
            }
            /* Override hardcoded gold references */
            .bg-\\[\\#fcba00\\] { background-color: var(--admin-brand-color) !important; }
            .text-\\[\\#fcba00\\] { color: var(--admin-brand-color) !important; }
            .border-\\[\\#fcba00\\] { border-color: var(--admin-secondary-color-1) !important; }
            .ring-\\[\\#fcba00\\] { --tw-ring-color: var(--admin-secondary-color-1) !important; }
            .hover\\:bg-\\[\\#d99f00\\]:hover { background-color: var(--admin-brand-color-hover) !important; }
            .accent-\\[\\#fcba00\\] { accent-color: var(--admin-brand-color) !important; }
            .peer-checked\\:bg-\\[\\#fcba00\\] { background-color: var(--admin-brand-color) !important; }
            .focus\\:ring-\\[\\#fcba00\\]:focus { --tw-ring-color: var(--admin-secondary-color-1) !important; }
            .dark .peer-focus\\:ring-\\[\\#fcba00\\] { --tw-ring-color: var(--admin-secondary-color-1) !important; }
          `
        }}
      />
      <div className="space-y-6 px-4 lg:px-6">
        {/* Onboarding Reminder - Shows if critical tasks incomplete */}
        {organization && (
          <OnboardingReminder 
            organization={organization}
            onOrganizationUpdate={async (updatedOrg) => {
              // Update local organization state
              setOrganization(updatedOrg);
              // Also update header settings if location was updated
              if (updatedOrg.requests_header_location) {
                setHeaderSettings(prev => ({
                  ...prev,
                  location: updatedOrg.requests_header_location || prev.location
                }));
              }
            }}
          />
        )}
        
        {/* Stripe Connect Requirement Banner */}
        <StripeConnectRequirementBanner organization={organization} />
        
        {/* Stripe Connect Setup Component */}
        <StripeConnectSetup />
        
        {/* Usage Limit Banner for Free Tier */}
        {subscriptionTier === 'starter' && subscriptionStatus && usageStats && (
          <UsageLimitBanner
            currentUsage={usageStats.currentUsage}
            limit={usageStats.limit}
            subscriptionTier={subscriptionTier as 'starter'}
            subscriptionStatus={subscriptionStatus}
            featureName="requests"
          />
        )}
        
        {/* Upgrade Prompt for Starter Tier */}
        {subscriptionTier === 'starter' && (
          <UpgradePrompt 
            message="Unlock unlimited requests, full payment processing, and advanced features with Pro plan."
            featureName="Unlimited Requests & Payments"
            tier="professional"
            className="mb-4"
          />
        )}

        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Crowd Requests
              </h1>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
              <Button
                onClick={() => router.push('/admin/qr-scans')}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 h-8 sm:h-9"
                title="View Scans"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline text-xs sm:text-sm">View Scans</span>
              </Button>
              <Button
                onClick={() => setShowQRGenerator(!showQRGenerator)}
                size="sm"
                className="btn-primary inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 h-8 sm:h-9"
                title={showQRGenerator ? 'Hide QR Code Generator' : 'Generate QR Code'}
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline text-xs sm:text-sm">{showQRGenerator ? 'Hide' : 'Generate'} QR</span>
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/crowd-request/find-missing-venmo?days=7&paymentMethod=venmo');
                    const data = await response.json();
                    if (data.success) {
                      toast({
                        title: 'Missing Requests Found',
                        description: `Found ${data.summary.total} requests. ${data.summary.without_organization} without organization. Check console for details.`,
                      });
                      console.log('Missing requests data:', data);
                      // If there are requests without organization, offer to assign them
                      if (data.without_organization.length > 0 && organization?.id) {
                        const assign = confirm(`Found ${data.without_organization.length} requests without organization. Assign them to your organization?`);
                        if (assign) {
                          for (const req of data.without_organization) {
                            await (supabase
                              .from('crowd_requests') as any)
                              .update({ organization_id: organization.id })
                              .eq('id', req.id);
                          }
                          toast({
                            title: 'Success',
                            description: `Assigned ${data.without_organization.length} request(s) to your organization`,
                          });
                          fetchRequests();
                        }
                      }
                    }
                  } catch (error) {
                    toast({
                      title: 'Error',
                      description: 'Failed to find missing requests',
                      variant: 'destructive',
                    });
                  }
                }}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 h-8 sm:h-9"
                title="Find missing Venmo requests from the last 7 days"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden lg:inline text-xs sm:text-sm">Find Missing</span>
              </Button>
              <Button
                onClick={handleManualSync}
                disabled={syncingPayments}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 h-8 sm:h-9"
                title="Sync payment status from Stripe for all requests"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${syncingPayments ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline text-xs sm:text-sm">{syncingPayments ? 'Syncing...' : 'Sync Payments'}</span>
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/webhooks/stripe/test');
                    const data = await response.json();
                    const message = data.status === 'healthy' 
                      ? `✅ Webhooks configured correctly!\n\n${JSON.stringify(data.checks, null, 2)}`
                      : `⚠️ Issues detected:\n\n${data.recommendations?.map((r: any) => `- ${r.issue}: ${r.fix}`).join('\n') || 'Unknown error'}`;
                    alert(message);
                  } catch (error: any) {
                    toast({
                      title: 'Test Failed',
                      description: error?.message || 'Unknown error',
                      variant: 'destructive',
                    });
                  }
                }}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 h-8 sm:h-9"
                title="Test Stripe webhook configuration"
              >
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden lg:inline text-xs sm:text-sm">Test Webhooks</span>
              </Button>
              <Button
                onClick={async () => {
                  try {
                    setSyncingPayments(true);
                    const response = await fetch('/api/crowd-request/find-orphaned-payments');
                    const data = await response.json();
                    
                    if (data.success) {
                      const total = data.summary.orphaned_payments + data.summary.orphaned_sessions + data.summary.payments_without_request_id;
                      if (total === 0) {
                        toast({
                          title: 'No Orphaned Payments',
                          description: 'All payments in Stripe are properly linked!',
                        });
                      } else {
                        setOrphanedPaymentsData(data);
                        setShowOrphanedDialog(true);
                        console.log('Orphaned Payments:', data);
                      }
                    }
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: error?.message || 'Unknown error',
                      variant: 'destructive',
                    });
                  } finally {
                    setSyncingPayments(false);
                  }
                }}
                disabled={syncingPayments}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 h-8 sm:h-9"
                title="Find payments in Stripe that aren't in the app"
              >
                <Search className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${syncingPayments ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline text-xs sm:text-sm">{syncingPayments ? 'Searching...' : 'Find Orphaned'}</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards - Moved to Top */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {requests.length}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Paid</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {requests.filter(r => r.payment_status === 'paid').length}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                ${(requests
                  .filter(r => r.payment_status === 'paid' || r.payment_status === 'partially_refunded')
                  .reduce((sum, r) => {
                    const paid = r.amount_paid || 0;
                    const refunded = r.refund_amount || 0;
                    return sum + (paid - refunded);
                  }, 0) / 100).toFixed(2)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {requests.filter(r => r.payment_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Generator */}
        {showQRGenerator && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generate QR Code
            </h2>
            
            {/* QR Type Selection */}
            <div className="flex gap-3 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setQrType('public');
                  setGeneratedQR(null);
                  setGeneratedPublicQR(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  qrType === 'public'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Public Requests Page
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrType('event');
                  setGeneratedQR(null);
                  setGeneratedPublicQR(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  qrType === 'event'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Event-Specific
              </button>
            </div>

            {qrType === 'event' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Event Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={qrEventCode}
                      onChange={(e) => setQrEventCode(e.target.value)}
                      placeholder="e.g., wedding-2025-01-15"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Unique identifier for this event (used in URL)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Event Name (optional)
                    </label>
                    <Input
                      value={qrEventName}
                      onChange={(e) => setQrEventName(e.target.value)}
                      placeholder="e.g., Sarah & Michael's Wedding"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Event Date (optional)
                    </label>
                    <Input
                      type="date"
                      value={qrEventDate}
                      onChange={(e) => setQrEventDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={generateQRCode}
                    className="btn-primary inline-flex items-center gap-2"
                    disabled={!qrEventCode.trim()}
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </Button>
                  
                  {generatedQR && (
                    <>
                      <Button
                        onClick={copyQRUrl}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy URL
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={downloadQRCode}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download QR
                      </Button>
                      
                      <Button
                        onClick={printQRCodeToPDF}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print PDF
                      </Button>
                    </>
                  )}
                </div>

                {generatedQR && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="flex-shrink-0">
                        <DecoratedQRCode 
                          qrCodeUrl={generatedQR} 
                          size={180}
                          showDecorations={true}
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Request URL:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">
                          {process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/crowd-request/{qrEventCode}?qr=1
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Scan this QR code or share the URL above with your event attendees.
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          ✨ Festive decorations will appear in your printed PDF!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    This QR code will link to the public requests page at <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">/requests</code>. 
                    Anyone can use this page to submit song requests or shoutouts.
                  </p>
                </div>

                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={generateQRCode}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate Public QR Code
                  </Button>
                  
                  {generatedPublicQR && (
                    <>
                      <Button
                        onClick={copyQRUrl}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy URL
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={downloadQRCode}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download QR
                      </Button>
                      
                      <Button
                        onClick={printQRCodeToPDF}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print PDF
                      </Button>
                    </>
                  )}
                </div>


                {generatedPublicQR && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      <div className="flex-shrink-0">
                        <DecoratedQRCode 
                          qrCodeUrl={generatedPublicQR} 
                          size={180}
                          showDecorations={true}
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Public Requests URL:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">
                          {(() => {
                            // Determine base URL based on product context
                            // Check multiple sources to ensure we get the correct product context
                            let productContext = organization?.product_context || null;
                            
                            // If product context is not set or might be wrong, try to detect from multiple sources
                            if (!productContext || productContext === 'm10dj') {
                              // Try to detect from current domain first
                              if (typeof window !== 'undefined') {
                                const hostname = window.location.hostname.toLowerCase();
                                if (hostname.includes('tipjar.live')) {
                                  productContext = 'tipjar';
                                } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
                                  productContext = 'djdash';
                                } else if (hostname.includes('m10djcompany.com')) {
                                  productContext = 'm10dj';
                                }
                              }
                              
                              // If on localhost and still not detected, check user metadata or environment
                              if ((!productContext || productContext === 'm10dj') && typeof window !== 'undefined') {
                                const hostname = window.location.hostname.toLowerCase();
                                if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
                                  // On localhost, check environment variables or default to tipjar
                                  // This helps with development when product_context might be incorrectly set
                                  if (process.env.NEXT_PUBLIC_TIPJAR_URL || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT === 'tipjar') {
                                    productContext = 'tipjar';
                                  } else if (process.env.NEXT_PUBLIC_DJDASH_URL || process.env.NEXT_PUBLIC_DEFAULT_PRODUCT === 'djdash') {
                                    productContext = 'djdash';
                                  } else {
                                    // For localhost development, default to tipjar if product_context was m10dj
                                    // This helps fix cases where organization was created with wrong product_context
                                    productContext = 'tipjar';
                                  }
                                }
                              }
                            }
                            
                            // Final fallback: default to tipjar if still not detected
                            productContext = productContext || 'tipjar';
                            
                            let baseUrl: string;
                            switch (productContext) {
                              case 'tipjar':
                                baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://tipjar.live';
                                break;
                              case 'djdash':
                                baseUrl = process.env.NEXT_PUBLIC_DJDASH_URL || 'https://djdash.net';
                                break;
                              case 'm10dj':
                                baseUrl = process.env.NEXT_PUBLIC_M10DJ_URL || 'https://m10djcompany.com';
                                break;
                              default:
                                // Fallback: check current domain
                                if (typeof window !== 'undefined') {
                                  const hostname = window.location.hostname.toLowerCase();
                                  if (hostname.includes('tipjar.live')) {
                                    baseUrl = 'https://tipjar.live';
                                  } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
                                    baseUrl = 'https://djdash.net';
                                  } else {
                                    baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                                  }
                                } else {
                                  baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
                                }
                            }

                            // Use organization slug for TipJar/DJDash, also for M10 if slug exists
                            if (organization?.slug && (productContext === 'tipjar' || productContext === 'djdash' || productContext === 'm10dj')) {
                              return `${baseUrl}/${organization.slug}/requests?qr=1`;
                            } else {
                              return `${baseUrl}/requests?qr=1`;
                            }
                          })()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Scan this QR code or share the URL above. This page is publicly accessible to anyone.
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          ✨ Festive decorations will appear in your printed PDF!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* PDF Preview Dialog */}
        <Dialog open={showPDFPreview} onOpenChange={(open) => {
          setShowPDFPreview(open);
          if (!open) {
            if (pdfBlobUrl) {
              URL.revokeObjectURL(pdfBlobUrl);
              setPdfBlobUrl(null);
            }
            setShowArtistNameInput(false);
          }
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full max-h-[95vh] h-[95vh] sm:h-[90vh] flex flex-col p-4 sm:p-6 m-4 sm:m-0 overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>PDF Preview</DialogTitle>
            </DialogHeader>
            
            {/* PDF Configuration Section */}
            <div className="border-b pb-4 mb-4 space-y-4 flex-shrink-0 overflow-y-auto">
              {/* PDF Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  PDF Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPdfType('full-page')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                      pdfType === 'full-page'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Full Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfType('table-tent')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                      pdfType === 'table-tent'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Table Tent
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {pdfType === 'table-tent' 
                    ? '8.5" x 11" portrait - fold vertically down the middle to create A-frame tent'
                    : 'Standard 8.5" x 11" portrait format'}
                </p>
              </div>

              {/* Artist Name Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                    Artist Name
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowArtistNameInput(!showArtistNameInput)}
                    className="h-8 px-2"
                  >
                    {showArtistNameInput ? (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
                {showArtistNameInput || pdfArtistName ? (
                  <Input
                    value={pdfArtistName}
                    onChange={(e) => setPdfArtistName(e.target.value)}
                    placeholder="Enter artist/DJ name (leave empty to remove)"
                    className="w-full"
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    (No artist name - click Edit to add)
                  </p>
                )}
                {pdfArtistName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to remove artist name from PDF
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
              {generatingPDF ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-400" />
                    <p className="text-lg font-semibold mb-2">Generating PDF...</p>
                    <p className="text-sm">This may take a few seconds</p>
                  </div>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p className="mb-4">Configure artist name and click &quot;Generate PDF&quot; to preview</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPDFPreview(false);
                  if (pdfBlobUrl) {
                    URL.revokeObjectURL(pdfBlobUrl);
                    setPdfBlobUrl(null);
                  }
                  setShowArtistNameInput(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={generatePDFWithArtistName}
                  disabled={generatingPDF}
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {generatingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      {pdfBlobUrl ? 'Regenerate PDF' : 'Generate PDF'}
                    </>
                  )}
                </Button>
                {pdfBlobUrl && (
                  <Button
                    onClick={() => {
                      if (pdfBlobUrl) {
                        const link = document.createElement('a');
                        link.href = pdfBlobUrl;
                        link.download = pdfFilename;
                        link.click();
                        
                        toast({
                          title: 'Downloaded',
                          description: 'PDF saved to your downloads folder',
                        });
                        
                        // Clean up after a delay to allow download to start
                        setTimeout(() => {
                          setShowPDFPreview(false);
                          URL.revokeObjectURL(pdfBlobUrl);
                          setPdfBlobUrl(null);
                          setShowArtistNameInput(false);
                        }, 1000);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings - Full Screen Modal */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 overflow-hidden flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            {/* Premium Header */}
            <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 px-8 py-6 border-b border-purple-500/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white mb-1">
                      Request Settings
                    </DialogTitle>
                    <p className="text-purple-100 text-sm">
                      Customize your crowd request experience
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </DialogHeader>

            {/* Tabbed Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8">
              <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-6 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  <TabsTrigger value="payment" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <DollarSign className="w-4 h-4" />
                    <span className="hidden sm:inline">Payment</span>
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Zap className="w-4 h-4" />
                    <span className="hidden sm:inline">Pricing</span>
                  </TabsTrigger>
                  <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Appearance</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">Social</span>
                  </TabsTrigger>
                  <TabsTrigger value="bidding" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Bidding</span>
                  </TabsTrigger>
                </TabsList>

                {/* Payment Tab */}
                <TabsContent value="payment" className="space-y-6 mt-0">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Payment Methods
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Configure alternative payment options
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          CashApp Tag
                        </label>
                        <Input
                          value={paymentSettings.cashAppTag}
                          onChange={(e) => setPaymentSettings(prev => ({ ...prev, cashAppTag: e.target.value }))}
                          placeholder="$DJbenmurray"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Your CashApp cashtag for manual payments
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Venmo Username
                        </label>
                        <Input
                          value={paymentSettings.venmoUsername}
                          onChange={(e) => setPaymentSettings(prev => ({ ...prev, venmoUsername: e.target.value }))}
                          placeholder="@djbenmurray"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Your Venmo username for manual payments
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Venmo Phone Number (Optional - Recommended)
                      </label>
                      <Input
                        type="tel"
                        value={paymentSettings.venmoPhoneNumber}
                        onChange={(e) => {
                          // Only allow digits
                          const digits = e.target.value.replace(/\D/g, '');
                          setPaymentSettings(prev => ({ ...prev, venmoPhoneNumber: digits }));
                        }}
                        placeholder="9014977001"
                        className="w-full"
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your Venmo phone number (10 digits, no dashes). This prevents customers from needing to verify your phone number when making payments. If provided, the deep link will use your phone number instead of username, which is more reliable.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-6 mt-0">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Pricing Configuration
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Set fees and payment amounts
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Fast-Track Fee
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={(requestSettings.fastTrackFee / 100).toFixed(2)}
                            onChange={(e) => {
                              const dollars = parseFloat(e.target.value) || 0;
                              setRequestSettings(prev => ({ ...prev, fastTrackFee: Math.round(dollars * 100) }));
                            }}
                            placeholder="10.00"
                            className="w-full pl-8"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Priority placement fee
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Minimum Payment
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={(requestSettings.minimumAmount / 100).toFixed(2)}
                            onChange={(e) => {
                              const dollars = parseFloat(e.target.value) || 0;
                              setRequestSettings(prev => ({ ...prev, minimumAmount: Math.round(dollars * 100) }));
                            }}
                            placeholder="1.00"
                            className="w-full pl-8"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Minimum amount per request
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                        Quick Amount Presets
                      </label>
                      <div className="space-y-3">
                        {requestSettings.presetAmounts.map((amount, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={(amount / 100).toFixed(2)}
                                onChange={(e) => {
                                  const dollars = parseFloat(e.target.value) || 0;
                                  if (dollars > 0) {
                                    const newAmounts = [...requestSettings.presetAmounts];
                                    newAmounts[index] = Math.round(dollars * 100);
                                    setRequestSettings(prev => ({ ...prev, presetAmounts: newAmounts }));
                                  }
                                }}
                                className="pl-8"
                                placeholder="0.00"
                              />
                            </div>
                            {requestSettings.presetAmounts.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newAmounts = requestSettings.presetAmounts.filter((_, i) => i !== index);
                                  setRequestSettings(prev => ({ ...prev, presetAmounts: newAmounts }));
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setRequestSettings(prev => ({ 
                              ...prev, 
                              presetAmounts: [...prev.presetAmounts, 500]
                            }));
                          }}
                          className="w-full border-dashed"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Preset Amount
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <input
                          type="checkbox"
                          id="bundleDiscountEnabled"
                          checked={requestSettings.bundleDiscountEnabled}
                          onChange={(e) => setRequestSettings(prev => ({ ...prev, bundleDiscountEnabled: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <label htmlFor="bundleDiscountEnabled" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer block mb-1">
                            Enable Bundle Discount
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Offer discounts when users request multiple songs
                          </p>
                          {requestSettings.bundleDiscountEnabled && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={requestSettings.bundleDiscountPercent}
                                onChange={(e) => {
                                  const percent = parseInt(e.target.value) || 0;
                                  if (percent >= 0 && percent <= 100) {
                                    setRequestSettings(prev => ({ ...prev, bundleDiscountPercent: percent }));
                                  }
                                }}
                                placeholder="10"
                                className="w-24"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">% discount per additional song</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6 mt-0">
                  {/* Header Settings */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Music className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Page Header
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Customize the header displayed on your requests page
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Artist/DJ Name
                        </label>
                        <Input
                          value={headerSettings.artistName}
                          onChange={(e) => setHeaderSettings(prev => ({ ...prev, artistName: e.target.value }))}
                          placeholder="DJ Ben Murray"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Location/Venue
                        </label>
                        <div className="relative">
                          <Input
                            value={headerSettings.location}
                            onChange={(e) => setHeaderSettings(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Silky O' Sullivan's"
                            className="w-full pr-10"
                          />
                          {headerSettings.location && (
                            <button
                              type="button"
                              onClick={() => setHeaderSettings(prev => ({ ...prev, location: '' }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              title="Clear location/venue"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Leave empty for a general requests page
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Date
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal pr-10",
                                !headerSettings.date && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {headerSettings.date ? (
                                headerSettings.date
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={headerSettings.date ? (() => {
                                // Try to parse the date string - handle various formats
                                const dateStr = headerSettings.date;
                                // Try common formats
                                const dateFormats = [
                                  /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/, // MM.DD.YY or MM.DD.YYYY
                                  /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // MM/DD/YY or MM/DD/YYYY
                                  /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
                                ];
                                
                                for (let i = 0; i < dateFormats.length; i++) {
                                  const dateFormat = dateFormats[i];
                                  const matchResult = dateStr.match(dateFormat);
                                  if (!matchResult) continue;
                                  // TypeScript doesn't narrow after continue, so we assert non-null
                                  const match = matchResult as RegExpMatchArray;
                                  const match1 = match[1];
                                  const match2 = match[2];
                                  const match3 = match[3];
                                  if (match1 && match2 && match3) {
                                    let month = parseInt(match1, 10);
                                    let day = parseInt(match2, 10);
                                    let year = parseInt(match3, 10);
                                    
                                    // Handle 2-digit years
                                    if (year < 100) {
                                      year += 2000;
                                    }
                                    
                                    // Check if format is YYYY-MM-DD (ISO)
                                    if (i === 2) {
                                      year = parseInt(match1, 10);
                                      month = parseInt(match2, 10);
                                      day = parseInt(match3, 10);
                                    }
                                    
                                    const date = new Date(year, month - 1, day);
                                    if (!isNaN(date.getTime())) {
                                      return date;
                                    }
                                  }
                                }
                                
                                // Fallback: try direct Date parsing
                                const parsed = new Date(dateStr);
                                return !isNaN(parsed.getTime()) ? parsed : undefined;
                              })() : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  // Format as MM.dd.yy to match the placeholder format
                                  const formatted = format(date, 'MM.dd.yy');
                                  setHeaderSettings(prev => ({ ...prev, date: formatted }));
                                } else {
                                  setHeaderSettings(prev => ({ ...prev, date: '' }));
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <div className="relative">
                          <Input
                            value={headerSettings.date}
                            onChange={(e) => setHeaderSettings(prev => ({ ...prev, date: e.target.value }))}
                            placeholder="11.29.25 or pick from calendar"
                            className="w-full pr-10"
                          />
                          {headerSettings.date && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              onClick={() => setHeaderSettings(prev => ({ ...prev, date: '' }))}
                              title="Clear date"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Leave empty for a general requests page
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cover Photos */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                        <Eye className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Cover Photos
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Set background images for your requests page
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Primary Cover Photo URL - Only show when neither artist nor venue photos are set */}
                      {!coverPhotoSettings.requests_artist_photo_url && !coverPhotoSettings.requests_venue_photo_url && (
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                            Primary Cover Photo URL
                          </label>
                          <Input
                            type="url"
                            value={coverPhotoSettings.requests_cover_photo_url}
                            onChange={(e) => setCoverPhotoSettings(prev => ({ ...prev, requests_cover_photo_url: e.target.value }))}
                            placeholder="https://example.com/cover-photo.jpg"
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Set a cover photo for your requests page. Once you add artist or venue photos, you can choose between them instead.
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Recommended: 1920x800px or larger
                          </p>
                          {coverPhotoSettings.requests_cover_photo_url && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <img
                                src={coverPhotoSettings.requests_cover_photo_url}
                                alt="Cover preview"
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          {/* Cover Photo History */}
                          {coverPhotoHistory.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Previously Used Cover Photos
                              </label>
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                {coverPhotoHistory.map((url, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => setCoverPhotoSettings(prev => ({ ...prev, requests_cover_photo_url: url }))}
                                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                      coverPhotoSettings.requests_cover_photo_url === url
                                        ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                                    }`}
                                    title={url}
                                  >
                                    <img
                                      src={url}
                                      alt={`Cover ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.parentElement?.classList.add('hidden');
                                      }}
                                    />
                                    {coverPhotoSettings.requests_cover_photo_url === url && (
                                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Click a photo to reuse it
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Primary Cover Photo Source Selection - Show when both artist and venue are set */}
                      {coverPhotoSettings.requests_artist_photo_url && coverPhotoSettings.requests_venue_photo_url && (
                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Primary Cover Photo Source
                          </label>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Both artist and venue photos are set. Choose which one to use as the primary cover photo:
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 font-medium">
                            ⚠️ Remember to click &quot;Save Settings&quot; after making your selection for changes to take effect on the requests page.
                          </p>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                console.log('🎯 Selecting artist photo as primary');
                                setCoverPhotoSettings(prev => ({ ...prev, requests_primary_cover_source: 'artist' }));
                              }}
                              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                coverPhotoSettings.requests_primary_cover_source === 'artist'
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-300 dark:ring-purple-700'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                              }`}
                            >
                              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Artist Photo</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Use artist photo as primary</div>
                              {coverPhotoSettings.requests_primary_cover_source === 'artist' && (
                                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">✓ Selected</div>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                console.log('🎯 Selecting venue photo as primary');
                                setCoverPhotoSettings(prev => ({ ...prev, requests_primary_cover_source: 'venue' }));
                              }}
                              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                                coverPhotoSettings.requests_primary_cover_source === 'venue'
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-300 dark:ring-purple-700'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                              }`}
                            >
                              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Venue Photo</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Use venue photo as primary</div>
                              {coverPhotoSettings.requests_primary_cover_source === 'venue' && (
                                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">✓ Selected</div>
                              )}
                            </button>
                          </div>
                          
                          {/* Current Cover Photo Preview */}
                          {(() => {
                            // Create a mock organization object to use with getCoverPhotoUrl
                            const mockOrg = {
                              requests_cover_photo_url: coverPhotoSettings.requests_cover_photo_url || null,
                              requests_artist_photo_url: coverPhotoSettings.requests_artist_photo_url || null,
                              requests_venue_photo_url: coverPhotoSettings.requests_venue_photo_url || null,
                              requests_primary_cover_source: coverPhotoSettings.requests_primary_cover_source || 'artist'
                            };
                            const currentCoverPhoto = getCoverPhotoUrl(mockOrg, '');
                            
                            if (!currentCoverPhoto) return null;
                            
                            return (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Current Cover Photo Preview
                                </label>
                                <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-700">
                                  <img
                                    src={currentCoverPhoto}
                                    alt="Current cover photo preview"
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                    <p className="text-xs text-white font-medium">
                                      {coverPhotoSettings.requests_primary_cover_source === 'venue' 
                                        ? 'Using Venue Photo' 
                                        : 'Using Artist Photo'}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  This is the photo that will appear on your requests page
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                            Artist Photo URL (Fallback)
                          </label>
                          <Input
                            type="url"
                            value={coverPhotoSettings.requests_artist_photo_url}
                            onChange={(e) => setCoverPhotoSettings(prev => ({ ...prev, requests_artist_photo_url: e.target.value }))}
                            placeholder="https://example.com/artist-photo.jpg"
                            className="w-full"
                          />
                          {coverPhotoSettings.requests_artist_photo_url && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <img
                                src={coverPhotoSettings.requests_artist_photo_url}
                                alt="Artist preview"
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          {/* Artist Photo History */}
                          {artistPhotoHistory.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Previously Used Artist Photos
                              </label>
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                {artistPhotoHistory.map((url, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => setCoverPhotoSettings(prev => ({ ...prev, requests_artist_photo_url: url }))}
                                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                      coverPhotoSettings.requests_artist_photo_url === url
                                        ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                                    }`}
                                    title={url}
                                  >
                                    <img
                                      src={url}
                                      alt={`Artist ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.parentElement?.classList.add('hidden');
                                      }}
                                    />
                                    {coverPhotoSettings.requests_artist_photo_url === url && (
                                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Click a photo to reuse it
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                            Venue Photo URL (Fallback)
                          </label>
                          <Input
                            type="url"
                            value={coverPhotoSettings.requests_venue_photo_url}
                            onChange={(e) => setCoverPhotoSettings(prev => ({ ...prev, requests_venue_photo_url: e.target.value }))}
                            placeholder="https://example.com/venue-photo.jpg"
                            className="w-full"
                          />
                          {coverPhotoSettings.requests_venue_photo_url && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <img
                                src={coverPhotoSettings.requests_venue_photo_url}
                                alt="Venue preview"
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          {/* Venue Photo History */}
                          {venuePhotoHistory.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Previously Used Venue Photos
                              </label>
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                {venuePhotoHistory.map((url, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => setCoverPhotoSettings(prev => ({ ...prev, requests_venue_photo_url: url }))}
                                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                      coverPhotoSettings.requests_venue_photo_url === url
                                        ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                                    }`}
                                    title={url}
                                  >
                                    <img
                                      src={url}
                                      alt={`Venue ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.parentElement?.classList.add('hidden');
                                      }}
                                    />
                                    {coverPhotoSettings.requests_venue_photo_url === url && (
                                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Click a photo to reuse it
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-6 mt-0">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Page Content & Text
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Customize all text and labels on your requests page
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {/* SEO Settings */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                          SEO & Page Info
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                              Page Title
                            </label>
                            <Input
                              value={pageSettings.pageTitle}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, pageTitle: e.target.value }))}
                              placeholder={getPageTitlePlaceholder()}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Browser tab title and SEO title
                            </p>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                              Meta Description
                            </label>
                            <Textarea
                              value={pageSettings.pageDescription}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, pageDescription: e.target.value }))}
                              placeholder="Request songs and shoutouts for your event"
                              className="w-full"
                              rows={2}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              SEO meta description
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Main Content
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                              Main Heading
                            </label>
                            <Input
                              value={pageSettings.mainHeading}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, mainHeading: e.target.value }))}
                              placeholder="What would you like to request?"
                              className="w-full"
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                                Song Request Button Label
                              </label>
                              <Input
                                value={pageSettings.songRequestLabel}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, songRequestLabel: e.target.value }))}
                                placeholder="Song Request"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                                Shoutout Button Label
                              </label>
                              <Input
                                value={pageSettings.shoutoutLabel}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, shoutoutLabel: e.target.value }))}
                                placeholder="Shoutout"
                                className="w-full"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                              Default Request Type
                            </label>
                            <select
                              value={pageSettings.defaultRequestType}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, defaultRequestType: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="song_request">Song Request</option>
                              <option value="shoutout">Shoutout</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields - Collapsible Sections */}
                      <div className="space-y-4">
                        {/* Music Link Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Music Link Section</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Label
                              </label>
                              <Input
                                value={pageSettings.musicLinkLabel}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, musicLinkLabel: e.target.value }))}
                                placeholder="Paste Music Link (Optional)"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Placeholder
                              </label>
                              <Input
                                value={pageSettings.musicLinkPlaceholder}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, musicLinkPlaceholder: e.target.value }))}
                                placeholder="Paste YouTube, Spotify, SoundCloud link"
                                className="w-full"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Help Text
                              </label>
                              <Input
                                value={pageSettings.musicLinkHelpText}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, musicLinkHelpText: e.target.value }))}
                                placeholder="We'll automatically fill in the song title and artist name"
                                className="w-full"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Manual Entry Divider Text
                              </label>
                              <Input
                                value={pageSettings.manualEntryDivider}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, manualEntryDivider: e.target.value }))}
                                placeholder="Or enter manually"
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Song Request Fields */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Song Request Fields</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Song Title Label
                              </label>
                              <Input
                                value={pageSettings.songTitleLabel}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, songTitleLabel: e.target.value }))}
                                placeholder="Song Title"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Song Title Placeholder
                              </label>
                              <Input
                                value={pageSettings.songTitlePlaceholder}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, songTitlePlaceholder: e.target.value }))}
                                placeholder="Enter song title"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Artist Name Label
                              </label>
                              <Input
                                value={pageSettings.artistNameLabel}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, artistNameLabel: e.target.value }))}
                                placeholder="Artist Name"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Artist Name Placeholder
                              </label>
                              <Input
                                value={pageSettings.artistNamePlaceholder}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, artistNamePlaceholder: e.target.value }))}
                                placeholder="Enter artist name"
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Shoutout Fields */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Shoutout Fields</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Recipient Name Label
                              </label>
                              <Input
                                value={pageSettings.recipientNameLabel}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, recipientNameLabel: e.target.value }))}
                                placeholder="Recipient Name"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Recipient Name Placeholder
                              </label>
                              <Input
                                value={pageSettings.recipientNamePlaceholder}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, recipientNamePlaceholder: e.target.value }))}
                                placeholder="Who is this shoutout for?"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Message Label
                              </label>
                              <Input
                                value={pageSettings.messageLabel}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, messageLabel: e.target.value }))}
                                placeholder="Message"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Message Placeholder
                              </label>
                              <Input
                                value={pageSettings.messagePlaceholder}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, messagePlaceholder: e.target.value }))}
                                placeholder="What would you like to say?"
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Audio Upload Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Audio Upload Section</h4>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={pageSettings.showAudioUpload}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, showAudioUpload: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Enable</span>
                            </label>
                          </div>
                          {pageSettings.showAudioUpload && (
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="md:col-span-2 space-y-2">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Audio Upload Label
                                </label>
                                <Input
                                  value={pageSettings.audioUploadLabel}
                                  onChange={(e) => setPageSettings(prev => ({ ...prev, audioUploadLabel: e.target.value }))}
                                  placeholder="Upload Your Own Audio File"
                                  className="w-full"
                                />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Description
                                </label>
                                <Textarea
                                  value={pageSettings.audioUploadDescription}
                                  onChange={(e) => setPageSettings(prev => ({ ...prev, audioUploadDescription: e.target.value }))}
                                  placeholder="Upload your own audio file to be played..."
                                  className="w-full"
                                  rows={2}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Artist Rights Text
                                </label>
                                <Input
                                  value={pageSettings.artistRightsText}
                                  onChange={(e) => setPageSettings(prev => ({ ...prev, artistRightsText: e.target.value }))}
                                  placeholder="I confirm that I own the rights..."
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Is Artist Text
                                </label>
                                <Input
                                  value={pageSettings.isArtistText}
                                  onChange={(e) => setPageSettings(prev => ({ ...prev, isArtistText: e.target.value }))}
                                  placeholder="I am the artist..."
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Audio Fee Text
                                </label>
                                <Input
                                  value={pageSettings.audioFeeText}
                                  onChange={(e) => setPageSettings(prev => ({ ...prev, audioFeeText: e.target.value }))}
                                  placeholder="+$100.00 for audio upload"
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Buttons & Steps */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Buttons & Steps</h4>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Submit Button Text
                              </label>
                              <Input
                                value={pageSettings.submitButtonText}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, submitButtonText: e.target.value }))}
                                placeholder="Submit Request"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Step 1 Text
                              </label>
                              <Input
                                value={pageSettings.step1Text}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, step1Text: e.target.value }))}
                                placeholder="Step 1 of 2: Choose your request"
                                className="w-full"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Step 2 Text
                              </label>
                              <Input
                                value={pageSettings.step2Text}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, step2Text: e.target.value }))}
                                placeholder="Step 2 of 2: Payment"
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Feature Toggles */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Feature Toggles
                          </h4>
                          <div className="grid md:grid-cols-3 gap-4">
                            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={pageSettings.showFastTrack}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, showFastTrack: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">Fast-Track</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={pageSettings.showNextSong}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, showNextSong: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">Next Song</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                              <input
                                type="checkbox"
                                checked={pageSettings.showBundleDiscount}
                                onChange={(e) => setPageSettings(prev => ({ ...prev, showBundleDiscount: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">Bundle Discount</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Social Links Tab */}
                <TabsContent value="social" className="space-y-6 mt-0">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Social Links
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add social media links to display on your requests page
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          const newLink = {
                            platform: 'custom',
                            url: '',
                            label: '',
                            enabled: true,
                            order: socialLinks.length + 1
                          };
                          setSocialLinks([...socialLinks, newLink]);
                        }}
                        className="bg-[#fcba00] hover:bg-[#d99f00] text-black"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Link
                      </Button>
                    </div>

                    {socialLinks.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <Globe className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">No social links added yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                          Default links (Instagram & Facebook) will be shown to visitors
                        </p>
                        <Button
                          onClick={() => {
                            const newLink = {
                              platform: 'custom',
                              url: '',
                              label: '',
                              enabled: true,
                              order: 1
                            };
                            setSocialLinks([newLink]);
                          }}
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Link
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {socialLinks.map((link, index) => (
                          <div
                            key={index}
                            className={`border rounded-lg p-4 transition-all ${
                              link.enabled
                                ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex flex-col gap-1 pt-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (index > 0) {
                                      const updated = [...socialLinks];
                                      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
                                      updated[index].order = index + 1;
                                      updated[index - 1].order = index;
                                      setSocialLinks(updated);
                                    }
                                  }}
                                  disabled={index === 0}
                                  className="h-6 w-6 p-0"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (index < socialLinks.length - 1) {
                                      const updated = [...socialLinks];
                                      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
                                      updated[index].order = index + 1;
                                      updated[index + 1].order = index + 2;
                                      setSocialLinks(updated);
                                    }
                                  }}
                                  disabled={index === socialLinks.length - 1}
                                  className="h-6 w-6 p-0"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Platform
                                  </label>
                                  <select
                                    value={link.platform}
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[index] = { ...updated[index], platform: e.target.value };
                                      if (e.target.value !== 'custom' && !updated[index].label) {
                                        const platforms: Record<string, string> = {
                                          facebook: 'Facebook',
                                          instagram: 'Instagram',
                                          twitter: 'Twitter/X',
                                          youtube: 'YouTube',
                                          tiktok: 'TikTok',
                                          linkedin: 'LinkedIn',
                                          snapchat: 'Snapchat',
                                          pinterest: 'Pinterest'
                                        };
                                        updated[index].label = platforms[e.target.value] || e.target.value;
                                      }
                                      setSocialLinks(updated);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="custom">Custom Link</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="twitter">Twitter/X</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="snapchat">Snapchat</option>
                                    <option value="pinterest">Pinterest</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Link Label
                                  </label>
                                  <Input
                                    type="text"
                                    value={link.label}
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[index] = { ...updated[index], label: e.target.value };
                                      setSocialLinks(updated);
                                    }}
                                    placeholder="e.g., Follow Us"
                                    className="w-full"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    URL
                                  </label>
                                  <Input
                                    type="url"
                                    value={link.url}
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[index] = { ...updated[index], url: e.target.value };
                                      setSocialLinks(updated);
                                    }}
                                    placeholder="https://..."
                                    className="w-full"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={link.enabled}
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[index] = { ...updated[index], enabled: e.target.checked };
                                      setSocialLinks(updated);
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSocialLinks(socialLinks.filter((_, i) => i !== index));
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Bidding Mode Tab */}
                <TabsContent value="bidding" className="space-y-6 mt-0">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Bidding War Mode
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Enable competitive bidding for song requests
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">
                          How Bidding Mode Works
                        </h4>
                        <ul className="text-sm text-gray-800 dark:text-gray-300 space-y-1 list-disc list-inside">
                          <li>Users submit requests and place bids</li>
                          <li>Every 30 minutes, the highest bidder wins</li>
                          <li>Winner is charged, others&apos; authorizations are released</li>
                          <li>Winning request is played by the DJ</li>
                        </ul>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            Enable Bidding War Mode
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            When enabled, requests go to bidding rounds instead of direct payment
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={biddingSettings.enabled}
                            onChange={(e) => {
                              setBiddingSettings(prev => ({ ...prev, enabled: e.target.checked }));
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fcba00]/20 dark:peer-focus:ring-[#fcba00]/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#fcba00]"></div>
                        </label>
                      </div>

                      {biddingSettings.enabled && (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              Starting Bid Amount <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                              The default initial bid amount for new requests. This ensures bids never start at $0. (in dollars)
                            </p>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="1"
                                value={(biddingSettings.startingBid / 100).toFixed(2)}
                                onChange={(e) => {
                                  const value = Math.round(parseFloat(e.target.value) * 100) || 100;
                                  setBiddingSettings(prev => ({ ...prev, startingBid: Math.max(100, value) }));
                                }}
                                className="w-full pl-8"
                                placeholder="5.00"
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Current starting bid: ${(biddingSettings.startingBid / 100).toFixed(2)} (stored as {biddingSettings.startingBid} cents)
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              Minimum Bid Amount
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                              The minimum amount users must bid to beat the current winning bid (in dollars)
                            </p>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="1"
                                value={(biddingSettings.minimumBid / 100).toFixed(2)}
                                onChange={(e) => {
                                  const value = Math.round(parseFloat(e.target.value) * 100) || 100;
                                  setBiddingSettings(prev => ({ ...prev, minimumBid: Math.max(100, value) }));
                                }}
                                className="w-full pl-8"
                                placeholder="5.00"
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Current minimum: ${(biddingSettings.minimumBid / 100).toFixed(2)} (stored as {biddingSettings.minimumBid} cents)
                            </p>
                          </div>
                        </>
                      )}

                      {!biddingSettings.enabled && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Bidding mode is currently <strong>disabled</strong>. Requests will use the normal payment flow.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Save Button - Sticky Footer */}
              <div className="sticky bottom-0 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 -mx-8 px-8 pb-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Changes are saved automatically when you click Save
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowSettings(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveSettings}
                      disabled={savingSettings}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      {savingSettings ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save All Settings
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* OLD SETTINGS REMOVED - Using new tabbed design above */}
        {false && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Crowd Request Settings
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure payment methods, pricing, and other parameters for crowd requests.
            </p>
            
            <div className="space-y-6">
              {/* Payment Method Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Methods
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      CashApp Tag
                    </label>
                    <Input
                      value={paymentSettings.cashAppTag}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, cashAppTag: e.target.value }))}
                      placeholder="$DJbenmurray"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your CashApp cashtag (e.g., $DJbenmurray)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Venmo Username
                    </label>
                    <Input
                      value={paymentSettings.venmoUsername}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, venmoUsername: e.target.value }))}
                      placeholder="@djbenmurray"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your Venmo username (e.g., @djbenmurray)
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pricing Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Fast-Track Fee (in dollars)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(requestSettings.fastTrackFee / 100).toFixed(2)}
                      onChange={(e) => {
                        const dollars = parseFloat(e.target.value) || 0;
                        setRequestSettings(prev => ({ ...prev, fastTrackFee: Math.round(dollars * 100) }));
                      }}
                      placeholder="10.00"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Additional fee for fast-tracking song requests to the front of the queue
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Minimum Payment Amount (in dollars)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(requestSettings.minimumAmount / 100).toFixed(2)}
                      onChange={(e) => {
                        const dollars = parseFloat(e.target.value) || 0;
                        setRequestSettings(prev => ({ ...prev, minimumAmount: Math.round(dollars * 100) }));
                      }}
                      placeholder="1.00"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum amount users can pay for a request
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Quick Amount Presets (in dollars)
                    </label>
                    <div className="space-y-2 max-w-md">
                      {requestSettings.presetAmounts.map((amount, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={(amount / 100).toFixed(2)}
                              onChange={(e) => {
                                const dollars = parseFloat(e.target.value) || 0;
                                if (dollars > 0) {
                                  const newAmounts = [...requestSettings.presetAmounts];
                                  newAmounts[index] = Math.round(dollars * 100);
                                  setRequestSettings(prev => ({ ...prev, presetAmounts: newAmounts }));
                                }
                              }}
                              className="pl-8"
                              placeholder="0.00"
                            />
                          </div>
                          {requestSettings.presetAmounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newAmounts = requestSettings.presetAmounts.filter((_, i) => i !== index);
                                setRequestSettings(prev => ({ ...prev, presetAmounts: newAmounts }));
                              }}
                              className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove this amount"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setRequestSettings(prev => ({ 
                            ...prev, 
                            presetAmounts: [...prev.presetAmounts, 500] // Add $5.00 by default
                          }));
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Amount
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Preset payment amounts shown as quick options. Click the X to remove an amount.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bundle Discount Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Bundle Discount Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="bundleDiscountEnabled"
                      checked={requestSettings.bundleDiscountEnabled}
                      onChange={(e) => setRequestSettings(prev => ({ ...prev, bundleDiscountEnabled: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="bundleDiscountEnabled" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                      Enable Bundle Discount Feature
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">
                    When enabled, users can request multiple songs and receive a discount on additional songs.
                  </p>
                  
                  {requestSettings.bundleDiscountEnabled && (
                    <div className="ml-8">
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Bundle Discount Percentage
                      </label>
                      <div className="flex items-center gap-2 max-w-md">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={requestSettings.bundleDiscountPercent}
                          onChange={(e) => {
                            const percent = parseInt(e.target.value) || 0;
                            if (percent >= 0 && percent <= 100) {
                              setRequestSettings(prev => ({ ...prev, bundleDiscountPercent: percent }));
                            }
                          }}
                          placeholder="10"
                          className="max-w-32"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Discount percentage applied to each additional song when users request multiple songs (e.g., 10 = 10% off)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Requests Page Header Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Requests Page Header
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Customize the header text displayed on the public requests page.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Artist/DJ Name
                    </label>
                    <Input
                      value={headerSettings.artistName}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, artistName: e.target.value }))}
                      placeholder="DJ Ben Murray"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      The main artist/DJ name displayed at the top of the requests page
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Location/Venue
                    </label>
                    <Input
                      value={headerSettings.location}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Silky O' Sullivan's"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      The location or venue name displayed below the artist name
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full max-w-md justify-start text-left font-normal",
                            !headerSettings.date && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {headerSettings.date ? (
                            headerSettings.date
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={headerSettings.date ? (() => {
                            // Try to parse the date string - handle various formats
                            const dateStr = headerSettings.date;
                            // Try common formats
                            const dateFormats = [
                              /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/, // MM.DD.YY or MM.DD.YYYY
                              /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, // MM/DD/YY or MM/DD/YYYY
                              /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
                            ];
                            
                            for (let i = 0; i < dateFormats.length; i++) {
                              const dateFormat = dateFormats[i];
                              const matchResult = dateStr.match(dateFormat);
                              if (!matchResult) continue;
                              // TypeScript doesn't narrow after continue, so we assert non-null
                              const match = matchResult as RegExpMatchArray;
                              const match1 = match[1];
                              const match2 = match[2];
                              const match3 = match[3];
                              if (!match1 || !match2 || !match3) continue;
                              let month = parseInt(match1, 10);
                              let day = parseInt(match2, 10);
                              let year = parseInt(match3, 10);
                              
                              // Handle 2-digit years
                              if (year < 100) {
                                year += 2000;
                              }
                              
                              // Check if format is YYYY-MM-DD (ISO)
                              if (i === 2) {
                                year = parseInt(match1, 10);
                                month = parseInt(match2, 10);
                                day = parseInt(match3, 10);
                              }
                              
                              const date = new Date(year, month - 1, day);
                              if (!isNaN(date.getTime())) {
                                return date;
                              }
                            }
                                
                            // Fallback: try direct Date parsing
                            const parsed = new Date(dateStr);
                            return !isNaN(parsed.getTime()) ? parsed : undefined;
                          })() : undefined}
                          onSelect={(date) => {
                            if (date) {
                              // Format as MM.dd.yy to match the placeholder format
                              const formatted = format(date, 'MM.dd.yy');
                              setHeaderSettings(prev => ({ ...prev, date: formatted }));
                            } else {
                              setHeaderSettings(prev => ({ ...prev, date: '' }));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="relative mt-2 max-w-md">
                      <Input
                        value={headerSettings.date}
                        onChange={(e) => setHeaderSettings(prev => ({ ...prev, date: e.target.value }))}
                        placeholder="11.29.25 or pick from calendar"
                        className="w-full pr-10"
                      />
                      {headerSettings.date && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => setHeaderSettings(prev => ({ ...prev, date: '' }))}
                          title="Clear date"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      The date displayed below the location (format: MM.DD.YY or any format you prefer)
                    </p>
                  </div>
                </div>
              </div>

              {/* Cover Photo Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cover Photos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Set the background images displayed on the public requests page header.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Primary Cover Photo URL
                    </label>
                    <Input
                      type="url"
                      value={coverPhotoSettings.requests_cover_photo_url}
                      onChange={(e) => setCoverPhotoSettings(prev => ({ ...prev, requests_cover_photo_url: e.target.value }))}
                      placeholder="https://example.com/cover-photo.jpg"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Main hero image displayed at the top (recommended: 1920x800px or larger)
                    </p>
                    {coverPhotoSettings.requests_cover_photo_url && (
                      <div className="mt-3">
                        <img
                          src={coverPhotoSettings.requests_cover_photo_url}
                          alt="Cover preview"
                          className="w-full max-w-md h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Artist/DJ Photo URL (Fallback)
                    </label>
                    <Input
                      type="url"
                      value={coverPhotoSettings.requests_artist_photo_url}
                      onChange={(e) => setCoverPhotoSettings(prev => ({ ...prev, requests_artist_photo_url: e.target.value }))}
                      placeholder="https://example.com/artist-photo.jpg"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Used if primary cover photo is not set
                    </p>
                    {coverPhotoSettings.requests_artist_photo_url && (
                      <div className="mt-3">
                        <img
                          src={coverPhotoSettings.requests_artist_photo_url}
                          alt="Artist preview"
                          className="w-full max-w-md h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Venue Photo URL (Fallback)
                    </label>
                    <Input
                      type="url"
                      value={coverPhotoSettings.requests_venue_photo_url}
                      onChange={(e) => setCoverPhotoSettings(prev => ({ ...prev, requests_venue_photo_url: e.target.value }))}
                      placeholder="https://example.com/venue-photo.jpg"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Used if other cover photos are not set
                    </p>
                    {coverPhotoSettings.requests_venue_photo_url && (
                      <div className="mt-3">
                        <img
                          src={coverPhotoSettings.requests_venue_photo_url}
                          alt="Venue preview"
                          className="w-full max-w-md h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Requests Page Content Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Requests Page Content & Text
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Customize all text, labels, and content displayed on the public requests page.
                </p>
                
                <div className="space-y-4">
                  {/* SEO Settings */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">SEO & Page Info</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Page Title
                        </label>
                        <Input
                          value={pageSettings.pageTitle}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, pageTitle: e.target.value }))}
                          placeholder={getPageTitlePlaceholder()}
                          className="max-w-md"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Browser tab title and SEO title
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Meta Description
                        </label>
                        <Textarea
                          value={pageSettings.pageDescription}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, pageDescription: e.target.value }))}
                          placeholder="Request songs and shoutouts for your event"
                          className="max-w-md"
                          rows={2}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          SEO meta description
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Main Content</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Main Heading
                        </label>
                        <Input
                          value={pageSettings.mainHeading}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, mainHeading: e.target.value }))}
                          placeholder="What would you like to request?"
                          className="max-w-md"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Song Request Button Label
                          </label>
                          <Input
                            value={pageSettings.songRequestLabel}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, songRequestLabel: e.target.value }))}
                            placeholder="Song Request"
                            className="max-w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Shoutout Button Label
                          </label>
                          <Input
                            value={pageSettings.shoutoutLabel}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, shoutoutLabel: e.target.value }))}
                            placeholder="Shoutout"
                            className="max-w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Default Request Type
                        </label>
                        <select
                          value={pageSettings.defaultRequestType}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, defaultRequestType: e.target.value }))}
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-w-md"
                        >
                          <option value="song_request">Song Request</option>
                          <option value="shoutout">Shoutout</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Which option is selected by default when page loads
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Music Link Section */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Music Link Section</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Music Link Label
                        </label>
                        <Input
                          value={pageSettings.musicLinkLabel}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, musicLinkLabel: e.target.value }))}
                          placeholder="Paste Music Link (Optional)"
                          className="max-w-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Music Link Placeholder
                        </label>
                        <Input
                          value={pageSettings.musicLinkPlaceholder}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, musicLinkPlaceholder: e.target.value }))}
                          placeholder="Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link"
                          className="max-w-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Help Text
                        </label>
                        <Input
                          value={pageSettings.musicLinkHelpText}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, musicLinkHelpText: e.target.value }))}
                          placeholder="We'll automatically fill in the song title and artist name"
                          className="max-w-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Manual Entry Divider Text
                        </label>
                        <Input
                          value={pageSettings.manualEntryDivider}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, manualEntryDivider: e.target.value }))}
                          placeholder="Or enter manually"
                          className="max-w-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Start Over Button Text
                        </label>
                        <Input
                          value={pageSettings.startOverText}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, startOverText: e.target.value }))}
                          placeholder="Start over"
                          className="max-w-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Song Request Fields */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Song Request Fields</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Song Title Label
                          </label>
                          <Input
                            value={pageSettings.songTitleLabel}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, songTitleLabel: e.target.value }))}
                            placeholder="Song Title"
                            className="max-w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Song Title Placeholder
                          </label>
                          <Input
                            value={pageSettings.songTitlePlaceholder}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, songTitlePlaceholder: e.target.value }))}
                            placeholder="Enter song title"
                            className="max-w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Artist Name Label
                          </label>
                          <Input
                            value={pageSettings.artistNameLabel}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, artistNameLabel: e.target.value }))}
                            placeholder="Artist Name"
                            className="max-w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Artist Name Placeholder
                          </label>
                          <Input
                            value={pageSettings.artistNamePlaceholder}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, artistNamePlaceholder: e.target.value }))}
                            placeholder="Enter artist name"
                            className="max-w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audio Upload Section */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Audio Upload Section</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showAudioUpload"
                          checked={pageSettings.showAudioUpload}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, showAudioUpload: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="showAudioUpload" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                          Show Audio Upload Option
                        </label>
                      </div>
                      {pageSettings.showAudioUpload && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                              Audio Upload Label
                            </label>
                            <Input
                              value={pageSettings.audioUploadLabel}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, audioUploadLabel: e.target.value }))}
                              placeholder="Upload Your Own Audio File"
                              className="max-w-md"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                              Audio Upload Description
                            </label>
                            <Textarea
                              value={pageSettings.audioUploadDescription}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, audioUploadDescription: e.target.value }))}
                              placeholder="Upload your own audio file to be played. This is perfect for upcoming artists or custom tracks. ($100 per file)"
                              className="max-w-md"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                              Artist Rights Checkbox Text
                            </label>
                            <Input
                              value={pageSettings.artistRightsText}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, artistRightsText: e.target.value }))}
                              placeholder="I confirm that I own the rights to this music or have permission to use it"
                              className="max-w-md"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                              Is Artist Checkbox Text
                            </label>
                            <Input
                              value={pageSettings.isArtistText}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, isArtistText: e.target.value }))}
                              placeholder="I am the artist (this is for promotion, not just a play)"
                              className="max-w-md"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                              Audio Fee Text
                            </label>
                            <Input
                              value={pageSettings.audioFeeText}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, audioFeeText: e.target.value }))}
                              placeholder="+$100.00 for audio upload"
                              className="max-w-md"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Shoutout Fields */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Shoutout Fields</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Recipient Name Label
                          </label>
                          <Input
                            value={pageSettings.recipientNameLabel}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, recipientNameLabel: e.target.value }))}
                            placeholder="Recipient Name"
                            className="max-w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Recipient Name Placeholder
                          </label>
                          <Input
                            value={pageSettings.recipientNamePlaceholder}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, recipientNamePlaceholder: e.target.value }))}
                            placeholder="Who is this shoutout for?"
                            className="max-w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Message Label
                          </label>
                          <Input
                            value={pageSettings.messageLabel}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, messageLabel: e.target.value }))}
                            placeholder="Message"
                            className="max-w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Message Placeholder
                          </label>
                          <Input
                            value={pageSettings.messagePlaceholder}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, messagePlaceholder: e.target.value }))}
                            placeholder="What would you like to say?"
                            className="max-w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons & Steps */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Buttons & Steps</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                          Submit Button Text
                        </label>
                        <Input
                          value={pageSettings.submitButtonText}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, submitButtonText: e.target.value }))}
                          placeholder="Submit Request"
                          className="max-w-md"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Step 1 Text
                          </label>
                          <Input
                            value={pageSettings.step1Text}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, step1Text: e.target.value }))}
                            placeholder="Step 1 of 2: Choose your request"
                            className="max-w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Step 2 Text
                          </label>
                          <Input
                            value={pageSettings.step2Text}
                            onChange={(e) => setPageSettings(prev => ({ ...prev, step2Text: e.target.value }))}
                            placeholder="Step 2 of 2: Payment"
                            className="max-w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Feature Toggles</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showFastTrack"
                          checked={pageSettings.showFastTrack}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, showFastTrack: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="showFastTrack" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                          Show Fast-Track Option
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showNextSong"
                          checked={pageSettings.showNextSong}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, showNextSong: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="showNextSong" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                          Show &quot;Next Song&quot; Option
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showBundleDiscount"
                          checked={pageSettings.showBundleDiscount}
                          onChange={(e) => setPageSettings(prev => ({ ...prev, showBundleDiscount: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="showBundleDiscount" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                          Show Bundle Discount Feature
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="btn-primary"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save All Settings'
                  )}
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-4">
            <Button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline"
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {(statusFilter !== 'all' || paymentMethodFilter !== 'all' || requestTypeFilter !== 'all' || dateRangeStart || dateRangeEnd || eventCodeFilter || audioUploadFilter !== 'all' || viewMode !== 'all') && (
                  <Badge className="ml-2 bg-purple-500 text-white">Active</Badge>
                )}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showMobileFilters ? 'rotate-90' : ''}`} />
            </Button>
          </div>
          
          <div className={`flex flex-col gap-4 ${showMobileFilters ? 'block' : 'hidden lg:flex'}`}>
            {/* View Mode Toggle - Requests vs Bids */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">View:</span>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'all'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setViewMode('requests')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'requests'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Requests
                </button>
                <button
                  onClick={() => setViewMode('bids')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    viewMode === 'bids'
                      ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Bids
                </button>
              </div>
            </div>

            {/* First Row: Search and Quick Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search requests, names, emails, phones, or payment IDs (pi_xxx/ch_xxx)..."
              className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (searchTerm.startsWith('pi_') || searchTerm.startsWith('ch_'))) {
                      // If searching by payment ID, open link payment modal
                      const paymentId = searchTerm.trim();
                      setLinkPaymentIntentId(paymentId);
                      setShowLinkPaymentModal(true);
                      searchByPaymentIntent(paymentId);
                    }
                  }}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="playing">Playing</option>
            <option value="played">Played</option>
            <option value="paid">Paid</option>
          </select>

              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
              >
                <option value="all">All Payment Methods</option>
                <option value="card">Card</option>
                <option value="cashapp">CashApp</option>
                <option value="venmo">Venmo</option>
                <option value="manual">Manual</option>
              </select>

              <select
                value={requestTypeFilter}
                onChange={(e) => setRequestTypeFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
              >
                <option value="all">All Types</option>
                <option value="song_request">Song Request</option>
                <option value="shoutout">Shoutout</option>
              </select>

              <select
                value={audioUploadFilter}
                onChange={(e) => setAudioUploadFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
              >
                <option value="all">All Audio Types</option>
                <option value="custom">Custom Upload</option>
                <option value="standard">Standard Link</option>
              </select>
            </div>

            {/* Second Row: Date Range and Event Code */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  placeholder="Start Date"
                  className="min-w-[150px]"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  placeholder="End Date"
                  className="min-w-[150px]"
                />
              </div>

              <Input
                value={eventCodeFilter}
                onChange={(e) => setEventCodeFilter(e.target.value)}
                placeholder="Filter by event code..."
                className="flex-1 max-w-xs"
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setDateRangeStart('');
                    setDateRangeEnd('');
                    setEventCodeFilter('');
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentMethodFilter('all');
                    setRequestTypeFilter('all');
                    setViewMode('all');
                  }}
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
          
          <Button
            onClick={fetchRequests}
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>

                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  variant={autoRefresh ? "default" : "outline"}
                  className="inline-flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedRequests.size > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedRequests.size} request(s) selected
              </span>
              <Button
                onClick={() => setSelectedRequests(new Set())}
                variant="ghost"
                size="sm"
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Bulk Update Status</option>
                <option value="new">New</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="playing">Playing</option>
                <option value="played">Played</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkPaymentStatusUpdate(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Bulk Update Payment</option>
                <option value="paid">Mark as Paid</option>
                <option value="pending">Mark as Pending</option>
              </select>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="inline-flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedRequests.size})
              </Button>
            </div>
          </div>
        )}

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No requests found</p>
            {(searchTerm || statusFilter !== 'all' || dateRangeStart || dateRangeEnd || paymentMethodFilter !== 'all' || requestTypeFilter !== 'all' || eventCodeFilter) && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateRangeStart('');
                  setDateRangeEnd('');
                  setPaymentMethodFilter('all');
                  setRequestTypeFilter('all');
                  setEventCodeFilter('');
                  setAudioUploadFilter('all');
                }}
                variant="outline"
                className="mt-4"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={paginatedRequests.length > 0 && paginatedRequests.every(r => selectedRequests.has(r.id))}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                        onClick={() => handleSort('song_title')}
                      >
                        <div className="flex items-center gap-2">
                      Request
                          {sortColumn === 'song_title' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                    </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                        onClick={() => handleSort('requester_name')}
                      >
                        <div className="flex items-center gap-2">
                      Requester
                          {sortColumn === 'requester_name' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                    </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center gap-2">
                      Amount
                          {sortColumn === 'amount' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                    </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                      Status
                          {sortColumn === 'status' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                    </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {sortColumn === 'created_at' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedRequests.map((request) => {
                      const bundleInfo = getBundleInfo(request);
                      const bundleGroup = getBundleGroup(request);
                      const bundleRequests = bundleGroup ? requests.filter(r => getBundleGroup(r) === bundleGroup) : [];
                      
                      return (
                    <tr 
                      key={request.id} 
                      className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        request.is_fast_track ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500' : ''
                      } ${
                        !request.organization_id ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500' : ''
                        } ${
                          isBundleRequest(request) ? 'bg-purple-50 dark:bg-purple-900/10 border-l-4 border-purple-500' : ''
                      }`}
                      onClick={() => openDetailModal(request)}
                    >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRequests.has(request.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectRequest(request.id, e.target.checked);
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {request.request_type === 'song_request' ? (
                            <Music className={`w-5 h-5 ${request.is_fast_track ? 'text-orange-500' : 'text-purple-500'}`} />
                          ) : request.request_type === 'shoutout' ? (
                            <Mic className="w-5 h-5 text-pink-500" />
                          ) : (
                            <Gift className="w-5 h-5 text-yellow-500" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {request.request_type === 'song_request' 
                                  ? request.song_title || 'Unknown Song'
                                  : request.request_type === 'shoutout'
                                  ? `Shoutout for ${request.recipient_name}`
                                  : 'Tip'}
                              </p>
                              {request.is_fast_track && (
                                <Badge className="bg-orange-500 text-white flex items-center gap-1 px-2 py-0.5">
                                  <Zap className="w-3 h-3" />
                                  Fast-Track
                                </Badge>
                              )}
                              {request.is_custom_audio && (
                                <Badge className="bg-gray-500 text-white flex items-center gap-1 px-2 py-0.5">
                                  <FileText className="w-3 h-3" />
                                  Custom Audio
                                </Badge>
                              )}
                              {isBundleRequest(request) && (
                                <Badge className="bg-purple-500 text-white flex items-center gap-1 px-2 py-0.5">
                                  <Gift className="w-3 h-3" />
                                  Bundle
                                </Badge>
                              )}
                              {request.is_artist && (
                                <Badge className="bg-green-500 text-white flex items-center gap-1 px-2 py-0.5">
                                  <User className="w-3 h-3" />
                                  Artist
                                </Badge>
                              )}
                              {request.bidding_enabled && (
                                <Badge className="bg-purple-600 text-white flex items-center gap-1 px-2 py-0.5">
                                  <DollarSign className="w-3 h-3" />
                                  Bidding
                                </Badge>
                              )}
                              {!request.organization_id && (
                                <Badge className="bg-yellow-500 text-white flex items-center gap-1 px-2 py-0.5" title="Orphaned - No organization assigned">
                                  ⚠️ Orphaned
                                </Badge>
                              )}
                              {request.organization_id && request.organization_id !== organization?.id && (request as any).organization && (
                                <Badge className="bg-gray-500 text-white flex items-center gap-1 px-2 py-0.5" title={`From organization: ${(request as any).organization?.name || 'Other'}`}>
                                  🏢 {(request as any).organization?.name || 'Other Org'}
                                </Badge>
                              )}
                            </div>
                            {request.request_type === 'song_request' && request.song_artist && (
                              <>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  by {request.song_artist}
                                </p>
                                {request.bidding_enabled && request.current_bid_amount && (
                                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">
                                    Current Bid: ${(request.current_bid_amount / 100).toFixed(2)}
                                    {request.highest_bidder_name && ` by ${request.highest_bidder_name}`}
                                  </p>
                                )}
                                <div className="mt-2">
                                  <MusicServiceLinks
                                    requestId={request.id}
                                    songTitle={request.song_title}
                                    songArtist={request.song_artist}
                                    postedLink={request.posted_link || null}
                                    links={request.music_service_links || null}
                                    showRefreshButton={false}
                                    onLinksUpdated={(newLinks) => {
                                      // Update the request in local state
                                      setRequests(prev => prev.map(r => 
                                        r.id === request.id 
                                          ? { ...r, music_service_links: newLinks }
                                          : r
                                      ));
                                    }}
                                  />
                                </div>
                              </>
                            )}
                            {request.request_type === 'shoutout' && request.recipient_message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                {request.recipient_message}
                              </p>
                            )}
                            {request.request_type === 'tip' && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Thank you for your tip!
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {/* Show requester name - prioritize Stripe name if available */}
                            {(() => {
                              const stripeName = stripeCustomerNames[request.id];
                              const displayName = stripeName || 
                                (request.requester_name && request.requester_name !== 'Guest' 
                                  ? request.requester_name 
                                  : null);
                              
                              if (request.payment_intent_id || (request as any).stripe_session_id) {
                                return (
                                  <span className="flex items-center gap-1">
                                    <span className="text-indigo-600 dark:text-indigo-400" title="Stripe payment - customer data from Stripe">
                                      💳
                                    </span>
                                    {displayName || 'Loading...'}
                                  </span>
                                );
                              } else {
                                return displayName || 'N/A';
                              }
                            })()}
                          </p>
                          {request.requester_email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {request.requester_email}
                            </p>
                          )}
                          {request.requester_phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {request.requester_phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {request.bidding_enabled && request.current_bid_amount ? (
                            <>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-purple-500" />
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  ${(request.current_bid_amount / 100).toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">(bid)</span>
                              </div>
                              {request.payment_status === 'pending' && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                                  ⚠️ Authorized (not charged)
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  ${((request.amount_paid || request.amount_requested) / 100).toFixed(2)}
                                </span>
                              </div>
                              {request.is_fast_track && request.fast_track_fee > 0 && (
                                <span className="text-xs text-orange-600 dark:text-orange-400">
                                  +${(request.fast_track_fee / 100).toFixed(2)} fast-track
                                </span>
                              )}
                              {request.is_custom_audio && request.audio_upload_fee > 0 && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  +${(request.audio_upload_fee / 100).toFixed(2)} audio upload
                                </span>
                              )}
                              {bundleInfo && (
                                <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                  <Gift className="w-3 h-3" />
                                  Bundle: {bundleInfo.bundleSize} songs (${(bundleInfo.bundlePrice / 100).toFixed(2)} total)
                                </span>
                              )}
                            </>
                          )}
                          {bundleGroup && bundleRequests.length > 0 && (
                            <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                              <span className="font-medium">Bundle Group:</span> {bundleRequests.length} request{bundleRequests.length !== 1 ? 's' : ''} 
                              {request.payment_code && (
                                <span className="ml-1">(Code: {request.payment_code})</span>
                              )}
                              {request.payment_intent_id && (
                                <span className="ml-1">(Intent: {request.payment_intent_id.substring(0, 12)}...)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status, request.payment_status, request)}
                          {request.request_type === 'song_request' && request.status === 'played' && request.matched_song_detection && (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1" title="Auto-detected by audio recognition">
                              <Mic className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {/* Quick Action - View Details */}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailModal(request);
                            }}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          {/* Single Consolidated Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                              {/* View Details (duplicate for convenience) */}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailModal(request);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Status Change */}
                              <div className="px-2 py-1.5">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Change Status</p>
                                <select
                                  value={request.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateRequestStatus(request.id, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  <option value="new">New</option>
                                  <option value="acknowledged">Acknowledged</option>
                                  <option value="playing">Playing</option>
                                  <option value="played">Played</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                              
                              <DropdownMenuSeparator />
                              
                              {/* Assign to Org */}
                              {!request.organization_id && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Assign this orphaned request to your organization?')) {
                                      assignRequestToOrganization(request.id);
                                    }
                                  }}
                                  className="text-yellow-600 dark:text-yellow-400"
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  Assign to Org
                                </DropdownMenuItem>
                              )}
                              
                              {/* Mark as Played */}
                              {request.request_type === 'song_request' && request.status !== 'played' && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsPlayed(request.id);
                                  }}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark as Played
                                </DropdownMenuItem>
                              )}
                              
                              {/* Bidding Actions */}
                              {request.bidding_enabled && request.bidding_round_id && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleViewBidHistory(request.id, request.bidding_round_id!);
                                    }}
                                  >
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    View Bid History
                                  </DropdownMenuItem>
                                  {request.payment_status === 'pending' && request.current_bid_amount && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (confirm(`Charge the winning bid of $${(request.current_bid_amount! / 100).toFixed(2)}?`)) {
                                            await handleChargeWinningBid(request.id);
                                          }
                                        }}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Charge Winning Bid
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (confirm('Cancel this bid authorization? The payment hold will be released.')) {
                                            await handleCancelBidAuthorization(request.id);
                                          }
                                        }}
                                        className="text-red-600 dark:text-red-400"
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel Authorization
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </>
                              )}
                              
                              {/* Payment Actions */}
                              {!request.bidding_enabled && request.payment_status === 'pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const paymentMethod = request.payment_method || 'manual';
                                      
                                      if ((paymentMethod === 'venmo' || paymentMethod === 'cashapp') && 
                                          (!request.requester_name || request.requester_name === 'Guest')) {
                                        const venmoName = prompt(
                                          `Request: ${request.song_title || request.recipient_name || 'Request'}\n` +
                                          `Payment Code: ${request.payment_code || 'N/A'}\n\n` +
                                          `Enter the requester's name from the ${paymentMethod === 'venmo' ? 'Venmo' : 'CashApp'} transaction:\n\n` +
                                          `(This helps match the payment. Leave blank to skip.)`,
                                          ''
                                        );
                                        
                                        if (venmoName && venmoName.trim()) {
                                          await updateRequesterName(request.id, venmoName.trim());
                                        }
                                      }

                                      // For Venmo payments, also prompt for Venmo username if not already set
                                      if (paymentMethod === 'venmo' && !request.requester_venmo_username) {
                                        const venmoUsername = prompt(
                                          `Request: ${request.song_title || request.recipient_name || 'Request'}\n` +
                                          `Payment Code: ${request.payment_code || 'N/A'}\n\n` +
                                          `Enter the customer's Venmo username from the transaction (e.g., @username):\n\n` +
                                          `(Leave blank to skip.)`,
                                          ''
                                        );
                                        
                                        if (venmoUsername && venmoUsername.trim()) {
                                          await updateVenmoUsername(request.id, venmoUsername.trim());
                                        }
                                      }
                                      
                                      await updatePaymentStatus(request.id, 'paid', paymentMethod);
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Paid
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {/* Refund Actions */}
                              {request.payment_status === 'paid' && 
                               (request.payment_intent_id || request.payment_method === 'venmo' || request.payment_method === 'cashapp') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (request.payment_method === 'venmo') {
                                        handleVenmoRefundClick(request);
                                      } else {
                                        const isStripe = !!request.payment_intent_id;
                                        const paymentMethodName = request.payment_method === 'cashapp' ? 'CashApp' : 'Stripe';
                                        const confirmMessage = isStripe
                                          ? 'Are you sure you want to refund this payment? The refund will be processed automatically via Stripe.'
                                          : `Are you sure you want to mark this ${paymentMethodName} payment as refunded? You must process the refund manually in ${paymentMethodName} first.`;
                                        
                                        if (confirm(confirmMessage)) {
                                          handleRefund(request.id, true);
                                        }
                                      }
                                    }}
                                    className="text-red-600 dark:text-red-400"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    {request.payment_intent_id ? 'Refund via Stripe' : request.payment_method === 'venmo' ? 'Refund via Venmo' : 'Mark as Refunded'}
                                  </DropdownMenuItem>
                                </>
                              )}
                              
                              {/* Payment Method Display */}
                              {request.payment_status === 'paid' && request.payment_method && (
                                <>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    {request.payment_method === 'card' ? '💳 Card' : 
                                     request.payment_method === 'cashapp' ? '💰 CashApp' :
                                     request.payment_method === 'venmo' ? '💸 Venmo' :
                                     '✅ Paid'}
                                  </div>
                                </>
                              )}
                              
                              {/* Refund Status */}
                              {(request.payment_status === 'refunded' || request.payment_status === 'partially_refunded') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <div className="px-2 py-1.5 text-xs">
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                      {request.payment_status === 'refunded' ? '🔄 Refunded' : '🔄 Partially Refunded'}
                                    </span>
                                    {request.refund_amount && (
                                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                                        ${(request.refund_amount / 100).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                              
                              {/* Delete - Always at the bottom */}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRequest(request.id);
                                }}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                    );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3 mt-4">
            {paginatedRequests.map((request) => {
              const bundleInfo = getBundleInfo(request);
              const bundleGroup = getBundleGroup(request);
              const bundleRequests = bundleGroup ? requests.filter(r => getBundleGroup(r) === bundleGroup) : [];
              
              return (
              <div
                key={request.id}
                onClick={() => openDetailModal(request)}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.98] ${
                  request.is_fast_track ? 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10' : ''
                } ${
                  !request.organization_id ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                } ${
                  isBundleRequest(request) ? 'border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : ''
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {request.request_type === 'song_request' ? (
                      <Music className={`w-6 h-6 flex-shrink-0 ${request.is_fast_track ? 'text-orange-500' : 'text-purple-500'}`} />
                    ) : request.request_type === 'shoutout' ? (
                      <Mic className="w-6 h-6 flex-shrink-0 text-pink-500" />
                    ) : (
                      <Gift className="w-6 h-6 flex-shrink-0 text-yellow-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-gray-900 dark:text-white text-base">
                          {request.request_type === 'song_request' 
                            ? request.song_title || 'Unknown Song'
                            : request.request_type === 'shoutout'
                            ? `Shoutout for ${request.recipient_name}`
                            : 'Tip'}
                        </p>
                        {/* Played/Unplayed Status for Song Requests */}
                        {request.request_type === 'song_request' && (
                          request.status === 'played' ? (
                            <Badge className="bg-green-600 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              Played
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
                              <Clock className="w-3 h-3" />
                              Not Played
                            </Badge>
                          )
                        )}
                        {request.is_fast_track && (
                          <Badge className="bg-orange-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs">
                            <Zap className="w-3 h-3" />
                            Fast-Track
                          </Badge>
                        )}
                        {request.is_custom_audio && (
                          <Badge className="bg-gray-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs">
                            <FileText className="w-3 h-3" />
                            Custom Audio
                          </Badge>
                        )}
                        {request.is_artist && (
                          <Badge className="bg-green-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs">
                            <User className="w-3 h-3" />
                            Artist
                          </Badge>
                        )}
                        {isBundleRequest(request) && (
                          <Badge className="bg-purple-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs">
                            <Gift className="w-3 h-3" />
                            Bundle
                          </Badge>
                        )}
                      </div>
                      {request.request_type === 'song_request' && request.song_artist && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          by {request.song_artist}
                        </p>
                      )}
                      {request.request_type === 'shoutout' && request.recipient_message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {request.recipient_message}
                        </p>
                      )}
                      {request.request_type === 'tip' && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Thank you for your tip!
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRequests.has(request.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectRequest(request.id, e.target.checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 flex-shrink-0"
                  />
                </div>

                {/* Requester Info */}
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {(() => {
                        const stripeName = stripeCustomerNames[request.id];
                        const displayName = stripeName || 
                          (request.requester_name && request.requester_name !== 'Guest' 
                            ? request.requester_name 
                            : null);
                        
                        if (request.payment_intent_id || (request as any).stripe_session_id) {
                          return (
                            <span className="flex items-center gap-1">
                              <span className="text-indigo-600 dark:text-indigo-400">💳</span>
                              {displayName || 'Loading...'}
                            </span>
                          );
                        } else {
                          return displayName || 'N/A';
                        }
                      })()}
                    </p>
                  </div>
                  {request.requester_email && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 ml-6 truncate">
                      {request.requester_email}
                    </p>
                  )}
                  {request.requester_phone && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                      {request.requester_phone}
                    </p>
                  )}
                  {request.source_domain && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 ml-6 flex items-center gap-1">
                      <span className="text-purple-500">🌐</span>
                      {request.source_domain}
                    </p>
                  )}
                </div>

                {/* Amount and Status Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DollarSign className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      ${((request.amount_paid || request.amount_requested) / 100).toFixed(2)}
                    </span>
                    {request.is_fast_track && request.fast_track_fee > 0 && (
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        +${(request.fast_track_fee / 100).toFixed(2)}
                      </span>
                    )}
                    {request.is_custom_audio && request.audio_upload_fee > 0 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        +${(request.audio_upload_fee / 100).toFixed(2)}
                      </span>
                    )}
                    {bundleInfo && (
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        Bundle: {bundleInfo.bundleSize} songs
                      </span>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    {getStatusBadge(request.status, request.payment_status)}
                  </div>
                </div>
                
                {/* Bundle Group Info */}
                {bundleGroup && bundleRequests.length > 0 && (
                  <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">
                      Bundle Group: {bundleRequests.length} request{bundleRequests.length !== 1 ? 's' : ''}
                    </p>
                    {request.payment_code && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                        Code: {request.payment_code}
                      </p>
                    )}
                    {request.payment_intent_id && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-mono truncate">
                        Intent: {request.payment_intent_id.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                )}

                {/* Date and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap overflow-x-auto" onClick={(e) => e.stopPropagation()}>
                    {!request.organization_id && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Assign this orphaned request to your organization?')) {
                            assignRequestToOrganization(request.id);
                          }
                        }}
                        size="sm"
                        className="text-xs h-7 px-2 bg-yellow-600 hover:bg-yellow-700 text-white flex-shrink-0"
                        title="Assign to organization"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    )}
                    {/* Mark as Played - Only for song requests that haven't been played */}
                    {request.request_type === 'song_request' && request.status !== 'played' && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsPlayed(request.id);
                        }}
                        size="sm"
                        className="text-xs h-7 px-2 bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                        title="Mark as played"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(request);
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2 flex-shrink-0"
                      title="View details"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(request.id);
                      }}
                      size="sm"
                      variant="destructive"
                      className="text-xs h-7 px-2 flex-shrink-0"
                      title="Delete request"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              );
              })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && itemsPerPage < 10000 && (
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                  <option value={10000}>All</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
        )}

        {/* Request Detail Modal */}
        {showDetailModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Request Details
                </h3>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Orphaned Request Warning */}
                {!selectedRequest.organization_id && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                          Orphaned Request
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          This request has no organization assigned. It may not appear in filtered views. Assign it to your organization to manage it properly.
                        </p>
                        <Button
                          onClick={() => {
                            assignRequestToOrganization(selectedRequest.id);
                            setShowDetailModal(false);
                            setSelectedRequest(null);
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          Assign to My Organization
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Request Type & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Request Type</p>
                    <div className="flex items-center gap-2">
                      {selectedRequest.request_type === 'song_request' ? (
                        <Music className="w-5 h-5 text-purple-500" />
                      ) : selectedRequest.request_type === 'shoutout' ? (
                        <Mic className="w-5 h-5 text-pink-500" />
                      ) : (
                        <Gift className="w-5 h-5 text-yellow-500" />
                      )}
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {selectedRequest.request_type === 'tip' ? 'Tip' : selectedRequest.request_type.replace('_', ' ')}
                      </p>
                      {selectedRequest.is_fast_track && (
                        <Badge className="bg-orange-500 text-white flex items-center gap-1 px-2 py-0.5">
                          <Zap className="w-3 h-3" />
                          Fast-Track
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
                    <div className="flex items-center gap-2 mb-3">
                      {getStatusBadge(selectedRequest.status, selectedRequest.payment_status, selectedRequest)}
                    </div>
                    <div className="space-y-3">
                      {/* Request Status Update - Only for song requests */}
                      {selectedRequest.request_type === 'song_request' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Request Status
                          </label>
                          <select
                            value={selectedRequest.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              await updateRequestStatus(selectedRequest.id, newStatus);
                              // Update local state
                              setSelectedRequest({ ...selectedRequest, status: newStatus as any });
                              // Refresh requests list
                              await fetchRequests();
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="new">New</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="playing">Playing</option>
                            <option value="played">Played</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      )}
                      {/* Payment Status Update */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Payment Status
                        </label>
                        <select
                          value={selectedRequest.payment_status}
                          onChange={async (e) => {
                            const newPaymentStatus = e.target.value;
                            const paymentMethod = selectedRequest.payment_method || 'manual';
                            
                            // For Venmo/CashApp payments, prompt for requester name if missing
                            if ((newPaymentStatus === 'paid') && 
                                (paymentMethod === 'venmo' || paymentMethod === 'cashapp') && 
                                (!selectedRequest.requester_name || selectedRequest.requester_name === 'Guest')) {
                              const venmoName = prompt(
                                `Enter the requester's name from the ${paymentMethod === 'venmo' ? 'Venmo' : 'CashApp'} transaction:\n\n` +
                                `(This helps match the payment to the request. Leave blank to skip.)`,
                                ''
                              );
                              
                              // If name was provided, update it first
                              if (venmoName && venmoName.trim()) {
                                await updateRequesterName(selectedRequest.id, venmoName.trim());
                              }
                            }

                            // For Venmo payments, also prompt for Venmo username if not already set
                            if (newPaymentStatus === 'paid' && 
                                paymentMethod === 'venmo' && 
                                !selectedRequest.requester_venmo_username) {
                              const venmoUsername = prompt(
                                `Enter the customer's Venmo username from the transaction (e.g., @username):\n\n` +
                                `(Leave blank to skip.)`,
                                ''
                              );
                              
                              // If username was provided, update it
                              if (venmoUsername && venmoUsername.trim()) {
                                await updateVenmoUsername(selectedRequest.id, venmoUsername.trim());
                              }
                            }
                            
                            await updatePaymentStatus(selectedRequest.id, newPaymentStatus, paymentMethod);
                            // Update local state
                            setSelectedRequest({ ...selectedRequest, payment_status: newPaymentStatus as any });
                            // Refresh requests list
                            await fetchRequests();
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                          <option value="partially_refunded">Partially Refunded</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Song/Shoutout Details */}
                {selectedRequest.request_type === 'song_request' ? (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Song Request</p>
                      {!editingSongDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditSongDetails}
                          className="h-7 px-2 text-xs"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                    {editingSongDetails ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Song Title
                          </label>
                          <Input
                            value={editedSongTitle}
                            onChange={(e) => setEditedSongTitle(e.target.value)}
                            placeholder="Enter song title"
                            className="w-full"
                            disabled={savingSongDetails}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1">
                            Artist
                          </label>
                          <Input
                            value={editedSongArtist}
                            onChange={(e) => setEditedSongArtist(e.target.value)}
                            placeholder="Enter artist name"
                            className="w-full"
                            disabled={savingSongDetails}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveSongDetails}
                            disabled={savingSongDetails || !editedSongTitle.trim()}
                            className="flex-1"
                          >
                            {savingSongDetails ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEditSongDetails}
                            disabled={savingSongDetails}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {selectedRequest.song_title || 'Unknown Song'}
                        </p>
                        {selectedRequest.song_artist && (
                          <p className="text-lg text-gray-700 dark:text-gray-300">
                            by {selectedRequest.song_artist}
                          </p>
                        )}
                      </>
                    )}
                    {/* Audio Detection Info */}
                    {selectedRequest.matched_song_detection && (
                      <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Mic className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                            Auto-detected by Audio Recognition
                          </p>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <p>
                            Detected: {new Date(selectedRequest.matched_song_detection.recognition_timestamp).toLocaleString()}
                          </p>
                          {selectedRequest.matched_song_detection.recognition_confidence && (
                            <p>
                              Confidence: {(selectedRequest.matched_song_detection.recognition_confidence * 100).toFixed(0)}%
                            </p>
                          )}
                          <p>
                            Detected as: "{selectedRequest.matched_song_detection.song_title}" by {selectedRequest.matched_song_detection.song_artist}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Posted Link Info */}
                    {selectedRequest.posted_link && (
                      <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-700">
                        <div className="flex items-center gap-2 mb-2">
                          <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Original Posted Link
                          </p>
                        </div>
                        <a
                          href={selectedRequest.posted_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-600 dark:text-gray-400 hover:underline break-all flex items-center gap-1"
                        >
                          {selectedRequest.posted_link}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {/* Music Service Links */}
                    {selectedRequest.request_type === 'song_request' && (
                      <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Streaming Service Links
                        </p>
                        <MusicServiceLinks
                          requestId={selectedRequest.id}
                          songTitle={selectedRequest.song_title}
                          songArtist={selectedRequest.song_artist}
                          postedLink={selectedRequest.posted_link || null}
                          links={selectedRequest.music_service_links || null}
                          onLinksUpdated={(newLinks) => {
                            // Update the selected request in local state
                            setSelectedRequest(prev => prev ? { ...prev, music_service_links: newLinks } : null);
                            // Also update in requests list
                            setRequests(prev => prev.map(r => 
                              r.id === selectedRequest.id 
                                ? { ...r, music_service_links: newLinks }
                                : r
                            ));
                          }}
                        />
                      </div>
                    )}
                    {/* YouTube Audio Download (Super Admin Only) */}
                    {isSuperAdmin && selectedRequest.request_type === 'song_request' && (
                      <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Download Audio (Super Admin)
                        </p>
                        {/* Show download button if YouTube link exists, or show message to find links first */}
                        {selectedRequest.posted_link?.includes('youtube.com') || 
                         selectedRequest.posted_link?.includes('youtu.be') ||
                         selectedRequest.music_service_links?.youtube ? (
                          <>
                        {selectedRequest.audio_download_status === 'completed' && selectedRequest.downloaded_audio_url ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span>Audio downloaded successfully</span>
                            </div>
                            <a
                              href={selectedRequest.downloaded_audio_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold"
                            >
                              <Download className="w-4 h-4" />
                              Download MP3
                            </a>
                            {selectedRequest.audio_downloaded_at && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Downloaded: {new Date(selectedRequest.audio_downloaded_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        ) : selectedRequest.audio_download_status === 'processing' || downloadingAudio === selectedRequest.id ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Downloading audio...</span>
                          </div>
                        ) : selectedRequest.audio_download_status === 'failed' ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                              <XCircle className="w-4 h-4" />
                              <span>Download failed</span>
                            </div>
                            {selectedRequest.audio_download_error && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {selectedRequest.audio_download_error}
                              </p>
                            )}
                            <Button
                              onClick={() => handleDownloadYouTubeAudio(selectedRequest)}
                              size="sm"
                              variant="outline"
                              disabled={downloadingAudio === selectedRequest.id}
                              className="text-xs"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry Download
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleDownloadYouTubeAudio(selectedRequest)}
                            size="sm"
                            variant="outline"
                            disabled={downloadingAudio === selectedRequest.id}
                            className="text-xs"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {downloadingAudio === selectedRequest.id ? 'Downloading...' : 'Download Audio as MP3'}
                          </Button>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Download audio from YouTube for use in external DJ software
                        </p>
                          </>
                        ) : (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>No YouTube link found. Use "Find Music Links" to locate the YouTube URL first.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Shoutout</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      For: {selectedRequest.recipient_name || 'Unknown Recipient'}
                    </p>
                    {selectedRequest.recipient_message && (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedRequest.recipient_message}
                      </p>
                    )}
                  </div>
                )}

                {/* Requester Information */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Requester Information</p>
                    {/* Allow editing requester name for Venmo/CashApp payments where name might be missing */}
                    {/* NOTE: New requests will always have a name (mandatory field). This is for legacy records. */}
                    {(selectedRequest.payment_method === 'venmo' || selectedRequest.payment_method === 'cashapp') && 
                     (!selectedRequest.requester_name || selectedRequest.requester_name === 'Guest') && (
                      <Button
                        onClick={() => {
                          const newName = prompt('Enter the requester name (from Venmo/CashApp payment):', selectedRequest.requester_name || '');
                          if (newName && newName.trim() && newName.trim() !== selectedRequest.requester_name) {
                            updateRequesterName(selectedRequest.id, newName.trim());
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Update Name
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {stripeDetails?.customer?.name || selectedRequest.requester_name}
                        {stripeDetails?.customer?.name && stripeDetails.customer.name !== selectedRequest.requester_name && (
                          <span className="text-xs text-gray-500 ml-2">(from Stripe)</span>
                        )}
                        {(!selectedRequest.requester_name || selectedRequest.requester_name === 'Guest') && 
                         (selectedRequest.payment_method === 'venmo' || selectedRequest.payment_method === 'cashapp') && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">(Legacy record - Click "Update Name" to add from payment)</span>
                        )}
                      </p>
                    </div>
                    {(stripeDetails?.customer?.email || selectedRequest.requester_email) && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                        <a 
                          href={`mailto:${stripeDetails?.customer?.email || selectedRequest.requester_email}`}
                          className="font-medium text-gray-600 dark:text-gray-400 hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          {stripeDetails?.customer?.email || selectedRequest.requester_email}
                          {stripeDetails?.customer?.email && (
                            <span className="text-xs text-gray-500 ml-1">(Stripe)</span>
                          )}
                        </a>
                      </div>
                    )}
                    {(stripeDetails?.customer?.phone || selectedRequest.requester_phone) && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                        <a 
                          href={`tel:${stripeDetails?.customer?.phone || selectedRequest.requester_phone}`}
                          className="font-medium text-gray-600 dark:text-gray-400 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {stripeDetails?.customer?.phone || selectedRequest.requester_phone}
                          {stripeDetails?.customer?.phone && (
                            <span className="text-xs text-gray-500 ml-1">(Stripe)</span>
                          )}
                        </a>
                      </div>
                    )}
                    {selectedRequest.source_domain && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Source Domain</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          <Globe className="w-3 h-3 text-purple-500" />
                          {selectedRequest.source_domain}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {selectedRequest.source_domain === 'tipjar.live' || selectedRequest.source_domain === 'www.tipjar.live'
                            ? 'Request came from TipJar.live'
                            : selectedRequest.source_domain === 'm10djcompany.com' || selectedRequest.source_domain === 'www.m10djcompany.com'
                            ? 'Request came from M10DJCompany.com'
                            : 'Request origin'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stripe Payment Details */}
                {(selectedRequest.payment_intent_id || (selectedRequest as any).stripe_session_id) && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Stripe Payment Details</p>
                      {!stripeDetails && !loadingStripeDetails && (
                        <Button
                          onClick={() => fetchStripeDetails(selectedRequest)}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Load Stripe Details
                        </Button>
                      )}
                      {loadingStripeDetails && (
                        <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    
                    {stripeDetails ? (
                      <div className="space-y-4">
                        {/* Stripe Customer Info */}
                        {stripeDetails.customer && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Stripe Customer</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {stripeDetails.customer.name && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{stripeDetails.customer.name}</p>
                                </div>
                              )}
                              {stripeDetails.customer.email && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{stripeDetails.customer.email}</p>
                                </div>
                              )}
                              {stripeDetails.customer.phone && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                                  <p className="font-medium text-gray-900 dark:text-white">{stripeDetails.customer.phone}</p>
                                </div>
                              )}
                              {stripeDetails.customer.id && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer ID</p>
                                  <p className="font-mono text-xs text-gray-600 dark:text-gray-400">{stripeDetails.customer.id}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Card Details */}
                        {stripeDetails.charge?.payment_method_details?.card && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Card Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Brand</p>
                                <p className="font-medium text-gray-900 dark:text-white capitalize">
                                  {stripeDetails.charge.payment_method_details.card.brand}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Last 4</p>
                                <p className="font-mono font-medium text-gray-900 dark:text-white">
                                  •••• {stripeDetails.charge.payment_method_details.card.last4}
                                </p>
                              </div>
                              {stripeDetails.charge.payment_method_details.card.country && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {stripeDetails.charge.payment_method_details.card.country}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Payment Intent Info */}
                        {stripeDetails.paymentIntent && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Intent</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
                                <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                                  {stripeDetails.paymentIntent.id}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                <p className="font-medium text-gray-900 dark:text-white capitalize">
                                  {stripeDetails.paymentIntent.status}
                                </p>
                              </div>
                              {stripeDetails.paymentIntent.created && (
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {new Date(stripeDetails.paymentIntent.created * 1000).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Billing Details */}
                        {stripeDetails.charge?.billing_details && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Billing Details</p>
                            <div className="text-sm">
                              {stripeDetails.charge.billing_details.name && (
                                <p className="text-gray-900 dark:text-white">
                                  <span className="text-gray-500 dark:text-gray-400">Name: </span>
                                  {stripeDetails.charge.billing_details.name}
                                </p>
                              )}
                              {stripeDetails.charge.billing_details.email && (
                                <p className="text-gray-900 dark:text-white">
                                  <span className="text-gray-500 dark:text-gray-400">Email: </span>
                                  {stripeDetails.charge.billing_details.email}
                                </p>
                              )}
                              {stripeDetails.charge.billing_details.phone && (
                                <p className="text-gray-900 dark:text-white">
                                  <span className="text-gray-500 dark:text-gray-400">Phone: </span>
                                  {stripeDetails.charge.billing_details.phone}
                                </p>
                              )}
                              {stripeDetails.charge.billing_details.address && (
                                <div className="mt-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                                  <p className="text-gray-900 dark:text-white text-xs">
                                    {[
                                      stripeDetails.charge.billing_details.address.line1,
                                      stripeDetails.charge.billing_details.address.line2,
                                      stripeDetails.charge.billing_details.address.city,
                                      stripeDetails.charge.billing_details.address.state,
                                      stripeDetails.charge.billing_details.address.postal_code,
                                      stripeDetails.charge.billing_details.address.country,
                                    ].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : !loadingStripeDetails ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click &quot;Load Stripe Details&quot; to fetch customer information from Stripe.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading Stripe details...</p>
                    )}
                  </div>
                )}

                {/* Payment Information */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment Information</p>
                    {selectedRequest.payment_intent_id && stripeDetails?.paymentIntent && 
                     stripeDetails.paymentIntent.status === 'succeeded' && 
                     (selectedRequest.payment_status !== 'paid' || selectedRequest.amount_paid === 0) && (
                      <Button
                        onClick={async () => {
                          try {
                            setLoadingStripeDetails(true);
                            // Sync payment status from Stripe
                            const response = await fetch('/api/crowd-request/update-payment-status', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                requestId: selectedRequest.id,
                                paymentStatus: 'paid',
                                paymentMethod: 'card',
                                amountPaid: stripeDetails.paymentIntent.amount,
                                paidAt: stripeDetails.paymentIntent.created 
                                  ? new Date(stripeDetails.paymentIntent.created * 1000).toISOString()
                                  : new Date().toISOString(),
                              }),
                            });
                            
                            if (response.ok) {
                              toast({
                                title: 'Payment Synced',
                                description: 'Payment status updated from Stripe',
                              });
                              // Refresh request data
                              await fetchRequests();
                              // Update selected request
                              const updatedRequest = requests.find(r => r.id === selectedRequest.id);
                              if (updatedRequest) {
                                setSelectedRequest(updatedRequest);
                              }
                            } else {
                              throw new Error('Failed to update payment status');
                            }
                          } catch (error: any) {
                            toast({
                              title: 'Sync Failed',
                              description: error?.message || 'Failed to sync payment status',
                              variant: 'destructive',
                            });
                          } finally {
                            setLoadingStripeDetails(false);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={loadingStripeDetails}
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${loadingStripeDetails ? 'animate-spin' : ''}`} />
                        Sync from Stripe
                      </Button>
                    )}
                  </div>
                  {selectedRequest.payment_intent_id && stripeDetails?.paymentIntent && 
                   stripeDetails.paymentIntent.status === 'succeeded' && 
                   (selectedRequest.payment_status !== 'paid' || selectedRequest.amount_paid === 0) && (
                    <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ Payment succeeded in Stripe but not synced to database. Click &quot;Sync from Stripe&quot; to update.
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Amount Requested</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${(selectedRequest.amount_requested / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${((selectedRequest.amount_paid || 0) / 100).toFixed(2)}
                        {stripeDetails?.paymentIntent?.status === 'succeeded' && 
                         stripeDetails.paymentIntent.amount && 
                         selectedRequest.amount_paid !== stripeDetails.paymentIntent.amount && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">
                            (Stripe: ${(stripeDetails.paymentIntent.amount / 100).toFixed(2)})
                          </span>
                        )}
                      </p>
                    </div>
                    {selectedRequest.is_fast_track && selectedRequest.fast_track_fee > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fast-Track Fee</p>
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                          ${(selectedRequest.fast_track_fee / 100).toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payment Status</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {selectedRequest.payment_status}
                        </p>
                        {stripeDetails?.paymentIntent?.status === 'succeeded' && 
                         selectedRequest.payment_status !== 'paid' && (
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            (Stripe: {stripeDetails.paymentIntent.status})
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedRequest.payment_method && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payment Method</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {selectedRequest.payment_method === 'card' ? '💳 Card' : 
                           selectedRequest.payment_method === 'cashapp' ? '💰 CashApp' :
                           selectedRequest.payment_method === 'venmo' ? '💸 Venmo' :
                           selectedRequest.payment_method || 'N/A'}
                        </p>
                      </div>
                    )}
                    {selectedRequest.payment_method === 'venmo' && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">Venmo Username</p>
                          <Button
                            onClick={() => {
                              const currentUsername = selectedRequest.requester_venmo_username || '';
                              const newUsername = prompt(
                                'Enter the customer\'s Venmo username (e.g., @username):',
                                currentUsername
                              );
                              if (newUsername !== null && newUsername.trim() !== currentUsername) {
                                updateVenmoUsername(selectedRequest.id, newUsername.trim());
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="text-xs h-6 px-2"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            {selectedRequest.requester_venmo_username ? 'Edit' : 'Add'}
                          </Button>
                        </div>
                        <p className="font-medium text-purple-600 dark:text-purple-400">
                          {selectedRequest.requester_venmo_username || 'Not set'}
                        </p>
                      </div>
                    )}
                    {selectedRequest.refund_amount && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Refund Amount</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          ${(selectedRequest.refund_amount / 100).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Code for Venmo/CashApp Verification */}
                  {selectedRequest.payment_code && (selectedRequest.payment_method === 'venmo' || selectedRequest.payment_method === 'cashapp') && (
                    <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4">
                      <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        🔑 Payment Verification Code
                      </p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 font-mono text-center mb-2">
                        {selectedRequest.payment_code}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 text-center">
                        {selectedRequest.payment_method === 'venmo' 
                          ? 'Look for this code in the Venmo payment note to verify payment'
                          : 'Look for this code in the CashApp payment note to verify payment'}
                      </p>
                      {selectedRequest.payment_status === 'pending' && (
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 text-center mt-2 font-medium">
                          ⚠️ Verify this code in your {selectedRequest.payment_method === 'venmo' ? 'Venmo' : 'CashApp'} app before marking as paid
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bundle Information */}
                {isBundleRequest(selectedRequest) && (() => {
                  const bundleInfo = getBundleInfo(selectedRequest);
                  const bundleGroup = getBundleGroup(selectedRequest);
                  const bundleRequests = bundleGroup ? requests.filter(r => getBundleGroup(r) === bundleGroup && r.id !== selectedRequest.id) : [];
                  
                  return (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Bundle Deal Information</p>
                      </div>
                      
                      {bundleInfo && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bundle Details</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {bundleInfo.bundleSize} songs for ${(bundleInfo.bundlePrice / 100).toFixed(2)} total
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ${(bundleInfo.bundlePrice / bundleInfo.bundleSize / 100).toFixed(2)} per song
                          </p>
                        </div>
                      )}
                      
                      {(selectedRequest.payment_code || selectedRequest.payment_intent_id) && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shared Payment Identifier</p>
                          {selectedRequest.payment_code && (
                            <p className="text-sm font-mono text-purple-600 dark:text-purple-400">
                              Code: {selectedRequest.payment_code}
                            </p>
                          )}
                          {selectedRequest.payment_intent_id && (
                            <p className="text-xs font-mono text-purple-600 dark:text-purple-400 mt-1">
                              Intent: {selectedRequest.payment_intent_id}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {bundleRequests.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Linked Bundle Requests ({bundleRequests.length}):
                          </p>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {bundleRequests.map((bundleReq) => (
                              <div 
                                key={bundleReq.id}
                                className="bg-white dark:bg-gray-800 rounded p-2 border border-purple-200 dark:border-purple-700 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30"
                                onClick={() => {
                                  setShowDetailModal(false);
                                  setTimeout(() => openDetailModal(bundleReq), 100);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                      {bundleReq.song_title || 'Unknown Song'}
                                    </p>
                                    {bundleReq.song_artist && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        by {bundleReq.song_artist}
                                      </p>
                                    )}
                                  </div>
                                  <div className="ml-2 text-right">
                                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                      ${((bundleReq.amount_paid || bundleReq.amount_requested) / 100).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {getStatusBadge(bundleReq.status, bundleReq.payment_status, bundleReq)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Event Information */}
                {(selectedRequest.event_qr_code || selectedRequest.event_name || selectedRequest.event_date) && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Event Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedRequest.event_qr_code && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Event Code</p>
                          <p className="font-medium text-gray-900 dark:text-white font-mono">
                            {selectedRequest.event_qr_code}
                          </p>
                        </div>
                      )}
                      {selectedRequest.event_name && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Event Name</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedRequest.event_name}
                          </p>
                        </div>
                      )}
                      {selectedRequest.event_date && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Event Date</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(selectedRequest.event_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Timestamps</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Created At</p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(selectedRequest.created_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedRequest.played_at && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Played At</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(selectedRequest.played_at).toLocaleString()}
                          {selectedRequest.matched_song_detection?.auto_marked_as_played && (
                            <span title="Auto-detected" className="ml-1">
                              <Mic className="w-3 h-3 text-green-600 dark:text-green-400" />
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {selectedRequest.paid_at && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Paid At</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(selectedRequest.paid_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedRequest.refunded_at && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Refunded At</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(selectedRequest.refunded_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Timeline */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Customer Timeline</p>
                  </div>
                  
                  {loadingSuccessViews ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
                    </div>
                  ) : (
                    (() => {
                      // Build timeline events array
                      const timelineEvents: Array<{
                        type: string;
                        time: Date;
                        component: JSX.Element;
                      }> = [];

                      // Request Created
                      timelineEvents.push({
                        type: 'request_created',
                        time: new Date(selectedRequest.created_at),
                        component: (
                          <div key="request_created" className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Request Created</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(selectedRequest.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )
                      });

                      // Payment Made
                      if (selectedRequest.paid_at) {
                        timelineEvents.push({
                          type: 'payment_made',
                          time: new Date(selectedRequest.paid_at),
                          component: (
                            <div key="payment_made" className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gray-500 mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Made</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(selectedRequest.paid_at).toLocaleString()}
                                </p>
                                {selectedRequest.payment_method && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                    via {selectedRequest.payment_method === 'card' ? 'Stripe' : selectedRequest.payment_method === 'venmo' ? 'Venmo' : selectedRequest.payment_method === 'cashapp' ? 'CashApp' : selectedRequest.payment_method}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        });
                      }

                      // Success Page Views - Show all views
                      successPageViews.forEach((view) => {
                        timelineEvents.push({
                          type: 'success_page_view',
                          time: new Date(view.viewed_at),
                          component: (
                            <div key={view.id} className="flex items-start gap-3">
                              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                view.is_first_view ? 'bg-purple-500' : 'bg-gray-400'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                  {view.is_first_view ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                      Success Page Viewed (First Time)
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-4 h-4 text-gray-400" />
                                      Success Page Re-visited
                                    </>
                                  )}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(view.viewed_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )
                        });
                      });

                      // Song Played
                      if (selectedRequest.played_at) {
                        timelineEvents.push({
                          type: 'song_played',
                          time: new Date(selectedRequest.played_at),
                          component: (
                            <div key="song_played" className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Song Played</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(selectedRequest.played_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )
                        });
                      }

                      // Sort by time (oldest first - chronological order)
                      timelineEvents.sort((a, b) => a.time.getTime() - b.time.getTime());

                      // If no success page views, show message
                      if (successPageViews.length === 0) {
                        timelineEvents.push({
                          type: 'no_success_views',
                          time: new Date(selectedRequest.created_at),
                          component: (
                            <div key="no_success_views" className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                  Success page not yet viewed
                                </p>
                              </div>
                            </div>
                          )
                        });
                      }

                      return (
                        <div className="space-y-3">
                          {timelineEvents.map(event => event.component)}
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedRequest(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
                        handleDeleteRequest(selectedRequest.id);
                        setShowDetailModal(false);
                        setSelectedRequest(null);
                      }
                    }}
                    variant="destructive"
                    className="flex-1 inline-flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                  {selectedRequest.payment_status === 'pending' && (
                    <Button
                      onClick={async () => {
                        const paymentMethod = selectedRequest.payment_method || 'manual';
                        
                        // For Venmo/CashApp payments, prompt for requester name if missing
                        if ((paymentMethod === 'venmo' || paymentMethod === 'cashapp') && 
                            (!selectedRequest.requester_name || selectedRequest.requester_name === 'Guest')) {
                          const venmoName = prompt(
                            `Enter the requester's name from the ${paymentMethod === 'venmo' ? 'Venmo' : 'CashApp'} transaction:\n\n` +
                            `(This helps match the payment to the request. Leave blank to skip.)`,
                            ''
                          );
                          
                          // If name was provided, update it first
                          if (venmoName && venmoName.trim()) {
                            await updateRequesterName(selectedRequest.id, venmoName.trim());
                          }
                        }
                        
                        // Update payment status
                        await updatePaymentStatus(selectedRequest.id, 'paid', paymentMethod);
                        setShowDetailModal(false);
                        setSelectedRequest(null);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Link Stripe Payment Modal */}
        {showLinkPaymentModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Link Stripe Payment
                </h3>
                <button
                  onClick={() => {
                    setShowLinkPaymentModal(false);
                    setLinkPaymentIntentId('');
                    setLinkPaymentRequestId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Stripe Payment Intent ID
                  </label>
                  <Input
                    value={linkPaymentIntentId}
                    onChange={(e) => setLinkPaymentIntentId(e.target.value)}
                    placeholder="pi_xxxxx or ch_xxxxx"
                    className="w-full font-mono"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter the Payment Intent ID from Stripe (starts with pi_) or Charge ID (starts with ch_)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (linkPaymentIntentId) {
                        searchByPaymentIntent(linkPaymentIntentId);
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={!linkPaymentIntentId}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search for Request
                  </Button>
                </div>

                {linkPaymentRequestId ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                      Request found! Click below to link the payment.
                    </p>
                    <Button
                      onClick={() => {
                        if (linkPaymentRequestId && linkPaymentIntentId) {
                          linkStripePayment(linkPaymentRequestId, linkPaymentIntentId);
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Link Payment to Request
                    </Button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Or Select Request Manually
                    </label>
                    <select
                      value={linkPaymentRequestId || ''}
                      onChange={(e) => setLinkPaymentRequestId(e.target.value || null)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a request...</option>
                      {requests.map((req) => (
                        <option key={req.id} value={req.id}>
                          {req.request_type === 'song_request' 
                            ? `${req.song_title || 'Unknown'}${req.song_artist ? ` by ${req.song_artist}` : ''}`
                            : `Shoutout for ${req.recipient_name}`} - {req.requester_name} - ${new Date(req.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkPaymentRequestId && linkPaymentIntentId && (
                  <Button
                    onClick={() => {
                      linkStripePayment(linkPaymentRequestId, linkPaymentIntentId);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Link Payment
                  </Button>
                )}

                <Button
                  onClick={() => {
                    setShowLinkPaymentModal(false);
                    setLinkPaymentIntentId('');
                    setLinkPaymentRequestId(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Venmo Refund Modal */}
        {showRefundModal && refundRequest && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Process Venmo Refund
                </h3>
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Refund Amount:</strong>
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${((refundRequest.amount_paid || 0) / 100).toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-3">
                    <strong>Steps to process refund:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li>Click &quot;Open Venmo&quot; below to open Venmo with the refund amount pre-filled</li>
                    {refundRequest.requester_phone && (
                      <li className="ml-4">Venmo will try to find the customer using their phone: {refundRequest.requester_phone}</li>
                    )}
                    {!refundRequest.requester_phone && (
                      <li className="ml-4">Search for the customer by name, phone, or Venmo username</li>
                    )}
                    <li>Complete the payment in Venmo</li>
                    <li>Return here and click &quot;Mark as Refunded&quot; to update the record</li>
                  </ol>
                  {refundRequest.requester_name && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Customer: <strong>{refundRequest.requester_name}</strong>
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      openVenmoRefund(refundRequest);
                      toast({
                        title: 'Venmo Opened',
                        description: 'Complete the payment in Venmo, then return here to mark as refunded.',
                      });
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Open Venmo
                  </Button>
                  <Button
                    onClick={() => {
                      if (confirm('Have you completed the refund payment in Venmo? Click OK to mark this as refunded.')) {
                        handleRefund(refundRequest.id, true);
                      }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Refunded
                  </Button>
                </div>
                
                <Button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundRequest(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Audio Tracking Modal - Minimized Floating View */}
        {showAudioTrackingModal && isAudioModalMinimized && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-3 min-w-[280px] max-w-[320px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Live Detection</h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAudioModalMinimized(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Maximize"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAudioTrackingModal(false);
                      setIsAudioModalMinimized(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div 
                className="text-xs text-gray-600 dark:text-gray-400 mb-2 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200"
                onClick={() => setIsAudioModalMinimized(false)}
                title="Click to maximize"
              >
                {selectedEventId 
                  ? availableEvents.find(e => e.id === selectedEventId)?.event_name || 'Event selected'
                  : 'No event selected'}
              </div>
              <Badge variant="outline" className="animate-pulse text-xs">
                <Mic className="h-3 w-3 mr-1" />
                Listening...
              </Badge>
            </div>
          </div>
        )}

        {/* Audio Tracking Modal - Full View */}
        {showAudioTrackingModal && !isAudioModalMinimized && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-0 sm:p-4" onClick={() => {}}>
            <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-2xl shadow-2xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    Live Song Detection
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                    Listen to music and automatically detect songs being played
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAudioModalMinimized(true)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Minimize"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAudioTrackingModal(false);
                      setIsAudioModalMinimized(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Event Selection */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Select Event <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Select an event to automatically match detected songs to song requests. You can start listening without selecting an event - songs will still be detected and saved.
                  </p>
                  
                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search events by name, client, or venue..."
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      onFocus={() => setShowEventDropdown(true)}
                      className="pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  {/* Event Dropdown */}
                  <div className="relative event-dropdown-container">
                    <div
                      className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer flex items-center justify-between"
                      onClick={() => setShowEventDropdown(!showEventDropdown)}
                    >
                      <span className="truncate">
                        {selectedEventId 
                          ? availableEvents.find(e => e.id === selectedEventId)?.event_name || 'Event selected'
                          : 'No event selected (detect only)'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showEventDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showEventDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <button
                          onClick={() => {
                            setSelectedEventCode(null);
                            setSelectedEventId(null);
                            setShowEventDropdown(false);
                            setEventSearchQuery('');
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            !selectedEventId ? 'bg-gray-50 dark:bg-gray-800' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">No event selected</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Detect songs only (no auto-matching)</p>
                            </div>
                            {!selectedEventId && (
                              <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        {loadingEvents ? (
                          <div className="px-4 py-8 text-center">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading events...</p>
                          </div>
                        ) : (
                          <>
                            {availableEvents
                              .filter(event => {
                                if (!eventSearchQuery) return true;
                                const query = eventSearchQuery.toLowerCase();
                                return (
                                  event.event_name?.toLowerCase().includes(query) ||
                                  event.client_name?.toLowerCase().includes(query) ||
                                  event.venue_name?.toLowerCase().includes(query) ||
                                  event.event_qr_code?.toLowerCase().includes(query)
                                );
                              })
                              .map((event) => {
                                const eventDate = event.event_date ? new Date(event.event_date) : null;
                                const isSelected = selectedEventId === event.id;
                                
                                return (
                                  <button
                                    key={event.id}
                                    onClick={async () => {
                                      setSelectedEventCode(event.event_qr_code);
                                      setSelectedEventId(event.id);
                                      setShowEventDropdown(false);
                                      setEventSearchQuery('');
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 ${
                                      isSelected ? 'bg-gray-50 dark:bg-gray-800' : ''
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          {event.event_name || 'Unnamed Event'}
                                        </p>
                                        <div className="mt-1 space-y-0.5">
                                          {eventDate && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              {format(eventDate, 'MMM d, yyyy')}
                                            </p>
                                          )}
                                          {event.client_name && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                                              <User className="w-3 h-3" />
                                              {event.client_name}
                                            </p>
                                          )}
                                          {event.venue_name && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                              📍 {event.venue_name}
                                            </p>
                                          )}
                                          {event.event_qr_code && (
                                            <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">
                                              Code: {event.event_qr_code}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <CheckCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            
                            {availableEvents.filter(event => {
                              if (!eventSearchQuery) return true;
                              const query = eventSearchQuery.toLowerCase();
                              return (
                                event.event_name?.toLowerCase().includes(query) ||
                                event.client_name?.toLowerCase().includes(query) ||
                                event.venue_name?.toLowerCase().includes(query) ||
                                event.event_qr_code?.toLowerCase().includes(query)
                              );
                            }).length === 0 && (
                              <div className="px-4 py-8 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">No events found</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedEventCode && selectedEventId && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Event selected - songs will auto-match to requests
                      </p>
                    </div>
                  )}
                </div>

                {/* Song Recognition Component */}
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-6">
                  <SongRecognition
                    eventId={selectedEventId || undefined}
                    organizationId={organization?.id || undefined}
                    onSongDetected={(song) => {
                      toast({
                        title: "Song Detected!",
                        description: selectedEventId 
                          ? `${song.title} by ${song.artist} - Request marked as played`
                          : `${song.title} by ${song.artist} - Detected and saved`,
                      });
                      // Refresh requests to show updated status
                      setTimeout(() => {
                        fetchRequests();
                      }, 1000);
                    }}
                    chunkDuration={5}
                  />
                </div>

                {/* Info Section */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2">How it works:</h4>
                  <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Place your phone near the speakers</li>
                    <li>The system will continuously listen and detect songs every 5 seconds</li>
                    <li>When a song is detected, it will automatically match to song requests if an event is selected</li>
                    <li>Matching requests will be marked as "played" automatically</li>
                    <li>Detected songs are saved to the database for tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Orphaned Payments Dialog */}
      <Dialog open={showOrphanedDialog} onOpenChange={setShowOrphanedDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Orphaned Payments Found</DialogTitle>
          </DialogHeader>
          {orphanedPaymentsData && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                  Found {orphanedPaymentsData.summary.orphaned_payments + 
                         orphanedPaymentsData.summary.orphaned_sessions + 
                         orphanedPaymentsData.summary.payments_without_request_id} orphaned payment(s)
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li>{orphanedPaymentsData.summary.orphaned_payments} payments with request_id but not linked</li>
                  <li>{orphanedPaymentsData.summary.orphaned_sessions} sessions with request_id but not linked</li>
                  <li>{orphanedPaymentsData.summary.payments_without_request_id} payments without request_id</li>
                </ul>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">These are payments in Stripe that either:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Have no request_id in metadata</li>
                  <li>The request_id doesn't exist in the database</li>
                  <li>The payment isn't properly linked to the request</li>
                </ul>
              </div>

              {orphanedPaymentsData.orphaned_payments && orphanedPaymentsData.orphaned_payments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Orphaned Payments ({orphanedPaymentsData.orphaned_payments.length}):</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {orphanedPaymentsData.orphaned_payments.slice(0, 5).map((payment: any, idx: number) => (
                      <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                        <p><strong>Payment Intent:</strong> {payment.payment_intent_id}</p>
                        <p><strong>Request ID:</strong> {payment.request_id}</p>
                        <p><strong>Amount:</strong> ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}</p>
                        <p><strong>Reason:</strong> {payment.reason}</p>
                      </div>
                    ))}
                    {orphanedPaymentsData.orphaned_payments.length > 5 && (
                      <p className="text-xs text-gray-500">... and {orphanedPaymentsData.orphaned_payments.length - 5} more (check console for full list)</p>
                    )}
                  </div>
                </div>
              )}

              {orphanedPaymentsData.orphaned_sessions && orphanedPaymentsData.orphaned_sessions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Orphaned Sessions ({orphanedPaymentsData.orphaned_sessions.length}):</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {orphanedPaymentsData.orphaned_sessions.slice(0, 5).map((session: any, idx: number) => (
                      <div key={idx} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                        <p><strong>Session ID:</strong> {session.session_id}</p>
                        <p><strong>Request ID:</strong> {session.request_id}</p>
                        <p><strong>Amount:</strong> ${(session.amount_total / 100).toFixed(2)} {session.currency.toUpperCase()}</p>
                        <p><strong>Reason:</strong> {session.reason}</p>
                      </div>
                    ))}
                    {orphanedPaymentsData.orphaned_sessions.length > 5 && (
                      <p className="text-xs text-gray-500">... and {orphanedPaymentsData.orphaned_sessions.length - 5} more (check console for full list)</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={async () => {
                    try {
                      setSyncingPayments(true);
                      const response = await fetch('/api/crowd-request/sync-orphaned-payments', {
                        method: 'POST',
                      });
                      const data = await response.json();
                      
                      if (data.success) {
                        toast({
                          title: 'Sync Complete',
                          description: `Synced ${data.synced} payment(s)`,
                        });
                        setShowOrphanedDialog(false);
                        // Refresh the requests list
                        window.location.reload();
                      } else {
                        toast({
                          title: 'Sync Failed',
                          description: data.error || 'Unknown error',
                          variant: 'destructive',
                        });
                      }
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error?.message || 'Unknown error',
                        variant: 'destructive',
                      });
                    } finally {
                      setSyncingPayments(false);
                    }
                  }}
                  disabled={syncingPayments}
                  className="flex-1"
                >
                  {syncingPayments ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Orphaned Payments
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowOrphanedDialog(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bid History Modal */}
      <Dialog open={showBidHistoryModal} onOpenChange={setShowBidHistoryModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bid History</DialogTitle>
            <DialogDescription>
              View all bids placed for this request
            </DialogDescription>
          </DialogHeader>
          
          {loadingBidHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {biddingRound && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Bidding Round Info</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Round Number:</span>
                      <span className="ml-2 font-medium">{biddingRound.round_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`ml-2 font-medium ${
                        biddingRound.status === 'active' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {biddingRound.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Started:</span>
                      <span className="ml-2 font-medium">
                        {new Date(biddingRound.started_at).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Ends:</span>
                      <span className="ml-2 font-medium">
                        {new Date(biddingRound.ends_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {bidHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No bids found for this request
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">All Bids ({bidHistory.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {bidHistory.map((bid: any) => (
                      <div
                        key={bid.id}
                        className={`p-4 rounded-lg border ${
                          bid.is_winning_bid || bid.payment_status === 'charged'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : bid.payment_status === 'refunded'
                            ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                ${(bid.bid_amount / 100).toFixed(2)}
                              </span>
                              {bid.is_winning_bid && (
                                <Badge className="bg-green-600 text-white text-xs">Winning</Badge>
                              )}
                              <Badge className={
                                bid.payment_status === 'charged' ? 'bg-green-500 text-white' :
                                bid.payment_status === 'pending' ? 'bg-yellow-500 text-white' :
                                bid.payment_status === 'refunded' ? 'bg-gray-500 text-white' :
                                'bg-red-500 text-white'
                              }>
                                {bid.payment_status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <p><strong>Bidder:</strong> {bid.bidder_name}</p>
                              {bid.bidder_email && <p><strong>Email:</strong> {bid.bidder_email}</p>}
                              {bid.bidder_phone && <p><strong>Phone:</strong> {bid.bidder_phone}</p>}
                              <p><strong>Placed:</strong> {new Date(bid.created_at).toLocaleString()}</p>
                              {bid.payment_intent_id && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  <strong>Payment Intent:</strong> {bid.payment_intent_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => setShowBidHistoryModal(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

