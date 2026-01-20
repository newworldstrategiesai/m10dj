'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/Toasts/use-toast';
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
  Info
} from 'lucide-react';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '@/utils/youtube-api';

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

export default function VideoManager({ organizationId }: VideoManagerProps) {
  const { toast } = useToast();

  // State
  const [videos, setVideos] = useState<KaraokeVideo[]>([]);
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

  // Load videos
  useEffect(() => {
    loadVideos();
  }, [organizationId]);

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

  // Search for videos to link
  const searchVideos = async (songTitle: string, songArtist?: string) => {
    if (!songTitle.trim()) return;

    setSearching(true);
    try {
      const response = await fetch('/api/karaoke/search-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: songTitle.trim(),
          songArtist: songArtist?.trim(),
          organizationId,
          maxResults: 10
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Video Library
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage YouTube video links for karaoke songs
          </p>
        </div>
        <div className="flex gap-2">
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
    </div>
  );
}