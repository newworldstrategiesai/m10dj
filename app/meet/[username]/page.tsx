'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { VideoMeetPlayer } from '@/components/VideoMeetPlayer';
import { MeetPreJoin, saveStoredPrefs, type MeetPreJoinSubmitPayload } from '@/components/MeetPreJoin';
import type { LocalUserChoices } from '@livekit/components-core';
import { DisconnectReason } from 'livekit-client';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';
import Image from 'next/image';
import { Clock, Calendar, RefreshCw } from 'lucide-react';

interface MeetRoom {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  is_active: boolean;
  started_at?: string | null;
  request_a_song_enabled?: boolean | null;
}

function parseScheduledAt(at: string | null): Date | null {
  if (!at || typeof at !== 'string') return null;
  const trimmed = at.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

function useCountdown(targetDate: Date | null) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!targetDate) return;
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  if (!targetDate) return null;
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
}

export default function MeetPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawUsername = (params?.username as string) || '';
  const username = rawUsername
    .replace(/^@/, '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 50);

  const atParam = typeof searchParams !== 'undefined' && searchParams !== null ? searchParams.get('at') : null;
  const scheduledAt = useMemo(() => parseScheduledAt(atParam), [atParam]);
  const countdown = useCountdown(scheduledAt);

  const [room, setRoom] = useState<MeetRoom | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [userChoices, setUserChoices] = useState<LocalUserChoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState<DisconnectReason | undefined>(undefined);
  const [requestASongOrg, setRequestASongOrg] = useState<{ id: string; name?: string; [key: string]: unknown } | null>(null);
  const supabase = createClient();

  // When scheduled time has passed, poll so we show pre-join as soon as the host starts the room
  useEffect(() => {
    if (!countdown?.isPast || !room) return;
    const id = setInterval(() => window.location.reload(), 30000);
    return () => clearInterval(id);
  }, [countdown?.isPast, room]);

  function handleDisconnected(reason?: DisconnectReason) {
    setDisconnectReason(reason);
    setMeetingEnded(true);
    setToken(null);
    setServerUrl(null);
  }

  const isM10Domain = typeof window !== 'undefined' && window.location.hostname.includes('m10djcompany.com');
  const isTipJarDomain = typeof window !== 'undefined' &&
    (window.location.hostname === 'tipjar.live' || window.location.hostname === 'www.tipjar.live');

  useEffect(() => {
    async function loadMeet() {
      try {
        if (!username) {
          setError('Invalid username');
          setLoading(false);
          return;
        }

        const { data: meetData, error: meetError } = await supabase
          .from('meet_rooms')
          .select('*')
          .eq('username', username)
          .single();

        if (meetError || !meetData) {
          setError('Meeting not found');
          setLoading(false);
          return;
        }

        const typedMeet = meetData as MeetRoom;
        setRoom(typedMeet);
        if (!typedMeet.is_active) {
          setLoading(false);
          return;
        }

        if (typedMeet.request_a_song_enabled) {
          try {
            const res = await fetch(`/api/meet/room-organization?roomName=${encodeURIComponent(typedMeet.room_name)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.organization) setRequestASongOrg(data.organization);
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error('Error loading meet:', err);
        setError('Failed to load meeting');
      } finally {
        setLoading(false);
      }
    }

    loadMeet();
  }, [username, supabase]);

  async function hashEmailForIdentity(email: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(email.trim().toLowerCase());
      const buf = await crypto.subtle.digest('SHA-256', data);
      const hex = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return hex.slice(0, 16);
    }
    return `email-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`;
  }

  async function handlePreJoinSubmit(payload: MeetPreJoinSubmitPayload) {
    if (!room) return;

    const { values, email } = payload;
    setUserChoices(values);

    saveStoredPrefs(email, {
      displayName: values.username?.trim() || '',
      audioEnabled: values.audioEnabled ?? true,
      videoEnabled: values.videoEnabled ?? true,
    });

    const { data: { user } } = await supabase.auth.getUser();
    const stableIdentity = user?.id ?? `email-${await hashEmailForIdentity(email)}`;

    const tokenResponse = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: room.room_name,
        participantName: values.username?.trim() || 'Guest',
        participantIdentity: stableIdentity,
        roomType: 'meet',
      }),
    });

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.json();
      setError(errData.error || 'Failed to join meeting');
      setUserChoices(null);
      return;
    }

    const { token: t, url } = await tokenResponse.json();
    setToken(t);
    setServerUrl(url);
    setError(null);

    // Register participant (email/display name) for host-only lookup; fire-and-forget
    fetch('/api/meet/participant-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: room.room_name,
        participantIdentity: stableIdentity,
        participantName: values.username?.trim() || 'Guest',
        email,
      }),
    }).catch(() => {});
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          {isTipJarDomain ? (
            <>
              <TipJarAnimatedLoader size={128} className="mx-auto mb-4" />
              <div className="text-lg">Loading meeting...</div>
            </>
          ) : isM10Domain ? (
            <>
              <Image src="/M10-Rotating-Logo.gif" alt="Loading" width={128} height={128} className="mx-auto mb-4" />
              <div className="text-lg">Loading meeting...</div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-lg">Loading meeting...</div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">{error}</h1>
        </div>
      </div>
    );
  }

  // Room exists but not active yet: show scheduled time + countdown (when link has ?at=) or generic "not started"
  if (room && !room.is_active) {
    const meetingTitle = room.title ? `Join: ${room.title}` : `Meeting with @${room.username || username}`;
    const formattedWhen = scheduledAt
      ? scheduledAt.toLocaleString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : null;

    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: isM10Domain
              ? 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(252,186,0,0.2) 0%, transparent 55%)'
              : 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(16,185,129,0.15) 0%, transparent 55%)',
          }}
        />
        <div className="relative z-10 w-full max-w-lg mx-auto text-center text-white animate-in fade-in duration-500">
          <div
            className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${
              isM10Domain ? 'bg-[#fcba00]/20' : 'bg-emerald-500/20'
            }`}
          >
            <Clock className={`h-8 w-8 ${isM10Domain ? 'text-[#fcba00]' : 'text-emerald-400'}`} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            {scheduledAt ? 'Your meeting is scheduled' : "Meeting hasn't started yet"}
          </h1>
          <p className="text-gray-400 text-base mb-6">{meetingTitle}</p>

          {formattedWhen && (
            <div className="flex items-center justify-center gap-2 text-gray-300 mb-8">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-lg">{formattedWhen}</span>
            </div>
          )}

          {countdown && !countdown.isPast && (
            <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-8">
              {[
                { value: countdown.days, label: 'Days' },
                { value: countdown.hours, label: 'Hours' },
                { value: countdown.minutes, label: 'Min' },
                { value: countdown.seconds, label: 'Sec' },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className={`rounded-2xl border backdrop-blur-sm ${
                    isM10Domain
                      ? 'bg-[#fcba00]/10 border-[#fcba00]/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  <div
                    className={`text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums ${
                      isM10Domain ? 'text-[#fcba00]' : 'text-emerald-400'
                    }`}
                  >
                    {String(value).padStart(2, '0')}
                  </div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}

          {countdown?.isPast && (
            <p className="text-gray-400 text-sm mb-6">
              The scheduled time has passed. The host may start the meeting shortly.
            </p>
          )}

          <p className="text-gray-500 text-sm mb-6">
            {scheduledAt
              ? 'When it’s time, the host will start the meeting. This page will refresh automatically when the room is live, or you can check manually.'
              : 'The host will start the meeting when ready. Refresh this page to see if the meeting has started.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-base transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isM10Domain
                ? 'bg-[#fcba00] text-black hover:bg-[#e5a800] shadow-lg shadow-[#fcba00]/20'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            Check if meeting has started
          </button>
        </div>
      </div>
    );
  }

  // Disconnected from meeting - show reason-specific message (kicked vs meeting ended vs other)
  if (meetingEnded) {
    const wasRemovedByHost = disconnectReason === DisconnectReason.PARTICIPANT_REMOVED;
    const wasRoomEnded = disconnectReason === DisconnectReason.ROOM_DELETED;

    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4 overflow-hidden">
        {/* Subtle gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: isM10Domain
              ? 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(252,186,0,0.15) 0%, transparent 60%)'
              : 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(16,185,129,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10 text-center text-white max-w-md w-full animate-in fade-in duration-500">
          {/* Icon */}
          <div
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
              isM10Domain ? 'bg-[#fcba00]/20' : 'bg-emerald-500/20'
            }`}
          >
            <svg
              className={`h-10 w-10 ${isM10Domain ? 'text-[#fcba00]' : 'text-emerald-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            {wasRemovedByHost
              ? 'You were removed from the meeting'
              : wasRoomEnded
                ? 'The meeting has ended'
                : "You're no longer in the meeting"}
          </h1>
          <p className="text-gray-400 text-base mb-8 max-w-sm mx-auto leading-relaxed">
            {wasRemovedByHost
              ? 'The host removed you from this meeting. You can try to rejoin using the same link if the host allows.'
              : wasRoomEnded
                ? 'The host has ended this meeting. Thanks for joining!'
                : 'Your connection to the meeting was lost. You can try to rejoin using the same link.'}
          </p>
          <a
            href="/"
            className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium text-base transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isM10Domain
                ? 'bg-[#fcba00] text-black hover:bg-[#e5a800] shadow-lg shadow-[#fcba00]/20'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
            }`}
          >
            Return home
          </a>
        </div>
      </div>
    );
  }

  // Banned: token API returned 403 with "You have been banned from this meeting" (on join or rejoin attempt)
  const bannedError = 'You have been banned from this meeting';
  if (error === bannedError && room && !token) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: isM10Domain
              ? 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(252,186,0,0.15) 0%, transparent 60%)'
              : 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(16,185,129,0.12) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10 text-center text-white max-w-md w-full animate-in fade-in duration-500">
          <div
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
              isM10Domain ? 'bg-red-500/20' : 'bg-red-500/20'
            }`}
          >
            <svg
              className="h-10 w-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            You have been banned from this meeting
          </h1>
          <p className="text-gray-400 text-base mb-8 max-w-sm mx-auto leading-relaxed">
            You cannot rejoin this meeting. Contact the host if you believe this is an error.
          </p>
          <a
            href="/"
            className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium text-base transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isM10Domain
                ? 'bg-[#fcba00] text-black hover:bg-[#e5a800] shadow-lg shadow-[#fcba00]/20'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
            }`}
          >
            Return home
          </a>
        </div>
      </div>
    );
  }

  // PreJoin: blurred current broadcast + modal for username
  if (!token || !serverUrl) {
    return (
      <MeetPreJoin
        roomName={room!.room_name}
        onSubmit={handlePreJoinSubmit}
        onError={(e) => setError(e.message)}
        meetingTitle={room?.title ? `Join: ${room.title}` : `Join ${room?.username || username}'s meeting`}
        joinLabel="Join Meeting"
        emailLabel="Email address"
        displayNameLabel="Display name"
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 w-full">
        <VideoMeetPlayer
          roomName={room!.room_name}
          token={token}
          serverUrl={serverUrl}
          videoEnabled={userChoices?.videoEnabled ?? true}
          audioEnabled={userChoices?.audioEnabled ?? true}
          onDisconnected={handleDisconnected}
          startedAt={room?.started_at ? new Date(room.started_at).getTime() : undefined}
        />
      </div>
    </div>
  );
}
