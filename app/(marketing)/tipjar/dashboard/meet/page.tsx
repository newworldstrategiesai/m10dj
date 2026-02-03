'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { VideoMeetPlayer } from '@/components/VideoMeetPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Video, Share2, Check, Square } from 'lucide-react';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

interface MeetRoom {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  is_active: boolean;
}

export default function MeetPage() {
  const [room, setRoom] = useState<MeetRoom | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inMeeting, setInMeeting] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [title, setTitle] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadRoom() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          const isM10 = typeof window !== 'undefined' && window.location.hostname.includes('m10djcompany.com');
          router.push(isM10 ? '/signin?redirect=/dashboard/meet' : '/tipjar/signin?redirect=/tipjar/dashboard/meet');
          return;
        }

        // m10djcompany.com: only super admin can access Meet
        const isM10Domain = typeof window !== 'undefined' && window.location.hostname.includes('m10djcompany.com');
        if (isM10Domain && !isSuperAdminEmail(user.email)) {
          router.push('/admin');
          return;
        }

        const newUsername = user.email?.split('@')[0] || `user-${user.id.slice(0, 8)}`;
        const roomName = `meet-${user.id}`;

        const { data: existingRoom } = await supabase
          .from('meet_rooms')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingRoom) {
          const typed = existingRoom as MeetRoom;
          setRoom(typed);
          setTitle(typed.title || `Meet with @${typed.username}`);
          setInMeeting(typed.is_active);
          if (typed.is_active) {
            await getMeetToken(typed.room_name);
          }
        } else {
          const { data: newRoom } = await supabase
            .from('meet_rooms')
            .insert({
              user_id: user.id,
              username: newUsername,
              room_name: roomName,
              title: `Meet with @${newUsername}`,
              is_active: false,
            } as any)
            .select()
            .single();

          if (newRoom) {
            const typed = newRoom as MeetRoom;
            setRoom(typed);
            setTitle(typed.title || `Meet with @${newUsername}`);
          }
        }
      } catch (err) {
        console.error('Error loading meet room:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
  }, [supabase, router]);

  async function getMeetToken(roomName: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: user?.email?.split('@')[0] || room?.username || 'Host',
          participantIdentity: user?.id,
          roomType: 'meet',
        }),
      });

      if (response.ok) {
        const { token: t, url } = await response.json();
        setToken(t);
        setServerUrl(url);
      }
    } catch (error) {
      console.error('Error getting meet token:', error);
    }
  }

  async function handleStartMeeting() {
    if (!room) return;

    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      alert('Please allow camera and microphone access to start the meeting');
      return;
    }

    await (supabase.from('meet_rooms') as any)
      .update({
        title: title || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', room.id);

    setRoom({ ...room, is_active: true, title });
    setInMeeting(true);
    await getMeetToken(room.room_name);
    copyToClipboard(getMeetUrl()).then((ok) => {
      setUrlCopied(ok);
      setTimeout(() => setUrlCopied(false), 3000);
    });
  }

  async function handleEndMeeting() {
    if (!room) return;

    const { error } = await (supabase.from('meet_rooms') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', room.id);

    if (!error) {
      setRoom({ ...room, is_active: false });
      setInMeeting(false);
      setToken(null);
      setServerUrl(null);
    } else {
      alert('Failed to end meeting. Please try again.');
    }
  }

  function getMeetUrl() {
    if (!room) return '';
    return typeof window !== 'undefined'
      ? `${window.location.origin}/meet/${room.username}`
      : `https://tipjar.live/meet/${room.username}`;
  }

  async function copyToClipboard(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }

  function handleCopyUrl() {
    if (!room) return;
    copyToClipboard(getMeetUrl()).then((ok) => {
      setUrlCopied(ok);
      setTimeout(() => setUrlCopied(false), 3000);
    });
  }

  async function handleShare() {
    if (!room) return;
    const meetUrl = getMeetUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: room.title || `${room.username}'s Meeting`,
          text: isM10Domain ? 'Join my video meeting' : 'Join my video meeting on TipJar.live',
          url: meetUrl,
        });
      } catch (err) {
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  }

  const isM10Domain = typeof window !== 'undefined' && window.location.hostname.includes('m10djcompany.com');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center text-white">
          {isM10Domain ? (
            <Image src="/assets/m10 dj company logo white.gif" alt="M10" width={128} height={128} className="mb-4" />
          ) : (
            <TipJarAnimatedLoader size={128} className="mb-4" />
          )}
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center px-4">
          <p className="text-lg mb-4">Failed to load</p>
          <Button onClick={() => router.push('/tipjar/signin')} variant="outline" className="text-white border-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {!inMeeting ? (
        <div className="h-full flex flex-col">
          <div className="px-4 pt-safe-top pb-4 border-b border-gray-800 flex items-center gap-3">
            {isM10Domain && (
              <Image src="/assets/m10 dj company logo white.gif" alt="M10" width={40} height={40} className="flex-shrink-0" />
            )}
            <div>
              <h1 className="text-2xl font-bold">Video Meeting</h1>
            <p className="text-gray-400 text-sm mt-1">
              Start a video call with your audience using LiveKit&apos;s premade conferencing UI
            </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            <div>
              <Label htmlFor="title" className="text-white mb-2 block">Meeting Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value.substring(0, 100))}
                placeholder={`Meet with @${room.username}`}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                maxLength={100}
              />
            </div>

            <div className="pb-safe-bottom pt-4">
              <Button
                onClick={handleStartMeeting}
                size="lg"
                className={`w-full text-lg font-semibold py-6 rounded-xl ${
                  isM10Domain
                    ? 'bg-[#fcba00] hover:bg-[#e5a800] text-black'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                }`}
              >
                <Video className="h-6 w-6 mr-2" />
                Start Meeting
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="px-4 pt-safe-top pb-3 border-b border-gray-800 bg-black/95 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isM10Domain && (
                <Image src="/assets/m10 dj company logo white.gif" alt="M10" width={32} height={32} className="flex-shrink-0" />
              )}
              <div className={`w-2 h-2 rounded-full animate-pulse ${isM10Domain ? 'bg-[#fcba00]' : 'bg-emerald-500'}`} />
              <span className={`font-bold text-sm ${isM10Domain ? 'text-[#fcba00]' : 'text-emerald-500'}`}>IN MEETING</span>
            </div>
            <Button
              onClick={handleEndMeeting}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <Square className="h-4 w-4 mr-1" />
              End Meeting
            </Button>
          </div>

          <div className="flex-1 relative min-h-0">
            {token && serverUrl ? (
              <VideoMeetPlayer
                roomName={room.room_name}
                token={token}
                serverUrl={serverUrl}
                onDisconnected={handleEndMeeting}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Connecting...
              </div>
            )}
          </div>

          <div className="px-4 py-4 border-t border-gray-800 bg-black/95 backdrop-blur-sm pb-safe-bottom">
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 bg-white p-1.5 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(getMeetUrl())}`}
                  alt="Scan to join meeting"
                  width={100}
                  height={100}
                  className="block"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={getMeetUrl()}
                    className="flex-1 min-w-0 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white text-sm font-mono select-text"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    onClick={handleCopyUrl}
                    variant="outline"
                    size="icon"
                    className={`flex-shrink-0 ${isM10Domain ? 'border-[#fcba00]/50 text-white hover:bg-[#fcba00]/20 hover:border-[#fcba00]' : 'border-gray-700 text-white hover:bg-gray-800'}`}
                  >
                    {urlCopied ? <Check className={`h-4 w-4 ${isM10Domain ? 'text-[#fcba00]' : 'text-green-400'}`} /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <a
                  href={getMeetUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                >
                  Open link
                </a>
              </div>
            </div>
            <Button
              onClick={handleShare}
              variant="outline"
              className={`w-full mt-3 text-white ${isM10Domain ? 'border-[#fcba00]/50 hover:bg-[#fcba00]/20 hover:border-[#fcba00]' : 'border-gray-700 hover:bg-gray-800'}`}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Meeting Link
            </Button>
            {isM10Domain && (
              <div className="mt-2 text-center text-xs text-[#fcba00]/80">M10 Video Meeting</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
