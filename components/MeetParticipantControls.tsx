'use client';

/**
 * Admin controls overlay for meet participant tiles: Mute and Solo.
 * Only rendered when isSuperAdmin. Uses TrackRefContext from TrackLoop.
 */
import * as React from 'react';
import { useMaybeTrackRefContext } from '@livekit/components-react';
import { isTrackReference } from '@livekit/components-core';
import { Mic, MicOff, Headphones, UserMinus, Ban } from 'lucide-react';

interface MeetParticipantControlsProps {
  roomName: string;
  onMuteError?: (msg: string) => void;
  onSoloError?: (msg: string) => void;
  onKickError?: (msg: string) => void;
  onBanError?: (msg: string) => void;
  soloedIdentity: string | null;
  onSoloChange: (identity: string | null) => void;
}

export function MeetParticipantControls({
  roomName,
  onMuteError,
  onSoloError,
  onKickError,
  onBanError,
  soloedIdentity,
  onSoloChange,
}: MeetParticipantControlsProps) {
  const trackRef = useMaybeTrackRefContext();
  const [muted, setMuted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  if (!trackRef || !isTrackReference(trackRef)) return null;

  const identity = trackRef.participant?.identity ?? '';
  const name = (trackRef.participant as { name?: string })?.name ?? '';
  if (!identity) return null;

  const isSoloed = soloedIdentity === identity;

  const handleMute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/livekit/meet/mute-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantIdentity: identity,
          muted: !muted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onMuteError?.(data.error || 'Failed');
        return;
      }
      setMuted(!muted);
    } catch (err) {
      onMuteError?.(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSolo = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isSoloed) {
        const res = await fetch('/api/livekit/meet/solo-participant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName, clear: true }),
        });
        const data = await res.json();
        if (!res.ok) {
          onSoloError?.(data.error || 'Failed to clear solo');
          return;
        }
        onSoloChange(null);
      } else {
        const res = await fetch('/api/livekit/meet/solo-participant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName, participantIdentity: identity }),
        });
        const data = await res.json();
        if (!res.ok) {
          onSoloError?.(data.error || 'Failed to solo');
          return;
        }
        onSoloChange(identity);
      }
    } catch (err) {
      onSoloError?.(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/livekit/meet/kick-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, participantIdentity: identity }),
      });
      const data = await res.json();
      if (!res.ok) {
        onKickError?.(data.error || 'Failed to kick');
        return;
      }
      // Participant will disconnect; tile may disappear
    } catch (err) {
      onKickError?.(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (loading) return;
    if (!confirm('Permanently ban this user from the meeting? They will not be able to rejoin.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/livekit/meet/ban-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantIdentity: identity,
          participantName: name || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onBanError?.(data.error || 'Failed to ban');
        return;
      }
      // Participant will disconnect; tile may disappear
    } catch (err) {
      onBanError?.(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap justify-center gap-1 opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-lg py-1">
      <button
        type="button"
        onClick={handleMute}
        disabled={loading}
        className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
          muted
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={handleSolo}
        disabled={loading}
        className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
          isSoloed
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
        title={isSoloed ? 'Clear solo' : 'Solo (only this audio)'}
      >
        <Headphones className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleKick}
        disabled={loading}
        className="p-1.5 rounded-md text-xs font-medium transition-colors bg-orange-700 hover:bg-orange-600 text-white"
        title="Kick (remove from meeting)"
      >
        <UserMinus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleBan}
        disabled={loading}
        className="p-1.5 rounded-md text-xs font-medium transition-colors bg-red-700 hover:bg-red-600 text-white"
        title="Ban (kick and block rejoin)"
      >
        <Ban className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
