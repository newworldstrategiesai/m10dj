// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import {
  Mic,
  Users,
  Music,
  Loader2,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  CheckCircle,
  Clock,
  Play,
  Pause,
  SkipForward,
  X,
  Settings,
  RefreshCw,
  Eye,
  Trash2,
  Edit3,
  Zap,
  Calendar,
  User,
  Phone,
  Mail,
  ExternalLink,
  MoreVertical,
  QrCode,
  Copy,
  Monitor,
  Info,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/Toasts/use-toast';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import DiscoverPage from '@/components/karaoke/DiscoverPage';
import VideoManager from '@/components/karaoke/VideoManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { getGroupLabel, formatGroupDisplayName, KaraokeSignup } from '@/types/karaoke';
import { getSortedQueue, getCurrentSinger, getNextSinger, getQueue, calculateQueuePosition, calculateEstimatedWait, formatEstimatedWait, getQueueHealth } from '@/utils/karaoke-queue';
import { getCurrentOrganization } from '@/utils/organization-context';
import { DecoratedQRCode } from '@/components/ui/DecoratedQRCode';
import { logSettingsChange, getClientInfo } from '@/utils/karaoke-audit';
import YouTubePlayer from '@/components/karaoke/YouTubePlayer';

export default function KaraokeAdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [signups, setSignups] = useState<KaraokeSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [eventCodeFilter, setEventCodeFilter] = useState<string>('');
  const [selectedSignup, setSelectedSignup] = useState<KaraokeSignup | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [showVideoSearchForSignup, setShowVideoSearchForSignup] = useState(false);
  const [videoSearchSignup, setVideoSearchSignup] = useState<KaraokeSignup | null>(null);
  const [signupVideoSuggestions, setSignupVideoSuggestions] = useState<{[key: string]: any}>({});
  const [loadingVideoSuggestions, setLoadingVideoSuggestions] = useState<{[key: string]: boolean}>({});

  // Search for video suggestions for a signup
  const searchVideoSuggestionsForSignup = async (signup: KaraokeSignup) => {
    if (!signup.song_title || signup.video_data) return;

    setLoadingVideoSuggestions(prev => ({ ...prev, [signup.id]: true }));

    try {
      const response = await fetch('/api/karaoke/find-best-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: signup.song_title,
          songArtist: signup.song_artist,
          organizationId: organization?.id,
          prioritizeKarafun: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.bestVideo) {
          setSignupVideoSuggestions(prev => ({
            ...prev,
            [signup.id]: data.bestVideo
          }));
        }
      } else {
        console.warn('Failed to find video suggestions:', response.statusText);
      }
    } catch (error) {
      console.error('Error searching for video suggestions:', error);
    } finally {
      setLoadingVideoSuggestions(prev => ({ ...prev, [signup.id]: false }));
    }
  };

  // Link suggested video to signup
  const linkSuggestedVideoToSignup = async (signupId: string, videoData: any) => {
    try {
      const response = await fetch('/api/karaoke/link-signup-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signupId,
          videoId: videoData.existingLink?.id || null, // Use existing video ID if available
          videoData: videoData, // Pass full video data for linking
          organizationId: organization?.id
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Update the signup in local state
        setSignups(prev => prev.map(signup =>
          signup.id === signupId
            ? { ...signup, video_id: data.video.id, video_data: data.video }
            : signup
        ));

        // Update selected signup if it's the current one
        if (selectedSignup && selectedSignup.id === signupId) {
          setSelectedSignup(prev => prev ? {
            ...prev,
            video_id: data.video.id,
            video_data: data.video
          } : null);
        }

        // Clear the suggestion
        setSignupVideoSuggestions(prev => {
          const newSuggestions = { ...prev };
          delete newSuggestions[signupId];
          return newSuggestions;
        });

        toast({
          title: 'Video Linked Successfully',
          description: `Karaoke video linked to signup`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link video');
      }
    } catch (error: any) {
      console.error('Error linking video to signup:', error);
      toast({
        title: 'Linking Failed',
        description: error.message || 'Failed to link video to signup',
        variant: 'destructive'
      });
    }
  };

  // Page customization settings
  const [pageSettings, setPageSettings] = useState({
    pageTitle: '',
    pageDescription: '',
    mainHeading: '',
    welcomeMessage: '',
    signupSuccessMessage: '',
    queuePositionMessage: '',
    estimatedWaitMessage: ''
  });

  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
    showWelcomeMessage: true,
    showCurrentSinger: true,
    showQueuePreview: true,
    showEstimatedWait: true,
    theme: 'default'
  });

  // Operational settings
  const [operationalSettings, setOperationalSettings] = useState({
    maxConcurrentSingers: 10,
    smsNotificationsEnabled: true,
    phoneFieldMode: 'required' as 'required' | 'optional' | 'hidden'
  });

  // QR Generator state (reused from crowd-requests)
  const [qrEventCode, setQrEventCode] = useState('');
  const [qrEventName, setQrEventName] = useState('');
  const [qrEventDate, setQrEventDate] = useState('');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [generatedSignupUrl, setGeneratedSignupUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDisplaySetup, setShowDisplaySetup] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [displayQR, setDisplayQR] = useState<string | null>(null);
  const [displayCopied, setDisplayCopied] = useState(false);

  // Video playback state for modal
  const [modalVideoPlaying, setModalVideoPlaying] = useState(false);

  // Check if video is from Karafun
  const isKarafunVideo = (channelName?: string, channelId?: string) => {
    if (!channelName && !channelId) return false;
    const karafunTerms = (process.env.NEXT_PUBLIC_KARAFUN_CHANNEL_IDS || 'karafun').split(',');
    return karafunTerms.some(term =>
      channelId?.toLowerCase().includes(term.toLowerCase()) ||
      channelName?.toLowerCase().includes(term.toLowerCase())
    );
  };

  // Load organization
  useEffect(() => {
    async function loadOrganization() {
      const org = await getCurrentOrganization(supabase);
      setOrganization(org);
      setSubscriptionTier(org?.subscription_tier || 'free');
      if (org) {
        loadSettings(org.id);
        loadSignups(org.id);
      }
    }
    loadOrganization();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !organization) return;

    const interval = setInterval(() => {
      if (organization) {
        loadSignups(organization.id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, organization]);

  const loadSettings = async (orgId: string) => {
    try {
      const { data } = await supabase
        .from('karaoke_settings')
        .select('*')
        .eq('organization_id', orgId)
        .single();

      if (data) {
        setSettings(data);

        // Load operational settings from karaoke_settings
        setOperationalSettings({
          maxConcurrentSingers: (data as any).max_concurrent_singers || 10,
          smsNotificationsEnabled: (data as any).sms_notifications_enabled !== false,
          phoneFieldMode: (data as any).phone_field_mode || 'required'
        });

        // Load page customization from organization
        if (organization) {
          setPageSettings({
            pageTitle: organization.karaoke_page_title || '',
            pageDescription: organization.karaoke_page_description || '',
            mainHeading: organization.karaoke_main_heading || '',
            welcomeMessage: organization.karaoke_welcome_message || '',
            signupSuccessMessage: organization.karaoke_signup_success_message || '',
            queuePositionMessage: organization.karaoke_queue_position_message || '',
            estimatedWaitMessage: organization.karaoke_estimated_wait_message || ''
          });

          setDisplaySettings({
            showWelcomeMessage: organization.karaoke_show_welcome_message !== false,
            showCurrentSinger: organization.karaoke_show_current_singer !== false,
            showQueuePreview: organization.karaoke_show_queue_preview !== false,
            showEstimatedWait: organization.karaoke_show_estimated_wait !== false,
            theme: organization.karaoke_theme || 'default'
          });
        }
      } else {
        const { data: newSettings } = await (supabase
          .from('karaoke_settings') as any)
          .insert({
            organization_id: orgId,
            karaoke_enabled: true,
            priority_pricing_enabled: true,
            rotation_enabled: true,
            priority_fee_cents: 1000,
            free_signups_allowed: true,
            max_singers_before_repeat: 3,
            rotation_fairness_mode: 'strict',
            display_show_queue_count: 5,
            display_theme: 'default',
            auto_advance: false,
            allow_skips: true
          })
          .select()
          .single();

        if (newSettings) {
          setSettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!organization?.id) return;

    setSavingSettings(true);
    try {
      // Capture old settings for audit logging
      const oldSettings = {
        karaoke: { ...settings },
        page: {
          pageTitle: organization.karaoke_page_title,
          pageDescription: organization.karaoke_page_description,
          mainHeading: organization.karaoke_main_heading,
          welcomeMessage: organization.karaoke_welcome_message,
          signupSuccessMessage: organization.karaoke_signup_success_message,
          queuePositionMessage: organization.karaoke_queue_position_message,
          estimatedWaitMessage: organization.karaoke_estimated_wait_message,
          showWelcomeMessage: organization.karaoke_show_welcome_message,
          showCurrentSinger: organization.karaoke_show_current_singer,
          showQueuePreview: organization.karaoke_show_queue_preview,
          showEstimatedWait: organization.karaoke_show_estimated_wait,
          theme: organization.karaoke_theme
        },
        operational: { ...operationalSettings },
        display: { ...displaySettings }
      };

      // Update karaoke_settings with operational settings
      const karaokeSettingsUpdate: any = {
        max_concurrent_singers: operationalSettings.maxConcurrentSingers,
        sms_notifications_enabled: operationalSettings.smsNotificationsEnabled,
        phone_field_mode: operationalSettings.phoneFieldMode
      };

      const { error: karaokeError } = await (supabase
        .from('karaoke_settings') as any)
        .update(karaokeSettingsUpdate)
        .eq('organization_id', organization.id);

      if (karaokeError) {
        console.error('Error updating karaoke settings:', karaokeError);
        throw karaokeError;
      }

      // Update karaoke settings state
      setSettings({ ...settings, ...karaokeSettingsUpdate });

      // Update organization with page customization settings
      const orgUpdateData: any = {
        karaoke_page_title: pageSettings.pageTitle || null,
        karaoke_page_description: pageSettings.pageDescription || null,
        karaoke_main_heading: pageSettings.mainHeading || null,
        karaoke_welcome_message: pageSettings.welcomeMessage || null,
        karaoke_signup_success_message: pageSettings.signupSuccessMessage || null,
        karaoke_queue_position_message: pageSettings.queuePositionMessage || null,
        karaoke_estimated_wait_message: pageSettings.estimatedWaitMessage || null,
        karaoke_show_welcome_message: displaySettings.showWelcomeMessage,
        karaoke_show_current_singer: displaySettings.showCurrentSinger,
        karaoke_show_queue_preview: displaySettings.showQueuePreview,
        karaoke_show_estimated_wait: displaySettings.showEstimatedWait,
        karaoke_theme: displaySettings.theme
      };

      const { error: orgError } = await (supabase
        .from('organizations') as any)
        .update(orgUpdateData)
        .eq('id', organization.id);

      if (orgError) {
        console.error('Error updating organization:', orgError);
        throw orgError;
      }

      // Update organization state
      setOrganization({ ...organization, ...orgUpdateData });

      // Log settings change for audit
      const newSettings = {
        karaoke: { ...settings, ...karaokeSettingsUpdate },
        page: { ...pageSettings },
        operational: { ...operationalSettings },
        display: { ...displaySettings }
      };

      await logSettingsChange(
        organization.id,
        'settings_updated',
        'admin_user', // TODO: Get actual user email
        oldSettings,
        newSettings,
        undefined, // ip_address - would need to be passed from API
        navigator?.userAgent
      );

      toast({
        title: "Settings saved",
        description: "Your karaoke settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const loadSignups = async (orgId: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('karaoke_signups')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (eventCodeFilter) {
        query = query.eq('event_qr_code', eventCodeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSignups(data || []);

      const eventCodes = Array.from(new Set((data || []).map((s: any) => s.event_qr_code).filter(Boolean)));
      setAvailableEvents(eventCodes as string[]);
    } catch (error: any) {
      console.error('Error loading signups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load karaoke signups',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (signupId: string, newStatus: KaraokeSignup['status'], adminNotes?: string) => {
    // Find the signup to store original state for rollback
    const originalSignup = signups.find(s => s.id === signupId);
    if (!originalSignup) return;

    // Optimistic update - update UI immediately
    setSignups(prev => prev.map(s => 
      s.id === signupId ? { ...s, status: newStatus } : s
    ));

    try {
      const response = await fetch('/api/karaoke/update-status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signup_id: signupId,
          status: newStatus,
          admin_notes: adminNotes
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      toast({
        title: 'Success',
        description: `Status updated to ${newStatus}`,
      });

      // Refresh to get latest data (including timestamps, notifications, etc.)
      if (organization) {
        loadSignups(organization.id);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      // Revert optimistic update on error
      setSignups(prev => prev.map(s => 
        s.id === signupId ? originalSignup : s
      ));
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const reorderQueue = async (signupId: string, newPriorityOrder: number) => {
    try {
      const { error } = await (supabase
        .from('karaoke_signups') as any)
        .update({ priority_order: newPriorityOrder })
        .eq('id', signupId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Queue order updated',
      });

      if (organization) {
        loadSignups(organization.id);
      }
    } catch (error: any) {
      console.error('Error reordering queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to update queue order',
        variant: 'destructive'
      });
    }
  };

  const deleteSignup = async (signupId: string) => {
    if (!confirm('Are you sure you want to delete this signup?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('karaoke_signups')
        .delete()
        .eq('id', signupId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Signup deleted',
      });

      if (organization) {
        loadSignups(organization.id);
      }
    } catch (error: any) {
      console.error('Error deleting signup:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete signup',
        variant: 'destructive'
      });
    }
  };

  // Generate QR Code (reused pattern from crowd-requests)
  const generateQRCode = async () => {
    // Allow empty event code for organization-wide karaoke
    if (!organization?.slug) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      });
      return;
    }

    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const signupUrl = qrEventCode.trim()
        ? `${baseUrl}/organizations/${organization.slug}/sing?eventCode=${qrEventCode.trim()}`
        : `${baseUrl}/organizations/${organization.slug}/sing`;

      // Generate QR code image URL
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(signupUrl)}`;

      setGeneratedQR(qrCodeUrl);
      setGeneratedSignupUrl(signupUrl);
      toast({
        title: 'Success',
        description: 'QR code generated',
      });
    } catch (error: any) {
      console.error('Error generating QR:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate QR code',
        variant: 'destructive'
      });
    }
  };

  // Generate Display URL and QR
  const generateDisplayURL = (eventCode?: string) => {
    if (!organization) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    // If eventCode is provided, create event-specific display
    // If no eventCode, create organization-wide display
    const url = eventCode
      ? `${baseUrl}/karaoke/display/${eventCode}?org_id=${organization.id}`
      : `${baseUrl}/karaoke/display/all?org_id=${organization.id}`;

    setDisplayUrl(url);

    // Generate QR code for display URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`;
    setDisplayQR(qrCodeUrl);
  };

  // Auto-generate display URL when modal opens
  useEffect(() => {
    if (showDisplaySetup && organization) {
      if (eventCodeFilter) {
        generateDisplayURL(eventCodeFilter);
      } else {
        generateDisplayURL(); // Generate all-events display
      }
    }
  }, [showDisplaySetup, eventCodeFilter, organization]);

  // Filter signups (reused pattern from crowd-requests)
  const filteredSignups = signups.filter(signup => {
    if (statusFilter === 'active') {
      if (!['queued', 'next', 'singing'].includes(signup.status)) return false;
    } else if (statusFilter === 'completed') {
      if (signup.status !== 'completed') return false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = signup.singer_name?.toLowerCase().includes(search);
      const matchesSong = signup.song_title?.toLowerCase().includes(search);
      const matchesArtist = signup.song_artist?.toLowerCase().includes(search);
      const matchesPhone = signup.singer_phone?.includes(search);
      const matchesEmail = signup.singer_email?.toLowerCase().includes(search);

      if (!matchesName && !matchesSong && !matchesArtist && !matchesPhone && !matchesEmail) {
        return false;
      }
    }

    return true;
  });

  const currentSinger = getCurrentSinger(filteredSignups);
  const nextSinger = getNextSinger(filteredSignups);
  const queue = getQueue(filteredSignups);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input, textarea, or if a modal is open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        showDetailModal ||
        showSettings ||
        showQRGenerator ||
        showDisplaySetup
      ) {
        return;
      }

      // Space = Advance queue (complete current, start next)
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        if (currentSinger) {
          updateStatus(currentSinger.id, 'completed');
          // Auto-advance to next after a short delay
          setTimeout(() => {
            if (nextSinger) {
              updateStatus(nextSinger.id, 'singing');
            }
          }, 300);
        }
      }

      // N = Mark next singer as current
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && nextSinger) {
        e.preventDefault();
        updateStatus(nextSinger.id, 'singing');
      }

      // C = Complete current singer
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && currentSinger) {
        e.preventDefault();
        updateStatus(currentSinger.id, 'completed');
      }

      // Delete = Skip current (with confirmation)
      if (e.key === 'Delete' && currentSinger && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (confirm('Skip current singer?')) {
          updateStatus(currentSinger.id, 'skipped');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentSinger, nextSinger, updateStatus, showDetailModal, showSettings, showQRGenerator, showDisplaySetup]);

  // Status badge component (reused from crowd-requests pattern)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'singing':
        return <Badge className="bg-green-600 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
          <CheckCircle2 className="w-3 h-3" />
          Currently Singing
        </Badge>;
      case 'next':
        return <Badge className="bg-yellow-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
          <ArrowUp className="w-3 h-3" />
          Next Up
        </Badge>;
      case 'queued':
        return <Badge className="bg-blue-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
          <Clock className="w-3 h-3" />
          In Queue
        </Badge>;
      case 'completed':
        return <Badge className="bg-gray-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>;
      case 'skipped':
        return <Badge className="bg-orange-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
          <SkipForward className="w-3 h-3" />
          Skipped
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
          <X className="w-3 h-3" />
          Cancelled
        </Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <KaraokeLayout title="Discover" currentPage="discover">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <DiscoverPage isPremium={subscriptionTier !== 'free'} />
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-2 sm:pb-4 lg:pb-8">
          {/* Header - Reused pattern from crowd-requests */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Mic className="w-6 h-6" />
                Karaoke Queue
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage karaoke signups and queue order
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => organization && loadSignups(organization.id)}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQRGenerator(true)}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Karaoke QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisplaySetup(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                TV Display
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Queue Summary Header */}
          {queue.length > 0 || currentSinger ? (
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-white shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">Queue Summary</h2>
                  <p className="text-purple-100 text-sm sm:text-base">
                    {queue.length} in queue • {currentSinger ? '1 singing' : 'No one singing'} • 
                    {queue.length > 0 && ` ~${Math.ceil(queue.length * 3.5)} min total wait`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-purple-100">Total Signups</p>
                    <p className="text-2xl sm:text-3xl font-bold">{signups.length}</p>
                  </div>
                  {queue.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-purple-100">Queue Health</p>
                      <Badge className={`${
                        getQueueHealth(queue.length).color === 'green' ? 'bg-green-500' :
                        getQueueHealth(queue.length).color === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      } text-white font-semibold`}>
                        {getQueueHealth(queue.length).label}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Stats Cards - Reused pattern from crowd-requests */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Signups</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{signups.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">In Queue</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{queue.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Currently Singing</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{currentSinger ? 1 : 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs sm:text-sm text-gray-400">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400">
                {signups.filter(s => s.status === 'completed').length}
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Info className="w-4 h-4" />
              <span className="font-semibold">Keyboard Shortcuts:</span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-700 text-xs font-mono">Space</kbd>
              <span>Advance</span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-700 text-xs font-mono">N</kbd>
              <span>Next</span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-700 text-xs font-mono">C</kbd>
              <span>Complete</span>
            </div>
          </div>

          {/* Event Selector - Prominent */}
          {availableEvents.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Current Event
                  </label>
                  <select
                    value={eventCodeFilter || ''}
                    onChange={(e) => {
                      setEventCodeFilter(e.target.value);
                      if (e.target.value && organization) {
                        loadSignups(organization.id);
                      }
                    }}
                    className="w-full sm:w-auto min-w-[200px] px-4 py-2 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
                  >
                    <option value="">All Events</option>
                    {availableEvents.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
                {eventCodeFilter && (
                  <Button
                    variant="outline"
                    onClick={() => setShowDisplaySetup(true)}
                    className="border-blue-500 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    TV Display
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </Button>
            {eventCodeFilter ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEventCodeFilter('');
                  if (organization) {
                    loadSignups(organization.id);
                  }
                }}
                className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
              >
                <X className="w-3 h-3 mr-1" />
                Clear Event
              </Button>
            ) : null}
          </div>

          {/* Filters - Reused pattern from crowd-requests */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 sm:mb-6 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, song, phone..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="active">Active (Queue + Next + Singing)</option>
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="queued">Queued Only</option>
                  <option value="next">Next Up</option>
                  <option value="singing">Currently Singing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Code
                </label>
                <select
                  value={eventCodeFilter}
                  onChange={(e) => setEventCodeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Events</option>
                  {availableEvents.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Auto-refresh every 5 seconds
              </label>
            </div>
          </div>

          {/* Current Singer - Enhanced with better visual hierarchy */}
          {currentSinger && (
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 sm:p-8 mb-4 sm:mb-6 shadow-lg border-4 border-green-400">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white">NOW SINGING</h3>
                      {currentSinger.started_at && (
                        <p className="text-green-100 text-sm sm:text-base">
                          Started {Math.floor((Date.now() - new Date(currentSinger.started_at).getTime()) / 60000)} min ago
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                    {formatGroupDisplayName(
                      currentSinger.singer_name,
                      currentSinger.group_members,
                      currentSinger.group_size
                    )}
                  </p>
                  {currentSinger.group_size > 1 && (
                    <p className="text-lg text-green-100 mb-3 font-semibold">
                      {getGroupLabel(currentSinger.group_size)}
                    </p>
                  )}
                  <p className="text-xl sm:text-2xl text-green-100 mb-1">
                    <Music className="w-5 h-5 inline mr-2" />
                    "{currentSinger.song_title}"
                    {currentSinger.song_artist && ` by ${currentSinger.song_artist}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                  <Button
                    size="lg"
                    onClick={() => updateStatus(currentSinger.id, 'completed')}
                    className="bg-white text-green-700 hover:bg-green-50 font-bold px-6 w-full sm:w-auto"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => updateStatus(currentSinger.id, 'skipped')}
                    className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Next Up - Enhanced */}
          {nextSinger && (
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-5 sm:p-6 mb-4 sm:mb-6 shadow-lg border-4 border-yellow-300">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <ArrowUp className="w-8 h-8 flex-shrink-0 text-white" />
                    <h3 className="text-xl sm:text-2xl font-bold text-white">NEXT UP</h3>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
                    {formatGroupDisplayName(
                      nextSinger.singer_name,
                      nextSinger.group_members,
                      nextSinger.group_size
                    )}
                  </p>
                  {nextSinger.group_size > 1 && (
                    <p className="text-base text-yellow-100 mb-2 font-semibold">
                      {getGroupLabel(nextSinger.group_size)}
                    </p>
                  )}
                  <p className="text-lg sm:text-xl text-yellow-100">
                    <Music className="w-5 h-5 inline mr-2" />
                    "{nextSinger.song_title}"
                    {nextSinger.song_artist && ` by ${nextSinger.song_artist}`}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => updateStatus(nextSinger.id, 'singing')}
                  className="bg-white text-yellow-700 hover:bg-yellow-50 font-bold px-6 flex-shrink-0 w-full sm:w-auto"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Now
                </Button>
              </div>
            </div>
          )}

          {/* Queue List - Reused card pattern from crowd-requests */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Queue ({queue.length})
              </h2>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : queue.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <Mic className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No one in queue
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Generate a QR code to start receiving karaoke signups
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button onClick={() => setShowQRGenerator(true)}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate Signup QR Code
                  </Button>
                  <Button variant="outline" onClick={() => setShowDisplaySetup(true)}>
                    <Monitor className="w-4 h-4 mr-2" />
                    Set Up TV Display
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {queue.map((signup) => {
                  const queuePosition = calculateQueuePosition(signup, filteredSignups);
                  const estimatedWait = calculateEstimatedWait(signup, filteredSignups);
                  return (
                    <div
                      key={signup.id}
                      className="group p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedSignup(signup);
                        setShowDetailModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Mic className={`w-6 h-6 flex-shrink-0 ${signup.is_priority ? 'text-orange-500' : 'text-purple-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                                #{queuePosition}
                              </span>
                              {getStatusBadge(signup.status)}
                              {signup.is_priority && (
                                <Badge className="bg-orange-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
                                  <Zap className="w-3 h-3" />
                                  Priority
                                </Badge>
                              )}
                              {signup.group_size > 1 && (
                                <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                                  <Users className="w-3 h-3" />
                                  {getGroupLabel(signup.group_size)}
                                </Badge>
                              )}
                              {/* Video Status Badge */}
                              {signup.video_data ? (
                                <>
                                  <Badge className={`flex items-center gap-1 px-2 py-0.5 text-xs font-semibold ${
                                    signup.video_data.link_status === 'active' ? 'bg-green-500 text-white' :
                                    signup.video_data.link_status === 'broken' ? 'bg-red-500 text-white' :
                                    'bg-yellow-500 text-white'
                                  }`}>
                                    <Music className="w-3 h-3" />
                                    Video {signup.video_data.video_quality_score ? `${signup.video_data.video_quality_score}%` : ''}
                                  </Badge>
                                  {isKarafunVideo(signup.video_data.youtube_channel_name, signup.video_data.youtube_channel_id) && (
                                    <Badge className="bg-purple-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
                                      <Music className="w-3 h-3" />
                                      Karafun
                                    </Badge>
                                  )}
                                </>
                              ) : signup.video_id ? (
                                <Badge className="bg-blue-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
                                  <Music className="w-3 h-3" />
                                  Video Linked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500">
                                  <Music className="w-3 h-3" />
                                  No Video
                                </Badge>
                              )}
                              {estimatedWait > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatEstimatedWait(estimatedWait)}
                                </Badge>
                              )}
                            </div>
                            <p className="font-bold text-gray-900 dark:text-white text-base mb-1">
                              {formatGroupDisplayName(
                                signup.singer_name,
                                signup.group_members,
                                signup.group_size
                              )}
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 mb-1">
                              <Music className="w-4 h-4 inline mr-1" />
                              "{signup.song_title}"
                              {signup.song_artist && ` by ${signup.song_artist}`}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2 flex-wrap">
                              {signup.singer_phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {signup.singer_phone}
                                </span>
                              )}
                              {signup.singer_email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {signup.singer_email}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(signup.created_at).toLocaleString()}
                              </span>
                            </div>
                            {signup.next_up_notification_sent && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                SMS notification sent
                              </p>
                            )}
                            {signup.sms_notification_error && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                SMS failed: {signup.sms_notification_error}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Video Action Buttons - Always visible if video available */}
                          <div className="flex items-center gap-1 mr-2">
                            {(() => {
                              const videoData = signup.video_data;
                              return videoData?.youtube_video_id ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`https://www.youtube.com/watch?v=${videoData.youtube_video_id}`, '_blank');
                                    }}
                                    className="h-8 px-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
                                    title="Open video on YouTube"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`/karaoke/video-display?videoId=${videoData.youtube_video_id}&title=${encodeURIComponent(signup.song_title)}&artist=${encodeURIComponent(signup.song_artist || '')}`, 'karaokeVideoDisplay', 'width=1280,height=720,scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no,location=no,directories=no');
                                    }}
                                    className="h-8 px-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                                    title="Open in display window"
                                  >
                                    <Monitor className="w-3 h-3" />
                                  </Button>
                                </>
                              ) : null;
                            })()}
                            {!signup.video_id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open videos tab in settings
                                  setShowSettings(true);
                                  setSettingsTab('videos');
                                }}
                                className="h-8 px-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 hover:text-orange-800"
                                title="Link video in settings"
                              >
                                <Music className="w-3 h-3" />
                              </Button>
                            )}
                          </div>

                          {/* Quick Action Buttons - Visible on hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {signup.status === 'queued' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(signup.id, 'next');
                                }}
                                className="h-8 px-2"
                                title="Mark as Next"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                            )}
                            {signup.status === 'next' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(signup.id, 'singing');
                                }}
                                className="h-8 px-2 bg-yellow-600 hover:bg-yellow-700"
                                title="Start Now"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            {signup.status === 'singing' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatus(signup.id, 'completed');
                                }}
                                className="h-8 px-2 bg-green-600 hover:bg-green-700"
                                title="Mark Complete"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(signup.id, 'next');
                              }}>
                                <ArrowUp className="w-4 h-4 mr-2" />
                                Mark as Next
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(signup.id, 'singing');
                              }}>
                                <Play className="w-4 h-4 mr-2" />
                                Start Now
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                reorderQueue(signup.id, signup.priority_order - 100);
                              }}>
                                <ArrowUp className="w-4 h-4 mr-2" />
                                Move Up
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                reorderQueue(signup.id, signup.priority_order + 100);
                              }}>
                                <ArrowDown className="w-4 h-4 mr-2" />
                                Move Down
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedSignup(signup);
                                setShowDetailModal(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(signup.id, 'skipped');
                              }}>
                                <SkipForward className="w-4 h-4 mr-2" />
                                Skip
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSignup(signup.id);
                                }}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auto-search for video suggestions when signup is viewed */}
          {useEffect(() => {
            if (selectedSignup && selectedSignup.song_title && !selectedSignup.video_data && showDetailModal) {
              searchVideoSuggestionsForSignup(selectedSignup);
            }
          }, [selectedSignup, showDetailModal])}

          {/* Detail Modal - Reused pattern from crowd-requests */}
          <Dialog open={showDetailModal} onOpenChange={(open) => {
            setShowDetailModal(open);
            if (!open) {
              setModalVideoPlaying(false); // Reset video state when modal closes
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Signup Details</DialogTitle>
              </DialogHeader>
              {selectedSignup && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Singer/Group</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatGroupDisplayName(
                        selectedSignup.singer_name,
                        selectedSignup.group_members,
                        selectedSignup.group_size
                      )}
                    </p>
                    {selectedSignup.group_size > 1 && selectedSignup.group_members && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Group Members:</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                          {selectedSignup.group_members.map((member, i) => (
                            <li key={i}>{member}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Song</label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      "{selectedSignup.song_title}"
                    </p>
                    {selectedSignup.song_artist && (
                      <p className="text-gray-700 dark:text-gray-300">by {selectedSignup.song_artist}</p>
                    )}
                  </div>

                  {/* Karaoke Video Search */}
                  {selectedSignup.song_title && (
                    <div className="mt-6">
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 block">
                        Karaoke Videos
                      </label>

                      {/* Show current video if already linked */}
                      {selectedSignup.video_data ? (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://img.youtube.com/vi/${selectedSignup.video_data.youtube_video_id}/default.jpg`}
                              alt="Current video"
                              className="w-16 h-12 rounded object-cover border-2 border-green-300"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {selectedSignup.video_data.youtube_video_title || 'Linked Video'}
                                </h4>
                                {isKarafunVideo(selectedSignup.video_data.youtube_channel_name, selectedSignup.video_data.youtube_channel_id) && (
                                  <Badge className="bg-purple-500 text-white text-xs">
                                    <Music className="w-3 h-3 mr-1" />
                                    Karafun
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedSignup.video_data.youtube_channel_name} • Quality: {selectedSignup.video_data.video_quality_score}/100
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.open(
                                  `https://www.youtube.com/watch?v=${selectedSignup.video_data.youtube_video_id}`,
                                  '_blank',
                                  'noopener,noreferrer'
                                );
                              }}
                              className="border-green-300 hover:bg-green-50"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Play Video
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Show suggested video or search option */
                        <div className="space-y-3">
                          {/* Automatic video suggestion */}
                          {loadingVideoSuggestions[selectedSignup.id] ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                              <div className="animate-pulse flex items-center gap-4">
                                <div className="w-16 h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Finding the best karaoke video...
                              </p>
                            </div>
                          ) : signupVideoSuggestions[selectedSignup.id] ? (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-start gap-4">
                                {/* Video Thumbnail */}
                                <img
                                  src={`https://img.youtube.com/vi/${signupVideoSuggestions[selectedSignup.id].id}/mqdefault.jpg`}
                                  alt="Suggested karaoke video"
                                  className="w-24 h-18 rounded-lg object-cover border-2 border-blue-300"
                                />

                                {/* Video Details */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                      {signupVideoSuggestions[selectedSignup.id].title}
                                    </h4>
                                    {isKarafunVideo(
                                      signupVideoSuggestions[selectedSignup.id].channelTitle,
                                      signupVideoSuggestions[selectedSignup.id].channelId
                                    ) && (
                                      <Badge className="bg-purple-500 text-white text-xs">
                                        <Music className="w-3 h-3 mr-1" />
                                        Karafun
                                      </Badge>
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    {signupVideoSuggestions[selectedSignup.id].channelTitle} •
                                    {signupVideoSuggestions[selectedSignup.id].viewCount?.toLocaleString()} views
                                  </p>

                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-xs">
                                      Quality: {signupVideoSuggestions[selectedSignup.id].karaokeScore}/100
                                    </Badge>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const video = signupVideoSuggestions[selectedSignup.id];
                                        window.open(
                                          `https://www.youtube.com/watch?v=${video.id}`,
                                          '_blank',
                                          'noopener,noreferrer'
                                        );
                                      }}
                                      className="border-gray-300 hover:bg-gray-50"
                                    >
                                      <Play className="w-4 h-4 mr-1" />
                                      Play Video
                                    </Button>

                                    <Button
                                      size="sm"
                                      onClick={() => linkSuggestedVideoToSignup(selectedSignup.id, signupVideoSuggestions[selectedSignup.id])}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Use This Video
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Manual search option */
                            <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Music className="w-4 h-4 text-pink-600" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    No automatic video found
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setShowVideoSearchForSignup(true);
                                    setVideoSearchSignup(selectedSignup);
                                  }}
                                  className="bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                  <Search className="w-4 h-4 mr-1" />
                                  Search YouTube
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Search manually for karaoke videos on YouTube. Karafun videos are prioritized.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video Information */}
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Video Status</label>
                    <div className="mt-2 space-y-2">
                      {selectedSignup.video_data ? (
                        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div className="flex-1">
                            <p className="font-medium text-green-900 dark:text-green-100">Video Linked</p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Quality: {selectedSignup.video_data.video_quality_score}/100 •
                              Status: {selectedSignup.video_data.link_status}
                              {isKarafunVideo(selectedSignup.video_data.youtube_channel_name, selectedSignup.video_data.youtube_channel_id) && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs rounded">
                                  Karafun
                                </span>
                              )}
                            </p>
                            {selectedSignup.video_data.youtube_channel_name && (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Channel: {selectedSignup.video_data.youtube_channel_name}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedSignup.video_data!.youtube_video_id}`, '_blank')}
                              className="text-green-700 border-green-300 hover:bg-green-100"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/karaoke/video-display?videoId=${selectedSignup.video_data!.youtube_video_id}&title=${encodeURIComponent(selectedSignup.song_title)}&artist=${encodeURIComponent(selectedSignup.song_artist || '')}`, 'karaokeVideoDisplay', 'width=1280,height=720,scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no,location=no,directories=no')}
                              className="text-green-700 border-green-300 hover:bg-green-100"
                            >
                              <Monitor className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : selectedSignup.video_id ? (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <Music className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div className="flex-1">
                            <p className="font-medium text-blue-900 dark:text-blue-100">Video Linked</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Video is linked but details not loaded
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                          <Music className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">No Video Linked</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Link a YouTube video in the Videos tab
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowSettings(true);
                              setSettingsTab('videos');
                              setShowDetailModal(false);
                            }}
                            className="text-gray-700 border-gray-300 hover:bg-gray-100"
                          >
                            Link Video
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Video Embed Player */}
                    {selectedSignup.video_data?.youtube_video_id && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Video Preview
                          </label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setModalVideoPlaying(!modalVideoPlaying)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {modalVideoPlaying ? (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Play
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="aspect-video w-full max-w-2xl mx-auto bg-black rounded-lg overflow-hidden">
                          <YouTubePlayer
                            videoId={selectedSignup.video_data.youtube_video_id}
                            isPlaying={modalVideoPlaying}
                            onStateChange={(state) => {
                              if (state === 'ended') {
                                setModalVideoPlaying(false);
                              }
                            }}
                            showControls={true}
                            autoPlay={false}
                            volume={30} // Lower volume for modal preview
                            className="w-full h-full"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Quality: {selectedSignup.video_data.video_quality_score}/100</span>
                          {selectedSignup.video_data.youtube_channel_name && (
                            <span>Channel: {selectedSignup.video_data.youtube_channel_name}</span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/karaoke/video-display?videoId=${selectedSignup.video_data!.youtube_video_id}&title=${encodeURIComponent(selectedSignup.song_title)}&artist=${encodeURIComponent(selectedSignup.song_artist || '')}`, 'karaokeVideoDisplay', 'width=1280,height=720,scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no,location=no,directories=no')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Monitor className="w-4 h-4 mr-1" />
                            Open in Display Window
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedSignup.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Queue Position</label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        #{calculateQueuePosition(selectedSignup, filteredSignups)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white">{selectedSignup.singer_phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white">{selectedSignup.singer_email || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Event Code</label>
                    <p className="text-gray-900 dark:text-white">{selectedSignup.event_qr_code || 'N/A'}</p>
                  </div>
                  {selectedSignup.admin_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Admin Notes</label>
                      <p className="text-gray-900 dark:text-white">{selectedSignup.admin_notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        if (selectedSignup.status === 'queued') {
                          updateStatus(selectedSignup.id, 'next');
                        } else if (selectedSignup.status === 'next') {
                          updateStatus(selectedSignup.id, 'singing');
                        } else if (selectedSignup.status === 'singing') {
                          updateStatus(selectedSignup.id, 'completed');
                        }
                        setShowDetailModal(false);
                      }}
                    >
                      {selectedSignup.status === 'queued' && 'Mark as Next'}
                      {selectedSignup.status === 'next' && 'Start Now'}
                      {selectedSignup.status === 'singing' && 'Mark Complete'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* QR Generator Modal - Reused from crowd-requests */}
          <Dialog open={showQRGenerator} onOpenChange={setShowQRGenerator}>
            <DialogContent className="max-w-lg w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate Karaoke QR Code</DialogTitle>
                <DialogDescription>
                  Create a QR code for karaoke signups - works for all events or specific events
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Signup Type
                  </label>
                  <select
                    value={qrEventCode || 'general'}
                    onChange={(e) => setQrEventCode(e.target.value === 'general' ? '' : e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="general">General Karaoke (All Events)</option>
                    <option value="">Specific Event (enter code below)</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    General QR codes work for any karaoke event. Event-specific codes are tied to one event.
                  </p>
                </div>
                {qrEventCode !== '' && qrEventCode !== 'general' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Code
                    </label>
                    <Input
                      value={qrEventCode}
                      onChange={(e) => setQrEventCode(e.target.value)}
                      placeholder="wedding-2025-01-15"
                      className="text-base"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Name (Optional)
                  </label>
                  <Input
                    value={qrEventName}
                    onChange={(e) => setQrEventName(e.target.value)}
                    placeholder="Sarah & Michael's Wedding"
                    className="text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={qrEventDate}
                    onChange={(e) => setQrEventDate(e.target.value)}
                    className="text-base"
                  />
                </div>
                <Button onClick={generateQRCode} className="w-full min-h-[48px] text-base font-semibold">
                  Generate QR Code
                </Button>
                {generatedQR && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex justify-center px-2 sm:px-4">
                      <div className="hidden sm:block">
                        <DecoratedQRCode
                          qrCodeUrl={generatedQR}
                          size={180}
                        />
                      </div>
                      <div className="block sm:hidden">
                        <DecoratedQRCode
                          qrCodeUrl={generatedQR}
                          size={140}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Input
                        readOnly
                        value={generatedSignupUrl || ''}
                        className="w-full text-sm sm:text-base px-3 py-2 min-h-[44px]"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedSignupUrl || '');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="w-full min-h-[44px] text-base"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* TV Display Setup Modal */}
          <Dialog open={showDisplaySetup} onOpenChange={setShowDisplaySetup}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  TV Display Setup
                </DialogTitle>
                <DialogDescription>
                  Generate and share the public display screen for your karaoke queue
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Display Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Type
                  </label>
                  <select
                    value={eventCodeFilter || 'all'}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'all') {
                        setEventCodeFilter('');
                        generateDisplayURL(); // No event code = all events
                      } else {
                        setEventCodeFilter(value);
                        generateDisplayURL(value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Events (Organization-wide)</option>
                    {availableEvents.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Organization-wide display shows karaoke from all events. Event-specific display shows only that event's karaoke.
                  </p>
                </div>

                {/* Display URL */}
                {displayUrl && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Display URL
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={displayUrl}
                          className="flex-1 font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(displayUrl);
                            setDisplayCopied(true);
                            setTimeout(() => setDisplayCopied(false), 2000);
                            toast({
                              title: 'Copied!',
                              description: 'Display URL copied to clipboard',
                            });
                          }}
                        >
                          {displayCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(displayUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* QR Code */}
                    {displayQR && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          QR Code (Scan to open on TV)
                        </label>
                        <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <img
                            src={displayQR}
                            alt="Display QR Code"
                            className="w-64 h-64 border-4 border-white dark:border-gray-700 rounded-lg shadow-lg"
                          />
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Scan this QR code with a TV or tablet to open the display screen
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Setup Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            How to Set Up on a TV
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                            <li>
                              <strong>Option 1 - Smart TV Browser:</strong> Open the browser on your smart TV, scan the QR code or enter the URL manually
                            </li>
                            <li>
                              <strong>Option 2 - Streaming Device:</strong> Use a Chromecast, Apple TV, or Fire TV Stick. Open the URL in a browser app and cast to the TV
                            </li>
                            <li>
                              <strong>Option 3 - Tablet/Phone:</strong> Open the URL on a tablet or phone, then use screen mirroring to display on TV
                            </li>
                            <li>
                              <strong>Option 4 - Laptop/Computer:</strong> Connect a laptop to the TV via HDMI and open the URL in fullscreen mode (F11)
                            </li>
                            <li>
                              <strong>Pro Tip:</strong> Set the browser to fullscreen mode and disable sleep/auto-lock. The page auto-refreshes every 3 seconds.
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          window.open(displayUrl, '_blank');
                        }}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Display
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(displayUrl);
                          setDisplayCopied(true);
                          setTimeout(() => setDisplayCopied(false), 2000);
                          toast({
                            title: 'Copied!',
                            description: 'Display URL copied to clipboard',
                          });
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                )}

                {!displayUrl && eventCodeFilter && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an event code above to generate the display URL</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Settings Modal - Comprehensive karaoke settings */}
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 overflow-hidden flex flex-col bg-gradient-to-br from-white to-cyan-50 dark:from-gray-900 dark:to-cyan-950">
              {/* Premium Header */}
              <DialogHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 px-8 py-6 border-b border-cyan-400/20 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-white mb-1">
                        Karaoke Settings
                      </DialogTitle>
                      <p className="text-cyan-100 text-sm">
                        Customize your karaoke experience
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={saveSettings}
                      disabled={savingSettings}
                      className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowSettings(false)}
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Close
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* Tabbed Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8">
                {settings && (
                  <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-7 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                      <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">General</span>
                      </TabsTrigger>
                      <TabsTrigger value="operational" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <User className="w-4 h-4" />
                        <span className="hidden sm:inline">Operations</span>
                      </TabsTrigger>
                      <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline">Pricing</span>
                      </TabsTrigger>
                      <TabsTrigger value="rotation" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Rotation</span>
                      </TabsTrigger>
                      <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Appearance</span>
                      </TabsTrigger>
                      <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Content</span>
                      </TabsTrigger>
                      <TabsTrigger value="videos" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <Music className="w-4 h-4" />
                        <span className="hidden sm:inline">Videos</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-6 mt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Settings</h3>
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                            <div>
                              <label className="text-sm font-medium text-gray-900 dark:text-white">
                                Enable Karaoke Mode
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Allow customers to sign up for karaoke sessions
                              </p>
                            </div>
                            <Switch
                              checked={settings.karaoke_enabled}
                              onCheckedChange={async (checked) => {
                                const { error } = await (supabase
                                  .from('karaoke_settings') as any)
                                  .update({ karaoke_enabled: checked })
                                  .eq('organization_id', organization.id);
                                if (!error) {
                                  setSettings({ ...settings, karaoke_enabled: checked });
                                }
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                            <div>
                              <label className="text-sm font-medium text-gray-900 dark:text-white">
                                Auto-Advance Queue
                              </label>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Automatically move to next singer when current finishes
                              </p>
                            </div>
                            <Switch
                        checked={settings.auto_advance}
                        onCheckedChange={async (checked) => {
                          const { error } = await (supabase
                            .from('karaoke_settings') as any)
                            .update({ auto_advance: checked })
                            .eq('organization_id', organization.id);
                          if (!error) {
                            setSettings({ ...settings, auto_advance: checked });
                          }
                        }}
                      />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="operational" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Operational Settings</h3>
                      <div className="grid gap-4">
                        <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Maximum Concurrent Singers
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Maximum number of singers allowed at the same time
                          </p>
                          <Input
                            type="number"
                            min="1"
                            max="50"
                            value={operationalSettings.maxConcurrentSingers}
                            onChange={(e) => setOperationalSettings(prev => ({
                              ...prev,
                              maxConcurrentSingers: parseInt(e.target.value) || 10
                            }))}
                            className="w-full h-10"
                            placeholder="10"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              SMS Notifications
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Enable SMS notifications for queue updates and phone field collection
                            </p>
                          </div>
                          <Switch
                            checked={operationalSettings.smsNotificationsEnabled}
                            onCheckedChange={(checked) => setOperationalSettings(prev => ({
                              ...prev,
                              smsNotificationsEnabled: checked
                            }))}
                          />
                        </div>

                        <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Phone Number Field
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            Control how the phone number field appears to customers
                          </p>
                          <div className="space-y-2">
                            {[
                              { value: 'required', label: 'Required', desc: 'Must provide phone number to sign up' },
                              { value: 'optional', label: 'Optional', desc: 'Can sign up with or without phone' },
                              { value: 'hidden', label: 'Hidden', desc: 'Phone field not shown at all' }
                            ].map((option) => (
                              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="phoneFieldMode"
                                  value={option.value}
                                  checked={operationalSettings.phoneFieldMode === option.value}
                                  onChange={(e) => setOperationalSettings(prev => ({
                                    ...prev,
                                    phoneFieldMode: e.target.value as 'required' | 'optional' | 'hidden'
                                  }))}
                                  className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 focus:ring-cyan-500 dark:focus:ring-cyan-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {option.desc}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          Priority Pricing
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Allow singers to pay to skip the queue
                        </p>
                      </div>
                      <Switch
                        checked={settings.priority_pricing_enabled}
                        onCheckedChange={async (checked) => {
                          const { error } = await (supabase
                            .from('karaoke_settings') as any)
                            .update({ priority_pricing_enabled: checked })
                            .eq('organization_id', organization.id);
                          if (!error) {
                            setSettings({ ...settings, priority_pricing_enabled: checked });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Priority Fee
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={(settings.priority_fee_cents / 100).toFixed(2)}
                          onChange={async (e) => {
                            const dollars = parseFloat(e.target.value) || 0;
                            const { error } = await (supabase
                              .from('karaoke_settings') as any)
                              .update({ priority_fee_cents: Math.round(dollars * 100) })
                              .eq('organization_id', organization.id);
                            if (!error) {
                              setSettings({ ...settings, priority_fee_cents: Math.round(dollars * 100) });
                            }
                          }}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="rotation" className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                          Rotation System
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Prevent same singer from going twice in a row
                        </p>
                      </div>
                      <Switch
                        checked={settings.rotation_enabled}
                        onCheckedChange={async (checked) => {
                          const { error } = await (supabase
                            .from('karaoke_settings') as any)
                            .update({ rotation_enabled: checked })
                            .eq('organization_id', organization.id);
                          if (!error) {
                            setSettings({ ...settings, rotation_enabled: checked });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Max Singers Before Repeat
                      </label>
                      <Input
                        type="number"
                        value={settings.max_singers_before_repeat}
                        onChange={async (e) => {
                          const value = parseInt(e.target.value) || 3;
                          const { error } = await (supabase
                            .from('karaoke_settings') as any)
                            .update({ max_singers_before_repeat: value })
                            .eq('organization_id', organization.id);
                          if (!error) {
                            setSettings({ ...settings, max_singers_before_repeat: value });
                          }
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="appearance" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Display Options</h3>
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              Show Welcome Message
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Display welcome text on the karaoke page
                            </p>
                          </div>
                          <Switch
                            checked={displaySettings.showWelcomeMessage}
                            onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, showWelcomeMessage: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              Show Current Singer
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Display who's currently singing
                            </p>
                          </div>
                          <Switch
                            checked={displaySettings.showCurrentSinger}
                            onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, showCurrentSinger: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              Show Queue Preview
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Show upcoming singers in queue
                            </p>
                          </div>
                          <Switch
                            checked={displaySettings.showQueuePreview}
                            onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, showQueuePreview: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              Show Estimated Wait
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Display estimated wait times
                            </p>
                          </div>
                          <Switch
                            checked={displaySettings.showEstimatedWait}
                            onCheckedChange={(checked) => setDisplaySettings(prev => ({ ...prev, showEstimatedWait: checked }))}
                          />
                        </div>

                        <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Theme
                          </label>
                          <select
                            value={displaySettings.theme}
                            onChange={(e) => setDisplaySettings(prev => ({ ...prev, theme: e.target.value }))}
                            className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                          >
                            <option value="default">Default</option>
                            <option value="dark">Dark</option>
                            <option value="colorful">Colorful</option>
                            <option value="minimal">Minimal</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-6 mt-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Page Content</h3>
                        <div className="grid gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Page Title
                            </label>
                            <Input
                              value={pageSettings.pageTitle}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, pageTitle: e.target.value }))}
                              placeholder="Karaoke Sign-Up"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Page Description
                            </label>
                            <Input
                              value={pageSettings.pageDescription}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, pageDescription: e.target.value }))}
                              placeholder="Sign up for karaoke and join the fun!"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Main Heading
                            </label>
                            <Input
                              value={pageSettings.mainHeading}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, mainHeading: e.target.value }))}
                              placeholder="Karaoke Time!"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Messages</h3>
                        <div className="grid gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Welcome Message
                            </label>
                            <Input
                              value={pageSettings.welcomeMessage}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                              placeholder="Welcome to karaoke night!"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Signup Success Message
                            </label>
                            <Input
                              value={pageSettings.signupSuccessMessage}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, signupSuccessMessage: e.target.value }))}
                              placeholder="You're all signed up!"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Queue Position Message
                            </label>
                            <Input
                              value={pageSettings.queuePositionMessage}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, queuePositionMessage: e.target.value }))}
                              placeholder="You're #{position} in line"
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Estimated Wait Message
                            </label>
                            <Input
                              value={pageSettings.estimatedWaitMessage}
                              onChange={(e) => setPageSettings(prev => ({ ...prev, estimatedWaitMessage: e.target.value }))}
                              placeholder="About {time} wait time"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="videos" className="mt-6">
                    {organization && (
                      <VideoManager organizationId={organization.id} />
                    )}
                  </TabsContent>
                </Tabs>
              )}
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          {organization && (
            <VideoManager organizationId={organization.id} />
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Settings content will go here */}
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Settings</h3>
            <p className="text-gray-500">Karaoke settings and preferences will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Video Search Modal for Karaoke Signups */}
      <Dialog open={showVideoSearchForSignup} onOpenChange={setShowVideoSearchForSignup}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-pink-600" />
              Find Karaoke Video for "{videoSearchSignup?.song_title}"
            </DialogTitle>
            <DialogDescription>
              Search YouTube for karaoke videos. Karafun videos are automatically prioritized.
            </DialogDescription>
          </DialogHeader>

          {videoSearchSignup && (
            <VideoManager
              organizationId={organization?.id || ''}
              preSearchQuery={`${videoSearchSignup.song_title}${videoSearchSignup.song_artist ? ` ${videoSearchSignup.song_artist}` : ''}`}
              mode="signup-link"
              signupToLink={videoSearchSignup}
              onVideoLinked={(signupId, videoData) => {
                // Update the signup in the local state
                setSignups(prev => prev.map(signup =>
                  signup.id === signupId
                    ? { ...signup, video_id: videoData.id, video_data: videoData }
                    : signup
                ));

                // Update selected signup if it's the current one
                if (selectedSignup && selectedSignup.id === signupId) {
                  setSelectedSignup(prev => prev ? {
                    ...prev,
                    video_id: videoData.id,
                    video_data: videoData
                  } : null);
                }

                setShowVideoSearchForSignup(false);
                setVideoSearchSignup(null);

                toast({
                  title: 'Video Linked',
                  description: 'Karaoke video has been linked to this signup',
                });
              }}
              onClose={() => {
                setShowVideoSearchForSignup(false);
                setVideoSearchSignup(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </KaraokeLayout>
  );
}
