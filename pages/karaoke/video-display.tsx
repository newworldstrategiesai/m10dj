'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { X, Maximize, Minimize, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import YouTubePlayer from '@/components/karaoke/YouTubePlayer';

export default function VideoDisplayPage() {
  const router = useRouter();
  const { videoId, title, artist } = router.query;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(50);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Listen for control messages from admin window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Video display received message:', event.data, 'from origin:', event.origin);

      // Only accept messages from the same origin for security
      if (event.origin !== window.location.origin) {
        console.warn('Rejected message from different origin:', event.origin);
        return;
      }

      const { type, data } = event.data;

      if (type === 'VIDEO_CONTROL') {
        console.log('Processing VIDEO_CONTROL command:', data);
        const control = (window as any).youtubePlayerControl;
        console.log('YouTube player control available:', !!control);

        if (!control) {
          console.warn('YouTube player control not available yet');
          return;
        }

        switch (data.action) {
          case 'ping':
            console.log('Received ping from admin window');
            // Send back pong to confirm connection
            event.source?.postMessage({
              type: 'VIDEO_STATUS',
              data: { pong: true, ready: !!(window as any).youtubePlayerControl }
            }, { targetOrigin: event.origin });
            break;
          case 'play':
            console.log('Executing play command');
            control.play();
            // Send status update back
            setTimeout(() => {
              const currentTime = control.getCurrentTime();
              const duration = control.getDuration();
              event.source?.postMessage({
                type: 'VIDEO_STATUS',
                data: {
                  isPlaying: true,
                  currentTime,
                  duration,
                  volume: volume
                }
              }, { targetOrigin: event.origin });
            }, 100);
            break;
          case 'pause':
            console.log('Executing pause command');
            control.pause();
            // Send status update back
            setTimeout(() => {
              const currentTime = control.getCurrentTime();
              const duration = control.getDuration();
              event.source?.postMessage({
                type: 'VIDEO_STATUS',
                data: {
                  isPlaying: false,
                  currentTime,
                  duration,
                  volume: volume
                }
              }, { targetOrigin: event.origin });
            }, 100);
            break;
          case 'stop':
            console.log('Executing stop command');
            control.stop();
            // Send status update back
            event.source?.postMessage({
              type: 'VIDEO_STATUS',
              data: {
                isPlaying: false,
                currentTime: 0,
                duration: control.getDuration(),
                volume: volume
              }
            }, { targetOrigin: event.origin });
            break;
          case 'seek':
            if (data.seconds !== undefined) {
              console.log('Executing seek command to', data.seconds, 'seconds');
              control.seekTo(data.seconds);
              // Send status update back
              setTimeout(() => {
                event.source?.postMessage({
                  type: 'VIDEO_STATUS',
                  data: {
                    isPlaying: control.getPlayerState() === 1, // Playing
                    currentTime: data.seconds,
                    duration: control.getDuration(),
                    volume: volume
                  }
                }, { targetOrigin: event.origin });
              }, 100);
            }
            break;
          case 'volume':
            if (data.volume !== undefined) {
              console.log('Executing volume command to', data.volume);
              setVolume(data.volume);
              control.setVolume(data.volume);
              // Send status update back
              event.source?.postMessage({
                type: 'VIDEO_STATUS',
                data: {
                  volume: data.volume
                }
              }, { targetOrigin: event.origin });
            }
            break;
          case 'mute':
            console.log('Executing mute command');
            control.mute();
            // Send status update back
            event.source?.postMessage({
              type: 'VIDEO_STATUS',
              data: {
                volume: 0
              }
            }, { targetOrigin: event.origin });
            break;
          case 'unmute':
            console.log('Executing unmute command');
            control.unMute();
            // Send status update back
            event.source?.postMessage({
              type: 'VIDEO_STATUS',
              data: {
                volume: volume
              }
            }, { targetOrigin: event.origin });
            break;
          case 'getStatus':
            // Send back current status
            const currentTime = control.getCurrentTime();
            const duration = control.getDuration();
            const playerState = control.getPlayerState();

            event.source?.postMessage({
              type: 'VIDEO_STATUS',
              data: {
                currentTime,
                duration,
                playerState,
                volume,
                videoId,
                title,
                artist
              }
            }, { targetOrigin: event.origin });
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [videoId, title, artist, volume]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Close window
  const closeWindow = () => {
    window.close();
  };

  // Refresh/reload video
  const refreshVideo = () => {
    window.location.reload();
  };

  if (!videoId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No video specified</p>
          <Button onClick={closeWindow} variant="outline" className="text-white border-white">
            Close Window
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{title ? `${title}${artist ? ` - ${artist}` : ''}` : 'Karaoke Video Display'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          /* Hide scrollbars and make it clean for display */
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: black;
          }

          /* Custom fullscreen styles */
          :fullscreen {
            background: black;
          }

          /* Hide controls in fullscreen */
          :fullscreen .video-controls {
            display: none;
          }

          /* Show controls on hover in fullscreen */
          :fullscreen:hover .video-controls {
            display: flex;
          }
        `}</style>
      </Head>

      <div className="relative w-screen h-screen bg-black overflow-hidden">
        {/* Video Player */}
        <div className="w-full h-full">
          <YouTubePlayer
            videoId={videoId as string}
            isPlaying={true}
            showControls={false} // Hide YouTube controls for clean display
            autoPlay={true}
            volume={volume}
            onVolumeChange={setVolume}
            enableExternalControl={true} // Enable external control via postMessage
            className="w-full h-full"
          />
        </div>

        {/* Control Overlay */}
        <div className={`video-controls absolute top-4 left-4 right-4 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-3 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
          {/* Left side - Song info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-lg font-bold truncate">
              {title as string}
            </h1>
            {artist && (
              <p className="text-gray-300 text-sm truncate">
                by {artist as string}
              </p>
            )}
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center gap-2">
            {/* Volume Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVolume(Math.max(0, volume - 10))}
                className="text-white hover:bg-white/20 p-2"
                title="Volume Down"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm min-w-[40px] text-center">
                {volume}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVolume(Math.min(100, volume + 10))}
                className="text-white hover:bg-white/20 p-2"
                title="Volume Up"
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshVideo}
              className="text-white hover:bg-white/20 p-2"
              title="Refresh Video"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20 p-2"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>

            {/* Close Window */}
            <Button
              variant="ghost"
              size="sm"
              onClick={closeWindow}
              className="text-red-400 hover:bg-red-500/20 hover:text-red-300 p-2"
              title="Close Window"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Instructions overlay for first-time use */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm text-center">
          <p>💡 <strong>Pro Tip:</strong> Drag this window to your second display for karaoke performances!</p>
          <p className="text-xs text-gray-300 mt-1">
            Press F11 for fullscreen • Use volume controls • Close when done
          </p>
        </div>
      </div>
    </>
  );
}