'use client';

/**
 * VideoMeetPlayer - TipJar Live video conferencing
 * Uses LiveKit's premade VideoConference UI (full video conferencing layout).
 * Unlike LiveVideoPlayer (livestream), this shows the standard grid of participants
 * where everyone can publish video/audio - similar to Zoom/Meet.
 *
 * Based on LiveKit Meet template: https://github.com/livekit-examples/meet
 */
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';

interface VideoMeetPlayerProps {
  roomName: string;
  token: string;
  serverUrl: string;
  onDisconnected?: () => void;
}

export function VideoMeetPlayer({
  roomName,
  token,
  serverUrl,
  onDisconnected,
}: VideoMeetPlayerProps) {
  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      onDisconnected={onDisconnected ? () => onDisconnected() : undefined}
      connect={true}
      className="h-full w-full"
      style={{ minHeight: '100%' }}
    >
      <div className="flex flex-col h-full w-full bg-gray-950 dark:bg-gray-950">
        <VideoConference />
        <RoomAudioRenderer />
      </div>
    </LiveKitRoom>
  );
}
