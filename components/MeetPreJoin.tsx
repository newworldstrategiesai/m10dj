'use client';

/**
 * MeetPreJoin - Blurred current meeting broadcast (host/other participants' feed)
 * behind a modal that collects email, display name, and device preferences before joining.
 * Preferences are remembered per email (localStorage); known users matched by email get their settings back.
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

const MEET_PREFS_KEY = 'meet_guest_prefs_';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function loadStoredPrefs(email: string): { displayName: string; audioEnabled: boolean; videoEnabled: boolean } | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = MEET_PREFS_KEY + normalizeEmail(email);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { displayName?: string; audioEnabled?: boolean; videoEnabled?: boolean };
    return {
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '',
      audioEnabled: typeof parsed.audioEnabled === 'boolean' ? parsed.audioEnabled : true,
      videoEnabled: typeof parsed.videoEnabled === 'boolean' ? parsed.videoEnabled : true,
    };
  } catch {
    return null;
  }
}

/** Persist preferences for a given email so they can be restored next time. */
export function saveStoredPrefs(
  email: string,
  prefs: { displayName: string; audioEnabled: boolean; videoEnabled: boolean },
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = MEET_PREFS_KEY + normalizeEmail(email);
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export type MeetPreJoinSubmitPayload = { values: LocalUserChoices; email: string };

export interface MeetPreJoinProps {
  roomName: string;
  /** Called with user choices and email. Parent should save prefs and request token. */
  onSubmit: (payload: MeetPreJoinSubmitPayload) => void;
  onError?: (error: Error) => void;
  meetingTitle?: string;
  joinLabel?: string;
  emailLabel?: string;
  displayNameLabel?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function looksLikeEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim());
}

function MeetPreJoinInner({
  meetingTitle,
  joinLabel,
  emailLabel,
  displayNameLabel,
  onSubmit,
}: Pick<MeetPreJoinProps, 'meetingTitle' | 'joinLabel' | 'emailLabel' | 'displayNameLabel' | 'onSubmit'>) {
  const videoEl = React.useRef<HTMLVideoElement>(null);
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [audioEnabled, setAudioEnabled] = React.useState(true);
  const [videoEnabled, setVideoEnabled] = React.useState(true);
  const [prefsLoadedFor, setPrefsLoadedFor] = React.useState<string | null>(null);

  const loadPrefsForEmail = React.useCallback((e: string) => {
    const normalized = normalizeEmail(e);
    if (!normalized || prefsLoadedFor === normalized) return;
    const prefs = loadStoredPrefs(e);
    if (prefs) {
      setDisplayName(prefs.displayName);
      setAudioEnabled(prefs.audioEnabled);
      setVideoEnabled(prefs.videoEnabled);
      setPrefsLoadedFor(normalized);
    }
  }, [prefsLoadedFor]);

  const handleEmailBlur = () => {
    if (looksLikeEmail(email)) loadPrefsForEmail(email);
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (looksLikeEmail(e.target.value)) loadPrefsForEmail(e.target.value);
  };

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
    const el = videoEl.current;
    if (!el || !videoTrackRef || !isTrackReference(videoTrackRef)) return;
    const track = videoTrackRef.publication?.track;
    if (track) {
      track.attach(el);
      return () => {
        track.detach(el);
      };
    }
  }, [videoTrackRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();
    if (!looksLikeEmail(trimmedEmail) || !trimmedName) return;

    onSubmit({
      values: {
        username: trimmedName,
        audioEnabled,
        videoEnabled,
        audioDeviceId: '',
        videoDeviceId: '',
      },
      email: normalizeEmail(trimmedEmail),
    });
  };

  const isValid = looksLikeEmail(email.trim()) && displayName.trim().length > 0;
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
              Enter your email and display name to join
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="meet-email" className="sr-only">
                {emailLabel}
              </label>
              <Input
                id="meet-email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder={emailLabel}
                autoComplete="email"
                autoFocus
                className={cn(
                  'h-12 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-white/50',
                  'focus:border-emerald-400/50 focus:ring-emerald-400/30',
                  'dark:border-white/20 dark:bg-white/10',
                )}
              />
            </div>
            <div>
              <label htmlFor="meet-display-name" className="sr-only">
                {displayNameLabel}
              </label>
              <Input
                id="meet-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={displayNameLabel}
                autoComplete="name"
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
  emailLabel = 'Email address',
  displayNameLabel = 'Display name',
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
        emailLabel={emailLabel}
        displayNameLabel={displayNameLabel}
        onSubmit={onSubmit}
      />
    </LiveKitRoom>
  );
}
