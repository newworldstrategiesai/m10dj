'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { X, Maximize, Minimize, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import YouTubePlayer from '@/components/karaoke/YouTubePlayer';

// Force server-side rendering since this page requires query parameters
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}

export default function VideoDisplayPage() {
  const router = useRouter();
  const { videoId: initialVideoId, title: initialTitle, artist: initialArtist } = router.query;

  const [currentVideo, setCurrentVideo] = useState<{
    videoId: string;
    title: string;
    artist: string;
  } | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(50);

  // Initialize video data when router is ready
  useEffect(() => {
    if (router.isReady && initialVideoId) {
      setCurrentVideo({
        videoId: initialVideoId as string,
        title: initialTitle as string || 'Karaoke Video',
        artist: initialArtist as string || ''
      });
    }
  }, [router.isReady, initialVideoId, initialTitle, initialArtist]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Listen for control messages from admin window via multiple channels
  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;

    // SIMPLE: Listen for messages from admin panel
    const handleMessage = (event: MessageEvent) => {
      console.log('🎧 DISPLAY WINDOW: Received message:', event.data, 'from:', event.origin, 'type:', event.data?.type);

      // Accept messages from our admin panel
      const isValidOrigin = event.origin === window.location.origin ||
                           event.origin === 'null' ||
                           event.origin.includes('localhost') ||
                           event.origin.includes('tipjar.live') ||
                           event.origin.includes('m10djcompany.com');

      if (!isValidOrigin) {
        console.log('🚫 Rejected message from invalid origin:', event.origin);
        return;
      }

      processControlCommand(event.data);
    };

    // Process control commands from any channel
    const processControlCommand = (message: any) => {
      const { type, data } = message;

      if (type === 'VIDEO_CONTROL') {
        console.log('🎬 Processing command:', data.action, data, 'from source:', message.source);
        const control = (window as any).youtubePlayerControl;
        console.log('🎮 YouTube control available:', !!control);

        if (!control) {
          console.warn('⚠️ YouTube player control not available yet - queuing command');
          // Queue the command for when player becomes available
          setTimeout(() => {
            console.log('🔄 Retrying queued command:', data.action);
            processControlCommand({ type: 'VIDEO_CONTROL', data, source: message.source });
          }, 1000);
          return;
        }

        switch (data.action) {
          case 'ping':
            // Send back pong to confirm connection
            const pongMessage = {
              type: 'VIDEO_STATUS',
              data: { pong: true, ready: !!(window as any).youtubePlayerControl }
            };
            // Send via postMessage only
            if (window.opener) window.opener.postMessage(pongMessage, '*');
            break;
          case 'play':
            try {
              control.play();
              // Send status update back via all channels
              setTimeout(() => {
                sendStatusUpdate({ isPlaying: true });
              }, 100);
            } catch (error) {
              console.error('❌ Error calling play:', error);
            }
            break;
          case 'pause':
            try {
              control.pause();
              // Send status update back
              setTimeout(() => {
                sendStatusUpdate({ isPlaying: false });
              }, 100);
            } catch (error) {
              console.error('❌ Error calling pause:', error);
            }
            break;
          case 'stop':
            try {
              control.stop();
              // Send status update back
              sendStatusUpdate({ isPlaying: false, currentTime: 0 });
            } catch (error) {
              console.error('❌ Error calling stop:', error);
            }
            break;
          case 'seek':
            if (data.seconds !== undefined) {
              try {
                control.seekTo(data.seconds);
                // Send status update back
                setTimeout(() => {
                  sendStatusUpdate({ currentTime: data.seconds });
                }, 100);
              } catch (error) {
                console.error('❌ Error calling seekTo:', error);
              }
            }
            break;
          case 'volume':
            if (data.volume !== undefined) {
              setVolume(data.volume);
              try {
                control.setVolume(data.volume);
                // Send status update back
                sendStatusUpdate({ volume: data.volume });
              } catch (error) {
                console.error('❌ Error calling setVolume:', error);
              }
            }
            break;
          case 'mute':
            try {
              control.mute();
              // Send status update back
              sendStatusUpdate({ volume: 0 });
            } catch (error) {
              console.error('❌ Error calling mute:', error);
            }
            break;
          case 'unmute':
            try {
              control.unMute();
              // Send status update back
              sendStatusUpdate({ volume: volume });
            } catch (error) {
              console.error('❌ Error calling unMute:', error);
            }
            break;
          case 'changeVideo':
            if (data.videoId && data.title) {
              console.log('🔄 Changing video to:', data);
              const newVideo = {
                videoId: data.videoId,
                title: data.title,
                artist: data.artist || ''
              };
              setCurrentVideo(newVideo);

              // Change the video in the YouTube player
              const control = (window as any).youtubePlayerControl;
              if (control && control.loadVideoById) {
                console.log('🎬 Loading new video in player');
                try {
                  control.loadVideoById(data.videoId);

                  // Send status updates at multiple intervals to ensure sync
                  const sendVideoChangeUpdate = () => {
                    sendStatusUpdate({
                      videoChanged: true,
                      videoId: data.videoId,
                      title: data.title,
                      artist: data.artist || ''
                    });
                  };

                  // Send updates at 500ms, 1s, and 2s intervals
                  setTimeout(sendVideoChangeUpdate, 500);
                  setTimeout(sendVideoChangeUpdate, 1000);
                  setTimeout(sendVideoChangeUpdate, 2000);
                } catch (error) {
                  console.error('❌ Error loading video:', error);
                }
              } else {
                console.warn('⚠️ YouTube control not available for video change');
              }

              // Send confirmation back immediately
              sendStatusUpdate({
                videoChanged: true,
                videoId: data.videoId,
                title: data.title,
                artist: data.artist || ''
              });
            }
            break;
          case 'getStatus':
            // Send back current status
            sendStatusUpdate();
            break;
        }
      }
    };

    // SIMPLE: Send status updates to admin panel
    const sendStatusUpdate = (overrides = {}) => {
      try {
        const control = (window as any).youtubePlayerControl;
        if (!control) return;

        const currentTime = control.getCurrentTime();
        const duration = control.getDuration();
        const playerState = control.getPlayerState();

        const statusData = {
          isPlaying: playerState === 1,
          currentTime: currentTime || 0,
          duration: duration || 0,
          volume: volume,
          videoId: currentVideo?.videoId || '',
          title: currentVideo?.title || '',
          artist: currentVideo?.artist || '',
          playerState: playerState,
          ...overrides
        };

        const message = {
          type: 'VIDEO_STATUS',
          data: statusData,
          timestamp: Date.now()
        };

        // ONLY send via postMessage to opener - use '*' for targetOrigin for reliability
        if (window.opener) {
          window.opener.postMessage(message, '*');
          console.log('📡 DISPLAY: Sent status to admin panel:', statusData);
        }
      } catch (error) {
        console.warn('❌ Error sending status update:', error);
      }
    };

    // Set up listener - SIMPLE approach
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentVideo?.videoId, currentVideo?.title, currentVideo?.artist, volume]);

  // Send periodic status updates to admin panel via multiple channels
  useEffect(() => {
    if (!currentVideo?.videoId) return;

    let broadcastChannel: BroadcastChannel | null = null;

    // Set up BroadcastChannel for reliable cross-window communication
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcastChannel = new BroadcastChannel('karaoke_sync');
        console.log('✅ Display window BroadcastChannel connected');
      } catch (error) {
        console.warn('❌ Failed to create BroadcastChannel:', error);
      }
    }

    const sendStatusUpdate = () => {
      const control = (window as any).youtubePlayerControl;
      if (control && currentVideo) {
        try {
          const currentTime = control.getCurrentTime();
          const duration = control.getDuration();
          const playerState = control.getPlayerState();

          const statusData = {
            isPlaying: playerState === 1, // YT.PlayerState.PLAYING
            currentTime: currentTime || 0,
            duration: duration || 0,
            volume: volume,
            videoId: currentVideo.videoId,
            title: currentVideo.title,
            artist: currentVideo.artist,
            playerState: playerState
          };

          const message = {
            type: 'VIDEO_STATUS',
            data: statusData,
            timestamp: Date.now()
          };

          console.log('📡 Display sending status update:', statusData);

          // Channel 1: BroadcastChannel (most reliable)
          if (broadcastChannel) {
            broadcastChannel.postMessage(message);
            console.log('📡 Sent via BroadcastChannel');
          }

          // Channel 2: localStorage (fallback)
          try {
            localStorage.setItem('karaoke_display_status', JSON.stringify(statusData));
            // Clean up after 1 second to avoid buildup
            setTimeout(() => {
              localStorage.removeItem('karaoke_display_status');
            }, 1000);
            console.log('📡 Sent via localStorage');
          } catch (error) {
            console.warn('❌ localStorage failed:', error);
          }

          // Channel 3: postMessage to opener (traditional) - use '*' for reliability
          if (window.opener) {
            window.opener.postMessage(message, '*');
            console.log('📡 Sent to opener via postMessage');
          }

          // Channel 4: postMessage to parent (additional) - use '*' for reliability
          if (window.parent && window.parent !== window.opener && window.parent !== window) {
            window.parent.postMessage(message, '*');
            console.log('📡 Sent to parent via postMessage');
          }

        } catch (error) {
          // Silently handle errors - window might be closed or player not ready
          console.warn('⚠️ Error sending periodic status update:', error);
        }
      }
    };

    // Send initial status update after player loads
    const initialTimer = setTimeout(sendStatusUpdate, 2000);

    // Send periodic updates every 200ms for smooth sync
    const interval = setInterval(sendStatusUpdate, 200);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [currentVideo, volume]);

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

  // Show loading while waiting for router query
  if (!router.isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-lg">Loading video...</p>
        </div>
      </div>
    );
  }

  // Show error if no video ID provided
  if (!currentVideo?.videoId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl mb-4">No video specified</p>
          <p className="text-gray-400 mb-6">Please select a video from the admin panel</p>
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
        <title>{currentVideo.title ? `${currentVideo.title}${currentVideo.artist ? ` - ${currentVideo.artist}` : ''}` : 'Karaoke Video Display'}</title>
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
          {currentVideo && (
            <YouTubePlayer
              videoId={currentVideo.videoId}
              isPlaying={true}
              showControls={false} // Hide YouTube controls for clean display
              autoPlay={true}
              volume={volume}
              onVolumeChange={setVolume}
              enableExternalControl={true} // Enable external control via postMessage
              className="w-full h-full"
            />
          )}
        </div>

        {/* Control Overlay */}
        <div className={`video-controls absolute top-4 left-4 right-4 flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-lg p-3 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
          {/* Left side - Song info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-lg font-bold truncate">
              {currentVideo.title || 'Karaoke Video'}
            </h1>
            {currentVideo.artist && (
              <p className="text-gray-300 text-sm truncate">
                by {currentVideo.artist}
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