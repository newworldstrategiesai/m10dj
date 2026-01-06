'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminPageLayout from '@/components/layouts/AdminPageLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Image as ImageIcon, 
  Save, 
  Loader2, 
  CheckCircle, 
  ExternalLink, 
  Plus, 
  Trash2,
  Upload,
  X,
  Eye,
  Globe,
  Music,
  Settings,
  ArrowUp,
  ArrowDown,
  Type,
  ToggleLeft,
  Search,
  FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ImageUploadInput from '@/components/admin/ImageUploadInput';
import Link from 'next/link';

interface SocialLink {
  platform: string;
  url: string;
  label: string;
  enabled: boolean;
  order: number;
}

const SUPPORTED_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'snapchat', label: 'Snapchat', icon: '👻' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' },
  { value: 'custom', label: 'Custom Link', icon: '🔗' },
];

export default function RequestsPageSettings() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cover' | 'social' | 'bidding' | 'header' | 'labels' | 'features' | 'seo'>('cover');
  const [biddingEnabled, setBiddingEnabled] = useState(false);
  const [minimumBid, setMinimumBid] = useState(500); // In cents
  const [startingBid, setStartingBid] = useState(500); // In cents - default starting bid (never $0)
  
  const [coverPhotos, setCoverPhotos] = useState({
    requests_cover_photo_url: '',
    requests_artist_photo_url: '',
    requests_venue_photo_url: '',
    requests_header_video_url: ''
  });
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  
  // Header fields
  const [headerFields, setHeaderFields] = useState({
    requests_header_artist_name: '',
    requests_header_location: '',
    requests_header_date: '',
    requests_main_heading: ''
  });
  
  // Label and text fields
  const [labelFields, setLabelFields] = useState({
    requests_song_request_label: '',
    requests_shoutout_label: '',
    requests_song_title_label: '',
    requests_song_title_placeholder: '',
    requests_artist_name_label: '',
    requests_artist_name_placeholder: '',
    requests_recipient_name_label: '',
    requests_recipient_name_placeholder: '',
    requests_message_label: '',
    requests_message_placeholder: '',
    requests_music_link_label: '',
    requests_music_link_placeholder: '',
    requests_music_link_help_text: '',
    requests_manual_entry_divider: '',
    requests_start_over_text: '',
    requests_audio_upload_label: '',
    requests_audio_upload_description: '',
    requests_artist_rights_text: '',
    requests_is_artist_text: '',
    requests_audio_fee_text: '',
    requests_submit_button_text: '',
    requests_step_1_text: '',
    requests_step_2_text: ''
  });
  
  // Feature toggles
  const [featureToggles, setFeatureToggles] = useState({
    requests_show_audio_upload: true,
    requests_show_fast_track: true,
    requests_show_next_song: true,
    requests_show_bundle_discount: true
  });
  
  // SEO fields
  const [seoFields, setSeoFields] = useState({
    requests_page_title: '',
    requests_page_description: '',
    requests_default_request_type: 'song_request' as 'song_request' | 'shoutout'
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  // Handle tab from URL query parameter
  useEffect(() => {
    const { tab } = router.query;
    if (tab === 'social' || tab === 'cover' || tab === 'bidding' || tab === 'header' || tab === 'labels' || tab === 'features' || tab === 'seo') {
      setActiveTab(tab as any);
    }
  }, [router.query]);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/signin');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/signin');
    }
  };

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (orgError && orgError.code !== 'PGRST116') {
        console.error('Error fetching organization:', orgError);
        setError('Failed to load organization');
        return;
      }

      if (org) {
        setOrganization(org);
        setCoverPhotos({
          requests_cover_photo_url: org.requests_cover_photo_url || '',
          requests_artist_photo_url: org.requests_artist_photo_url || '',
          requests_venue_photo_url: org.requests_venue_photo_url || '',
          requests_header_video_url: org.requests_header_video_url || ''
        });
        
        // Parse social links
        const links = org.social_links && Array.isArray(org.social_links) 
          ? org.social_links as SocialLink[]
          : [];
        setSocialLinks(links.sort((a, b) => (a.order || 0) - (b.order || 0)));
        
        // Set bidding settings
        setBiddingEnabled(org.requests_bidding_enabled || false);
        setMinimumBid(org.requests_bidding_minimum_bid || 500);
        setStartingBid(org.requests_bidding_starting_bid || 500); // Default to $5.00 if not set
        
        // Set header fields
        setHeaderFields({
          requests_header_artist_name: org.requests_header_artist_name || org.name || '',
          requests_header_location: org.requests_header_location || '',
          requests_header_date: org.requests_header_date || '',
          requests_main_heading: org.requests_main_heading || 'What would you like to request?'
        });
        
        // Set label fields (with defaults from schema)
        setLabelFields({
          requests_song_request_label: org.requests_song_request_label || 'Song Request',
          requests_shoutout_label: org.requests_shoutout_label || 'Shoutout',
          requests_song_title_label: org.requests_song_title_label || 'Song Title',
          requests_song_title_placeholder: org.requests_song_title_placeholder || 'Enter song title',
          requests_artist_name_label: org.requests_artist_name_label || 'Artist Name',
          requests_artist_name_placeholder: org.requests_artist_name_placeholder || 'Enter artist name',
          requests_recipient_name_label: org.requests_recipient_name_label || 'Recipient Name',
          requests_recipient_name_placeholder: org.requests_recipient_name_placeholder || 'Who is this shoutout for?',
          requests_message_label: org.requests_message_label || 'Message',
          requests_message_placeholder: org.requests_message_placeholder || 'What would you like to say?',
          requests_music_link_label: org.requests_music_link_label || 'Paste Music Link (Optional)',
          requests_music_link_placeholder: org.requests_music_link_placeholder || 'Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link',
          requests_music_link_help_text: org.requests_music_link_help_text || "We'll automatically fill in the song title and artist name",
          requests_manual_entry_divider: org.requests_manual_entry_divider || 'Or enter manually',
          requests_start_over_text: org.requests_start_over_text || 'Start over',
          requests_audio_upload_label: org.requests_audio_upload_label || 'Upload Your Own Audio File',
          requests_audio_upload_description: org.requests_audio_upload_description || 'Upload your own audio file to be played. This is perfect for upcoming artists or custom tracks. ($100 per file)',
          requests_artist_rights_text: org.requests_artist_rights_text || 'I confirm that I own the rights to this music or have permission to use it',
          requests_is_artist_text: org.requests_is_artist_text || 'I am the artist (this is for promotion, not just a play)',
          requests_audio_fee_text: org.requests_audio_fee_text || '+$100.00 for audio upload',
          requests_submit_button_text: org.requests_submit_button_text || 'Submit Request',
          requests_step_1_text: org.requests_step_1_text || 'Step 1 of 2: Choose your request',
          requests_step_2_text: org.requests_step_2_text || 'Step 2 of 2: Payment'
        });
        
        // Set feature toggles (default to true if not set)
        setFeatureToggles({
          requests_show_audio_upload: org.requests_show_audio_upload !== false,
          requests_show_fast_track: org.requests_show_fast_track !== false,
          requests_show_next_song: org.requests_show_next_song !== false,
          requests_show_bundle_discount: org.requests_show_bundle_discount !== false
        });
        
        // Set SEO fields
        setSeoFields({
          requests_page_title: org.requests_page_title || 'Request a Song or Shoutout | M10 DJ Company',
          requests_page_description: org.requests_page_description || '',
          requests_default_request_type: org.requests_default_request_type || 'song_request'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlChange = (field: string, value: string) => {
    setCoverPhotos(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };
  
  const handleHeaderFieldChange = (field: keyof typeof headerFields, value: string) => {
    setHeaderFields(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };
  
  const handleLabelFieldChange = (field: keyof typeof labelFields, value: string) => {
    setLabelFields(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };
  
  const handleFeatureToggleChange = (field: keyof typeof featureToggles, value: boolean) => {
    setFeatureToggles(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };
  
  const handleSeoFieldChange = (field: keyof typeof seoFields, value: string) => {
    setSeoFields(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!organization) {
      setError('No organization found');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Filter and prepare social links
      const validSocialLinks = socialLinks
        .filter(link => link.url.trim() !== '' && link.label.trim() !== '')
        .map(link => ({
          ...link,
          url: link.url.trim(),
          label: link.label.trim(),
        }));

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          // Cover photos and video
          requests_cover_photo_url: coverPhotos.requests_cover_photo_url || null,
          requests_artist_photo_url: coverPhotos.requests_artist_photo_url || null,
          requests_venue_photo_url: coverPhotos.requests_venue_photo_url || null,
          requests_header_video_url: coverPhotos.requests_header_video_url || null,
          // Social links
          social_links: validSocialLinks,
          // Bidding settings
          requests_bidding_enabled: biddingEnabled,
          requests_bidding_minimum_bid: minimumBid,
          requests_bidding_starting_bid: startingBid,
          // Header fields
          ...headerFields,
          // Label fields
          ...labelFields,
          // Feature toggles
          ...featureToggles,
          // SEO fields
          ...seoFields,
        })
        .eq('id', organization.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Refresh the local organization data to reflect changes in the preview
      fetchOrganization();

      // Also update the URL with a new timestamp to ensure the live page loads fresh data
      setOrganization(prev => prev ? { ...prev, _lastUpdated: Date.now() } : prev);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Social Links Management
  const addSocialLink = () => {
    const newLink: SocialLink = {
      platform: 'custom',
      url: '',
      label: '',
      enabled: true,
      order: socialLinks.length + 1,
    };
    setSocialLinks([...socialLinks, newLink]);
    setActiveTab('social');
  };

  const removeSocialLink = (index: number) => {
    const updated = socialLinks.filter((_, i) => i !== index);
    const reordered = updated.map((link, i) => ({ ...link, order: i + 1 }));
    setSocialLinks(reordered);
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'platform' && value !== 'custom' && !updated[index].label) {
      const platform = SUPPORTED_PLATFORMS.find(p => p.value === value);
      updated[index].label = platform?.label || value;
    }
    
    setSocialLinks(updated);
  };

  const moveSocialLink = (index: number, direction: 'up' | 'down') => {
    const updated = [...socialLinks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= updated.length) return;
    
    const tempOrder = updated[index].order;
    updated[index].order = updated[newIndex].order;
    updated[newIndex].order = tempOrder;
    
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSocialLinks(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#fcba00] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Organization Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to create an organization first before managing requests page settings.
          </p>
          <Link
            href="/admin/organizations"
            className="inline-flex items-center px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#d99f00] transition-colors"
          >
            Go to Organizations
          </Link>
        </div>
      </div>
    );
  }

  const requestsPageUrl = `/organizations/${organization.slug}/requests?t=${Date.now()}`;

  return (
    <AdminPageLayout title="Requests Page Settings" description="Customize your public song requests page with cover photos and social links">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 text-sm"
            >
              ← Back to Dashboard
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Music className="w-8 h-8 text-[#fcba00]" />
                  Requests Page Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Customize your public song requests page - headers, labels, features, and more
                </p>
              </div>
                <Link
                  href={requestsPageUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  onClick={() => {
                    // Force refresh the page by adding a timestamp to bypass any caching
                    window.open(`/organizations/${organization.slug}/requests?t=${Date.now()}`, '_blank');
                    return false;
                  }}
                >
                  <Eye className="w-4 h-4" />
                  Preview Page
                </Link>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-300">Settings saved successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('cover')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'cover'
                      ? 'border-[#fcba00] text-[#fcba00]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Cover Photos
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('social')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'social'
                      ? 'border-[#fcba00] text-[#fcba00]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Social Links
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('bidding')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'bidding'
                      ? 'border-[#fcba00] text-[#fcba00]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Bidding Mode
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('header')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'header'
                      ? 'border-[#fcba00] text-[#fcba00]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Header
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('labels')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'labels'
                      ? 'border-[#fcba00] text-[#fcba00]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Labels & Text
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'features'
                      ? 'border-[#fcba00] text-[#fcba00]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ToggleLeft className="w-5 h-5" />
                    Features
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'seo'
                      ? 'border-[#fcba00] text-[#fcba00]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    SEO & Metadata
                  </div>
                </button>
              </nav>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === 'cover' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Cover Photos
                  </h2>

                  <div className="space-y-6">
                    {/* Primary Cover Photo */}
                    <ImageUploadInput
                      label="Primary Cover Photo (Required)"
                      value={coverPhotos.requests_cover_photo_url}
                      onChange={(url) => handleImageUrlChange('requests_cover_photo_url', url)}
                      recommendedDimensions="1920x800px"
                      aspectRatio="16:9"
                      previewClassName="w-full h-64 object-cover"
                      showPreview={true}
                      required={true}
                    />

                    {/* Artist Photo */}
                    <ImageUploadInput
                      label="Artist/DJ Photo (Optional - Fallback)"
                      value={coverPhotos.requests_artist_photo_url}
                      onChange={(url) => handleImageUrlChange('requests_artist_photo_url', url)}
                      recommendedDimensions="1200x600px"
                      aspectRatio="2:1"
                      previewClassName="w-full h-48 object-cover"
                      showPreview={true}
                      required={false}
                    />

                    {/* Venue Photo */}
                    <ImageUploadInput
                      label="Venue Photo (Optional - Fallback)"
                      value={coverPhotos.requests_venue_photo_url}
                      onChange={(url) => handleImageUrlChange('requests_venue_photo_url', url)}
                      recommendedDimensions="1200x600px"
                      aspectRatio="2:1"
                      previewClassName="w-full h-48 object-cover"
                      showPreview={true}
                      required={false}
                    />

                    {/* Header Video URL */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Label htmlFor="video-url" className="text-sm font-medium text-gray-900 dark:text-white">
                            Header Video (Optional)
                          </Label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            MP4 video URL for animated header. If set, this plays instead of the cover photo.
                          </p>
                        </div>
                        {coverPhotos.requests_header_video_url && (
                          <button
                            type="button"
                            onClick={() => handleImageUrlChange('requests_header_video_url', '')}
                            className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Clear
                          </button>
                        )}
                      </div>
                      <Input
                        id="video-url"
                        type="url"
                        value={coverPhotos.requests_header_video_url}
                        onChange={(e) => handleImageUrlChange('requests_header_video_url', e.target.value)}
                        placeholder="https://example.com/your-video.mp4"
                        className="w-full"
                      />
                      {coverPhotos.requests_header_video_url && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                          <video
                            src={coverPhotos.requests_header_video_url}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            autoPlay
                            loop
                            muted
                            playsInline
                          />
                        </div>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        💡 Tip: Use a looping video with your logo or branding for the best effect. Recommended: 720p or 1080p MP4.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'social' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Social Links
                    </h2>
                    <button
                      onClick={addSocialLink}
                      className="inline-flex items-center px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#d99f00] transition-colors font-medium text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Link
                    </button>
                  </div>

                  {socialLinks.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <Globe className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2 font-medium">No social links added yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                        Default links (Instagram & Facebook) will be shown to visitors
                      </p>
                      <button
                        onClick={addSocialLink}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Link
                      </button>
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
                            {/* Move Controls */}
                            <div className="flex flex-col gap-1 pt-2">
                              <button
                                onClick={() => moveSocialLink(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveSocialLink(index, 'down')}
                                disabled={index === socialLinks.length - 1}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Platform
                                </label>
                                <select
                                  value={link.platform}
                                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                                >
                                  {SUPPORTED_PLATFORMS.map((platform) => (
                                    <option key={platform.value} value={platform.value}>
                                      {platform.icon} {platform.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Link Label
                                </label>
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                                  placeholder="e.g., Follow Us"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  URL
                                </label>
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                                  placeholder="https://..."
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col items-end gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={link.enabled}
                                  onChange={(e) => updateSocialLink(index, 'enabled', e.target.checked)}
                                  className="w-4 h-4 text-[#fcba00] border-gray-300 rounded focus:ring-[#fcba00]"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                              </label>
                              <button
                                onClick={() => removeSocialLink(index)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeTab === 'bidding' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Bidding War Mode
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        How Bidding Mode Works
                      </h3>
                      <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                        <li>Users submit requests and place bids</li>
                        <li>Every 30 minutes, the highest bidder wins</li>
                        <li>Winner is charged, others&apos; authorizations are released</li>
                        <li>Winning request is played by the DJ</li>
                      </ul>
                    </div>

                    {/* Enable Bidding Toggle */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Enable Bidding War Mode
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          When enabled, requests go to bidding rounds instead of direct payment
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={biddingEnabled}
                          onChange={(e) => {
                            setBiddingEnabled(e.target.checked);
                            setError(null);
                            setSuccess(false);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#fcba00]/20 dark:peer-focus:ring-[#fcba00]/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#fcba00]"></div>
                      </label>
                    </div>

                    {/* Starting Bid Amount */}
                    {biddingEnabled && (
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Starting Bid Amount <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          The default initial bid amount for new requests. This ensures bids never start at $0. (in dollars)
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            value={(startingBid / 100).toFixed(2)}
                            onChange={(e) => {
                              const value = Math.round(parseFloat(e.target.value) * 100) || 100;
                              setStartingBid(Math.max(100, value)); // Minimum $1.00
                              setError(null);
                              setSuccess(false);
                            }}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                            placeholder="5.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Current starting bid: ${(startingBid / 100).toFixed(2)} (stored as {startingBid} cents)
                        </p>
                      </div>
                    )}

                    {/* Minimum Bid Amount */}
                    {biddingEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Minimum Bid Amount
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          The minimum amount users must bid to beat the current winning bid (in dollars)
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            value={(minimumBid / 100).toFixed(2)}
                            onChange={(e) => {
                              const value = Math.round(parseFloat(e.target.value) * 100) || 100;
                              setMinimumBid(Math.max(100, value)); // Minimum $1.00
                              setError(null);
                              setSuccess(false);
                            }}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                            placeholder="5.00"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Current minimum: ${(minimumBid / 100).toFixed(2)} (stored as {minimumBid} cents)
                        </p>
                      </div>
                    )}

                    {/* Info when disabled */}
                    {!biddingEnabled && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Bidding mode is currently <strong>disabled</strong>. Requests will use the normal payment flow.
                        </p>
                      </div>
                    )}

                    {/* Link to bidding rounds admin */}
                    {biddingEnabled && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                          Manage Bidding Rounds
                        </h3>
                        <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">
                          View active rounds, winners, and statistics
                        </p>
                        <Link
                          href="/admin/bidding-rounds"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <Settings className="w-4 h-4" />
                          View Bidding Rounds
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'header' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Header Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="header_artist_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Artist/DJ Name <span className="text-gray-500 dark:text-gray-400 font-normal">(Displayed in header)</span>
                      </Label>
                      <Input
                        id="header_artist_name"
                        value={headerFields.requests_header_artist_name}
                        onChange={(e) => handleHeaderFieldChange('requests_header_artist_name', e.target.value)}
                        placeholder={organization?.name || 'Your DJ Name'}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The name displayed prominently at the top of your requests page
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="header_location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location/Venue
                      </Label>
                      <Input
                        id="header_location"
                        value={headerFields.requests_header_location}
                        onChange={(e) => handleHeaderFieldChange('requests_header_location', e.target.value)}
                        placeholder="Chicago, IL"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Optional: Location or venue name displayed in the header
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="header_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date
                      </Label>
                      <Input
                        id="header_date"
                        value={headerFields.requests_header_date}
                        onChange={(e) => handleHeaderFieldChange('requests_header_date', e.target.value)}
                        placeholder="December 31, 2024"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Optional: Event date displayed in the header
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="main_heading" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Main Heading
                      </Label>
                      <Input
                        id="main_heading"
                        value={headerFields.requests_main_heading}
                        onChange={(e) => handleHeaderFieldChange('requests_main_heading', e.target.value)}
                        placeholder="What would you like to request?"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The main heading displayed on the requests page
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'labels' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Labels & Text
                  </h2>
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Type Labels</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="song_request_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Song Request Label
                          </Label>
                          <Input
                            id="song_request_label"
                            value={labelFields.requests_song_request_label}
                            onChange={(e) => handleLabelFieldChange('requests_song_request_label', e.target.value)}
                            placeholder="Song Request"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shoutout_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Shoutout Label
                          </Label>
                          <Input
                            id="shoutout_label"
                            value={labelFields.requests_shoutout_label}
                            onChange={(e) => handleLabelFieldChange('requests_shoutout_label', e.target.value)}
                            placeholder="Shoutout"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Song Request Fields</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="song_title_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Song Title Label
                            </Label>
                            <Input
                              id="song_title_label"
                              value={labelFields.requests_song_title_label}
                              onChange={(e) => handleLabelFieldChange('requests_song_title_label', e.target.value)}
                              placeholder="Song Title"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="song_title_placeholder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Song Title Placeholder
                            </Label>
                            <Input
                              id="song_title_placeholder"
                              value={labelFields.requests_song_title_placeholder}
                              onChange={(e) => handleLabelFieldChange('requests_song_title_placeholder', e.target.value)}
                              placeholder="Enter song title"
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="artist_name_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Artist Name Label
                            </Label>
                            <Input
                              id="artist_name_label"
                              value={labelFields.requests_artist_name_label}
                              onChange={(e) => handleLabelFieldChange('requests_artist_name_label', e.target.value)}
                              placeholder="Artist Name"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="artist_name_placeholder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Artist Name Placeholder
                            </Label>
                            <Input
                              id="artist_name_placeholder"
                              value={labelFields.requests_artist_name_placeholder}
                              onChange={(e) => handleLabelFieldChange('requests_artist_name_placeholder', e.target.value)}
                              placeholder="Enter artist name"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shoutout Fields</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="recipient_name_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Recipient Name Label
                            </Label>
                            <Input
                              id="recipient_name_label"
                              value={labelFields.requests_recipient_name_label}
                              onChange={(e) => handleLabelFieldChange('requests_recipient_name_label', e.target.value)}
                              placeholder="Recipient Name"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="recipient_name_placeholder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Recipient Name Placeholder
                            </Label>
                            <Input
                              id="recipient_name_placeholder"
                              value={labelFields.requests_recipient_name_placeholder}
                              onChange={(e) => handleLabelFieldChange('requests_recipient_name_placeholder', e.target.value)}
                              placeholder="Who is this shoutout for?"
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="message_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Message Label
                            </Label>
                            <Input
                              id="message_label"
                              value={labelFields.requests_message_label}
                              onChange={(e) => handleLabelFieldChange('requests_message_label', e.target.value)}
                              placeholder="Message"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="message_placeholder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Message Placeholder
                            </Label>
                            <Input
                              id="message_placeholder"
                              value={labelFields.requests_message_placeholder}
                              onChange={(e) => handleLabelFieldChange('requests_message_placeholder', e.target.value)}
                              placeholder="What would you like to say?"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Music Link Section</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="music_link_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Music Link Label
                          </Label>
                          <Input
                            id="music_link_label"
                            value={labelFields.requests_music_link_label}
                            onChange={(e) => handleLabelFieldChange('requests_music_link_label', e.target.value)}
                            placeholder="Paste Music Link (Optional)"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="music_link_placeholder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Music Link Placeholder
                          </Label>
                          <Input
                            id="music_link_placeholder"
                            value={labelFields.requests_music_link_placeholder}
                            onChange={(e) => handleLabelFieldChange('requests_music_link_placeholder', e.target.value)}
                            placeholder="Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="music_link_help_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Music Link Help Text
                          </Label>
                          <Input
                            id="music_link_help_text"
                            value={labelFields.requests_music_link_help_text}
                            onChange={(e) => handleLabelFieldChange('requests_music_link_help_text', e.target.value)}
                            placeholder="We'll automatically fill in the song title and artist name"
                            className="w-full"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="manual_entry_divider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Manual Entry Divider Text
                            </Label>
                            <Input
                              id="manual_entry_divider"
                              value={labelFields.requests_manual_entry_divider}
                              onChange={(e) => handleLabelFieldChange('requests_manual_entry_divider', e.target.value)}
                              placeholder="Or enter manually"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="start_over_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Start Over Text
                            </Label>
                            <Input
                              id="start_over_text"
                              value={labelFields.requests_start_over_text}
                              onChange={(e) => handleLabelFieldChange('requests_start_over_text', e.target.value)}
                              placeholder="Start over"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Audio Upload Section</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="audio_upload_label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Audio Upload Label
                          </Label>
                          <Input
                            id="audio_upload_label"
                            value={labelFields.requests_audio_upload_label}
                            onChange={(e) => handleLabelFieldChange('requests_audio_upload_label', e.target.value)}
                            placeholder="Upload Your Own Audio File"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label htmlFor="audio_upload_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Audio Upload Description
                          </Label>
                          <Textarea
                            id="audio_upload_description"
                            value={labelFields.requests_audio_upload_description}
                            onChange={(e) => handleLabelFieldChange('requests_audio_upload_description', e.target.value)}
                            placeholder="Upload your own audio file to be played. This is perfect for upcoming artists or custom tracks. ($100 per file)"
                            className="w-full min-h-[80px]"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="artist_rights_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Artist Rights Text
                            </Label>
                            <Input
                              id="artist_rights_text"
                              value={labelFields.requests_artist_rights_text}
                              onChange={(e) => handleLabelFieldChange('requests_artist_rights_text', e.target.value)}
                              placeholder="I confirm that I own the rights to this music or have permission to use it"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="is_artist_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Is Artist Text
                            </Label>
                            <Input
                              id="is_artist_text"
                              value={labelFields.requests_is_artist_text}
                              onChange={(e) => handleLabelFieldChange('requests_is_artist_text', e.target.value)}
                              placeholder="I am the artist (this is for promotion, not just a play)"
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="audio_fee_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Audio Fee Text
                          </Label>
                          <Input
                            id="audio_fee_text"
                            value={labelFields.requests_audio_fee_text}
                            onChange={(e) => handleLabelFieldChange('requests_audio_fee_text', e.target.value)}
                            placeholder="+$100.00 for audio upload"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Buttons & Steps</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="submit_button_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Submit Button Text
                          </Label>
                          <Input
                            id="submit_button_text"
                            value={labelFields.requests_submit_button_text}
                            onChange={(e) => handleLabelFieldChange('requests_submit_button_text', e.target.value)}
                            placeholder="Submit Request"
                            className="w-full"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="step_1_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Step 1 Text
                            </Label>
                            <Input
                              id="step_1_text"
                              value={labelFields.requests_step_1_text}
                              onChange={(e) => handleLabelFieldChange('requests_step_1_text', e.target.value)}
                              placeholder="Step 1 of 2: Choose your request"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="step_2_text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Step 2 Text
                            </Label>
                            <Input
                              id="step_2_text"
                              value={labelFields.requests_step_2_text}
                              onChange={(e) => handleLabelFieldChange('requests_step_2_text', e.target.value)}
                              placeholder="Step 2 of 2: Payment"
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'features' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Feature Toggles
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Show Audio Upload Option
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Display the audio file upload option on the requests page
                        </p>
                      </div>
                      <Switch
                        checked={featureToggles.requests_show_audio_upload}
                        onCheckedChange={(checked) => handleFeatureToggleChange('requests_show_audio_upload', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Show Fast Track Option
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow users to pay extra to play their request immediately
                        </p>
                      </div>
                      <Switch
                        checked={featureToggles.requests_show_fast_track}
                        onCheckedChange={(checked) => handleFeatureToggleChange('requests_show_fast_track', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Show Next Song Option
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Allow users to pay extra to play their request as the next song
                        </p>
                      </div>
                      <Switch
                        checked={featureToggles.requests_show_next_song}
                        onCheckedChange={(checked) => handleFeatureToggleChange('requests_show_next_song', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Show Bundle Discount
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Display bundle discount options for multiple song requests
                        </p>
                      </div>
                      <Switch
                        checked={featureToggles.requests_show_bundle_discount}
                        onCheckedChange={(checked) => handleFeatureToggleChange('requests_show_bundle_discount', checked)}
                      />
                    </div>
                  </div>
                </div>
              ) : activeTab === 'seo' ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    SEO & Metadata
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="page_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Page Title <span className="text-gray-500 dark:text-gray-400 font-normal">(SEO & Browser Tab)</span>
                      </Label>
                      <Input
                        id="page_title"
                        value={seoFields.requests_page_title}
                        onChange={(e) => handleSeoFieldChange('requests_page_title', e.target.value)}
                        placeholder="Request a Song or Shoutout | M10 DJ Company"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The title shown in browser tabs and search engine results (recommended: 50-60 characters)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="page_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Meta Description <span className="text-gray-500 dark:text-gray-400 font-normal">(SEO)</span>
                      </Label>
                      <Textarea
                        id="page_description"
                        value={seoFields.requests_page_description}
                        onChange={(e) => handleSeoFieldChange('requests_page_description', e.target.value)}
                        placeholder="Request a song or shoutout for your event..."
                        className="w-full min-h-[100px]"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Description shown in search engine results (recommended: 150-160 characters)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="default_request_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Request Type
                      </Label>
                      <select
                        id="default_request_type"
                        value={seoFields.requests_default_request_type}
                        onChange={(e) => handleSeoFieldChange('requests_default_request_type', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                      >
                        <option value="song_request">Song Request</option>
                        <option value="shoutout">Shoutout</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        The request type selected by default when the page loads
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#fcba00]" />
                  Live Preview
                </h3>
                <Link
                  href={requestsPageUrl}
                  target="_blank"
                  className="block w-full text-center px-4 py-3 bg-[#fcba00] hover:bg-[#d99f00] text-black rounded-lg transition-colors text-sm font-medium mb-4 shadow-md"
                  onClick={() => {
                    // Force refresh the page by adding a timestamp to bypass any caching
                    window.open(`/organizations/${organization.slug}/requests?t=${Date.now()}`, '_blank');
                    return false;
                  }}
                >
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  View Live Page
                </Link>
                
                {/* Accurate Preview - Matches actual page layout */}
                <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-gradient-to-b from-gray-900 via-black to-black">
                  {/* Hero Section Preview */}
                  <div className="relative h-48 overflow-hidden">
                    {/* Show video if set, otherwise show cover photo */}
                    {coverPhotos.requests_header_video_url ? (
                      <video
                        src={coverPhotos.requests_header_video_url}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (coverPhotos.requests_cover_photo_url || coverPhotos.requests_artist_photo_url || coverPhotos.requests_venue_photo_url) ? (
                      <img
                        src={coverPhotos.requests_cover_photo_url || coverPhotos.requests_artist_photo_url || coverPhotos.requests_venue_photo_url}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    
                    {/* Overlay content preview - Only show when not using video (video has its own branding) */}
                    {!coverPhotos.requests_header_video_url && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 text-white">
                      {headerFields.requests_header_artist_name && (
                        <h2 className="text-lg font-bold mb-1 drop-shadow-lg">
                          {headerFields.requests_header_artist_name.toUpperCase()}
                        </h2>
                      )}
                      {headerFields.requests_header_location && (
                        <p className="text-sm text-white/90 mb-1 drop-shadow-md">
                          {headerFields.requests_header_location}
                        </p>
                      )}
                      {headerFields.requests_header_date && (
                        <p className="text-xs text-white/80 drop-shadow-sm">
                          {headerFields.requests_header_date}
                        </p>
                      )}
                    </div>
                    )}
                    
                    {/* Social Links Preview at bottom */}
                    {socialLinks.filter(link => link.enabled).length > 0 && (
                      <div className="absolute bottom-2 flex items-center justify-center gap-2">
                        {socialLinks
                          .filter(link => link.enabled)
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .slice(0, 4)
                          .map((link, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                              title={link.label}
                            >
                              <span className="text-[10px] text-white">🔗</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Main Heading Preview */}
                  <div className="bg-black/50 px-4 py-3 border-t border-white/10">
                    <p className="text-sm text-white font-semibold text-center">
                      {headerFields.requests_main_heading || 'What would you like to request?'}
                    </p>
                  </div>
                  
                  {/* Request Form Preview Placeholder */}
                  <div className="bg-gray-800/50 px-4 py-4 space-y-2">
                    <div className="h-8 bg-white/10 rounded"></div>
                    <div className="h-8 bg-white/10 rounded"></div>
                    <div className="h-16 bg-white/10 rounded"></div>
                    <div className="h-10 bg-[#fcba00]/20 rounded"></div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>Preview shows actual page layout</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>Header text overlays cover photo</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>Navbar is transparent on live page</span>
                  </p>
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  How It Works
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Cover photos appear in order: Primary → Artist → Venue → Default</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Social links display as minimal icons in header and hero</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>If no custom links are set, default Instagram & Facebook links are shown</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Images should be at least 1920x800px for best quality</span>
                  </li>
                </ul>
              </div>

              {/* Save Button - Sticky */}
              <div className="sticky top-8">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#fcba00] text-black rounded-lg hover:bg-[#d99f00] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save All Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AdminPageLayout>
  );
}

