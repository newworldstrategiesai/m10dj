'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/Toasts/use-toast';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import {
  ArrowLeft,
  Play,
  Edit3,
  Trash2,
  Plus,
  Search,
  MoreVertical,
  Music,
  Clock,
  Users,
  Crown,
  Save,
  X
} from 'lucide-react';
import { useKaraokeAuth } from '@/hooks/useKaraokeAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  video_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface Video {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  duration: string;
  is_premium?: boolean;
}

export default function PlaylistDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const { organization, subscriptionTier, isLoading: authLoading, isAuthenticated, supabase } = useKaraokeAuth();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add songs
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [searching, setSearching] = useState(false);

  const isPremium = subscriptionTier !== 'free';

  // Load playlist once authenticated and ID is available
  useEffect(() => {
    if (isAuthenticated && organization && id && !authLoading) {
      loadPlaylist();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, organization, id, authLoading]);

  const loadPlaylist = async () => {
    if (!id || !organization) return;

    setLoading(true);
    try {
      // Get playlist
      const { data: playlistData, error: playlistError } = await supabase
        .from('user_playlists')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('id', id)
        .single();

      if (playlistError) throw playlistError;

      const playlist = playlistData as any;
      setPlaylist(playlist);
      setEditName(playlist.name);
      setEditDescription(playlist.description || '');
      setEditIsPublic(playlist.is_public);

      // Get videos
      if (playlist.video_ids && playlist.video_ids.length > 0) {
        const { data: videosData, error: videosError } = await supabase
          .from('karaoke_song_videos')
          .select('id, song_title, song_artist, youtube_video_title, youtube_channel_name, youtube_video_duration, is_premium, youtube_video_id')
          .in('id', playlist.video_ids);

        if (videosError) throw videosError;

        // Sort videos in the order they appear in video_ids
        const sortedVideos = playlist.video_ids
          .map((videoId: string) => {
            const video = (videosData as any[])?.find((v: any) => v.id === videoId);
            if (video) {
              return {
                id: video.id,
                title: video.song_title || video.youtube_video_title,
                artist: video.song_artist || video.youtube_channel_name,
                thumbnail_url: `https://img.youtube.com/vi/${video.youtube_video_id}/default.jpg`,
                duration: video.youtube_video_duration ? `${Math.floor(video.youtube_video_duration / 60)}:${(video.youtube_video_duration % 60).toString().padStart(2, '0')}` : '0:00',
                is_premium: video.is_premium
              };
            }
            return null;
          })
          .filter(Boolean) as Video[];

        setVideos(sortedVideos);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playlist',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const savePlaylistChanges = async () => {
    if (!playlist) return;

    setSaving(true);
    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'update',
          playlistId: playlist.id,
          name: editName.trim(),
          description: editDescription.trim(),
          isPublic: editIsPublic
        })
      });

      if (!response.ok) throw new Error('Failed to update playlist');

      // Update local state
      setPlaylist(prev => prev ? {
        ...prev,
        name: editName.trim(),
        description: editDescription.trim(),
        is_public: editIsPublic
      } : null);

      setIsEditing(false);

      toast({
        title: 'Success',
        description: 'Playlist updated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update playlist',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Search for songs to add
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
        // Filter out songs already in playlist
        const existingIds = new Set(videos.map(v => v.id));
        const filteredResults = (data.songs || []).filter((song: Video) => !existingIds.has(song.id));
        setSearchResults(filteredResults);
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
  }, [searchQuery, organization, videos]);

  const addVideoToPlaylist = async (video: Video) => {
    if (!playlist) return;

    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'add-video',
          playlistId: playlist.id,
          videoId: video.id
        })
      });

      if (!response.ok) throw new Error('Failed to add song');

      // Update local state
      setVideos(prev => [...prev, video]);
      setSearchQuery('');
      setSearchResults([]);

      toast({
        title: 'Success',
        description: 'Song added to playlist'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add song',
        variant: 'destructive'
      });
    }
  };

  const removeVideoFromPlaylist = async (videoId: string) => {
    if (!playlist) return;

    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'remove-video',
          playlistId: playlist.id,
          videoId
        })
      });

      if (!response.ok) throw new Error('Failed to remove song');

      // Update local state
      setVideos(prev => prev.filter(v => v.id !== videoId));

      toast({
        title: 'Success',
        description: 'Song removed from playlist'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove song',
        variant: 'destructive'
      });
    }
  };

  const deletePlaylist = async () => {
    if (!playlist || !confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) return;

    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'delete',
          playlistId: playlist.id
        })
      });

      if (!response.ok) throw new Error('Failed to delete playlist');

      toast({
        title: 'Success',
        description: 'Playlist deleted successfully'
      });

      router.push('/admin/karaoke/playlists');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete playlist',
        variant: 'destructive'
      });
    }
  };

  if (authLoading || loading) {
    return (
      <KaraokeLayout title="Loading..." showBackButton currentPage="playlists">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading playlist...</p>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  if (!playlist) {
    return (
      <KaraokeLayout title="Playlist Not Found" showBackButton currentPage="playlists">
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Playlist Not Found</h3>
          <p className="text-gray-400 mb-6">The playlist you're looking for doesn't exist or has been deleted.</p>
          <Link href="/admin/karaoke/playlists">
            <Button className="karaoke-btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Playlists
            </Button>
          </Link>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title={playlist.name} showBackButton currentPage="playlists">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-3xl font-bold bg-gray-800/50 border-gray-700 text-white"
                  placeholder="Playlist name"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Playlist description"
                  rows={2}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editIsPublic}
                      onChange={(e) => setEditIsPublic(e.target.checked)}
                      className="rounded"
                    />
                    Public playlist
                  </label>
                  <Button
                    onClick={savePlaylistChanges}
                    disabled={!editName.trim() || saving}
                    size="sm"
                    className="karaoke-btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(playlist.name);
                      setEditDescription(playlist.description || '');
                      setEditIsPublic(playlist.is_public);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{playlist.name}</h1>
                  {playlist.is_public && (
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                      <Users className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  )}
                </div>
                {playlist.description && (
                  <p className="text-gray-400 mb-4">{playlist.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{videos.length} songs</span>
                  <span>Created {new Date(playlist.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAddSongs(true)}
                className="karaoke-btn-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Songs
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={deletePlaylist}
                    className="text-red-400 focus:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Songs List */}
        <Card className="karaoke-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="w-5 h-5" />
              Songs ({videos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No songs yet</h3>
                <p className="text-gray-400 mb-6">Add some songs to get your playlist started.</p>
                <Button onClick={() => setShowAddSongs(true)} className="karaoke-btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Song
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-gray-400 text-sm w-8">{index + 1}</span>
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{video.title}</p>
                        <p className="text-gray-400 text-sm truncate">{video.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {video.is_premium && (
                        <Badge variant="outline" className="border-pink-500/50 text-pink-400">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <span className="text-gray-400 text-sm">{video.duration}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-pink-400 hover:text-pink-300"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeVideoFromPlaylist(video.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Songs Dialog */}
        <Dialog open={showAddSongs} onOpenChange={setShowAddSongs}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Songs to Playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for songs to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => addVideoToPlaylist(video)}
                    >
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{video.title}</p>
                        <p className="text-sm text-gray-500 truncate">{video.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {video.is_premium && (
                          <Badge variant="outline" className="border-pink-500/50 text-pink-400">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">{video.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !searching && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No songs found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </KaraokeLayout>
  );
}