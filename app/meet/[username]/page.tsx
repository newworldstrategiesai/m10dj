'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { VideoMeetPlayer } from '@/components/VideoMeetPlayer';
import TipJarHeader from '@/components/tipjar/Header';
import { Button } from '@/components/ui/button';
import { Share2, Lock } from 'lucide-react';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please sign in to join the meeting');
          setLoading(false);
          return;
        }

        const tokenResponse = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName: typedMeet.room_name,
            participantName: user.email?.split('@')[0] || 'Guest',
            participantIdentity: user.id,
            roomType: 'meet',
          }),
        });

        if (!tokenResponse.ok) {
          const errData = await tokenResponse.json();
          setError(errData.error || 'Failed to join meeting');
          setLoading(false);
          return;
        }

        const { token: t, url } = await tokenResponse.json();
        setToken(t);
        setServerUrl(url);
      } catch (err) {
        console.error('Error loading meet:', err);
        setError('Failed to load meeting');
      } finally {
        setLoading(false);
      }
    }

    loadMeet();
  }, [username]);

  function handleShare() {
    const meetUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/meet/@${username}`
      : `https://tipjar.live/meet/@${username}`;
    if (navigator.share) {
      navigator.share({
        title: room?.title || `${username}'s Meeting`,
        text: 'Join my video meeting on TipJar.live',
        url: meetUrl,
      }).catch(() => navigator.clipboard.writeText(meetUrl));
    } else {
      navigator.clipboard.writeText(meetUrl);
    }
  }

  const isTipJarDomain = typeof window !== 'undefined' &&
    (window.location.hostname === 'tipjar.live' || window.location.hostname === 'www.tipjar.live');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          {isTipJarDomain ? (
            <>
              <TipJarAnimatedLoader size={128} className="mx-auto mb-4" />
              <div className="text-lg">Joining meeting...</div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-lg">Joining meeting...</div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (error || !room) {
    const needsSignIn = error === 'Please sign in to join the meeting';
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">{error || 'Meeting not found'}</h1>
          {needsSignIn && (
            <Button
              onClick={() => {
                window.location.href = `/tipjar/signin?redirect=${encodeURIComponent(window.location.pathname)}`;
              }}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <Lock className="h-4 w-4 mr-2" />
              Sign In to Join
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white text-lg">Connecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      <TipJarHeader />
      <div className="absolute top-12 md:top-14 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-3 sm:px-4 py-2 z-20 pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate">
              {room.title || `${room.username}'s Meeting`}
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
          roomName={room.room_name}
          token={token}
          serverUrl={serverUrl}
        />
      </div>
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white/80">
          TipJar.live
        </div>
      </div>
    </div>
  );
}
