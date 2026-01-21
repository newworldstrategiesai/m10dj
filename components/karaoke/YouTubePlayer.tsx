'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

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
  enableExternalControl?: boolean; // Enable control via postMessage
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
  muted = false,
  enableExternalControl = false
}: YouTubePlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const playerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate iframe embed URL with YouTube API enabled for external control
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=${showControls ? 1 : 0}&autoplay=${autoPlay && isPlaying ? 1 : 0}&mute=${muted ? 1 : 0}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;

  // Load YouTube IFrame API and create player
  useEffect(() => {
    if (!enableExternalControl || typeof window === 'undefined') return;

    // Load YouTube IFrame API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    } else {
      createPlayer();
    }

    function createPlayer() {
      if (!iframeRef.current || !(window as any).YT) return;

      playerRef.current = new (window as any).YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            if (mountedRef.current) {
              setIsLoading(false);
              setError(null);
              onStateChange?.('playing');
            }
          },
          onStateChange: (event: any) => {
            if (!mountedRef.current) return;
            const state = event.data;
            switch (state) {
              case (window as any).YT.PlayerState.PLAYING:
                onStateChange?.('playing');
                break;
              case (window as any).YT.PlayerState.PAUSED:
                onStateChange?.('paused');
                break;
              case (window as any).YT.PlayerState.ENDED:
                onStateChange?.('ended');
                break;
            }
          },
          onError: () => {
            if (mountedRef.current) {
              setError('Failed to load video');
              setIsLoading(false);
              onStateChange?.('error');
            }
          }
        }
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, enableExternalControl]);

  // Expose control methods for external use
  useEffect(() => {
    if (enableExternalControl && playerRef.current) {
      console.log('Exposing YouTube player control methods on window');
      // Make control methods available globally for postMessage handling
      (window as any).youtubePlayerControl = {
        play: () => {
          console.log('Calling playVideo()');
          playerRef.current?.playVideo();
        },
        pause: () => {
          console.log('Calling pauseVideo()');
          playerRef.current?.pauseVideo();
        },
        stop: () => {
          console.log('Calling stopVideo()');
          playerRef.current?.stopVideo();
        },
        seekTo: (seconds: number) => {
          console.log('Calling seekTo()', seconds);
          playerRef.current?.seekTo(seconds);
        },
        setVolume: (volume: number) => {
          console.log('Calling setVolume()', volume);
          playerRef.current?.setVolume(volume);
        },
        mute: () => {
          console.log('Calling mute()');
          playerRef.current?.mute();
        },
        unMute: () => {
          console.log('Calling unMute()');
          playerRef.current?.unMute();
        },
        getCurrentTime: () => playerRef.current?.getCurrentTime(),
        getDuration: () => playerRef.current?.getDuration(),
        getPlayerState: () => playerRef.current?.getPlayerState()
      };
      console.log('YouTube player control methods exposed');
    }
  }, [enableExternalControl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if ((window as any).youtubePlayerControl) {
        delete (window as any).youtubePlayerControl;
      }
    };
  }, []);

  // Handle iframe load
  const handleIframeLoad = () => {
    if (mountedRef.current) {
      setIsLoading(false);
      setError(null);
      // Call onStateChange to indicate video is ready
      onStateChange?.('playing');
    }
  };

  const handleIframeError = () => {
    if (mountedRef.current) {
      setError('Failed to load video');
      setIsLoading(false);
      onStateChange?.('error');
    }
  };

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
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-2" />
              <p className="text-white">Loading video...</p>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={enableExternalControl ? undefined : handleIframeLoad}
          onError={enableExternalControl ? undefined : handleIframeError}
        />
      </div>
    </div>
  );
}