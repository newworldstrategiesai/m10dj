'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Play,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  Filter,
  Star,
  Music,
  Monitor,
  Info,
  Grid3X3,
  List,
  Heart,
  BookmarkPlus,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Shuffle,
  Repeat,
  SkipBack,
  SkipForward,
  Pause,
  Library,
  Tag,
  Clock,
  Eye,
  ThumbsUp,
  FolderPlus,
  Share2,
  Copy,
  MoreVertical,
  X
} from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '@/utils/youtube-api';
import YouTubePlayer from '@/components/karaoke/YouTubePlayer';

interface KaraokeVideo {
  id: string;
  song_title: string;
  song_artist?: string;
  youtube_video_id: string;
  youtube_video_title: string;
  youtube_channel_name?: string;
  youtube_channel_id?: string;
  video_quality_score: number;
  confidence_score: number;
  link_status: 'active' | 'broken' | 'removed' | 'flagged';
  created_at: string;
  source: string;
}

interface VideoSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  karaokeScore: number;
  relevanceScore: number;
  viewCount: number;
  duration: string;
  publishedAt: string;
  thumbnailUrl: string;
  existingLink?: {
    id: string;
    qualityScore: number;
    confidenceScore: number;
  };
}

interface VideoManagerProps {
  organizationId: string;
}

interface VideoLibraryItem {
  id: string;
  title: string;
  artist?: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
  duration: string;
  channelTitle: string;
  qualityScore: number;
  isFavorite: boolean;
  tags: string[];
  addedAt: string;
  playCount: number;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  createdAt: string;
  isPublic: boolean;
}

interface PlayerState {
  videoId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
}

