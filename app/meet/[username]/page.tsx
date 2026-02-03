'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { VideoMeetPlayer } from '@/components/VideoMeetPlayer';
import { PreJoin } from '@livekit/components-react';
import type { LocalUserChoices } from '@livekit/components-react';
import TipJarHeader from '@/components/tipjar/Header';
import { Button } from '@/components/ui/button';
import { Share2, Lock } from 'lucide-react';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';
import Image from 'next/image';
import Link from 'next/link';

interface MeetRoom {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  is_active: boolean;
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
  const supabase = createClient();

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
      } catch (err) {
        console.error('Error loading meet:', err);
        setError('Failed to load meeting');
      } finally {
        setLoading(false);
      }
    }

    loadMeet();
  }, [username, supabase]);

  async function handlePreJoinSubmit(values: LocalUserChoices) {
    if (!room) return;

    setUserChoices(values);

    const { data: { user } } = await supabase.auth.getUser();

    const tokenResponse = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: room.room_name,
        participantName: values.username?.trim() || 'Guest',
        participantIdentity: user?.id,
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
  }

  function handleShare() {
    const meetUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/meet/${username}`
      : `https://tipjar.live/meet/${username}`;
    if (navigator.share) {
      navigator.share({
        title: room?.title || `${username}'s Meeting`,
        text: isM10Domain ? 'Join my video meeting' : 'Join my video meeting on TipJar.live',
        url: meetUrl,
      }).catch(() => navigator.clipboard.writeText(meetUrl));
    } else {
      navigator.clipboard.writeText(meetUrl);
    }
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

  // PreJoin: user enters username and selects devices (anonymous or logged-in)
  if (!token || !serverUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {isM10Domain ? (
          <header className="flex-shrink-0 h-12 md:h-14 bg-black/60 backdrop-blur-md flex items-center px-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/M10-Rotating-Logo.gif" alt="M10 DJ Company" width={36} height={36} className="object-contain" />
              <span className="text-white font-semibold">M10</span>
            </Link>
          </header>
        ) : (
          <TipJarHeader />
        )}
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
          <div className="w-full max-w-md">
            <h2 className="text-white text-xl font-semibold mb-2 text-center">
              Join {room?.title || `${room?.username}'s meeting`}
            </h2>
            <p className="text-gray-400 text-sm mb-6 text-center">
              Enter your name and adjust your camera and microphone
            </p>
            <div className="bg-gray-900 rounded-xl p-6">
              <PreJoin
                onError={(e) => setError(e.message)}
                onSubmit={handlePreJoinSubmit}
                defaults={{ username: '', videoEnabled: true, audioEnabled: true }}
                persistUserChoices={false}
                joinLabel="Join Meeting"
                userLabel="Your name"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {isM10Domain ? (
        <header className="flex-shrink-0 h-12 md:h-14 bg-black/60 backdrop-blur-md flex items-center px-4 z-20">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/M10-Rotating-Logo.gif" alt="M10 DJ Company" width={36} height={36} className="object-contain" />
            <span className="text-white font-semibold">M10</span>
          </Link>
        </header>
      ) : (
        <TipJarHeader />
      )}
      <div className="absolute top-12 md:top-14 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-3 sm:px-4 py-2 z-20 pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate">
              {room?.title || `${room?.username}'s Meeting`}
            </h1>
          </div>
          <Button
            onClick={handleShare}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 bg-black/40 p-2 h-9 w-9 rounded-full"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 pt-12 md:pt-14">
        <VideoMeetPlayer
          roomName={room!.room_name}
          token={token}
          serverUrl={serverUrl}
          videoEnabled={userChoices?.videoEnabled ?? true}
          audioEnabled={userChoices?.audioEnabled ?? true}
        />
      </div>
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white/80">
          {isM10Domain ? 'M10' : 'TipJar.live'}
        </div>
      </div>
    </div>
  );
}
