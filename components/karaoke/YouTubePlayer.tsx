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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // Generate iframe embed URL - simplified, no complex controls
  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=0&controls=${showControls ? 1 : 0}&autoplay=${autoPlay && isPlaying ? 1 : 0}&mute=${muted ? 1 : 0}&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
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
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  );
}