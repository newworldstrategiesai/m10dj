'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toasts/use-toast';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import {
  ArrowLeft,
  Save,
  Music,
  Search,
  Plus,
  X,
  Play,
  Crown
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getCurrentOrganization } from '@/utils/organization-context';

interface Video {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  duration: string;
  is_premium?: boolean;
}

export default function CreatePlaylistPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  // Playlist form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);

  // Song search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [searching, setSearching] = useState(false);

  // Creation state
  const [creating, setCreating] = useState(false);

  const isPremium = subscriptionTier !== 'free';

  // Load organization
  useEffect(() => {
    async function loadOrganization() {
      try {
        const org = await getCurrentOrganization(supabase);
        if (org) {
          setOrganization(org);
          setSubscriptionTier(org.subscription_tier || 'free');
        }
      } catch (error) {
        console.error('Error loading organization:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, []);

  // Search for songs
  const searchSongs = async (query: string) => {
    if (!query.trim() || !organization) return;

    setSearching(true);
    try {
      const response = await fetch('/api/karaoke/search-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          organizationId: organization.id,
          limit: 20
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.songs || []);
      }
    } catch (error) {
      console.error('Error searching songs:', error);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchSongs(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, organization]);

  const addVideoToPlaylist = (video: Video) => {
    if (!selectedVideos.find(v => v.id === video.id)) {
      setSelectedVideos(prev => [...prev, video]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeVideoFromPlaylist = (videoId: string) => {
    setSelectedVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const moveVideo = (fromIndex: number, toIndex: number) => {
    const newVideos = [...selectedVideos];
    const [moved] = newVideos.splice(fromIndex, 1);
    newVideos.splice(toIndex, 0, moved);
    setSelectedVideos(newVideos);
  };

  const createPlaylist = async () => {
    if (!name.trim() || !organization) return;

    setCreating(true);
    try {
      // First create the playlist
      const createResponse = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'create',
          name: name.trim(),
          description: description.trim(),
          isPublic
        })
      });

      if (!createResponse.ok) throw new Error('Failed to create playlist');

      const createResult = await createResponse.json();
      const playlistId = createResult.playlist.id;

      // Add videos to playlist if any selected
      if (selectedVideos.length > 0) {
        for (const video of selectedVideos) {
          await fetch('/api/karaoke/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: organization.id,
              action: 'add-video',
              playlistId,
              videoId: video.id
            })
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Playlist created successfully'
      });

      // Redirect to playlist page
      router.push(`/admin/karaoke/playlist/${playlistId}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create playlist',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <KaraokeLayout title="Create Playlist" showBackButton>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title="Create Playlist" showBackButton currentPage="playlists">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Create Playlist</h1>
            <p className="text-gray-400 mt-1">Build your perfect karaoke playlist</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Playlist Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="karaoke-card">
              <CardHeader>
                <CardTitle className="text-white">Playlist Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Name *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Awesome Playlist"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A collection of great karaoke songs..."
                    rows={3}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-300">
                      Public Playlist
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Allow others to view and use this playlist
                    </p>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Song Search */}
            <Card className="karaoke-card">
              <CardHeader>
                <CardTitle className="text-white">Add Songs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search for songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors cursor-pointer"
                        onClick={() => addVideoToPlaylist(video)}
                      >
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">
                            {video.title}
                          </p>
                          <p className="text-gray-400 text-xs truncate">
                            {video.artist}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {video.is_premium && (
                            <Badge variant="outline" className="border-pink-500/50 text-pink-400">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          <span className="text-gray-400 text-xs">{video.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Selected Songs */}
          <div className="space-y-6">
            <Card className="karaoke-card">
              <CardHeader>
                <CardTitle className="text-white">
                  Selected Songs ({selectedVideos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedVideos.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">
                      No songs added yet. Search and add songs to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedVideos.map((video, index) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-8 h-8 rounded object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">
                            {video.title}
                          </p>
                          <p className="text-gray-400 text-xs truncate">
                            {video.artist}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeVideoFromPlaylist(video.id)}
                          className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create Button */}
            <Button
              onClick={createPlaylist}
              disabled={!name.trim() || creating}
              className="w-full karaoke-btn-primary"
              size="lg"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Playlist
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </KaraokeLayout>
  );
}