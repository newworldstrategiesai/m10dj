'use client';

import { useEffect, useState, useRef } from 'react';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import { Room, LocalVideoTrack } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';

interface LiveVideoPlayerProps {
  roomName: string;
  token: string;
  serverUrl: string;
  onDisconnected?: () => void;
  isStreamer?: boolean;
  viewerCount?: number;
}

export function LiveVideoPlayer({ 
  roomName, 
  token, 
  serverUrl,
  onDisconnected,
  isStreamer = false,
  viewerCount = 0
}: LiveVideoPlayerProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);

  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  const toggleCamera = async () => {
    if (!room || !isStreamer) return;
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Get current video track
    const videoTrack = room.localParticipant?.videoTrackPublications.values().next().value?.track;
    if (videoTrack && videoTrack instanceof LocalVideoTrack) {
      // Restart track with new facing mode
      await videoTrack.restartTrack({
        facingMode: newFacingMode,
      });
    }
  };

  const toggleVideo = async () => {
    if (!room || !isStreamer) return;
    
    const videoTrack = room.localParticipant?.videoTrackPublications.values().next().value?.track;
    if (videoTrack) {
      if (isVideoEnabled) {
        await room.localParticipant.setCameraEnabled(false);
      } else {
        await room.localParticipant.setCameraEnabled(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Auto-switch to back camera in landscape (mobile)
  useEffect(() => {
    if (!isStreamer) return;
    
    const handleOrientation = () => {
      if (window.innerHeight < window.innerWidth) {
        setFacingMode('environment');
      }
    };
    
    window.addEventListener('resize', handleOrientation);
    return () => window.removeEventListener('resize', handleOrientation);
  }, [isStreamer]);

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      onDisconnected={onDisconnected ? () => onDisconnected() : undefined}
      connect={true}
      onConnected={((room: any) => setRoom(room)) as any}
      className="h-full w-full relative"
      options={{
        videoCaptureOptions: {
          facingMode: facingMode,
        },
      } as any}
    >
      <div className="flex flex-col h-full w-full relative bg-black">
        {/* Custom video layout - hide default VideoConference avatar placeholders */}
        <div className="absolute inset-0 w-full h-full">
          <VideoConference 
            style={{
              '--lk-grid-gap': '0px',
            } as React.CSSProperties}
          />
        </div>
        <RoomAudioRenderer />
        
        {/* Custom CSS to hide avatar placeholders and make video full screen */}
        <style dangerouslySetInnerHTML={{__html: `
          /* Hide large avatar placeholders in LiveKit VideoConference */
          .lk-grid-layout .lk-participant-tile:not(:has(video)) {
            display: none !important;
          }
          
          /* Make video tracks fill the container */
          .lk-participant-tile video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          
          /* Hide empty participant tiles */
          .lk-participant-tile:empty,
          .lk-participant-tile:not(:has(video)):not(:has(canvas)) {
            display: none !important;
          }
          
          /* Ensure grid layout takes full space */
          .lk-grid-layout {
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
          }
          
          /* Make participant tiles fill available space */
          .lk-participant-tile {
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
          }
        `}} />
        
        {/* Viewer Count Badge */}
        {viewerCount > 0 && !isStreamer && (
          <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-3 py-1.5 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">{viewerCount} watching</span>
          </div>
        )}

        {/* Camera Controls (Streamer Only, Mobile) */}
        {isStreamer && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 md:hidden">
            <Button
              onClick={toggleCamera}
              size="icon"
              className="bg-black/70 hover:bg-black/90 text-white rounded-full h-12 w-12"
            >
              <Camera className="h-5 w-5" />
            </Button>
            <Button
              onClick={toggleVideo}
              size="icon"
              className="bg-black/70 hover:bg-black/90 text-white rounded-full h-12 w-12"
            >
              {isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </Button>
          </div>
        )}
      </div>
    </LiveKitRoom>
  );
}
