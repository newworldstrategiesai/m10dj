'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminPageLayout from '@/components/layouts/AdminPageLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Save, 
  Loader2, 
  CheckCircle, 
  ExternalLink, 
  Plus, 
  Trash2,
  Eye,
  Globe,
  Music,
  Settings,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  Mail,
  Phone,
  Calendar,
  Code
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ArtistLink {
  label: string;
  url: string;
  icon: string;
}

export default function ArtistPageSettings() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'links' | 'contact' | 'custom'>('general');
  
  const [formData, setFormData] = useState({
    artist_page_enabled: false,
    artist_page_headline: '',
    artist_page_bio: '',
    artist_page_profile_image_url: '',
    artist_page_cover_image_url: '',
    artist_page_gallery_images: [] as string[],
    artist_page_video_urls: [] as string[],
    artist_page_links: [] as ArtistLink[],
    artist_page_contact_email: '',
    artist_page_contact_phone: '',
    artist_page_booking_url: '',
    artist_page_custom_css: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchArtistPage();
    }
  }, [user]);

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

  const fetchArtistPage = async () => {
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
        setFormData({
          artist_page_enabled: org.artist_page_enabled || false,
          artist_page_headline: org.artist_page_headline || '',
          artist_page_bio: org.artist_page_bio || '',
          artist_page_profile_image_url: org.artist_page_profile_image_url || '',
          artist_page_cover_image_url: org.artist_page_cover_image_url || '',
          artist_page_gallery_images: org.artist_page_gallery_images || [],
          artist_page_video_urls: org.artist_page_video_urls || [],
          artist_page_links: (org.artist_page_links || []) as ArtistLink[],
          artist_page_contact_email: org.artist_page_contact_email || '',
          artist_page_contact_phone: org.artist_page_contact_phone || '',
          artist_page_booking_url: org.artist_page_booking_url || '',
          artist_page_custom_css: org.artist_page_custom_css || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load artist page settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleAddGalleryImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        artist_page_gallery_images: [...prev.artist_page_gallery_images, url]
      }));
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      artist_page_gallery_images: prev.artist_page_gallery_images.filter((_, i) => i !== index)
    }));
  };

  const handleAddVideo = () => {
    const url = prompt('Enter video URL (YouTube or Vimeo):');
    if (url) {
      setFormData(prev => ({
        ...prev,
        artist_page_video_urls: [...prev.artist_page_video_urls, url]
      }));
    }
  };

  const handleRemoveVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      artist_page_video_urls: prev.artist_page_video_urls.filter((_, i) => i !== index)
    }));
  };

  const handleAddLink = () => {
    setFormData(prev => ({
      ...prev,
      artist_page_links: [...prev.artist_page_links, { label: '', url: '', icon: 'link' }]
    }));
  };

  const handleUpdateLink = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      artist_page_links: prev.artist_page_links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const handleRemoveLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      artist_page_links: prev.artist_page_links.filter((_, i) => i !== index)
    }));
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

      const response = await fetch('/api/organizations/artist-page/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organization.id,
          ...formData
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save artist page settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Refresh organization data
      await fetchArtistPage();
    } catch (error: any) {
      console.error('Error saving artist page:', error);
      setError(error.message || 'Failed to save artist page settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminPageLayout>
    );
  }

  if (!organization) {
    return (
      <AdminPageLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Organization not found</p>
        </div>
      </AdminPageLayout>
    );
  }

  const artistPageUrl = `https://tipjar.live/${organization.slug}`;

  return (
    <AdminPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Artist Page</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customize your public artist page at tipjar.live/{organization.slug}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {formData.artist_page_enabled && (
              <Link href={artistPageUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  View Page
                </Button>
              </Link>
            )}
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">Artist page settings saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'media', label: 'Media', icon: ImageIcon },
              { id: 'links', label: 'Links', icon: LinkIcon },
              { id: 'contact', label: 'Contact', icon: Mail },
              { id: 'custom', label: 'Custom CSS', icon: Code }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Enable Artist Page</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Make your artist page visible at {artistPageUrl}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.artist_page_enabled}
                  onChange={(e) => handleInputChange('artist_page_enabled', e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={formData.artist_page_headline}
                  onChange={(e) => handleInputChange('artist_page_headline', e.target.value)}
                  placeholder="e.g., Memphis's Premier DJ"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.artist_page_bio}
                  onChange={(e) => handleInputChange('artist_page_bio', e.target.value)}
                  placeholder="Tell your story..."
                  rows={6}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="profile_image">Profile Image URL</Label>
                <Input
                  id="profile_image"
                  value={formData.artist_page_profile_image_url}
                  onChange={(e) => handleInputChange('artist_page_profile_image_url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
                {formData.artist_page_profile_image_url && (
                  <img 
                    src={formData.artist_page_profile_image_url} 
                    alt="Profile preview" 
                    className="mt-2 w-32 h-32 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="cover_image">Cover Image URL</Label>
                <Input
                  id="cover_image"
                  value={formData.artist_page_cover_image_url}
                  onChange={(e) => handleInputChange('artist_page_cover_image_url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
                {formData.artist_page_cover_image_url && (
                  <img 
                    src={formData.artist_page_cover_image_url} 
                    alt="Cover preview" 
                    className="mt-2 w-full max-w-md h-48 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Gallery Images</Label>
                  <Button onClick={handleAddGalleryImage} variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Image
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {formData.artist_page_gallery_images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Gallery ${index + 1}`}
                        className="w-full aspect-square rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                      <button
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Videos</Label>
                  <Button onClick={handleAddVideo} variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Video
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.artist_page_video_urls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <Video className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-sm truncate">{url}</span>
                      <button
                        onClick={() => handleRemoveVideo(index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Links Tab */}
          {activeTab === 'links' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>External Links</Label>
                <Button onClick={handleAddLink} variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Link
                </Button>
              </div>
              {formData.artist_page_links.map((link, index) => (
                <div key={index} className="flex gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Input
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) => handleUpdateLink(index, 'label', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Icon (e.g., spotify, instagram)"
                    value={link.icon}
                    onChange={(e) => handleUpdateLink(index, 'icon', e.target.value)}
                    className="w-32"
                  />
                  <Button
                    onClick={() => handleRemoveLink(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.artist_page_contact_email}
                  onChange={(e) => handleInputChange('artist_page_contact_email', e.target.value)}
                  placeholder="contact@example.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.artist_page_contact_phone}
                  onChange={(e) => handleInputChange('artist_page_contact_phone', e.target.value)}
                  placeholder="(901) 555-1234"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="booking_url">Booking URL</Label>
                <Input
                  id="booking_url"
                  value={formData.artist_page_booking_url}
                  onChange={(e) => handleInputChange('artist_page_booking_url', e.target.value)}
                  placeholder="https://calendly.com/..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Custom CSS Tab */}
          {activeTab === 'custom' && (
            <div>
              <Label htmlFor="custom_css">Custom CSS</Label>
              <Textarea
                id="custom_css"
                value={formData.artist_page_custom_css}
                onChange={(e) => handleInputChange('artist_page_custom_css', e.target.value)}
                placeholder=".my-custom-class { color: red; }"
                rows={12}
                className="mt-1 font-mono text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
}

