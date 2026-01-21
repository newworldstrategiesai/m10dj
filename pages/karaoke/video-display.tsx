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

  // Listen for control messages from admin window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Display window received message:', event.data, 'from:', event.origin);

      // Only accept messages from the same origin for security
      if (event.origin !== window.location.origin) {
        console.log('🚫 Rejected message from different origin:', event.origin);
        return;
      }

      const { type, data } = event.data;

      if (type === 'VIDEO_CONTROL') {
        console.log('🎬 Processing command:', data.action, data);
        const control = (window as any).youtubePlayerControl;
        console.log('🎮 YouTube control available:', !!control);

        if (!control) {
          console.warn('⚠️ YouTube player control not available yet');
          return;
        }

        switch (data.action) {
          case 'ping':
            // Send back pong to confirm connection
            event.source?.postMessage({
              type: 'VIDEO_STATUS',
              data: { pong: true, ready: !!(window as any).youtubePlayerControl }
            }, { targetOrigin: event.origin });
            break;
          case 'play':
            try {
              control.play();
              // Send status update back
              setTimeout(() => {
                try {
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
                } catch (error) {
                  console.error('❌ Error sending play status:', error);
                }
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
                try {
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
                } catch (error) {
                  console.error('❌ Error sending pause status:', error);
                }
              }, 100);
            } catch (error) {
              console.error('❌ Error calling pause:', error);
            }
            break;
          case 'stop':
            try {
              control.stop();
              // Send status update back
              try {
                event.source?.postMessage({
                  type: 'VIDEO_STATUS',
                  data: {
                    isPlaying: false,
                    currentTime: 0,
                    duration: control.getDuration(),
                    volume: volume
                  }
                }, { targetOrigin: event.origin });
              } catch (error) {
                console.error('❌ Error sending stop status:', error);
              }
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
                  try {
                    event.source?.postMessage({
                      type: 'VIDEO_STATUS',
                      data: {
                        isPlaying: control.getPlayerState() === 1, // Playing
                        currentTime: data.seconds,
                        duration: control.getDuration(),
                        volume: volume
                      }
                    }, { targetOrigin: event.origin });
                  } catch (error) {
                    console.error('❌ Error sending seek status:', error);
                  }
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
                event.source?.postMessage({
                  type: 'VIDEO_STATUS',
                  data: {
                    volume: data.volume
                  }
                }, { targetOrigin: event.origin });
              } catch (error) {
                console.error('❌ Error calling setVolume:', error);
              }
            }
            break;
          case 'mute':
            try {
              control.mute();
              // Send status update back
              event.source?.postMessage({
                type: 'VIDEO_STATUS',
                data: {
                  volume: 0
                }
              }, { targetOrigin: event.origin });
            } catch (error) {
              console.error('❌ Error calling mute:', error);
            }
            break;
          case 'unmute':
            try {
              control.unMute();
              // Send status update back
              event.source?.postMessage({
                type: 'VIDEO_STATUS',
                data: {
                  volume: volume
                }
              }, { targetOrigin: event.origin });
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
                  const sendStatusUpdate = () => {
                    if (control && event.source) {
                      try {
                        const currentTime = control.getCurrentTime();
                        const duration = control.getDuration();
                        const playerState = control.getPlayerState();

                        event.source.postMessage({
                          type: 'VIDEO_STATUS',
                          data: {
                            videoChanged: true,
                            isPlaying: playerState === 1,
                            currentTime: currentTime || 0,
                            duration: duration || 0,
                            volume: volume,
                            videoId: data.videoId,
                            title: data.title,
                            artist: data.artist || '',
                            playerState: playerState
                          }
                        }, { targetOrigin: event.origin });
                        console.log('📊 Sent status update after video change');
                      } catch (error) {
                        console.warn('⚠️ Error sending video change status:', error);
                      }
                    }
                  };

                  // Send updates at 500ms, 1s, and 2s intervals
                  setTimeout(sendStatusUpdate, 500);
                  setTimeout(sendStatusUpdate, 1000);
                  setTimeout(sendStatusUpdate, 2000);
                } catch (error) {
                  console.error('❌ Error loading video:', error);
                }
              } else {
                console.warn('⚠️ YouTube control not available for video change');
              }

              // Send confirmation back immediately
              try {
                event.source?.postMessage({
                  type: 'VIDEO_STATUS',
                  data: {
                    videoChanged: true,
                    videoId: data.videoId,
                    title: data.title,
                    artist: data.artist || ''
                  }
                }, { targetOrigin: event.origin });
              } catch (error) {
                console.error('❌ Error sending video change confirmation:', error);
              }
            }
            break;
          case 'getStatus':
            // Send back current status
            try {
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
                  videoId: currentVideo?.videoId || '',
                  title: currentVideo?.title || '',
                  artist: currentVideo?.artist || ''
                }
              }, { targetOrigin: event.origin });
            } catch (error) {
              console.error('❌ Error getting status:', error);
              // Send fallback status
              event.source?.postMessage({
                type: 'VIDEO_STATUS',
                data: {
                  currentTime: 0,
                  duration: 0,
                  playerState: -1,
                  volume,
                  videoId: currentVideo?.videoId || '',
                  title: currentVideo?.title || '',
                  artist: currentVideo?.artist || ''
                }
              }, { targetOrigin: event.origin });
            }
            break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentVideo?.videoId, currentVideo?.title, currentVideo?.artist, volume]);

  // Send periodic status updates to admin panel
  useEffect(() => {
    if (!currentVideo?.videoId) return;

    const sendStatusUpdate = () => {
      const control = (window as any).youtubePlayerControl;
      if (control && window.opener && currentVideo) {
        try {
          const currentTime = control.getCurrentTime();
          const duration = control.getDuration();
          const playerState = control.getPlayerState();

          window.opener.postMessage({
            type: 'VIDEO_STATUS',
            data: {
              isPlaying: playerState === 1, // YT.PlayerState.PLAYING
              currentTime: currentTime || 0,
              duration: duration || 0,
              volume: volume,
              videoId: currentVideo.videoId,
              title: currentVideo.title,
              artist: currentVideo.artist,
              playerState: playerState
            }
          }, window.location.origin);
        } catch (error) {
          // Silently handle errors - window might be closed or player not ready
          console.warn('⚠️ Error sending periodic status update:', error);
        }
      }
    };

    // Send initial status update
    const initialTimer = setTimeout(sendStatusUpdate, 1000);

    // Send periodic updates every 500ms while playing
    const interval = setInterval(sendStatusUpdate, 500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
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