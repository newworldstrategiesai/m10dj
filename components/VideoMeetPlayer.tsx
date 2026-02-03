'use client';

/**
 * VideoMeetPlayer - TipJar Live video conferencing
 * Uses LiveKit's premade VideoConference UI (full video conferencing layout).
 * Unlike LiveVideoPlayer (livestream), this shows the standard grid of participants
 * where everyone can publish video/audio - similar to Zoom/Meet.
 *
 * Based on LiveKit Meet template: https://github.com/livekit-examples/meet
 */
import { LiveKitRoom } from '@livekit/components-react';
import { MeetingGridLayout } from '@/components/MeetingGridLayout';

interface VideoMeetPlayerProps {
  roomName: string;
  token: string;
  serverUrl: string;
  onDisconnected?: () => void;
  /** From PreJoin - whether to start with video/audio enabled */
  videoEnabled?: boolean;
  audioEnabled?: boolean;
}

export function VideoMeetPlayer({
  roomName,
  token,
  serverUrl,
  onDisconnected,
  videoEnabled = true,
  audioEnabled = true,
}: VideoMeetPlayerProps) {
  return (
    <LiveKitRoom
      video={videoEnabled}
      audio={audioEnabled}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      onDisconnected={onDisconnected ? () => onDisconnected() : undefined}
      connect={true}
      className="h-full w-full"
      style={{ minHeight: '100%' }}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
      connectOptions={{
        autoSubscribe: true,
      }}
    >
      <div className="flex flex-col h-full w-full bg-gray-950 dark:bg-gray-950">
        <MeetingGridLayout />
      </div>
    </LiveKitRoom>
  );
}
