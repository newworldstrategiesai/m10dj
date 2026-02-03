'use client';

/**
 * MeetPreJoin - Blurred current meeting broadcast (host/other participants' feed)
 * behind a modal that collects username and device preferences before joining.
 */
import * as React from 'react';
import { LiveKitRoom, useTracks } from '@livekit/components-react';
import { isTrackReference } from '@livekit/components-core';
import type { LocalUserChoices } from '@livekit/components-core';
import { Track } from 'livekit-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

export interface MeetPreJoinProps {
  roomName: string;
  onSubmit: (values: LocalUserChoices) => void;
  onError?: (error: Error) => void;
  meetingTitle?: string;
  joinLabel?: string;
  userLabel?: string;
}

function MeetPreJoinInner({
  meetingTitle,
  joinLabel,
  userLabel,
  onSubmit,
}: Pick<MeetPreJoinProps, 'meetingTitle' | 'joinLabel' | 'userLabel' | 'onSubmit'>) {
  const videoEl = React.useRef<HTMLVideoElement>(null);
  const [username, setUsername] = React.useState('');
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [videoEnabled, setVideoEnabled] = React.useState(true);

  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: true },
  );

  const videoTrackRef = React.useMemo(() => {
    const screenShare = tracks.find((t) => isTrackReference(t) && t.publication.source === Track.Source.ScreenShare);
    const camera = tracks.find((t) => isTrackReference(t) && t.publication.source === Track.Source.Camera);
    return screenShare || camera;
  }, [tracks]);

  React.useEffect(() => {
    if (!videoEl.current || !videoTrackRef || !isTrackReference(videoTrackRef)) return;
    const track = videoTrackRef.publication?.track;
    if (track) {
      track.attach(videoEl.current);
      return () => track.detach(videoEl.current!);
    }
  }, [videoTrackRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    onSubmit({
      username: trimmed,
      audioEnabled,
      videoEnabled,
      audioDeviceId: undefined,
      videoDeviceId: undefined,
    });
  };

  const isValid = username.trim().length > 0;
  const hasRemoteVideo = !!videoTrackRef && isTrackReference(videoTrackRef) && !!videoTrackRef.publication?.track;

  return (
    <div className="fixed inset-0 overflow-hidden bg-zinc-950">
      {/* Blurred current broadcast (host/other participants) */}
      <div className="absolute inset-0">
        {hasRemoteVideo ? (
          <video
            ref={videoEl}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover blur-3xl brightness-[0.4] scale-110"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-zinc-900 to-violet-950/90"
            aria-hidden
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Modal overlay */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            'w-full max-w-md',
            'rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl',
            'backdrop-blur-xl backdrop-saturate-150',
            'ring-1 ring-white/10',
            'animate-in fade-in-0 zoom-in-95 duration-300',
          )}
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {meetingTitle}
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Enter your name to join
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="meet-username" className="sr-only">
                {userLabel}
              </label>
              <Input
                id="meet-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={userLabel}
                autoComplete="off"
                autoFocus
                className={cn(
                  'h-12 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/50',
                  'focus:border-emerald-400/50 focus:ring-emerald-400/30',
                  'dark:border-white/20 dark:bg-white/10',
                )}
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAudioEnabled((v) => !v)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                  audioEnabled
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-red-500/20 text-red-300 hover:bg-red-500/30',
                )}
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {audioEnabled ? 'Mic on' : 'Mic off'}
              </button>
              <button
                type="button"
                onClick={() => setVideoEnabled((v) => !v)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                  videoEnabled
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-red-500/20 text-red-300 hover:bg-red-500/30',
                )}
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {videoEnabled ? 'Camera on' : 'Camera off'}
              </button>
            </div>

            <Button
              type="submit"
              disabled={!isValid}
              className={cn(
                'h-12 w-full rounded-xl font-semibold',
                'bg-emerald-600 text-white hover:bg-emerald-500',
                'disabled:opacity-50 disabled:hover:bg-emerald-600',
              )}
            >
              {joinLabel}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function MeetPreJoin({
  roomName,
  onSubmit,
  onError,
  meetingTitle = 'Join the meeting',
  joinLabel = 'Join Meeting',
  userLabel = 'Your name',
}: MeetPreJoinProps) {
  const [previewCreds, setPreviewCreds] = React.useState<{ token: string; url: string } | null>(null);
  const [tokenError, setTokenError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchPreviewToken() {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName, roomType: 'meet-preview' }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load preview');
        }
        if (!cancelled && data.token && data.url) {
          setPreviewCreds({ token: data.token, url: data.url });
        }
      } catch (err) {
        if (!cancelled) {
          setTokenError(err instanceof Error ? err.message : 'Failed to load preview');
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    fetchPreviewToken();
    return () => { cancelled = true; };
  }, [roomName, onError]);

  if (tokenError) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl max-w-md text-center text-white">
          <p className="text-white/80">{tokenError}</p>
        </div>
      </div>
    );
  }

  if (!previewCreds) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={previewCreds.token}
      serverUrl={previewCreds.url}
      connect={true}
      video={false}
      audio={false}
      data-lk-theme="default"
      onError={onError}
      connectOptions={{ autoSubscribe: true }}
      className="fixed inset-0"
    >
      <MeetPreJoinInner
        meetingTitle={meetingTitle}
        joinLabel={joinLabel}
        userLabel={userLabel}
        onSubmit={onSubmit}
      />
    </LiveKitRoom>
  );
}
