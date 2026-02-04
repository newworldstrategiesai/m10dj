'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { VideoMeetPlayer } from '@/components/VideoMeetPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Copy, Video, Share2, Check, Square, Play, Download, Users, Ban, UserX, ArrowLeft, LogIn, Film, FileText, Music, Wrench, Mic } from 'lucide-react';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

interface MeetRoom {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  is_active: boolean;
  recording_url?: string | null;
  banned_identities?: string[] | null;
  banned_names?: string[] | null;
  transcription_enabled?: boolean | null;
  transcript?: string | null;
  request_a_song_enabled?: boolean | null;
  updated_at?: string;
}

export default function MeetPage() {
  const [room, setRoom] = useState<MeetRoom | null>(null);
  const [allRooms, setAllRooms] = useState<MeetRoom[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inMeeting, setInMeeting] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [participantCount, setParticipantCount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<{ identity: string; name: string }[]>([]);
  const [bannedList, setBannedList] = useState<{ identities: string[]; names: string[] } | null>(null);
  const [roomParticipantCounts, setRoomParticipantCounts] = useState<Record<string, number>>({});
  const [toolsOpen, setToolsOpen] = useState(false);
  const [toolsBusy, setToolsBusy] = useState(false);
  const [playingRecording, setPlayingRecording] = useState<{
    url: string;
    title: string;
    transcript: string | null;
    mediaType: 'video' | 'audio';
  } | null>(null);

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

        const isM10Admin = isM10Domain && isSuperAdminEmail(user.email);

        if (existingRoom) {
          const typed = existingRoom as MeetRoom;
          setRoom(typed);
          setTitle(typed.title || `Meet with @${typed.username}`);
          // Do not auto-join: require user to click "Start Meeting" (Go live) before broadcast starts
          setInMeeting(false);
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

        if (isM10Admin) {
          const { data: rooms } = await supabase
            .from('meet_rooms')
            .select('*')
            .order('updated_at', { ascending: false });
          setAllRooms((rooms as MeetRoom[]) || []);
        }
      } catch (err) {
        console.error('Error loading meet room:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
  }, [supabase, router]);

  const isM10Domain = typeof window !== 'undefined' && window.location.hostname.includes('m10djcompany.com');

  // Poll participants when in meeting; poll banned list for super admin
  useEffect(() => {
    if (!inMeeting || !room) return;
    const roomName = room.room_name;

    async function fetchParticipants() {
      try {
        const res = await fetch(`/api/livekit/meet/participants?roomName=${encodeURIComponent(roomName)}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.participants ?? [];
          setParticipantCount(list.length);
          setParticipants(list);
        }
      } catch {
        // ignore
      }
    }

    async function fetchBanned() {
      if (!isM10Domain) return;
      try {
        const res = await fetch(`/api/livekit/meet/banned?roomName=${encodeURIComponent(roomName)}`);
        if (res.ok) {
          const data = await res.json();
          setBannedList({ identities: data.bannedIdentities ?? [], names: data.bannedNames ?? [] });
        }
      } catch {
        // ignore
      }
    }

    fetchParticipants();
    fetchBanned();
    const t = setInterval(() => {
      fetchParticipants();
      fetchBanned();
    }, 5000);
    return () => clearInterval(t);
  }, [inMeeting, room?.room_name, isM10Domain]);

  // Poll participant counts for active rooms (super admin, pre-meeting) for All Meet Rooms
  useEffect(() => {
    if (!isM10Domain || inMeeting || allRooms.length === 0) return;
    const activeRooms = allRooms.filter((r) => r.is_active);
    if (activeRooms.length === 0) return;

    async function fetchCounts() {
      const counts: Record<string, number> = {};
      await Promise.all(
        activeRooms.map(async (r) => {
          try {
            const res = await fetch(`/api/livekit/meet/participants?roomName=${encodeURIComponent(r.room_name)}`);
            if (res.ok) {
              const data = await res.json();
              counts[r.room_name] = data.participants?.length ?? 0;
            }
          } catch {
            // ignore
          }
        })
      );
      setRoomParticipantCounts((prev) => ({ ...prev, ...counts }));
    }

    fetchCounts();
    const t = setInterval(fetchCounts, 10000);
    return () => clearInterval(t);
  }, [isM10Domain, inMeeting, allRooms]);

  async function getMeetToken(roomName: string, roomOverride?: MeetRoom) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const r = roomOverride ?? room;
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: user?.email?.split('@')[0] || r?.username || 'Host',
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

  async function handleJoinOtherRoom(r: MeetRoom) {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      alert('Please allow camera and microphone access to join');
      return;
    }

    await (supabase.from('meet_rooms') as any)
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', r.id);

    setRoom({ ...r, is_active: true });
    setTitle(r.title || `Meet with @${r.username}`);
    setInMeeting(true);
    await getMeetToken(r.room_name, r);
  }

  async function handleEndMeeting() {
    if (!room) return;

    // End LiveKit room first (disconnects all participants)
    try {
      await fetch('/api/livekit/meet/end-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName: room.room_name }),
      });
    } catch {
      // Continue even if API fails (room may already be empty)
    }

    const { error } = await (supabase.from('meet_rooms') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', room.id);

    if (!error) {
      setRoom({ ...room, is_active: false });
      setInMeeting(false);
      setToken(null);
      setServerUrl(null);
      setParticipantCount(null);
      setParticipants([]);
      setBannedList(null);
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

  async function toolsBulkUpdate(updates: Partial<MeetRoom>) {
    if (!isM10Domain || allRooms.length === 0) return;
    setToolsBusy(true);
    try {
      const ts = new Date().toISOString();
      await Promise.all(
        allRooms.map((r) =>
          (supabase.from('meet_rooms') as any)
            .update({ ...updates, updated_at: ts })
            .eq('id', r.id)
        )
      );
      setAllRooms((prev) => prev.map((r) => ({ ...r, ...updates })));
      if (room && allRooms.some((r) => r.id === room.id)) {
        setRoom((prev) => (prev ? { ...prev, ...updates } : null));
      }
    } catch (e) {
      console.error('Tools bulk update failed:', e);
      alert('Failed to apply action. Please try again.');
    } finally {
      setToolsBusy(false);
    }
  }

  const recentRecordings = useMemo(() => {
    const list: Array<{
      id: string;
      url: string;
      title: string;
      date: string;
      transcript: string | null;
      mediaType: 'video' | 'audio';
      username: string;
    }> = [];
    if (room?.recording_url) {
      const ext = room.recording_url.toLowerCase().endsWith('.mp4') ? 'video' : 'audio';
      list.push({
        id: room.id,
        url: room.recording_url,
        title: room.title || `Meet @${room.username}`,
        date: room.updated_at || '',
        transcript: room.transcript ?? null,
        mediaType: ext as 'video' | 'audio',
        username: room.username,
      });
    }
    if (isM10Domain) {
      for (const r of allRooms) {
        if (r.recording_url && r.id !== room?.id) {
          const ext = r.recording_url.toLowerCase().endsWith('.mp4') ? 'video' : 'audio';
          list.push({
            id: r.id,
            url: r.recording_url,
            title: r.title || `Meet @${r.username}`,
            date: r.updated_at || '',
            transcript: r.transcript ?? null,
            mediaType: ext as 'video' | 'audio',
            username: r.username,
          });
        }
      }
    }
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list.slice(0, 20);
  }, [room, allRooms, isM10Domain]);

  function formatRecordingDate(iso: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

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
          <div className="px-4 pt-safe-top pb-4 border-b border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {isM10Domain && (
                <Link
                  href="/admin/dashboard"
                  className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  title="Back to dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              )}
              {isM10Domain && (
                <Image src="/assets/m10 dj company logo white.gif" alt="M10" width={40} height={40} className="flex-shrink-0" />
              )}
              <div className="min-w-0">
                <h1 className="text-2xl font-bold">Video Meeting</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Start a video call with your audience using LiveKit&apos;s premade conferencing UI
                </p>
              </div>
            </div>
            {isM10Domain && (
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0 border-gray-600 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-[#fcba00]/50"
                onClick={() => setToolsOpen(true)}
                title="Tools & quick actions"
              >
                <Wrench className="h-5 w-5" />
              </Button>
            )}
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

            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <Label htmlFor="transcription" className="text-white">Transcription</Label>
                </div>
                <Switch
                  id="transcription"
                  checked={room.transcription_enabled ?? false}
                  onCheckedChange={async (checked) => {
                    const { error } = await (supabase.from('meet_rooms') as any)
                      .update({ transcription_enabled: checked, updated_at: new Date().toISOString() })
                      .eq('id', room.id);
                    if (!error) setRoom({ ...room, transcription_enabled: checked });
                  }}
                  className={
                    isM10Domain
                      ? 'data-[state=checked]:bg-[#fcba00] data-[state=checked]:dark:bg-[#fcba00]'
                      : 'data-[state=checked]:bg-emerald-600 data-[state=checked]:dark:bg-emerald-600'
                  }
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                When on, enable transcription in your LiveKit project so speech in this room is transcribed and saved below.
              </p>
              {room.transcript && room.transcript.trim() && (
                <div className="mt-2 rounded-lg border border-gray-700 bg-gray-900/50 p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs text-gray-400 mb-1">Last saved transcript</p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{room.transcript.trim()}</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-gray-400" />
                  <Label htmlFor="request-a-song" className="text-white">Request a Song</Label>
                </div>
                <Switch
                  id="request-a-song"
                  checked={room.request_a_song_enabled ?? false}
                  onCheckedChange={async (checked) => {
                    const { error } = await (supabase.from('meet_rooms') as any)
                      .update({ request_a_song_enabled: checked, updated_at: new Date().toISOString() })
                      .eq('id', room.id);
                    if (!error) setRoom({ ...room, request_a_song_enabled: checked });
                  }}
                  className={
                    isM10Domain
                      ? 'data-[state=checked]:bg-[#fcba00] data-[state=checked]:dark:bg-[#fcba00]'
                      : 'data-[state=checked]:bg-emerald-600 data-[state=checked]:dark:bg-emerald-600'
                  }
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                When on, guests see a &quot;Request a Song&quot; button that opens the requests form in the chat panel (desktop and mobile).
              </p>
            </div>

            <div>
              <Label className="text-white mb-2 block">Public Meeting Link</Label>
              <div className="flex gap-2 items-center">
                <div className="flex-shrink-0 bg-white p-1.5 rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(getMeetUrl())}`}
                    alt="Scan to join"
                    width={80}
                    height={80}
                    className="block"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <input
                    readOnly
                    value={getMeetUrl()}
                    className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white text-sm font-mono select-text"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <a
                    href={getMeetUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                  >
                    Open link
                  </a>
                </div>
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  size="icon"
                  className={`flex-shrink-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 ${isM10Domain ? 'dark:border-[#fcba00]/50 dark:hover:bg-[#fcba00]/20 dark:hover:border-[#fcba00] dark:hover:text-[#fcba00]' : 'dark:hover:text-emerald-400'}`}
                  title="Copy link"
                >
                  {urlCopied ? <Check className={`h-4 w-4 text-emerald-600 dark:text-emerald-400 ${isM10Domain ? 'dark:text-[#fcba00]' : ''}`} /> : <Copy className="h-4 w-4 text-gray-900 dark:text-white" />}
                </Button>
              </div>
              <p className="text-gray-500 text-xs mt-1">Share this link so others can join. Click &quot;Start Meeting&quot; when you&apos;re ready to go live.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white">Recent recordings</Label>
                <Link
                  href={isM10Domain ? '/dashboard/recordings' : '/tipjar/dashboard/recordings'}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  <Film className="h-3.5 w-3.5" />
                  View all
                </Link>
              </div>
              {recentRecordings.length > 0 ? (
                <div className="rounded-lg border border-gray-700 bg-gray-900/50 divide-y divide-gray-800 max-h-64 overflow-y-auto">
                  {recentRecordings.map((rec) => (
                    <div
                      key={rec.id + rec.date}
                      className="flex items-center gap-3 p-3 hover:bg-gray-800/50 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPlayingRecording({
                            url: rec.url,
                            title: rec.title,
                            transcript: rec.transcript,
                            mediaType: rec.mediaType,
                          })
                        }
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${isM10Domain ? 'bg-[#fcba00]/20 text-[#fcba00] hover:bg-[#fcba00]/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                        title="Play and view transcript"
                      >
                        {rec.mediaType === 'video' ? (
                          <Film className="h-5 w-5" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{rec.title}</p>
                        <p className="text-xs text-gray-500">{formatRecordingDate(rec.date)}</p>
                        {rec.transcript && rec.transcript.trim() && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate" title="Has transcript">
                            Transcript available
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                          onClick={() =>
                            setPlayingRecording({
                              url: rec.url,
                              title: rec.title,
                              transcript: rec.transcript,
                              mediaType: rec.mediaType,
                            })
                          }
                          title="Play and view transcript"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <a
                          href={rec.url}
                          download
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 ${isM10Domain ? 'hover:text-[#fcba00]' : 'hover:text-emerald-400'}`}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 p-4 text-center">
                  <p className="text-sm text-gray-500">No recordings yet. Start a meeting and click Record to capture.</p>
                  <Link
                    href={isM10Domain ? '/dashboard/recordings' : '/tipjar/dashboard/recordings'}
                    className="mt-2 inline-block text-xs text-gray-400 hover:text-white"
                  >
                    View all recordings →
                  </Link>
                </div>
              )}
            </div>

            {isM10Domain && allRooms.length > 0 && (
              <div>
                <Label className="text-white mb-2 block">All Meet Rooms</Label>
                <div className="rounded-lg border border-gray-700 bg-gray-900/50 max-h-48 overflow-y-auto">
                  {allRooms.map((r) => {
                    const count = r.is_active ? (roomParticipantCounts[r.room_name] ?? null) : null;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-800 last:border-0 hover:bg-gray-800/50"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-white">@{r.username}</span>
                          {r.is_active && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${isM10Domain ? 'bg-[#fcba00]/20 text-[#fcba00]' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              Live
                            </span>
                          )}
                          {count !== null && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({count} in call)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-[#fcba00]/50 text-[#fcba00] hover:bg-[#fcba00]/20 hover:border-[#fcba00]"
                            onClick={() => handleJoinOtherRoom(r)}
                          >
                            <LogIn className="h-3 w-3 mr-1" />
                            Join
                          </Button>
                          <a
                            href={`/meet/${r.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 px-2"
                          >
                            Open
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
          <div className="px-4 pt-safe-top pb-3 border-b border-gray-800 bg-black/95 backdrop-blur-sm flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {isM10Domain && (
                <Link
                  href="/admin/dashboard"
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                  title="Back to dashboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
              {isM10Domain && (
                <Image src="/assets/m10 dj company logo white.gif" alt="M10" width={32} height={32} className="flex-shrink-0" />
              )}
              <div className={`w-2 h-2 rounded-full animate-pulse ${isM10Domain ? 'bg-[#fcba00]' : 'bg-emerald-500'}`} />
              <span className={`font-bold text-sm ${isM10Domain ? 'text-[#fcba00]' : 'text-emerald-500'}`}>IN MEETING</span>
              {participantCount !== null && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3.5 w-3.5" />
                  {participantCount} participant{participantCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isM10Domain && (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-600 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-[#fcba00]/50"
                  onClick={() => setToolsOpen(true)}
                  title="Tools & quick actions"
                >
                  <Wrench className="h-4 w-4" />
                </Button>
              )}
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
          </div>

          <div className="flex-1 relative min-h-0">
            {token && serverUrl ? (
              <VideoMeetPlayer
                roomName={room.room_name}
                token={token}
                serverUrl={serverUrl}
                onDisconnected={handleEndMeeting}
                isSuperAdmin={isM10Domain}
                isHost={true}
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
                    className={`flex-shrink-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 ${isM10Domain ? 'dark:border-[#fcba00]/50 dark:hover:bg-[#fcba00]/20 dark:hover:border-[#fcba00] dark:hover:text-[#fcba00]' : 'dark:hover:text-emerald-400'}`}
                    title="Copy link"
                  >
                    {urlCopied ? <Check className={`h-4 w-4 text-emerald-600 dark:text-emerald-400 ${isM10Domain ? 'dark:text-[#fcba00]' : ''}`} /> : <Copy className="h-4 w-4 text-gray-900 dark:text-white" />}
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
              className={`w-full mt-3 font-medium text-gray-900 bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 dark:text-white dark:bg-gray-800/80 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-500 ${isM10Domain ? 'dark:!border-[#fcba00]/60 dark:hover:!bg-[#fcba00]/20 dark:hover:!border-[#fcba00]' : ''}`}
            >
              <Share2 className="h-4 w-4 mr-2 shrink-0" />
              Share Meeting Link
            </Button>

            {isM10Domain && participants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <Label className="text-white mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants ({participants.length})
                </Label>
                <div className="rounded-lg border border-gray-700 bg-gray-900/50 max-h-24 overflow-y-auto p-2 flex flex-wrap gap-1">
                  {participants.map((p) => (
                    <span
                      key={p.identity}
                      className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300"
                      title={p.identity}
                    >
                      {p.name || p.identity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isM10Domain && bannedList && (bannedList.identities.length > 0 || bannedList.names.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <Label className="text-white mb-2 flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Banned participants
                </Label>
                <div className="rounded-lg border border-gray-700 bg-gray-900/50 max-h-32 overflow-y-auto space-y-1 p-2">
                  {bannedList.identities.map((id) => (
                    <div key={id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-300 truncate">{id}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/livekit/meet/unban-participant', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ roomName: room.room_name, participantIdentity: id }),
                            });
                            if (res.ok) {
                              setBannedList((prev) =>
                                prev ? { ...prev, identities: prev.identities.filter((x) => x !== id) } : null
                              );
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        className="flex-shrink-0 px-2 py-1 rounded text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      >
                        <UserX className="h-3 w-3 inline mr-1" />
                        Unban
                      </button>
                    </div>
                  ))}
                  {bannedList.names.map((name) => (
                    <div key={name} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-gray-300 truncate">{name} (name)</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/livekit/meet/unban-participant', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ roomName: room.room_name, participantName: name }),
                            });
                            if (res.ok) {
                              setBannedList((prev) =>
                                prev ? { ...prev, names: prev.names.filter((n) => n !== name) } : null
                              );
                            }
                          } catch {
                            // ignore
                          }
                        }}
                        className="flex-shrink-0 px-2 py-1 rounded text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      >
                        <UserX className="h-3 w-3 inline mr-1" />
                        Unban
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isM10Domain && (
              <div className="mt-2 text-center text-xs text-[#fcba00]/80">M10 Video Meeting</div>
            )}
          </div>
        </div>
      )}

      <Dialog open={!!playingRecording} onOpenChange={(open) => !open && setPlayingRecording(null)}>
        <DialogContent className="border-gray-700 bg-gray-900 text-white dark:border-gray-600 dark:bg-gray-900 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {playingRecording && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white dark:text-white truncate pr-8">
                  {playingRecording.title}
                </DialogTitle>
                <DialogDescription className="text-gray-400 dark:text-gray-400 sr-only">
                  Play recording and view transcript
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
                <div className="rounded-lg overflow-hidden bg-black aspect-video max-h-[50vh] flex items-center justify-center">
                  {playingRecording.mediaType === 'video' ? (
                    <video
                      src={playingRecording.url}
                      controls
                      className="w-full h-full object-contain"
                      preload="metadata"
                    />
                  ) : (
                    <div className="w-full p-6 flex flex-col items-center gap-2">
                      <Mic className="h-12 w-12 text-gray-500" />
                      <audio src={playingRecording.url} controls className="w-full max-w-md" preload="metadata" />
                    </div>
                  )}
                </div>
                {playingRecording.transcript && playingRecording.transcript.trim() ? (
                  <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                    <Label className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 block">
                      Transcript
                    </Label>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {playingRecording.transcript.trim()}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No transcript for this recording.</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={toolsOpen} onOpenChange={setToolsOpen}>
        <DialogContent className="border-gray-700 bg-gray-900 text-white dark:border-gray-600 dark:bg-gray-900 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white dark:text-white flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#fcba00]" />
              Tools & quick actions
            </DialogTitle>
            <DialogDescription className="text-gray-400 dark:text-gray-400">
              Apply these actions to all meet rooms. Only visible to super admins.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-gray-600 bg-gray-800/80 text-gray-200 hover:bg-[#fcba00]/20 hover:border-[#fcba00]/50 hover:text-[#fcba00]"
              disabled={toolsBusy || allRooms.length === 0}
              onClick={() => toolsBulkUpdate({ request_a_song_enabled: true }).then(() => setToolsOpen(false))}
            >
              <Music className="h-4 w-4 mr-2 shrink-0" />
              Display &quot;Request a Song&quot; for all rooms
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-gray-600 bg-gray-800/80 text-gray-200 hover:bg-[#fcba00]/20 hover:border-[#fcba00]/50 hover:text-[#fcba00]"
              disabled={toolsBusy || allRooms.length === 0}
              onClick={() => toolsBulkUpdate({ request_a_song_enabled: false }).then(() => setToolsOpen(false))}
            >
              <Music className="h-4 w-4 mr-2 shrink-0" />
              Hide &quot;Request a Song&quot; for all rooms
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-gray-600 bg-gray-800/80 text-gray-200 hover:bg-[#fcba00]/20 hover:border-[#fcba00]/50 hover:text-[#fcba00]"
              disabled={toolsBusy || allRooms.length === 0}
              onClick={() => toolsBulkUpdate({ transcription_enabled: true }).then(() => setToolsOpen(false))}
            >
              <FileText className="h-4 w-4 mr-2 shrink-0" />
              Enable transcription for all rooms
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-gray-600 bg-gray-800/80 text-gray-200 hover:bg-[#fcba00]/20 hover:border-[#fcba00]/50 hover:text-[#fcba00]"
              disabled={toolsBusy || allRooms.length === 0}
              onClick={() => toolsBulkUpdate({ transcription_enabled: false }).then(() => setToolsOpen(false))}
            >
              <FileText className="h-4 w-4 mr-2 shrink-0" />
              Disable transcription for all rooms
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/40 hover:border-red-600 hover:text-red-200"
              disabled={toolsBusy || allRooms.length === 0}
              onClick={async () => {
                await toolsBulkUpdate({ is_active: false });
                setToolsOpen(false);
                if (inMeeting && room) await handleEndMeeting();
              }}
            >
              <Square className="h-4 w-4 mr-2 shrink-0" />
              End all active meetings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
