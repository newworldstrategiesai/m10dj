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
  X,
  Shuffle,
  Heart,
  Share,
  MoreHorizontal,
  Pause,
  SkipBack,
  SkipForward,
  Volume2
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
  video_id?: string; // The actual karaoke_song_videos ID
}

interface VideoSuggestion {
  id: string;
  song_title: string;
  song_artist?: string;
  youtube_video_id: string;
  youtube_video_title: string;
  youtube_channel_name?: string;
  youtube_video_duration: string;
  is_premium?: boolean;
  karaokeScore?: number;
  relevanceScore?: number;
  thumbnail_url: string;
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

  // Video suggestions state
  const [videoSuggestions, setVideoSuggestions] = useState<{[songId: string]: VideoSuggestion[]}>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{[songId: string]: boolean}>({});
  const [showVideoSelector, setShowVideoSelector] = useState<string | null>(null);

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

  // Fetch video suggestions for a song
  const fetchVideoSuggestions = async (songTitle: string, songArtist?: string, songId: string) => {
    if (!organization) return;

    setLoadingSuggestions(prev => ({ ...prev, [songId]: true }));

    try {
      const response = await fetch('/api/karaoke/search-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${songTitle}${songArtist ? ` ${songArtist}` : ''}`.trim(),
          organizationId: organization.id,
          limit: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        const suggestions = (data.songs || []).map((song: any) => ({
          id: song.id,
          song_title: song.song_title,
          song_artist: song.song_artist,
          youtube_video_id: song.youtube_video_id,
          youtube_video_title: song.youtube_video_title,
          youtube_channel_name: song.youtube_channel_name,
          youtube_video_duration: song.youtube_video_duration,
          is_premium: song.is_premium,
          karaokeScore: song.karaoke_score || 0,
          relevanceScore: song.relevance_score || 0,
          thumbnail_url: `https://img.youtube.com/vi/${song.youtube_video_id}/default.jpg`
        }));

        setVideoSuggestions(prev => ({ ...prev, [songId]: suggestions }));
      }
    } catch (error) {
      console.error('Error fetching video suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch video suggestions',
        variant: 'destructive'
      });
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [songId]: false }));
    }
  };

  // Change the selected video for a playlist song
  const changePlaylistVideo = async (songId: string, newVideoId: string) => {
    if (!playlist || !organization) return;

    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'change-video',
          playlistId: playlist.id,
          songId,
          newVideoId
        })
      });

      if (!response.ok) throw new Error('Failed to change video');

      // Update the videos array with the new video data
      const newVideoData = videoSuggestions[songId]?.find(v => v.id === newVideoId);
      if (newVideoData) {
        setVideos(prev => prev.map(video =>
          video.id === songId ? {
            ...video,
            video_id: newVideoId,
            thumbnail_url: newVideoData.thumbnail_url,
            duration: newVideoData.youtube_video_duration ? `${Math.floor(newVideoData.youtube_video_duration / 60)}:${(newVideoData.youtube_video_duration % 60).toString().padStart(2, '0')}` : video.duration,
            is_premium: newVideoData.is_premium
          } : video
        ));

        toast({
          title: 'Success',
          description: 'Video changed successfully'
        });
      }

      setShowVideoSelector(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change video',
        variant: 'destructive'
      });
    }
  };

  // Unlink video from playlist song (set to default)
  const unlinkPlaylistVideo = async (songId: string) => {
    if (!playlist || !organization) return;

    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'unlink-video',
          playlistId: playlist.id,
          songId
        })
      });

      if (!response.ok) throw new Error('Failed to unlink video');

      // Reset the video to default (no specific video linked)
      setVideos(prev => prev.map(video =>
        video.id === songId ? {
          ...video,
          video_id: undefined,
          thumbnail_url: '/api/placeholder/120/67',
          duration: '0:00',
          is_premium: false
        } : video
      ));

      toast({
        title: 'Success',
        description: 'Video unlinked successfully'
      });

      setShowVideoSelector(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unlink video',
        variant: 'destructive'
      });
    }
  };

  if (authLoading || loading) {
    return (
      <KaraokeLayout title="Loading..." showBackButton currentPage="playlists">
        <div className="min-h-screen bg-gray-900">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-300 font-medium">Loading playlist...</p>
            </div>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  if (!playlist) {
    return (
      <KaraokeLayout title="Playlist Not Found" showBackButton currentPage="playlists">
        <div className="min-h-screen bg-gray-900">
          <div className="text-center py-20">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Music className="w-12 h-12 text-gray-500" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                <X className="w-4 h-4 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">Playlist Not Found</h3>
            <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
              The playlist you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/admin/karaoke/playlists">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Playlists
              </Button>
            </Link>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title={playlist.name} showBackButton currentPage="playlists">
      <div className="min-h-screen bg-gray-900">
        {/* Spotify-Style Hero Section */}
        <div className="relative overflow-hidden">
          {/* Dynamic Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-pink-600/20 to-blue-600/30 animate-pulse"></div>

          {/* Floating Background Elements */}
          <div className="absolute top-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>

          <div className="relative z-10 p-8 md:p-12">
            <div className="max-w-6xl mx-auto">
              {/* Playlist Cover and Info */}
              <div className="flex flex-col md:flex-row items-start md:items-end gap-8 mb-8">
                {/* Large Cover Art */}
                <div className="relative group">
                  <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                      <Music className="w-24 h-24 text-white/60" />
                    </div>

                    {/* Premium Badge Overlay */}
                    {isPremium && (
                      <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Playlist Details */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-4xl md:text-6xl font-black bg-transparent border-0 text-white placeholder-white/50 focus:ring-0 p-0 h-auto"
                          placeholder="Playlist name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Add an optional description"
                          rows={2}
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-xl resize-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-3 text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsPublic}
                            onChange={(e) => setEditIsPublic(e.target.checked)}
                            className="w-5 h-5 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-lg">Make playlist public</span>
                        </label>
                        <Button
                          onClick={savePlaylistChanges}
                          disabled={!editName.trim() || saving}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-2 rounded-xl font-semibold"
                        >
                          {saving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            'Save'
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            setEditName(playlist.name);
                            setEditDescription(playlist.description || '');
                            setEditIsPublic(playlist.is_public);
                          }}
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-purple-400 bg-purple-500/20 px-3 py-1 rounded-full">
                          Playlist
                        </span>
                        {playlist.is_public && (
                          <span className="text-sm font-medium text-green-400 bg-green-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Public
                          </span>
                        )}
                      </div>

                      <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                        {playlist.name}
                      </h1>

                      {playlist.description && (
                        <p className="text-gray-300 text-lg md:text-xl max-w-2xl leading-relaxed">
                          {playlist.description}
                        </p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        <span className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          {videos.length} song{videos.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(playlist.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isEditing && (
                <div className="flex flex-wrap items-center gap-4">
                  {/* Play Button */}
                  <Button className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3 text-lg">
                    <Play className="w-6 h-6 ml-1" />
                    Play
                  </Button>

                  {/* Shuffle */}
                  <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full p-3">
                    <Shuffle className="w-6 h-6" />
                  </Button>

                  {/* Heart */}
                  <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full p-3">
                    <Heart className="w-6 h-6" />
                  </Button>

                  {/* Share */}
                  <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full p-3">
                    <Share className="w-6 h-6" />
                  </Button>

                  {/* More Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full p-3">
                        <MoreHorizontal className="w-6 h-6" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem
                        onClick={() => setIsEditing(true)}
                        className="text-white hover:bg-gray-700"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={deletePlaylist}
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Add Songs Button */}
                  <Button
                    onClick={() => setShowAddSongs(true)}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full px-6 py-3 font-semibold transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Songs
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Songs List Section */}
        <div className="max-w-6xl mx-auto px-8 pb-8">
          {videos.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <Music className="w-16 h-16 text-gray-500" />
                </div>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                  <Plus className="w-6 h-6 text-white" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-white mb-4">Let's add some songs</h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Start building your playlist by adding your favorite karaoke songs.
              </p>

              <Button
                onClick={() => setShowAddSongs(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-6 h-6 mr-2" />
                Add Your First Song
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 text-sm font-semibold text-gray-400 border-b border-gray-800/50">
                <div className="w-8">#</div>
                <div>Title</div>
                <div className="hidden md:block">Duration</div>
                <div className="w-8"></div>
              </div>

              {/* Songs List */}
              <div className="space-y-2">
                {videos.map((video, index) => (
                  <div
                    key={video.id}
                    className="group grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 items-center"
                  >
                    {/* Track Number / Play Button */}
                    <div className="w-8 flex items-center justify-center">
                      <div className="group-hover:hidden text-gray-400 font-medium">
                        {index + 1}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hidden group-hover:flex w-8 h-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-full"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Song Info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                          {video.title}
                        </h4>
                        <p className="text-gray-400 text-sm truncate">
                          {video.artist}
                          {video.is_premium && (
                            <span className="ml-2 inline-flex items-center">
                              <Crown className="w-3 h-3 text-yellow-400" />
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="hidden md:block text-gray-400 text-sm font-medium">
                      {video.duration}
                    </div>

                    {/* Actions */}
                    <div className="w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-8 h-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 border-gray-700 min-w-[200px]">
                          <DropdownMenuItem className="text-white hover:bg-gray-700">
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setShowVideoSelector(video.id);
                              if (!videoSuggestions[video.id] && !loadingSuggestions[video.id]) {
                                fetchVideoSuggestions(video.title, video.artist, video.id);
                              }
                            }}
                            className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                          >
                            <Shuffle className="w-4 h-4 mr-2" />
                            Change Video
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => removeVideoFromPlaylist(video.id)}
                            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove from playlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modern Add Songs Modal */}
        <Dialog open={showAddSongs} onOpenChange={setShowAddSongs}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl overflow-hidden">
            <DialogHeader className="space-y-4 p-6 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-white">Add Songs to Playlist</DialogTitle>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search for songs to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-lg"
                />
                {searching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500 transition-all duration-200 cursor-pointer group"
                      onClick={() => addVideoToPlaylist(video)}
                    >
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                          {video.title}
                        </h4>
                        <p className="text-gray-400 text-sm truncate">
                          {video.artist}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {video.is_premium && (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          <span className="text-gray-500 text-xs">{video.duration}</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery && !searching ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No songs found</h3>
                  <p className="text-gray-400">
                    Try searching for a different song or artist.
                  </p>
                </div>
              ) : !searchQuery ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Search for songs</h3>
                  <p className="text-gray-400">
                    Start typing to find karaoke songs to add to your playlist.
                  </p>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        {/* Video Selector Modal */}
        <Dialog open={showVideoSelector !== null} onOpenChange={() => setShowVideoSelector(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl overflow-hidden">
            <DialogHeader className="space-y-4 p-6 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Shuffle className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Choose Video for "{videos.find(v => v.id === showVideoSelector)?.title}"
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {showVideoSelector && loadingSuggestions[showVideoSelector] ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-white mb-2">Finding videos...</h3>
                  <p className="text-gray-400">
                    Searching for karaoke videos for this song.
                  </p>
                </div>
              ) : showVideoSelector && videoSuggestions[showVideoSelector]?.length > 0 ? (
                <div className="space-y-4">
                  {/* Current Video Option */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Current Video</h4>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-green-500/10 border-2 border-green-500/30">
                      <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <img
                        src={videos.find(v => v.id === showVideoSelector)?.thumbnail_url}
                        alt="Current video"
                        className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">Currently Selected</p>
                        <p className="text-gray-400 text-sm">This is the video linked to this song</p>
                      </div>
                      <Button
                        onClick={() => unlinkPlaylistVideo(showVideoSelector)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Unlink
                      </Button>
                    </div>
                  </div>

                  {/* Alternative Video Options */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Alternative Videos</h4>
                    <div className="space-y-3">
                      {videoSuggestions[showVideoSelector].map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center gap-4 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-purple-500 transition-all duration-200 cursor-pointer group"
                          onClick={() => changePlaylistVideo(showVideoSelector, suggestion.id)}
                        >
                          <img
                            src={suggestion.thumbnail_url}
                            alt={suggestion.youtube_video_title}
                            className="w-16 h-12 rounded-lg object-cover flex-shrink-0 shadow-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                                {suggestion.youtube_video_title}
                              </p>
                              {suggestion.is_premium && (
                                <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-gray-400 text-sm truncate">
                              {suggestion.youtube_channel_name || 'Unknown Channel'}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">
                                {suggestion.youtube_video_duration ? `${Math.floor(suggestion.youtube_video_duration / 60)}:${(suggestion.youtube_video_duration % 60).toString().padStart(2, '0')}` : 'Unknown'}
                              </span>
                              {suggestion.karaokeScore && (
                                <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                                  Score: {Math.round(suggestion.karaokeScore)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-purple-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : showVideoSelector ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shuffle className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No alternative videos found</h3>
                  <p className="text-gray-400">
                    Try searching for this song in the add songs modal to find more options.
                  </p>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </KaraokeLayout>
  );
}