export default function VideoManager({ organizationId }: VideoManagerProps) {
  const { toast } = useToast();

  // State
  const [videos, setVideos] = useState<KaraokeVideo[]>([]);
  const [libraryVideos, setLibraryVideos] = useState<VideoLibraryItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkingSong, setLinkingSong] = useState<{ title: string; artist?: string } | null>(null);
  const [searchResults, setSearchResults] = useState<VideoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<{
    inProgress: boolean;
    progress: number;
    total: number;
  } | null>(null);

  // Enhanced UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'search' | 'library' | 'playlists'>('search');
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [playerState, setPlayerState] = useState<PlayerState>({
    videoId: null,
    isPlaying: false,
    isMuted: false,
    volume: 50,
    currentTime: 0,
    duration: 0
  });
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    minQuality: 0,
    maxDuration: 600, // 10 minutes
    channel: '',
    hasLyrics: null as boolean | null,
    sortBy: 'karaokeScore' as 'karaokeScore' | 'viewCount' | 'date' | 'relevance'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  // Load videos and initialize data
  useEffect(() => {
    loadVideos();
    loadLibrary();
    loadPlaylists();
  }, [organizationId]);

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'library' && libraryVideos.length === 0) {
      loadLibrary();
    } else if (activeTab === 'playlists' && playlists.length === 0) {
      loadPlaylists();
    }
  }, [activeTab]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/karaoke/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to load video library',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search for videos
  const searchVideos = async (songTitle?: string, songArtist?: string, isGeneralSearch = false) => {
    const query = songTitle || searchTerm;
    if (!query.trim()) return;

    setSearching(true);
    try {
      const response = await fetch('/api/karaoke/search-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: isGeneralSearch ? null : query.trim(),
          songArtist: songArtist?.trim(),
          organizationId,
          maxResults: 50,
          filters: searchFilters,
          generalSearch: isGeneralSearch ? query.trim() : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.videos || []);
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Video search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Unable to search for videos. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  };

  // Add video to library
  const addToLibrary = async (video: VideoSearchResult, customTitle?: string, customArtist?: string, tags: string[] = []) => {
    try {
      const libraryItem = {
        title: customTitle || video.title,
        artist: customArtist,
        youtubeVideoId: video.id,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        channelTitle: video.channelTitle,
        qualityScore: video.karaokeScore,
        isFavorite: false,
        tags
      };

      const response = await fetch('/api/karaoke/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'add',
          video: libraryItem
        })
      });

      if (response.ok) {
        toast({
          title: 'Added to Library',
          description: `"${libraryItem.title}" has been added to your video library.`
        });
        loadLibrary();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to library');
      }
    } catch (error) {
      console.error('Add to library error:', error);
      toast({
        title: 'Failed to Add',
        description: 'Unable to add video to library. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Load video library
  const loadLibrary = async () => {
    try {
      const response = await fetch('/api/karaoke/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'get'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLibraryVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Load library error:', error);
    }
  };

  // Load playlists
  const loadPlaylists = async () => {
    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'get'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      }
    } catch (error) {
      console.error('Load playlists error:', error);
    }
  };

  // Link video to song
  const linkVideo = async (youtubeVideoId: string, videoData: VideoSearchResult) => {
    if (!linkingSong) return;

    setLinking(true);
    try {
      const response = await fetch('/api/karaoke/link-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: linkingSong.title,
          songArtist: linkingSong.artist,
          youtubeVideoId,
          organizationId,
          source: 'manual'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Video Linked',
          description: `Successfully linked "${linkingSong.title}" to video`,
        });

        // Refresh videos list
        loadVideos();
        setShowLinkDialog(false);
        setLinkingSong(null);
        setSearchResults([]);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link video');
      }
    } catch (error: unknown) {
      console.error('Video linking error:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Failed to link video';
      toast({
        title: 'Linking Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLinking(false);
    }
  };

  // Bulk link videos for unlinked songs
  const bulkLinkVideos = async () => {
    try {
      // Get unlinked signups
      const response = await fetch('/api/karaoke/unlinked-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      });
      if (!response.ok) throw new Error('Failed to get unlinked songs');

      const data = await response.json();
      const unlinkedSongs = data.songs || [];

      if (unlinkedSongs.length === 0) {
        toast({
          title: 'No Unlinked Songs',
          description: 'All songs already have video links',
        });
        return;
      }

      setBulkOperation({
        inProgress: true,
        progress: 0,
        total: unlinkedSongs.length
      });

      // Process in batches
      const batchSize = 5;
      let processed = 0;

      for (let i = 0; i < unlinkedSongs.length; i += batchSize) {
        const batch = unlinkedSongs.slice(i, i + batchSize);

        const bulkResponse = await fetch('/api/karaoke/bulk-link-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            songQueries: batch.map((song: { id: string; song_title: string; song_artist?: string }) => ({
              songTitle: song.song_title,
              songArtist: song.song_artist,
              signupId: song.id
            })),
            autoLink: true,
            minQualityScore: 70
          })
        });

        if (bulkResponse.ok) {
          const bulkData = await bulkResponse.json();
          processed += batch.length;

          setBulkOperation(prev => prev ? {
            ...prev,
            progress: processed
          } : null);
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Final refresh
      loadVideos();
      setBulkOperation(null);

      toast({
        title: 'Bulk Linking Complete',
        description: `Processed ${unlinkedSongs.length} songs`,
      });

    } catch (error) {
      console.error('Bulk linking error:', error);
      setBulkOperation(null);
      toast({
        title: 'Bulk Linking Failed',
        description: 'Some videos may not have been linked. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Open video in a display-optimized window
  const openVideoInDisplayWindow = (videoId: string, songTitle: string, songArtist?: string) => {
    const videoUrl = getYouTubeEmbedUrl(videoId);
    const displayUrl = `/karaoke/video-display?videoId=${encodeURIComponent(videoId)}&title=${encodeURIComponent(songTitle)}&artist=${encodeURIComponent(songArtist || '')}`;

    // Open in a new window optimized for secondary display
    const newWindow = window.open(
      displayUrl,
      'karaokeVideoDisplay',
      'width=1280,height=720,scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no,location=no,directories=no'
    );

    // Focus the new window
    if (newWindow) {
      newWindow.focus();
    }
  };

  // Filter videos
  const filteredVideos = videos.filter(video => {
    const matchesSearch = !searchTerm ||
      video.song_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.song_artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.youtube_video_title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || video.link_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Shift + D = Open first video in display window
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        const firstVideo = filteredVideos[0];
        if (firstVideo) {
          openVideoInDisplayWindow(
            firstVideo.youtube_video_id,
            firstVideo.song_title,
            firstVideo.song_artist
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [filteredVideos]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>;
      case 'broken':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />Broken</Badge>;
      case 'flagged':
        return <Badge className="bg-yellow-500 text-white"><AlertTriangle className="w-3 h-3 mr-1" />Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Check if video is from Karafun
  const isKarafunVideo = (channelName?: string, channelId?: string) => {
    if (!channelName && !channelId) return false;
    const karafunTerms = (process.env.NEXT_PUBLIC_KARAFUN_CHANNEL_IDS || 'karafun').split(',');
    return karafunTerms.some(term =>
      channelId?.toLowerCase().includes(term.toLowerCase()) ||
      channelName?.toLowerCase().includes(term.toLowerCase())
    );
  };

  // Get quality color
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Player controls
  const playVideo = (videoId: string) => {
    setPlayerState(prev => ({
      ...prev,
      videoId,
      isPlaying: true
    }));
    setShowPlayer(true);
  };

  const pauseVideo = () => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: false
    }));
  };

  const toggleMute = () => {
    setPlayerState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
  };

  const previewVideo = (videoId: string) => {
    setPreviewVideoId(videoId);
  };

  const closePreview = () => {
    setPreviewVideoId(null);
  };

  // Toggle selection for bulk operations
  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  // Toggle favorite status for library videos
  const toggleFavorite = async (videoId: string) => {
    try {
      const response = await fetch('/api/karaoke/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'toggle-favorite',
          videoId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setLibraryVideos(prev => prev.map(video =>
          video.id === videoId
            ? { ...video, isFavorite: data.video.is_favorite }
            : video
        ));

        toast({
          title: data.video.is_favorite ? 'Added to Favorites' : 'Removed from Favorites',
          description: `"${data.video.title}" ${data.video.is_favorite ? 'added to' : 'removed from'} favorites.`
        });
      } else {
        throw new Error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      toast({
        title: 'Failed to Update',
        description: 'Unable to update favorite status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Bulk add to library
  const bulkAddToLibrary = async () => {
    if (selectedVideos.size === 0) return;

    const videosToAdd = searchResults.filter(video => selectedVideos.has(video.id));
    let successCount = 0;

    for (const video of videosToAdd) {
      try {
        await addToLibrary(video);
        successCount++;
      } catch (error) {
        console.error('Failed to add video:', video.id, error);
      }
    }

    setSelectedVideos(new Set());
    toast({
      title: 'Bulk Add Complete',
      description: `Added ${successCount} of ${videosToAdd.length} videos to library.`
    });
  };

  // Create new playlist
  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'create',
          name: newPlaylistName.trim(),
          description: newPlaylistDescription.trim() || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(prev => [data.playlist, ...prev]);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowCreatePlaylist(false);

        toast({
          title: 'Playlist Created',
          description: `"${data.playlist.name}" has been created.`
        });
      } else {
        throw new Error('Failed to create playlist');
      }
    } catch (error) {
      console.error('Create playlist error:', error);
      toast({
        title: 'Failed to Create',
        description: 'Unable to create playlist. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Filter and sort search results
  const filteredSearchResults = searchResults
    .filter(result => {
      if (searchFilters.minQuality > 0 && result.karaokeScore < searchFilters.minQuality) return false;
      if (searchFilters.channel && !result.channelTitle.toLowerCase().includes(searchFilters.channel.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (searchFilters.sortBy) {
        case 'viewCount':
          return b.viewCount - a.viewCount;
        case 'date':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        default:
          return b.karaokeScore - a.karaokeScore;
      }
    });

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            YouTube Video Manager
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search, preview, and manage karaoke videos in your library
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={bulkLinkVideos}
            disabled={bulkOperation?.inProgress}
          >
            {bulkOperation?.inProgress ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Bulk Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadVideos}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Video Player */}
      {showPlayer && playerState.videoId && (
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
          <div className="relative">
            <YouTubePlayer
              videoId={playerState.videoId}
              isPlaying={playerState.isPlaying}
              muted={playerState.isMuted}
              volume={playerState.volume}
              onStateChange={(state) => setPlayerState(prev => ({ ...prev, isPlaying: state === 'playing' }))}
              className="w-full aspect-video"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPlayer(false)}
              className="absolute top-2 right-2 text-white hover:bg-black/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Player Controls */}
          <div className="bg-gray-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={playerState.isPlaying ? pauseVideo : () => playVideo(playerState.videoId!)}
                className="text-white hover:bg-gray-700"
              >
                {playerState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-gray-700"
              >
                {playerState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
            <div className="text-white text-sm">
              {playerState.currentTime > 0 && (
                <span>{Math.floor(playerState.currentTime / 60)}:{(playerState.currentTime % 60).toFixed(0).padStart(2, '0')} / {Math.floor(playerState.duration / 60)}:{(playerState.duration % 60).toFixed(0).padStart(2, '0')}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Videos
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="w-4 h-4" />
            My Library ({libraryVideos.length})
          </TabsTrigger>
          <TabsTrigger value="playlists" className="flex items-center gap-2">
            <BookmarkPlus className="w-4 h-4" />
            Playlists ({playlists.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for karaoke songs or videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchVideos(undefined, undefined, true)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => searchVideos(undefined, undefined, true)} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Min Quality</label>
                    <Select value={searchFilters.minQuality.toString()} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, minQuality: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Any</SelectItem>
                        <SelectItem value="50">50+</SelectItem>
                        <SelectItem value="70">70+</SelectItem>
                        <SelectItem value="80">80+</SelectItem>
                        <SelectItem value="90">90+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Duration</label>
                    <Select value={searchFilters.maxDuration.toString()} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, maxDuration: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">5 min</SelectItem>
                        <SelectItem value="600">10 min</SelectItem>
                        <SelectItem value="900">15 min</SelectItem>
                        <SelectItem value="1800">30 min</SelectItem>
                        <SelectItem value="3600">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Channel</label>
                    <Input
                      placeholder="Filter by channel"
                      value={searchFilters.channel}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, channel: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort By</label>
                    <Select value={searchFilters.sortBy} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, sortBy: value as typeof searchFilters.sortBy }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="karaokeScore">Karaoke Score</SelectItem>
                        <SelectItem value="viewCount">View Count</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="relevance">Relevance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Actions */}
            {selectedVideos.size > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    {selectedVideos.size} video{selectedVideos.size > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={bulkAddToLibrary}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Library
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedVideos(new Set())}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

      {/* Bulk Operation Progress */}
      {bulkOperation?.inProgress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Linking videos... ({bulkOperation.progress}/{bulkOperation.total})
              </p>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(bulkOperation.progress / bulkOperation.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-2">
        <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
          <Info className="w-4 h-4" />
          <span className="font-semibold">Quick Display:</span>
          <kbd className="px-2 py-1 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-700 text-xs font-mono">Ctrl+Shift+D</kbd>
          <span>Open first video in display window</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search songs, artists, or videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="broken">Broken</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Video List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading video library...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-12 text-center">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No videos found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {videos.length === 0
                ? "Start by linking videos to your karaoke songs"
                : "Try adjusting your search or filters"
              }
            </p>
            <Button onClick={() => setShowLinkDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Link First Video
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredVideos.map((video) => (
              <div key={video.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        "{video.song_title}"
                        {video.song_artist && ` - ${video.song_artist}`}
                      </h3>
                      {getStatusBadge(video.link_status)}
                      {isKarafunVideo(video.youtube_channel_name, video.youtube_channel_id) && (
                        <Badge className="bg-purple-500 text-white flex items-center gap-1 px-2 py-0.5 text-xs font-semibold">
                          <Music className="w-3 h-3" />
                          Karafun
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Linked to: <span className="font-medium">{video.youtube_video_title}</span>
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Star className={`w-4 h-4 ${getQualityColor(video.video_quality_score)}`} />
                        Quality: {video.video_quality_score}/100
                        {isKarafunVideo(video.youtube_channel_name, video.youtube_channel_id) && (
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            (Karafun Boosted)
                          </span>
                        )}
                      </span>
                      {video.youtube_channel_name && (
                        <span>Channel: {video.youtube_channel_name}</span>
                      )}
                      <span>Source: {video.source}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getYouTubeWatchUrl(video.youtube_video_id), '_blank')}
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getYouTubeEmbedUrl(video.youtube_video_id), '_blank')}
                      title="Open embed player"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openVideoInDisplayWindow(video.youtube_video_id, video.song_title, video.song_artist)}
                      title="Open in display window (drag to second screen)"
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {filteredSearchResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Search Results ({filteredSearchResults.length})
            </h4>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedVideos.size === filteredSearchResults.length && filteredSearchResults.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedVideos(new Set(filteredSearchResults.map(v => v.id)));
                  } else {
                    setSelectedVideos(new Set());
                  }
                }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Select All</span>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSearchResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Thumbnail with overlay */}
                  <div className="relative group">
                    <img
                      src={result.thumbnailUrl}
                      alt={result.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => playVideo(result.id)}
                          className="bg-black/70 hover:bg-black/90 text-white"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => previewVideo(result.id)}
                          className="bg-black/70 hover:bg-black/90 text-white border-white/30"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedVideos.has(result.id)}
                        onCheckedChange={() => toggleVideoSelection(result.id)}
                        className="bg-white/90 border-gray-300"
                      />
                    </div>

                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {result.duration.replace('PT', '').toLowerCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3">
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                      {result.title}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {result.channelTitle}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${result.karaokeScore >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                          {result.karaokeScore}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {result.viewCount.toLocaleString()} views
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addToLibrary(result)}
                          title="Add to library"
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getYouTubeWatchUrl(result.id), '_blank')}
                          title="Open in YouTube"
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredSearchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <Checkbox
                    checked={selectedVideos.has(result.id)}
                    onCheckedChange={() => toggleVideoSelection(result.id)}
                  />

                  <img
                    src={result.thumbnailUrl}
                    alt={result.title}
                    className="w-16 h-12 object-cover rounded"
                  />

                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 dark:text-white truncate">
                      {result.title}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {result.channelTitle} • {result.viewCount.toLocaleString()} views • {result.duration.replace('PT', '').toLowerCase()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={result.karaokeScore >= 70 ? 'bg-green-500' : 'bg-yellow-500'}>
                        Score: {result.karaokeScore}
                      </Badge>
                      {result.existingLink && (
                        <Badge variant="outline" className="text-blue-600">
                          Already linked
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => playVideo(result.id)}
                      title="Play video"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToLibrary(result)}
                      title="Add to library"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(getYouTubeWatchUrl(result.id), '_blank')}
                      title="Open in YouTube"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {filteredSearchResults.length === 0 && !searching && searchTerm && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No videos found</h3>
          <p>Try adjusting your search terms or filters</p>
        </div>
      )}
    </TabsContent>


        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Video Library</h3>
            <Button variant="outline" size="sm" onClick={loadLibrary}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {libraryVideos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Library className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Your library is empty</h3>
              <p>Search for videos and add them to your library to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {libraryVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative group">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Button
                        size="sm"
                        onClick={() => playVideo(video.youtubeVideoId)}
                        className="bg-black/70 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>

                    {video.isFavorite && (
                      <div className="absolute top-2 left-2">
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration.replace('PT', '').toLowerCase()}
                    </div>
                  </div>

                  <div className="p-3">
                    <h5 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                      {video.title}
                      {video.artist && ` - ${video.artist}`}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {video.channelTitle}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${video.qualityScore >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`}>
                          {video.qualityScore}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Played {video.playCount}x
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getYouTubeWatchUrl(video.youtubeVideoId), '_blank')}
                          title="Open in YouTube"
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(video.id)}
                          title="Toggle favorite"
                          className="h-8 w-8 p-0"
                        >
                          <Heart className={`w-3 h-3 ${video.isFavorite ? 'text-red-500 fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Playlists</h3>
            <Button variant="outline" size="sm" onClick={() => setShowCreatePlaylist(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BookmarkPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No playlists yet</h3>
              <p>Create playlists to organize your karaoke videos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{playlist.name}</h4>
                    <Badge variant="outline">{playlist.videoIds.length} videos</Badge>
                  </div>
                  {playlist.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{playlist.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
                    {playlist.isPublic && <Badge variant="outline" className="text-xs">Public</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Video Preview Modal */}
      <Dialog open={!!previewVideoId} onOpenChange={() => closePreview()}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Video Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            {previewVideoId && (
              <YouTubePlayer
                videoId={previewVideoId}
                isPlaying={false}
                muted={true}
                volume={30}
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Video Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link YouTube Video</DialogTitle>
            <DialogDescription>
              Search for and link a YouTube video to a karaoke song
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Song Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Song Title *
                </label>
                <Input
                  placeholder="Enter song title"
                  value={linkingSong?.title || ''}
                  onChange={(e) => setLinkingSong(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Artist (Optional)
                </label>
                <Input
                  placeholder="Enter artist name"
                  value={linkingSong?.artist || ''}
                  onChange={(e) => setLinkingSong(prev => prev ? {
                    ...prev,
                    artist: e.target.value || undefined
                  } : null)}
                />
              </div>
            </div>

            {/* Search Button */}
            <Button
              onClick={() => linkingSong?.title && searchVideos(linkingSong.title, linkingSong.artist)}
              disabled={searching || !linkingSong?.title}
              className="w-full"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search YouTube Videos
                </>
              )}
            </Button>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Search Results ({searchResults.length})
                </h4>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <img
                        src={result.thumbnailUrl}
                        alt={result.title}
                        className="w-16 h-12 object-cover rounded"
                      />

                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {result.channelTitle} • {result.viewCount.toLocaleString()} views
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={result.karaokeScore >= 70 ? 'bg-green-500' : 'bg-yellow-500'}>
                            Score: {result.karaokeScore}
                          </Badge>
                          {result.existingLink && (
                            <Badge variant="outline" className="text-blue-600">
                              Already linked
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getYouTubeWatchUrl(result.id), '_blank')}
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVideoInDisplayWindow(result.id, linkingSong?.title || 'Unknown Song', linkingSong?.artist)}
                          title="Open in display window"
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
                        >
                          <Monitor className="w-4 h-4" />
                        </Button>

                        {!result.existingLink && (
                          <Button
                            size="sm"
                            onClick={() => linkVideo(result.id, result)}
                            disabled={linking}
                          >
                            {linking ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Link'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length === 0 && !searching && linkingSong?.title && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Search YouTube Videos" to find videos for this song</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Create a playlist to organize your favorite karaoke videos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Playlist Name *
              </label>
              <Input
                placeholder="Enter playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                placeholder="Describe your playlist..."
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowCreatePlaylist(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                className="flex-1"
              >
                Create Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}