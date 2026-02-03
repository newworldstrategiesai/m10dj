'use client';

/**
 * LiveKit voice agent UI using Agents UI pattern:
 * TokenSource.custom + useSession + AgentSessionProvider + useVoiceAssistant + BarVisualizer.
 * Used by VoiceAssistant when connecting via LiveKit (not browser recognition).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TokenSource, ConnectionState, Track } from 'livekit-client';
import {
  useSession,
  useVoiceAssistant,
  RoomAudioRenderer,
  BarVisualizer,
  useTrackToggle,
  useDisconnectButton,
} from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { IconMicrophone, IconMicrophoneOff, IconLoader2, IconPhoneOff } from '@tabler/icons-react';
import { cn } from '@/utils/cn';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { useLiveKitTranscription } from '@/hooks/useLiveKitTranscription';

interface LiveKitVoiceAgentUIProps {
  userId: string;
  userEmail?: string;
  onTranscription?: (text: string) => void;
  onError?: (error: Error) => void;
  onDisconnected?: () => void;
  className?: string;
}

function VoiceAgentInner({
  onTranscription,
  onError,
  onDisconnected,
  className,
}: {
  onTranscription?: (text: string) => void;
  onError?: (error: Error) => void;
  onDisconnected?: () => void;
  className?: string;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const { transcription, clearTranscription } = useLiveKitTranscription();
  const microphoneToggle = useTrackToggle({ source: Track.Source.Microphone });
  const { buttonProps: disconnectButtonProps } = useDisconnectButton({});
  const handleDisconnect = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      disconnectButtonProps.onClick?.(e);
      onDisconnected?.();
    },
    [disconnectButtonProps.onClick, onDisconnected]
  );
  const [error, setError] = useState<string | null>(null);

  // Send transcription to parent when final
  useEffect(() => {
    if (transcription?.trim() && onTranscription) {
      const shouldSend =
        transcription.length > 10 ||
        transcription.endsWith('.') ||
        transcription.endsWith('?') ||
        transcription.endsWith('!');
      if (shouldSend) {
        const timer = setTimeout(() => {
          onTranscription(transcription);
          clearTranscription();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [transcription, onTranscription, clearTranscription]);

  const handleMicToggle = useCallback(async () => {
    try {
      await microphoneToggle.toggle();
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Failed to toggle microphone');
      setError(e.message);
      onError?.(e);
    }
  }, [microphoneToggle, onError]);

  const stateLabel =
    state === 'initializing'
      ? 'Connecting...'
      : state === 'listening'
        ? 'Listening...'
        : state === 'thinking'
          ? 'Thinking...'
          : state === 'speaking'
            ? 'Speaking...'
            : state === 'connecting'
              ? 'Connecting...'
              : '';

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <RoomAudioRenderer />
      {/* Audio visualizer - BarVisualizer from @livekit/components-react */}
      <div className="flex items-center justify-center h-14 w-full max-w-[200px] rounded-lg bg-muted/50 dark:bg-muted/20 px-3">
        {audioTrack ? (
          <BarVisualizer
            state={state}
            barCount={5}
            track={audioTrack}
            className="w-full h-full [&>div]:bg-primary/60 dark:[&>div]:bg-primary/50"
          />
        ) : (
          <span className="text-xs text-muted-foreground">{stateLabel || 'Connecting...'}</span>
        )}
      </div>
      {transcription && (
        <p className="text-xs text-muted-foreground max-w-[220px] truncate text-center">
          {transcription}
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={microphoneToggle.enabled ? 'default' : 'outline'}
          onClick={handleMicToggle}
          className="rounded-full h-9 w-9 p-0"
          title={microphoneToggle.enabled ? 'Mute' : 'Unmute'}
        >
          {microphoneToggle.enabled ? (
            <IconMicrophone className="h-4 w-4" />
          ) : (
            <IconMicrophoneOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full h-9 w-9 p-0 text-destructive hover:text-destructive"
          title="End"
          onClick={handleDisconnect}
          disabled={disconnectButtonProps.disabled}
        >
          <IconPhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function LiveKitVoiceAgentUI({
  userId,
  userEmail,
  onTranscription,
  onError,
  onDisconnected,
  className,
}: LiveKitVoiceAgentUIProps) {
  const [connectError, setConnectError] = useState<string | null>(null);

  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async (options) => {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomType: 'admin-assistant',
            participantIdentity: options.participantIdentity ?? userId,
            participantName: options.participantName ?? userEmail ?? 'Admin',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Token failed (${res.status})`);
        }
        const data = await res.json();
        return {
          serverUrl: data.url,
          participantToken: data.token,
        };
      }),
    [userId, userEmail]
  );

  const session = useSession(tokenSource, {
    participantIdentity: userId,
    participantName: userEmail ?? 'Admin',
  });

  useEffect(() => {
    let cancelled = false;
    session.start().catch((err) => {
      if (!cancelled) {
        const message = err instanceof Error ? err.message : 'Failed to connect';
        setConnectError(message);
        onError?.(err instanceof Error ? err : new Error(message));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session, onError]);

  const handleRetry = useCallback(() => {
    setConnectError(null);
    session.start().catch((err) => {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setConnectError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    });
  }, [session, onError]);

  if (connectError) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <p className="text-sm text-destructive">{connectError}</p>
        <Button size="sm" variant="outline" onClick={handleRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (session.connectionState === ConnectionState.Connecting) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Connecting...</span>
      </div>
    );
  }

  return (
    <AgentSessionProvider session={session}>
      <VoiceAgentInner
        onTranscription={onTranscription}
        onError={onError}
        onDisconnected={onDisconnected}
        className={className}
      />
    </AgentSessionProvider>
  );
}
