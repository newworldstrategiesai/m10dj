'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Search,
  X,
  Music,
  Clock,
  Users,
  Lock,
  Crown,
  Plus,
  Monitor
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface KaraokePlayerPanelProps {
  onClose: () => void;
  isPremium: boolean;
  displayWindow?: Window | null;
  displayVideo?: {
    videoId: string;
    title: string;
    artist: string;
    thumbnailUrl: string;
  } | null;
  onDisplayWindowChange?: (window: Window | null) => void;
  onDisplayVideoChange?: (video: any) => void;
  signups?: any[]; // Current signups from admin interface
  onSignupStatusChange?: (signupId: string, status: string) => void; // Callback to update signup status
}

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnailUrl: string;
  isPremium?: boolean;
  signupData?: any; // Reference to original signup data
}

export default function KaraokePlayerPanel({
  onClose,
  isPremium,
  displayWindow: propDisplayWindow,
  displayVideo: propDisplayVideo,
  onDisplayWindowChange,
  onDisplayVideoChange,
  signups = [],
  onSignupStatusChange
}: KaraokePlayerPanelProps) {
  const { toast } = useToast();

  // Debug window reference
  console.log('🎪 KaraokePlayerPanel render - displayWindow:', propDisplayWindow, 'closed:', propDisplayWindow?.closed);
  const [logoError, setLogoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSong, setCurrentSong] = useState<QueueItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New state for sidebar view toggle
  const [sidebarView, setSidebarView] = useState<'queue' | 'browse'>('queue');
  const [browseSearchQuery, setBrowseSearchQuery] = useState('');
  const [browseResults, setBrowseResults] = useState<any[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  // Use props for display window tracking
  const [displayStatus, setDisplayStatus] = useState<{
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
  } | null>(null);

  // Prevent hydration errors by ensuring browser APIs are only used after mount
  const [mounted, setMounted] = useState(false);

  // Progress bar interaction state
  const [progressHoverTime, setProgressHoverTime] = useState<number | null>(null);
  const [progressHoverPosition, setProgressHoverPosition] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Loading states
  const [isCommandLoading, setIsCommandLoading] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  // Derive queue from signups that have videos and are queued/next
  const queue = signups
    .filter(signup => signup.video_data && ['queued', 'next'].includes(signup.status))
    .sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0))
    .map(signup => ({
      id: signup.id,
      title: signup.song_title,
      artist: signup.song_artist || '',
      duration: signup.video_data?.youtube_video_duration || '0:00',
      thumbnailUrl: `https://img.youtube.com/vi/${signup.video_data?.youtube_video_id}/default.jpg`,
      isPremium: signup.video_data?.is_premium || false,
      signupData: signup // Keep reference to original signup
    }));

  // Current playing signup (if any)
  const currentSignup = signups.find(signup => signup.status === 'singing');

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Set mounted after component mounts to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<QueueItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Mock data for demonstration
  const mockQueue: QueueItem[] = [
    {
      id: '1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      duration: '5:55',
      thumbnailUrl: '/api/placeholder/60/60',
      isPremium: false
    },
    {
      id: '2',
      title: 'Hotel California',
      artist: 'Eagles',
      duration: '6:30',
      thumbnailUrl: '/api/placeholder/60/60',
      isPremium: true
    },
    {
      id: '3',
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      duration: '8:02',
      thumbnailUrl: '/api/placeholder/60/60',
      isPremium: false
    }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const clearQueue = () => {
    // Clear queue by updating all queued signups to cancelled status
    queue.forEach(item => {
      if (item.signupData && onSignupStatusChange) {
        onSignupStatusChange(item.signupData.id, 'cancelled');
      }
    });
  };

  const removeFromQueue = (songId: string) => {
    // Remove from queue by updating signup status
    const item = queue.find(item => item.id === songId);
    if (item?.signupData && onSignupStatusChange) {
      onSignupStatusChange(item.signupData.id, 'cancelled');
    }
  };

  // Browse/search functionality
  const searchSongs = async (query: string) => {
    if (!query.trim()) {
      setBrowseResults([]);
      return;
    }

    setBrowseLoading(true);
    try {
      const supabase = (window as any).supabaseClient || createClient();
      const { data, error } = await supabase
        .from('karaoke_song_videos')
        .select('*')
        .or(`song_title.ilike.%${query}%,song_artist.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      setBrowseResults(data || []);
    } catch (error) {
      console.error('Error searching songs:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search songs. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setBrowseLoading(false);
    }
  };

  const addSongToQueue = (song: any) => {
    // Since we're now managing signups through the admin interface,
    // we can't directly add songs to queue from the browse view
    // This would require creating a new signup or linking to existing one
    toast({
      title: 'Browse Mode',
      description: 'Use the admin interface to add signups to the queue',
    });
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (browseSearchQuery) {
        searchSongs(browseSearchQuery);
      } else {
        setBrowseResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [browseSearchQuery]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: QueueItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', item.id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedItem) return;

    const draggedIndex = queue.findIndex(item => item.id === draggedItem.id);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    // Calculate new priority order for the dragged item
    const draggedSignup = draggedItem.signupData;
    if (draggedSignup && onSignupStatusChange) {
      // For simplicity, we'll just update the priority order
      // In a real implementation, you might want more sophisticated reordering
      const basePriority = draggedSignup.priority_order || 0;
      const newPriority = dropIndex < draggedIndex ? basePriority - 100 : basePriority + 100;

      // This would need to be implemented in the admin interface
      // For now, just show a message
      toast({
        title: 'Queue reordering',
        description: 'Use the admin interface to reorder signups',
      });
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const totalQueueTime = queue.reduce((total, song) => {
    const [mins, secs] = song.duration.split(':').map(Number);
    return total + mins * 60 + secs;
  }, 0);

  // Listen for status updates from display window - SIMPLE APPROACH
  useEffect(() => {
    // Only run on client side to prevent hydration errors
    if (!mounted) return;

    const handleMessage = (event: MessageEvent) => {
      console.log('🎧 SIMPLE: Received message:', event.data, 'from origin:', event.origin);

      // Accept messages from our display window or any localhost/tipjar domain
      const isValidOrigin = event.origin === window.location.origin ||
                           event.origin === 'null' ||
                           event.origin.includes('localhost') ||
                           event.origin.includes('tipjar.live') ||
                           event.origin.includes('m10djcompany.com');

      if (!isValidOrigin) {
        console.log('🚫 Rejected message from invalid origin:', event.origin);
        return;
      }

      const { type, data } = event.data;

      if (type === 'VIDEO_STATUS') {
        console.log('📊 Processing VIDEO_STATUS:', data);
        setDisplayStatus({
          isPlaying: data.playerState === 1 || data.isPlaying,
          currentTime: data.currentTime || 0,
          duration: data.duration || 0,
          volume: data.volume || 50
        });

        // Update display video info if we don't have it
        if (!propDisplayVideo && data.videoId && onDisplayVideoChange) {
          onDisplayVideoChange({
            videoId: data.videoId,
            title: data.title || 'Unknown Title',
            artist: data.artist || 'Unknown Artist',
            thumbnailUrl: `https://img.youtube.com/vi/${data.videoId}/default.jpg`
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('✅ Listening for display window messages');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [propDisplayVideo, onDisplayVideoChange, mounted]);

  // Send control command to display window - SIMPLE APPROACH
  const sendDisplayCommand = async (action: string, data?: any) => {
    console.log('🎮 SIMPLE: Sending command:', action, 'to window:', propDisplayWindow);

    if (!propDisplayWindow || propDisplayWindow.closed) {
      console.warn('❌ No display window available');
      return;
    }

    setIsCommandLoading(true);

    const message = {
      type: 'VIDEO_CONTROL',
      data: { action, ...data },
      timestamp: Date.now(),
      source: 'player_panel'
    };

    try {
      // ONLY use direct postMessage - simplest approach
      console.log('📤 Sending to display window:', message);
      propDisplayWindow.postMessage(message, window.location.origin);

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error('❌ Error sending command:', error);
    } finally {
      setIsCommandLoading(false);
    }
  };

  // Control functions for external display
  const toggleDisplayPlayPause = () => {
    if (displayStatus?.isPlaying) {
      sendDisplayCommand('pause');
    } else {
      sendDisplayCommand('play');
    }
  };

  const stopDisplayVideo = () => {
    sendDisplayCommand('stop');
  };

  const setDisplayVolume = (newVolume: number) => {
    sendDisplayCommand('volume', { volume: newVolume });
    setVolume(newVolume);
  };

  const toggleDisplayMute = () => {
    if (isMuted) {
      sendDisplayCommand('unmute');
    } else {
      sendDisplayCommand('mute');
    }
    setIsMuted(!isMuted);
  };

  // Request status update from display window
  const updateDisplayStatus = () => {
    sendDisplayCommand('getStatus');
  };

  // Change video in display window
  const changeDisplayVideo = (video: { videoId: string; title: string; artist: string }) => {
    if (propDisplayWindow && !propDisplayWindow.closed) {
      sendDisplayCommand('changeVideo', video);
      // Update local state immediately for UI responsiveness
      onDisplayVideoChange?.(video);
    }
  };

  // Play a queue item in the display window
  const playQueueItem = (queueItem: QueueItem) => {
    if (!queueItem.signupData || !queueItem.signupData.video_data) {
      console.warn('Queue item missing video data:', queueItem);
      return;
    }

    const videoData = queueItem.signupData.video_data;
    const video = {
      videoId: videoData.youtube_video_id,
      title: queueItem.title,
      artist: queueItem.artist
    };

    // Change the video in the display window
    changeDisplayVideo(video);

    // Start playing the video immediately
    setTimeout(() => {
      sendDisplayCommand('play');
    }, 500); // Small delay to let video load

    // Update the signup status to 'singing'
    if (onSignupStatusChange) {
      onSignupStatusChange(queueItem.signupData.id, 'singing');
    }

    console.log('Playing queue item:', queueItem.title);
  };

  // Progress bar interaction functions
  const handleProgressHover = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !displayStatus?.duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * displayStatus.duration;

    setProgressHoverPosition(percentage * 100);
    setProgressHoverTime(time);
  };

  const handleProgressLeave = () => {
    setProgressHoverTime(null);
    setProgressHoverPosition(null);
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !displayStatus?.duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const seekTime = percentage * displayStatus.duration;

    sendDisplayCommand('seek', { seconds: seekTime });
    updateDisplayStatus();
  };

  // Check if display window is still open
  useEffect(() => {
    const checkDisplayWindow = () => {
      if (propDisplayWindow && propDisplayWindow.closed && onDisplayWindowChange) {
        onDisplayWindowChange(null);
        setDisplayStatus(null);
      }
    };

    const interval = setInterval(checkDisplayWindow, 1000);
    return () => clearInterval(interval);
  }, [propDisplayWindow, onDisplayWindowChange]);

  // Auto-play signup when status changes to singing
  useEffect(() => {
    if (currentSignup && currentSignup.video_data && propDisplayWindow && !propDisplayWindow.closed) {
      console.log('Auto-playing signup:', currentSignup);
      const videoData = {
        videoId: currentSignup.video_data.youtube_video_id,
        title: currentSignup.song_title,
        artist: currentSignup.song_artist || ''
      };

      // Update display video
      onDisplayVideoChange?.(videoData);

      // Send change video command to display window
      propDisplayWindow.postMessage({
        type: 'VIDEO_CONTROL',
        data: { action: 'changeVideo', ...videoData }
      }, window.location.origin);
    }
  }, [currentSignup, propDisplayWindow, onDisplayVideoChange]);

  // Touch gesture handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Swipe left: next track
    if (isLeftSwipe && displayStatus) {
      sendDisplayCommand('seek', { seconds: Math.min(displayStatus.duration, displayStatus.currentTime + 10) });
      updateDisplayStatus();
    }

    // Swipe right: previous track (or rewind)
    if (isRightSwipe && displayStatus) {
      sendDisplayCommand('seek', { seconds: Math.max(0, displayStatus.currentTime - 10) });
      updateDisplayStatus();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    // Only run on client side to prevent hydration errors
    if (!mounted) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when display window is active
      if (!propDisplayWindow || !displayStatus) return;

      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          toggleDisplayPlayPause();
          break;
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const newTime = Math.max(0, displayStatus.currentTime - 10);
            sendDisplayCommand('seek', { seconds: newTime });
            updateDisplayStatus();
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const newTime = Math.min(displayStatus.duration, displayStatus.currentTime + 10);
            sendDisplayCommand('seek', { seconds: newTime });
            updateDisplayStatus();
          }
          break;
        case 'KeyM':
          event.preventDefault();
          toggleDisplayMute();
          break;
        case 'ArrowUp':
          event.preventDefault();
          setDisplayVolume(Math.min(100, volume + 5));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setDisplayVolume(Math.max(0, volume - 5));
          break;
        case 'KeyR':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            updateDisplayStatus();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [propDisplayWindow, displayStatus, volume, toggleDisplayPlayPause, toggleDisplayMute, setDisplayVolume, sendDisplayCommand, updateDisplayStatus, mounted]);

  return (
    <aside className="w-full md:w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 flex flex-col karaoke-scrollbar shadow-2xl">
      {/* Enhanced Header with Modern Design */}
      <div className="relative h-36 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex flex-col items-center justify-center shadow-xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        </div>

        {/* Connection Status and Display Controls */}
        <div className="absolute top-3 left-3 right-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${propDisplayWindow && !propDisplayWindow.closed ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs text-white/80 font-medium">
              {propDisplayWindow && !propDisplayWindow.closed ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Open Display Window Button */}
          <button
            onClick={() => {
              // Open display window - use the same logic as the admin page
              const windowName = 'karaokeVideoDisplay';
              const existingWindow = window.open('', windowName);

              if (existingWindow && !existingWindow.closed) {
                // Window already exists, just focus it
                existingWindow.focus();
                // Request status update to sync with current state
                setTimeout(() => {
                  if (existingWindow) {
                    const targetOrigin = existingWindow.location?.origin || '*';
                    existingWindow.postMessage({
                      type: 'VIDEO_CONTROL',
                      data: { action: 'getStatus' }
                    }, targetOrigin);
                  }
                }, 500);
              } else {
                // Open new display window with default content
                const displayWindow = window.open('/karaoke/video-display', windowName, 'width=1280,height=720,scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no,location=no,directories=no');
                if (displayWindow) {
                  // Register the window
                  onDisplayWindowChange?.(displayWindow);

                  // If there's a current signup, load its video
                  if (currentSignup && currentSignup.video_data) {
                    setTimeout(() => {
                      const targetOrigin = displayWindow.location?.origin || '*';
                      displayWindow.postMessage({
                        type: 'VIDEO_CONTROL',
                        data: {
                          action: 'changeVideo',
                          videoId: currentSignup.video_data.youtube_video_id,
                          title: currentSignup.song_title,
                          artist: currentSignup.song_artist || ''
                        }
                      }, targetOrigin);
                    }, 1000);
                  }
                }
              }
            }}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1"
            title="Open Display Window"
          >
            <Monitor className="w-3 h-3" />
            Display
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all duration-200 hover:scale-110"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Logo and Branding */}
        <div className="relative z-10 text-center">
          {!logoError ? (
            <img
              src="/assets/karafun-logo.png"
              alt="Karafun"
              className="h-14 object-contain mb-2 drop-shadow-lg"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="mb-2">
              <span className="text-white font-bold text-2xl drop-shadow-lg">KARAFUN</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-white font-medium">Live Control</span>
          </div>
        </div>
      </div>

      {/* Enhanced Now Playing Section */}
      <div className="p-6 border-b border-gray-800/50 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
            Now Playing
          </h3>

          {/* Status indicator */}
          {displayStatus && (
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${displayStatus.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="text-gray-400">
                {displayStatus.isPlaying ? 'Playing' : 'Paused'}
              </span>
            </div>
          )}
        </div>

        {propDisplayVideo ? (
          <div className="space-y-6">
            {/* Header with display indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
                External Display
              </span>
              <button
                onClick={updateDisplayStatus}
                className="text-xs text-gray-400 hover:text-gray-300"
                title="Refresh status"
              >
                ↻
              </button>
            </div>

            {/* Enhanced Thumbnail with Visual Effects */}
            <div
              className="relative w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl group touch-manipulation"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Background pattern for loading state */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-50" />

              {thumbnailLoading && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <img
                src={propDisplayVideo.thumbnailUrl}
                alt={propDisplayVideo.title}
                className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                  thumbnailLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setThumbnailLoading(false)}
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/320/180';
                  setThumbnailLoading(false);
                }}
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Play/Pause overlay */}
              {displayStatus && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    displayStatus.isPlaying
                      ? 'bg-purple-500/90 scale-100 shadow-lg shadow-purple-500/50'
                      : 'bg-black/70 scale-90 hover:scale-100'
                  }`}>
                    {displayStatus.isPlaying ? (
                      <div className="flex gap-1">
                        <div className="w-1 h-8 bg-white animate-pulse" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-8 bg-white animate-pulse" style={{ animationDelay: '200ms' }} />
                        <div className="w-1 h-8 bg-white animate-pulse" style={{ animationDelay: '400ms' }} />
                      </div>
                    ) : (
                      <Play className="w-10 h-10 text-white ml-1" />
                    )}
                  </div>
                </div>
              )}

              {/* Quality badge */}
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                <span className="text-xs text-white font-medium">HD</span>
              </div>
            </div>

            {/* Enhanced Song Info */}
            <div className="text-center space-y-2">
              <div>
                <h4 className="font-bold text-white text-xl leading-tight line-clamp-2 hover:text-purple-300 transition-colors cursor-pointer">
                  {propDisplayVideo.title}
                </h4>
                <p className="text-purple-300 font-medium text-sm mt-1">
                  {currentSignup ? currentSignup.singer_name : propDisplayVideo.artist}
                </p>
                {currentSignup && (
                  <div className="mt-2 text-xs text-gray-400">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      Currently Singing
                    </span>
                  </div>
                )}
              </div>

              {/* Rich Metadata Display */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-gray-400 font-medium">YouTube</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Views</span>
                      <span className="text-white">2.1M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Likes</span>
                      <span className="text-white">45K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Uploaded</span>
                      <span className="text-white">2 years ago</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-gray-400 font-medium">Karaoke</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quality</span>
                      <span className="text-green-400">HD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lyrics</span>
                      <span className="text-green-400">✓ Available</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Source</span>
                      <span className="text-purple-400">Karafun</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Bar - Mirrors External Display */}
            {propDisplayWindow && !propDisplayWindow.closed && (
              <div className="space-y-3 relative bg-gray-800/20 rounded-lg p-4 border border-gray-700/30">
                {/* Progress Bar Label */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="font-medium">Live Progress</span>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      displayStatus && displayStatus.duration > 0 ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    <span>
                      {displayStatus && displayStatus.duration > 0 ? 'Mirroring Display' : 'Waiting for video...'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar Content */}
                {displayStatus && displayStatus.duration > 0 ? (
                  <div>
                    {/* Progress Bar Container */}
                    <div className="relative group">
                  <div
                    ref={progressBarRef}
                    className="w-full bg-gray-700/80 rounded-full h-2 cursor-pointer relative overflow-hidden hover:h-3 transition-all duration-200"
                    onMouseMove={handleProgressHover}
                    onMouseLeave={handleProgressLeave}
                    onClick={handleProgressClick}
                  >
                    {/* Background track */}
                    <div className="absolute inset-0 bg-gray-600/50 rounded-full" />

                    {/* Progress fill */}
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-200"
                      style={{ width: `${(displayStatus.currentTime / displayStatus.duration) * 100}%` }}
                    />

                    {/* Hover indicator */}
                    {progressHoverPosition !== null && (
                      <div
                        className="absolute top-0 h-full w-1 bg-white/80 rounded-full pointer-events-none transition-all duration-100"
                        style={{ left: `${progressHoverPosition}%` }}
                      />
                    )}
                  </div>

                  {/* Hover tooltip */}
                  {progressHoverTime !== null && (
                    <div
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10"
                      style={{
                        left: progressHoverPosition ? `${progressHoverPosition}%` : '50%'
                      }}
                    >
                      {formatTime(progressHoverTime)}
                    </div>
                  )}
                </div>

                {/* Time display with remaining time toggle */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-mono">
                    {formatTime(displayStatus.currentTime)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 hover:text-gray-400 cursor-pointer transition-colors">
                      -{formatTime(displayStatus.duration - displayStatus.currentTime)}
                    </span>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-400 font-mono">
                      {formatTime(displayStatus.duration)}
                    </span>
                  </div>
                </div>

                {/* Seek controls */}
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => {
                      const newTime = Math.max(0, displayStatus.currentTime - 10);
                      sendDisplayCommand('seek', { seconds: newTime });
                      updateDisplayStatus();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-gray-800/50"
                    title="Rewind 10s"
                  >
                    -10s
                  </button>
                  <button
                    onClick={() => {
                      const newTime = Math.max(0, displayStatus.currentTime - 30);
                      sendDisplayCommand('seek', { seconds: newTime });
                      updateDisplayStatus();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-gray-800/50"
                    title="Rewind 30s"
                  >
                    -30s
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={() => {
                      const newTime = Math.min(displayStatus.duration, displayStatus.currentTime + 10);
                      sendDisplayCommand('seek', { seconds: newTime });
                      updateDisplayStatus();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-gray-800/50"
                    title="Forward 10s"
                  >
                    +10s
                  </button>
                  <button
                    onClick={() => {
                      const newTime = Math.min(displayStatus.duration, displayStatus.currentTime + 30);
                      sendDisplayCommand('seek', { seconds: newTime });
                      updateDisplayStatus();
                    }}
                    className="text-xs text-gray-500 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-gray-800/50"
                    title="Forward 30s"
                  >
                    +30s
                    </button>
                  </div>
                  </div>
                ) : (
                  /* Loading state for progress bar */
                  <div className="space-y-3">
                    <div className="w-full bg-gray-700/80 rounded-full h-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gray-600/50 rounded-full" />
                      <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-500 to-gray-600 rounded-full animate-pulse w-1/3" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Waiting for video...</span>
                      <span>0:00 / 0:00</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Touch-Friendly Controls */}
            <div className="flex items-center justify-center gap-6 px-4">
              <button className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50 active:bg-gray-600/50 text-gray-400 hover:text-white active:text-white transition-all touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center">
                <SkipBack className="w-6 h-6" />
              </button>

              <button
                onClick={toggleDisplayPlayPause}
                disabled={isCommandLoading}
                className={`p-4 rounded-full text-white shadow-lg transition-all touch-manipulation min-w-[64px] min-h-[64px] flex items-center justify-center ${
                  isCommandLoading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'karaoke-gradient-primary hover:shadow-xl active:shadow-lg hover:scale-105 active:scale-95'
                }`}
                title="Space: Play/Pause"
              >
                {isCommandLoading ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : displayStatus?.isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>

              <button
                onClick={stopDisplayVideo}
                className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/50 active:bg-gray-600/50 text-gray-400 hover:text-white active:text-white transition-all touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Instructions */}
            <div className="md:hidden text-center">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-3">
                <p className="text-xs text-gray-300 mb-1">
                  <span className="font-medium">🎵 Touch Controls:</span>
                </p>
                <p className="text-xs text-gray-400">
                  Swipe thumbnail to seek • Tap play button to control
                </p>
              </div>
            </div>

            {/* Debug Controls (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 space-y-2">
                <div className="text-xs text-yellow-400 font-medium">🔧 Debug Controls</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => console.log('Display Window:', propDisplayWindow, 'Closed:', propDisplayWindow?.closed)}
                    className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                  >
                    Log Window
                  </button>
                  <button
                    onClick={() => sendDisplayCommand('ping')}
                    className="px-2 py-1 text-xs bg-blue-700 text-blue-200 rounded"
                  >
                    Ping Display
                  </button>
                  <button
                    onClick={() => updateDisplayStatus()}
                    className="px-2 py-1 text-xs bg-green-700 text-green-200 rounded"
                  >
                    Get Status
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Keyboard Shortcuts Help */}
            <div className="hidden md:block text-center">
              <div className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-800/30 px-2 py-1 rounded-full">
                <span>⌨️</span>
                <span>Space, ↑↓ vol, Ctrl+←→ seek</span>
              </div>
            </div>

            {/* Enhanced Volume Controls */}
            <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-medium">Volume</span>
                <span className="font-mono">{isMuted ? 'Muted' : `${volume}%`}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={toggleDisplayMute}
                  className={`p-3 rounded-full transition-all duration-200 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center ${
                    isMuted
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 active:bg-gray-500/50 hover:text-white active:text-white'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 relative">
                  <div
                    className="w-full bg-gray-700/80 rounded-full h-2 cursor-pointer hover:h-3 transition-all duration-200"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = Math.max(0, Math.min(1, x / rect.width));
                      const newVolume = Math.round(percentage * 100);
                      setDisplayVolume(newVolume);
                    }}
                  >
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-200"
                      style={{ width: `${isMuted ? 0 : volume}%` }}
                    />
                  </div>

                  {/* Volume level indicator */}
                  <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              {/* Quick volume presets */}
              <div className="flex justify-center gap-2">
                {[25, 50, 75, 100].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDisplayVolume(preset)}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      volume === preset && !isMuted
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Visualization */}
            {displayStatus?.isPlaying && (
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400 font-medium">Audio Levels</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>

                {/* Spectrum Bars */}
                <div className="flex items-end justify-center gap-1 h-12">
                  {Array.from({ length: 12 }, (_, i) => {
                    const height = Math.random() * 100;
                    const delay = i * 100;
                    return (
                      <div
                        key={i}
                        className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm min-w-[3px] transition-all duration-300"
                        style={{
                          height: `${height}%`,
                          animationDelay: `${delay}ms`,
                          animation: displayStatus.isPlaying ? 'pulse 0.5s ease-in-out infinite' : 'none'
                        }}
                      />
                    );
                  })}
                </div>

                {/* Frequency Labels */}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>60Hz</span>
                  <span>1kHz</span>
                  <span>10kHz</span>
                </div>
              </div>
            )}
          </div>
        ) : currentSong ? (
          <div className="space-y-4">
            {/* Album Art */}
            <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Music className="w-12 h-12 text-white/50" />
            </div>

            {/* Song Info */}
            <div className="text-center">
              <h4 className="font-semibold text-white text-lg">{currentSong.title}</h4>
              <p className="text-gray-400">{currentSong.artist}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-1 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full karaoke-gradient-primary hover:shadow-xl text-white shadow-lg transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>

              <button className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="flex-1">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-1 rounded-full"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400 w-8">{isMuted ? 0 : volume}</span>
            </div>
          </div>
        ) : propDisplayWindow && !propDisplayWindow.closed ? (
          /* Loading state when display window is connected but no video loaded */
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mb-4 animate-pulse">
                  <div className="w-8 h-8 bg-purple-500/50 rounded animate-pulse" />
                </div>
                <p className="text-gray-400 text-sm">Waiting for video...</p>
                <button
                  onClick={updateDisplayStatus}
                  className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Refresh Status
                </button>
              </div>
            </div>

            {/* Skeleton controls */}
            <div className="space-y-4 opacity-50">
              <div className="flex items-center justify-center gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse" />
                <div className="w-12 h-12 bg-gray-800 rounded-full animate-pulse" />
                <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse" />
              </div>

              <div className="w-full bg-gray-800 rounded-full h-2 animate-pulse" />

              <div className="bg-gray-800/30 rounded-lg p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1 h-2 bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-2">No display window active</p>
            <p className="text-gray-500 text-xs">Open a video in display mode to control playback</p>
          </div>
        )}
      </div>

      {/* Queue/Browse Section */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarView('queue')}
                className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                  sidebarView === 'queue'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Queue
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={() => setSidebarView('browse')}
                className={`text-sm font-semibold uppercase tracking-wider transition-colors ${
                  sidebarView === 'browse'
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Browse
              </button>
            </div>
            <div className="flex items-center gap-2">
              {sidebarView === 'queue' ? (
                <>
                  <span className="text-xs text-gray-500">
                    {queue.length} song{queue.length !== 1 ? 's' : ''} - {formatTime(totalQueueTime)}
                  </span>
                  {queue.length > 0 && (
                    <button
                      onClick={clearQueue}
                      className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-500">
                  Find songs to add
                </span>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={sidebarView === 'queue' ? "Search queue..." : "Search songs..."}
              value={sidebarView === 'queue' ? searchQuery : browseSearchQuery}
              onChange={(e) => sidebarView === 'queue'
                ? setSearchQuery(e.target.value)
                : setBrowseSearchQuery(e.target.value)
              }
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Queue/Browse Items */}
        <div className="flex-1 overflow-y-auto">
          {sidebarView === 'queue' ? (
            // Queue View
            queue.length === 0 ? (
              <div className="p-8 text-center">
                <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-gray-400 font-medium mb-2">Your queue is empty</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Switch to Browse to add songs.
                </p>
                <Button
                  size="sm"
                  className="karaoke-btn-primary"
                  onClick={() => setSidebarView('browse')}
                >
                  Browse Songs
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {queue
                  .filter(song =>
                    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((song, index) => (
                  <div
                    key={song.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, song)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`p-3 transition-all duration-200 cursor-move ${
                      index === 0
                        ? 'bg-gradient-to-r from-pink-500/10 to-purple-600/10 border-l-4 border-pink-500'
                        : dragOverIndex === index
                        ? 'bg-blue-500/20 border-2 border-blue-500 border-dashed'
                        : 'hover:bg-gray-800/30'
                    } ${draggedItem?.id === song.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag Handle */}
                      <div className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors">
                        <div className="flex flex-col gap-1">
                          <div className="w-1 h-1 bg-current rounded-full" />
                          <div className="w-1 h-1 bg-current rounded-full" />
                          <div className="w-1 h-1 bg-current rounded-full" />
                        </div>
                      </div>

                      {/* Position Indicator */}
                      <div className="flex-shrink-0 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-xs text-gray-400 font-medium">
                        {index + 1}
                      </div>

                      {/* Thumbnail */}
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-white/50" />
                      </div>

                      {/* Signup Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white text-sm truncate">{song.title}</h4>
                          {song.isPremium && !isPremium && (
                            <Lock className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs truncate">
                          {song.signupData ? song.signupData.singer_name : song.artist}
                        </p>
                        <p className="text-gray-500 text-xs">{song.duration}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playQueueItem(song)}
                          className="text-pink-400 hover:text-pink-300 transition-colors"
                          title="Play Video"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromQueue(song.id)}
                          className="text-gray-500 hover:text-gray-400 transition-colors"
                          title="Remove from Queue"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )
        ) : (
          // Browse View
          browseLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm">Searching songs...</p>
            </div>
          ) : browseSearchQuery && browseResults.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h4 className="text-gray-400 font-medium mb-2">No songs found</h4>
              <p className="text-sm text-gray-500">
                Try a different search term.
              </p>
            </div>
          ) : browseResults.length > 0 ? (
            <div className="divide-y divide-gray-800/50">
              {browseResults.map((song) => (
                <div
                  key={song.id}
                  className="p-3 hover:bg-gray-800/30 transition-colors cursor-pointer"
                  onClick={() => addSongToQueue(song)}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-white/50" />
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white text-sm truncate">{song.song_title}</h4>
                        {song.is_premium && !isPremium && (
                          <Crown className="w-3 h-3 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-xs truncate">{song.song_artist}</p>
                      {song.youtube_video_duration && (
                        <p className="text-gray-500 text-xs">{song.youtube_video_duration}</p>
                      )}
                    </div>

                    {/* Add Button */}
                    <button
                      className="p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 hover:text-purple-300 transition-colors"
                      title="Add to Queue"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h4 className="text-gray-400 font-medium mb-2">Search for songs</h4>
              <p className="text-sm text-gray-500">
                Start typing above to find karaoke songs to add to your queue.
              </p>
            </div>
          )
        )}
        </div>
      </div>
    </aside>
  );
}