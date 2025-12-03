'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  QrCode, 
  Music, 
  Mic, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  Trash2,
  Eye,
  Edit3,
  Printer,
  Zap,
  X,
  Settings,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  MoreVertical,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { getCoverPhotoUrl } from '@/utils/cover-photo-helper';

interface CrowdRequest {
  id: string;
  event_qr_code: string;
  request_type: 'song_request' | 'shoutout';
  song_artist: string | null;
  song_title: string | null;
  recipient_name: string | null;
  recipient_message: string | null;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  amount_requested: number;
  amount_paid: number;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
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
}

export default function CrowdRequestsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const [requests, setRequests] = useState<CrowdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('payment');
  const [qrType, setQrType] = useState<'event' | 'public'>('event');
  
  // New feature states
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CrowdRequest | null>(null);
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>('all');
  const [eventCodeFilter, setEventCodeFilter] = useState<string>('');
  const [audioUploadFilter, setAudioUploadFilter] = useState<string>('all'); // 'all', 'custom', 'standard'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
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
  const [showLinkPaymentModal, setShowLinkPaymentModal] = useState(false);
  const [linkPaymentIntentId, setLinkPaymentIntentId] = useState('');
  const [linkPaymentRequestId, setLinkPaymentRequestId] = useState<string | null>(null);
  
  // QR Code Generator State
  const [qrEventCode, setQrEventCode] = useState('');
  const [qrEventName, setQrEventName] = useState('');
  const [qrEventDate, setQrEventDate] = useState('');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [generatedPublicQR, setGeneratedPublicQR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    cashAppTag: '$DJbenmurray',
    venmoUsername: '@djbenmurray'
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

  useEffect(() => {
    fetchRequests();
    fetchPaymentSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        const { data: updatedOrg, error: orgError } = await supabase
          .from('organizations')
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
            
            const { data: retryOrg, error: retryError } = await supabase
              .from('organizations')
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
          .single();
        
        if (refreshError) {
          console.error('Error refreshing organization:', refreshError);
        } else if (refreshedOrg) {
          setOrganization(refreshedOrg);
          // Update cover photo history from refreshed org
          let history: string[] = [];
          if (refreshedOrg.requests_cover_photo_history) {
            if (Array.isArray(refreshedOrg.requests_cover_photo_history)) {
              history = refreshedOrg.requests_cover_photo_history;
            } else if (typeof refreshedOrg.requests_cover_photo_history === 'string') {
              try {
                history = JSON.parse(refreshedOrg.requests_cover_photo_history);
              } catch (e) {
                console.warn('Failed to parse cover photo history:', e);
                history = [];
              }
            }
          }
          setCoverPhotoHistory(history);
          setHeaderSettings({
            artistName: refreshedOrg.requests_header_artist_name || '',
            location: refreshedOrg.requests_header_location || '',
            date: refreshedOrg.requests_header_date || ''
          });
          setCoverPhotoSettings({
            requests_cover_photo_url: refreshedOrg.requests_cover_photo_url || '',
            requests_artist_photo_url: refreshedOrg.requests_artist_photo_url || '',
            requests_venue_photo_url: refreshedOrg.requests_venue_photo_url || '',
            requests_primary_cover_source: (refreshedOrg.requests_primary_cover_source as 'artist' | 'venue') || 'artist',
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
          setCoverPhotoHistory(loadPhotoHistory(refreshedOrg.requests_cover_photo_history));
          setArtistPhotoHistory(loadPhotoHistory(refreshedOrg.requests_artist_photo_history));
          setVenuePhotoHistory(loadPhotoHistory(refreshedOrg.requests_venue_photo_history));
          console.log('✅ Organization data refreshed:', refreshedOrg);
          console.log('🎯 Primary cover source after refresh:', {
            requests_primary_cover_source: refreshedOrg.requests_primary_cover_source,
            requests_artist_photo_url: refreshedOrg.requests_artist_photo_url,
            requests_venue_photo_url: refreshedOrg.requests_venue_photo_url,
            requests_cover_photo_url: refreshedOrg.requests_cover_photo_url
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

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!org) {
        throw new Error('No organization found');
      }

      setOrganization(org);
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
      // Note: We'll handle sorting in the frontend to allow dynamic column sorting
      const { data, error } = await supabase
        .from('crowd_requests')
        .select('*')
        .or(`organization_id.eq.${org.id},organization_id.is.null`); // Include requests for this org OR orphaned requests

      if (error) throw error;
      setRequests(data || []);
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    let requestUrl: string;
    let qrCodeUrl: string;

    if (qrType === 'public') {
      // Generate QR for public requests page
      requestUrl = `${baseUrl}/requests`;
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
      requestUrl = `${baseUrl}/crowd-request/${encodeURIComponent(qrEventCode)}`;
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    let requestUrl: string;
    
    if (qrType === 'public') {
      requestUrl = `${baseUrl}/requests`;
    } else {
      if (!qrEventCode.trim()) return;
      requestUrl = `${baseUrl}/crowd-request/${encodeURIComponent(qrEventCode)}`;
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

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('crowd_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
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
        supabase
          .from('crowd_requests')
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

    try {
      const updates = Array.from(selectedRequests).map(id => 
        fetch('/api/crowd-request/update-payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: id,
            paymentStatus,
            paymentMethod: 'manual'
          })
        })
      );

      await Promise.all(updates);
      
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
    // Auto-fetch Stripe details if payment_intent_id or stripe_session_id exists
    if (request.payment_intent_id || (request as any).stripe_session_id) {
      fetchStripeDetails(request);
    }
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
      } else {
        console.error('Failed to fetch Stripe details');
      }
    } catch (error) {
      console.error('Error fetching Stripe details:', error);
    } finally {
      setLoadingStripeDetails(false);
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
        .single();

      if (!org) {
        throw new Error('No organization found');
      }

      const { error } = await supabase
        .from('crowd_requests')
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
      request.requester_phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    
    return matchesSearch && matchesStatus && matchesDateRange && matchesPaymentMethod && matchesRequestType && matchesEventCode && matchesAudioUpload;
  });

  // Sorting function
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    // Handle priority_order first (fast-track requests should appear first when sorting by date)
    if (sortColumn === 'created_at' || sortColumn === 'date') {
      // Fast-track requests (priority_order = 0) always come first
      if (a.is_fast_track && !b.is_fast_track) return -1;
      if (!a.is_fast_track && b.is_fast_track) return 1;
    }

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'created_at':
      case 'date':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
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
        aValue = a.payment_status?.toLowerCase() || '';
        bValue = b.payment_status?.toLowerCase() || '';
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
  }, [searchTerm, statusFilter, dateRangeStart, dateRangeEnd, paymentMethodFilter, requestTypeFilter, eventCodeFilter, audioUploadFilter]);

  const getStatusBadge = (status: string, paymentStatus: string) => {
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
        return <Badge className="bg-blue-500 text-white">New</Badge>;
      case 'acknowledged':
        return <Badge className="bg-purple-500 text-white">Acknowledged</Badge>;
      case 'playing':
        return <Badge className="bg-orange-500 text-white">Playing</Badge>;
      case 'played':
        return <Badge className="bg-green-600 text-white">Played</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Crowd Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage song requests and shoutouts from events
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => {
                setShowSettings(true);
                setSettingsTab('payment');
              }}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Payment Settings
            </Button>
            <Button
              onClick={() => setShowQRGenerator(!showQRGenerator)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              {showQRGenerator ? 'Hide' : 'Generate'} QR Code
            </Button>
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
                        onClick={() => window.print()}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                    </>
                  )}
                </div>

                {generatedQR && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-start gap-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img 
                          src={generatedQR} 
                          alt="QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Request URL:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">
                          {process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/crowd-request/{qrEventCode}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Scan this QR code or share the URL above with your event attendees.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
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
                        onClick={() => window.print()}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                    </>
                  )}
                </div>

                {generatedPublicQR && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-start gap-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img 
                          src={generatedPublicQR} 
                          alt="Public Requests QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Public Requests URL:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">
                          {process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/requests
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Scan this QR code or share the URL above. This page is publicly accessible to anyone.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
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
                  </div>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="space-y-6 mt-0">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
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
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
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
                              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Current Cover Photo Preview
                                </label>
                                <div className="relative rounded-lg overflow-hidden border-2 border-blue-300 dark:border-blue-700">
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
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
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
                              placeholder="Request a Song or Shoutout | M10 DJ Company"
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
                          placeholder="Request a Song or Shoutout | M10 DJ Company"
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
                {(statusFilter !== 'all' || paymentMethodFilter !== 'all' || requestTypeFilter !== 'all' || dateRangeStart || dateRangeEnd || eventCodeFilter || audioUploadFilter !== 'all') && (
                  <Badge className="ml-2 bg-purple-500 text-white">Active</Badge>
                )}
              </span>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showMobileFilters ? 'rotate-90' : ''}`} />
            </Button>
          </div>
          
          <div className={`flex flex-col gap-4 ${showMobileFilters ? 'block' : 'hidden lg:flex'}`}>
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
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
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
                    {paginatedRequests.map((request) => (
                    <tr 
                      key={request.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        request.is_fast_track ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500' : ''
                      } ${
                        !request.organization_id ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-500' : ''
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
                          ) : (
                            <Mic className="w-5 h-5 text-pink-500" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {request.request_type === 'song_request' 
                                  ? request.song_title || 'Unknown Song'
                                  : `Shoutout for ${request.recipient_name}`}
                              </p>
                              {request.is_fast_track && (
                                <Badge className="bg-orange-500 text-white flex items-center gap-1 px-2 py-0.5">
                                  <Zap className="w-3 h-3" />
                                  Fast-Track
                                </Badge>
                              )}
                              {request.is_custom_audio && (
                                <Badge className="bg-blue-500 text-white flex items-center gap-1 px-2 py-0.5">
                                  <FileText className="w-3 h-3" />
                                  Custom Audio
                                </Badge>
                              )}
                              {request.is_artist && (
                                <Badge className="bg-green-500 text-white flex items-center gap-1 px-2 py-0.5">
                                  <User className="w-3 h-3" />
                                  Artist
                                </Badge>
                              )}
                            </div>
                            {request.request_type === 'song_request' && request.song_artist && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                by {request.song_artist}
                              </p>
                            )}
                            {request.request_type === 'shoutout' && request.recipient_message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                {request.recipient_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {/* Prioritize Stripe customer name if payment exists, otherwise use DB name */}
                            {request.payment_intent_id || (request as any).stripe_session_id ? (
                              <span className="flex items-center gap-1">
                                <span className="text-indigo-600 dark:text-indigo-400" title="Stripe payment - customer data from Stripe">
                                  💳
                                </span>
                                {request.requester_name || 'Loading...'}
                              </span>
                            ) : (
                              request.requester_name || 'N/A'
                            )}
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
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              +${(request.audio_upload_fee / 100).toFixed(2)} audio upload
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(request.status, request.payment_status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-2">
                          {!request.organization_id && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Assign this orphaned request to your organization?')) {
                                  assignRequestToOrganization(request.id);
                                }
                              }}
                              size="sm"
                              className="text-xs h-7 w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                              title="This request has no organization assigned. Click to assign it to your organization."
                            >
                              Assign to Org
                            </Button>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailModal(request);
                            }}
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 w-full"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                          <select
                            value={request.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateRequestStatus(request.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="new">New</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="playing">Playing</option>
                            <option value="played">Played</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          
                          {/* Payment Status Update - Show for pending payments */}
                          {request.payment_status === 'pending' && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                const paymentMethod = request.payment_method || 'manual';
                                updatePaymentStatus(request.id, 'paid', paymentMethod);
                              }}
                              size="sm"
                              className="text-xs h-6 bg-green-600 hover:bg-green-700 text-white"
                            >
                              Mark Paid
                            </Button>
                          )}
                          
                          {/* Show payment method if paid */}
                          {request.payment_status === 'paid' && request.payment_method && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {request.payment_method === 'card' ? '💳 Card' : 
                                 request.payment_method === 'cashapp' ? '💰 CashApp' :
                                 request.payment_method === 'venmo' ? '💸 Venmo' :
                                 '✅ Paid'}
                              </span>
                              {/* Refund button - for Stripe, Venmo, and CashApp payments */}
                              {(request.payment_intent_id || request.payment_method === 'venmo' || request.payment_method === 'cashapp') && (
                                <Button
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
                                  size="sm"
                                  className={`text-xs h-6 ${
                                    request.payment_intent_id 
                                      ? 'bg-red-600 hover:bg-red-700' 
                                      : 'bg-orange-600 hover:bg-orange-700'
                                  } text-white`}
                                  title={request.payment_intent_id 
                                    ? "Refund payment via Stripe" 
                                    : request.payment_method === 'venmo'
                                    ? "Open Venmo to send refund"
                                    : `Mark as refunded (process refund manually in CashApp first)`}
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  {request.payment_intent_id ? 'Refund' : request.payment_method === 'venmo' ? 'Refund' : 'Mark Refunded'}
                                </Button>
                              )}
                            </div>
                          )}
                          {/* Show refund status if refunded */}
                          {(request.payment_status === 'refunded' || request.payment_status === 'partially_refunded') && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                {request.payment_status === 'refunded' ? '🔄 Refunded' : '🔄 Partially Refunded'}
                              </span>
                              {request.refund_amount && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ${(request.refund_amount / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3 mt-4">
            {paginatedRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => openDetailModal(request)}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.98] ${
                  request.is_fast_track ? 'border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10' : ''
                } ${
                  !request.organization_id ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {request.request_type === 'song_request' ? (
                      <Music className={`w-6 h-6 flex-shrink-0 ${request.is_fast_track ? 'text-orange-500' : 'text-purple-500'}`} />
                    ) : (
                      <Mic className="w-6 h-6 flex-shrink-0 text-pink-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-gray-900 dark:text-white text-base">
                          {request.request_type === 'song_request' 
                            ? request.song_title || 'Unknown Song'
                            : `Shoutout for ${request.recipient_name}`}
                        </p>
                        {request.is_fast_track && (
                          <Badge className="bg-orange-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs">
                            <Zap className="w-3 h-3" />
                            Fast-Track
                          </Badge>
                        )}
                        {request.is_custom_audio && (
                          <Badge className="bg-blue-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs">
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
                      {request.payment_intent_id || (request as any).stripe_session_id ? (
                        <span className="flex items-center gap-1">
                          <span className="text-indigo-600 dark:text-indigo-400">💳</span>
                          {request.requester_name || 'Loading...'}
                        </span>
                      ) : (
                        request.requester_name || 'N/A'
                      )}
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
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        +${(request.audio_upload_fee / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    {getStatusBadge(request.status, request.payment_status)}
                  </div>
                </div>

                {/* Date and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {!request.organization_id && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Assign this orphaned request to your organization?')) {
                            assignRequestToOrganization(request.id);
                          }
                        }}
                        size="sm"
                        className="text-xs h-8 bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        Assign
                      </Button>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(request);
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
                      ) : (
                        <Mic className="w-5 h-5 text-pink-500" />
                      )}
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">
                        {selectedRequest.request_type.replace('_', ' ')}
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedRequest.status, selectedRequest.payment_status)}
                    </div>
                  </div>
                </div>

                {/* Song/Shoutout Details */}
                {selectedRequest.request_type === 'song_request' ? (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Song Request</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {selectedRequest.song_title || 'Unknown Song'}
                    </p>
                    {selectedRequest.song_artist && (
                      <p className="text-lg text-gray-700 dark:text-gray-300">
                        by {selectedRequest.song_artist}
                      </p>
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
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Requester Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {stripeDetails?.customer?.name || selectedRequest.requester_name}
                        {stripeDetails?.customer?.name && stripeDetails.customer.name !== selectedRequest.requester_name && (
                          <span className="text-xs text-gray-500 ml-2">(from Stripe)</span>
                        )}
                      </p>
                    </div>
                    {(stripeDetails?.customer?.email || selectedRequest.requester_email) && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                        <a 
                          href={`mailto:${stripeDetails?.customer?.email || selectedRequest.requester_email}`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
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
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {stripeDetails?.customer?.phone || selectedRequest.requester_phone}
                          {stripeDetails?.customer?.phone && (
                            <span className="text-xs text-gray-500 ml-1">(Stripe)</span>
                          )}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stripe Payment Details */}
                {(selectedRequest.payment_intent_id || (selectedRequest as any).stripe_session_id) && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
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
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Payment Information</p>
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
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {selectedRequest.payment_status}
                      </p>
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
                    {selectedRequest.refund_amount && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Refund Amount</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          ${(selectedRequest.refund_amount / 100).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

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
                  {selectedRequest.payment_status === 'pending' && (
                    <Button
                      onClick={() => {
                        const paymentMethod = selectedRequest.payment_method || 'manual';
                        updatePaymentStatus(selectedRequest.id, 'paid', paymentMethod);
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
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
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
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    <strong>Steps to process refund:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300">
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
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
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

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {requests.length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {requests.filter(r => r.payment_status === 'paid').length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(requests
                .filter(r => r.payment_status === 'paid' || r.payment_status === 'partially_refunded')
                .reduce((sum, r) => {
                  const paid = r.amount_paid || 0;
                  const refunded = r.refund_amount || 0;
                  return sum + (paid - refunded);
                }, 0) / 100).toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {requests.filter(r => r.payment_status === 'pending').length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

