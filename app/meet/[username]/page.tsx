'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { VideoMeetPlayer } from '@/components/VideoMeetPlayer';
import { PreJoin } from '@livekit/components-react';
import type { LocalUserChoices } from '@livekit/components-react';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';
import Image from 'next/image';

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

  // PreJoin: full-screen, no header/footer - just the LiveKit PreJoin UI
  if (!token || !serverUrl) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <PreJoin
          onError={(e) => setError(e.message)}
          onSubmit={handlePreJoinSubmit}
          defaults={{ username: '', videoEnabled: true, audioEnabled: true }}
          persistUserChoices={false}
          joinLabel="Join Meeting"
          userLabel="Your name"
          className="w-full h-full max-w-4xl max-h-[90vh]"
        />
      </div>
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
        />
      </div>
    </div>
  );
}
