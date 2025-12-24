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
  ArrowDown
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'cover' | 'social' | 'bidding'>('cover');
  const [biddingEnabled, setBiddingEnabled] = useState(false);
  const [minimumBid, setMinimumBid] = useState(500); // In cents
  const [startingBid, setStartingBid] = useState(500); // In cents - default starting bid (never $0)
  
  const [coverPhotos, setCoverPhotos] = useState({
    requests_cover_photo_url: '',
    requests_artist_photo_url: '',
    requests_venue_photo_url: ''
  });
  
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

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
    if (tab === 'social' || tab === 'cover' || tab === 'bidding') {
      setActiveTab(tab);
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
          requests_venue_photo_url: org.requests_venue_photo_url || ''
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
          requests_cover_photo_url: coverPhotos.requests_cover_photo_url || null,
          requests_artist_photo_url: coverPhotos.requests_artist_photo_url || null,
          requests_venue_photo_url: coverPhotos.requests_venue_photo_url || null,
          social_links: validSocialLinks,
          requests_bidding_enabled: biddingEnabled,
          requests_bidding_minimum_bid: minimumBid,
          requests_bidding_starting_bid: startingBid,
        })
        .eq('id', organization.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchOrganization();
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

  const requestsPageUrl = `/organizations/${organization.slug}/requests`;

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
                  Customize your public song requests page with cover photos and social links
                </p>
              </div>
              <Link
                href={requestsPageUrl}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
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
              <nav className="-mb-px flex space-x-8">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Primary Cover Photo
                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(Required)</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Main hero image displayed at the top of your requests page. Recommended: 1920x800px or larger.
                      </p>
                      <input
                        type="url"
                        value={coverPhotos.requests_cover_photo_url}
                        onChange={(e) => handleImageUrlChange('requests_cover_photo_url', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                        placeholder="https://example.com/cover-photo.jpg"
                      />
                      {coverPhotos.requests_cover_photo_url && (
                        <div className="mt-4 relative group">
                          <img
                            src={coverPhotos.requests_cover_photo_url}
                            alt="Cover photo preview"
                            className="w-full h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button
                              onClick={() => handleImageUrlChange('requests_cover_photo_url', '')}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Artist Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Artist/DJ Photo
                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(Optional - Fallback)</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Used if primary cover photo is not set. Features the artist/DJ.
                      </p>
                      <input
                        type="url"
                        value={coverPhotos.requests_artist_photo_url}
                        onChange={(e) => handleImageUrlChange('requests_artist_photo_url', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                        placeholder="https://example.com/artist-photo.jpg"
                      />
                      {coverPhotos.requests_artist_photo_url && (
                        <div className="mt-4 relative group">
                          <img
                            src={coverPhotos.requests_artist_photo_url}
                            alt="Artist photo preview"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button
                              onClick={() => handleImageUrlChange('requests_artist_photo_url', '')}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Venue Photo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Venue Photo
                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">(Optional - Fallback)</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Used if other cover photos are not set. Features a venue.
                      </p>
                      <input
                        type="url"
                        value={coverPhotos.requests_venue_photo_url}
                        onChange={(e) => handleImageUrlChange('requests_venue_photo_url', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                        placeholder="https://example.com/venue-photo.jpg"
                      />
                      {coverPhotos.requests_venue_photo_url && (
                        <div className="mt-4 relative group">
                          <img
                            src={coverPhotos.requests_venue_photo_url}
                            alt="Venue photo preview"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button
                              onClick={() => handleImageUrlChange('requests_venue_photo_url', '')}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
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
                >
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  View Live Page
                </Link>
                {(coverPhotos.requests_cover_photo_url || coverPhotos.requests_artist_photo_url || coverPhotos.requests_venue_photo_url) ? (
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4 border-2 border-gray-200 dark:border-gray-600 shadow-inner">
                    <img
                      src={coverPhotos.requests_cover_photo_url || coverPhotos.requests_artist_photo_url || coverPhotos.requests_venue_photo_url}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg overflow-hidden mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">No cover photo set</p>
                    </div>
                  </div>
                )}
                
                {/* Social Links Preview */}
                {socialLinks.length > 0 && (
                  <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Social Links Preview:</p>
                    <div className="flex flex-wrap gap-2">
                      {socialLinks
                        .filter(link => link.enabled)
                        .map((link, index) => (
                          <div
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                          >
                            {link.label}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>Cover photos display in hero section</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>Social links appear at bottom of hero</span>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-[#fcba00] mt-0.5">•</span>
                    <span>Navbar becomes transparent automatically</span>
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

