'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { VideoMeetPlayer } from '@/components/VideoMeetPlayer';
import { MeetPreJoin, saveStoredPrefs, type MeetPreJoinSubmitPayload } from '@/components/MeetPreJoin';
import type { LocalUserChoices } from '@livekit/components-core';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';
import Image from 'next/image';

interface MeetRoom {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  is_active: boolean;
  request_a_song_enabled?: boolean | null;
}

export default function MeetPage() {
  const params = useParams();
  const rawUsername = (params?.username as string) || '';
  const username = rawUsername
    .replace(/^@/, '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .substring(0, 50);

  const [room, setRoom] = useState<MeetRoom | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [userChoices, setUserChoices] = useState<LocalUserChoices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [requestASongOrg, setRequestASongOrg] = useState<{ id: string; name?: string; [key: string]: unknown } | null>(null);
  const supabase = createClient();

  function handleDisconnected() {
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
        if (!typedMeet.is_active) {
          setError('Meeting is not active');
          setLoading(false);
          return;
        }

        setRoom(typedMeet);

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

  // Meeting ended by host - beautiful notification for disconnected participants
  if (meetingEnded) {
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
            The meeting has ended
          </h1>
          <p className="text-gray-400 text-base mb-8 max-w-sm mx-auto leading-relaxed">
            The host has ended this meeting. Thanks for joining!
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
          requestASongEnabled={!!(room?.request_a_song_enabled && requestASongOrg)}
          organizationId={requestASongOrg?.id ?? null}
          organizationData={requestASongOrg ?? null}
        />
      </div>
    </div>
  );
}
