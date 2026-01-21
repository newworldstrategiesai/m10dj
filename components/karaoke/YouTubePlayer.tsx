'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getYouTubeEmbedUrl } from '@/utils/youtube-api';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  onStateChange?: (state: 'playing' | 'paused' | 'ended' | 'error') => void;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
  volume?: number; // 0-100
  onVolumeChange?: (volume: number) => void;
  muted?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  isPlaying,
  onStateChange,
  className = '',
  showControls = true,
  autoPlay = true,
  volume = 50,
  onVolumeChange,
  muted = false
}: YouTubePlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [playerState, setPlayerState] = useState<'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued'>('unstarted');
  const [isMuted, setIsMuted] = useState(isMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);
  const apiLoadedRef = useRef(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      apiLoadedRef.current = true;
      initializePlayer();
      return;
    }

    if (!apiLoadedRef.current) {
      apiLoadedRef.current = true;

      // Load the YouTube IFrame API script
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);

      // Set up the global callback
      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }
  }, [videoId]);

  // Initialize YouTube player
  const initializePlayer = () => {
    if (!playerRef.current || !window.YT?.Player) return;

    try {
      const newPlayer = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: autoPlay ? 1 : 0,
          controls: showControls ? 1 : 0,
          disablekb: 1, // Disable keyboard controls
          enablejsapi: 1,
          fs: 0, // Disable fullscreen button
          iv_load_policy: 3, // Hide annotations
          modestbranding: 1,
          rel: 0, // Don't show related videos
          showinfo: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
            setIsLoading(false);
            setError(null);

            // Set initial volume
            event.target.setVolume(volume);

            // Auto-play if requested
            if (autoPlay && isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            let stateName: 'playing' | 'paused' | 'ended' | 'error';

            switch (state) {
              case window.YT.PlayerState.PLAYING:
                stateName = 'playing';
                break;
              case window.YT.PlayerState.PAUSED:
                stateName = 'paused';
                break;
              case window.YT.PlayerState.ENDED:
                stateName = 'ended';
                break;
              case window.YT.PlayerState.BUFFERING:
              case window.YT.PlayerState.CUED:
                return; // Don't report these intermediate states
              default:
                return;
            }

            setPlayerState(state === window.YT.PlayerState.PLAYING ? 'playing' :
                          state === window.YT.PlayerState.PAUSED ? 'paused' :
                          state === window.YT.PlayerState.ENDED ? 'ended' : 'paused');

            onStateChange?.(stateName);
          },
          onError: (event: any) => {
            let errorMessage = 'Unknown error occurred';
            switch (event.data) {
              case 2:
                errorMessage = 'Invalid video ID';
                break;
              case 5:
                errorMessage = 'HTML5 player error';
                break;
              case 100:
                errorMessage = 'Video not found';
                break;
              case 101:
              case 150:
                errorMessage = 'Video cannot be embedded';
                break;
            }
            setError(errorMessage);
            setIsLoading(false);
            onStateChange?.('error');
          }
        }
      });
    } catch (err) {
      console.error('Failed to initialize YouTube player:', err);
      setError('Failed to load video player');
      setIsLoading(false);
    }
  };

  // Handle play/pause based on isPlaying prop
  useEffect(() => {
    if (!player) return;

    try {
      if (isPlaying && playerState !== 'playing') {
        player.playVideo();
      } else if (!isPlaying && playerState === 'playing') {
        player.pauseVideo();
      }
    } catch (err) {
      console.error('Error controlling video playback:', err);
    }
  }, [isPlaying, player, playerState]);

  // Handle volume changes
  useEffect(() => {
    if (!player) return;

    try {
      player.setVolume(volume);
    } catch (err) {
      console.error('Error setting volume:', err);
    }
  }, [volume, player]);

  // Control functions
  const togglePlayPause = () => {
    if (!player) return;

    try {
      if (playerState === 'playing') {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch (err) {
      console.error('Error toggling play/pause:', err);
    }
  };

  const toggleMute = () => {
    if (!player) return;

    try {
      if (playerMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(100, volume + delta));
    onVolumeChange?.(newVolume);
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;

    if (!isFullscreen) {
      if (playerRef.current.requestFullscreen) {
        playerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-2" />
          <p className="text-red-300 font-semibold">Video Error</p>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Player */}
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-2" />
              <p className="text-white">Loading video...</p>
            </div>
          </div>
        )}

        <div ref={playerRef} className="w-full h-full" />

        {/* Custom Controls Overlay */}
        {showControls && !isLoading && !error && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              {/* Left side - Play/Pause and Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {playerState === 'playing' ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {playerMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustVolume(-10)}
                    className="text-white hover:bg-white/20 text-xs"
                  >
                    -
                  </Button>

                  <span className="text-white text-sm min-w-[40px] text-center">
                    {volume}%
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjustVolume(10)}
                    className="text-white hover:bg-white/20 text-xs"
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Right side - Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}