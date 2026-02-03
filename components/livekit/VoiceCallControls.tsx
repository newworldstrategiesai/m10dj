'use client';

import React, { useState, useCallback } from 'react';
import { RoomAudioRenderer, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';

interface VoiceCallControlsProps {
  displayName: string;
  onHangUp: () => void;
}

/**
 * Shared in-call UI: remote audio, mic toggle, hang up.
 * Renders inside LiveKitRoom.
 */
export function VoiceCallControls({ displayName, onHangUp }: VoiceCallControlsProps) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [muted, setMuted] = useState(false);

  const toggleMic = useCallback(() => {
    const next = !muted;
    localParticipant.setMicrophoneEnabled(next);
    setMuted(!next);
  }, [localParticipant, muted]);

  const hangUp = useCallback(() => {
    room.disconnect();
    onHangUp();
  }, [room, onHangUp]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <RoomAudioRenderer />
      <p className="text-sm text-muted-foreground">
        In call with {displayName}
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant={muted ? 'destructive' : 'outline'}
          size="icon"
          onClick={toggleMic}
          className="rounded-full h-12 w-12"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={hangUp}
          className="rounded-full h-12 w-12"
          title="End call"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
