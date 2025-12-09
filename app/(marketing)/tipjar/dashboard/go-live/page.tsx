'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LiveVideoPlayer } from '@/components/LiveVideoPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Play, Square, DollarSign, Users, X, Share2, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface LiveStream {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  is_live: boolean;
  ppv_price_cents: number | null;
}

export default function GoLivePage() {
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [urlCopied, setUrlCopied] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [ppvEnabled, setPpvEnabled] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadStream() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/tipjar/signin?redirect=/tipjar/dashboard/go-live');
        return;
      }

      // Check if user already has a stream
      const { data: existingStream } = await supabase
        .from('live_streams')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingStream) {
        const typedStream = existingStream as LiveStream;
        setStream(typedStream);
        setTitle(typedStream.title || `Live with @${typedStream.username}`);
        setPpvEnabled(typedStream.ppv_price_cents ? typedStream.ppv_price_cents > 0 : false);
        setPpvPrice(typedStream.ppv_price_cents ? (typedStream.ppv_price_cents / 100).toString() : '');
        setStreaming(typedStream.is_live);

        if (typedStream.is_live) {
          await getStreamToken(typedStream.room_name);
          startViewerCountTracking(typedStream.room_name);
          startEarningsTracking(typedStream.id);
        }
      } else {
        // Create new stream
        const newUsername = user.email?.split('@')[0] || `user-${user.id.slice(0, 8)}`;
        const roomName = `room-${user.id}`;

        const { data: newStream } = await supabase
          .from('live_streams')
          .insert({
            user_id: user.id,
            username: newUsername,
            room_name: roomName,
            title: `Live with @${newUsername}`,
            is_live: false,
          } as any)
          .select()
          .single();

        if (newStream) {
          const typedNewStream = newStream as LiveStream;
          setStream(typedNewStream);
          setTitle(typedNewStream.title || `Live with @${newUsername}`);
        }
      }

      setLoading(false);
    }

    loadStream();
  }, [supabase, router]);

  async function getStreamToken(roomName: string) {
    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantName: 'Streamer',
          participantIdentity: 'streamer',
        }),
      });

      if (response.ok) {
        const { token, url } = await response.json();
        setToken(token);
        setServerUrl(url);
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
  }

  function startViewerCountTracking(roomName: string) {
    const channel = supabase
      .channel(`viewer_count:${roomName}`)
      .on(
        'broadcast',
        { event: 'viewer_count_update' },
        (payload) => {
          setViewerCount(payload.payload.count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function startEarningsTracking(streamId: string) {
    const channel = supabase
      .channel(`earnings:${streamId}`)
      .on(
        'broadcast',
        { event: 'earnings_update' },
        (payload) => {
          setEarnings(prev => prev + (payload.payload.tip_amount || 0));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleStartStream() {
    if (!stream) return;

    // Request camera/mic permissions
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      alert('Please allow camera and microphone access to go live');
      return;
    }

    // Update stream in database
    await (supabase
      .from('live_streams') as any)
      .update({
        title: title || null,
        is_live: true,
        ppv_price_cents: ppvEnabled && ppvPrice ? Math.round(parseFloat(ppvPrice) * 100) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stream.id);

    setStream({ ...stream, is_live: true, title, ppv_price_cents: ppvEnabled && ppvPrice ? Math.round(parseFloat(ppvPrice) * 100) : null });
    setStreaming(true);
    await getStreamToken(stream.room_name);
    startViewerCountTracking(stream.room_name);
    startEarningsTracking(stream.id);

    // Auto-copy stream URL
    const streamUrl = `https://tipjar.live/live/@${stream.username}`;
    navigator.clipboard.writeText(streamUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 3000);
  }

  async function handleStopStream() {
    if (!stream) return;

    await (supabase
      .from('live_streams') as any)
      .update({
        is_live: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stream.id);

    setStream({ ...stream, is_live: false });
    setStreaming(false);
    setToken(null);
    setServerUrl(null);
    setViewerCount(0);
    setEarnings(0);
  }

  async function handleCopyUrl() {
    if (!stream) return;
    const streamUrl = `https://tipjar.live/live/@${stream.username}`;
    await navigator.clipboard.writeText(streamUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 3000);
  }

  async function handleShare() {
    if (!stream) return;
    const streamUrl = `https://tipjar.live/live/@${stream.username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: stream.title || `${stream.username}'s Live Stream`,
          text: `Watch ${stream.username} live on TipJar.live!`,
          url: streamUrl,
        });
      } catch (err) {
        // User cancelled or error - fallback to copy
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center px-4">
          <p className="text-lg mb-4">Failed to load stream</p>
          <Button onClick={() => router.push('/tipjar/signin')} variant="outline" className="text-white border-white">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {!streaming ? (
        // Pre-Stream Setup - Mobile Optimized
        <div className="h-full flex flex-col">
          {/* Minimal Header */}
          <div className="px-4 pt-safe-top pb-4 border-b border-gray-800">
            <h1 className="text-2xl font-bold">Go Live</h1>
            <p className="text-gray-400 text-sm mt-1">Start streaming in seconds</p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            <div>
              <Label htmlFor="title" className="text-white mb-2 block">Stream Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Live with @${stream.username}`}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label htmlFor="ppv" className="text-white font-semibold">
                    Pay-Per-View
                  </Label>
                  <p className="text-gray-400 text-sm mt-1">
                    Charge viewers to watch
                  </p>
                </div>
                <Switch
                  id="ppv"
                  checked={ppvEnabled}
                  onCheckedChange={setPpvEnabled}
                />
              </div>
            </div>

            {ppvEnabled && (
              <div>
                <Label htmlFor="ppvPrice" className="text-white mb-2 block">Price ($)</Label>
                <Input
                  id="ppvPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={ppvPrice}
                  onChange={(e) => setPpvPrice(e.target.value)}
                  placeholder="9.99"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            )}

            {/* Go Live Button - Fixed at bottom on mobile */}
            <div className="pb-safe-bottom pt-4">
              <Button
                onClick={handleStartStream}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold py-6 rounded-xl"
              >
                <Play className="h-6 w-6 mr-2" />
                Go Live
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // Live Streaming View - Full Screen Mobile
        <div className="h-full flex flex-col">
          {/* Top Stats Bar - Compact for Mobile */}
          <div className="px-4 pt-safe-top pb-3 border-b border-gray-800 bg-black/95 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-500 font-bold text-sm">LIVE</span>
              </div>
              <Button
                onClick={handleStopStream}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <Square className="h-4 w-4 mr-1" />
                End
              </Button>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">{viewerCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-green-400 font-semibold">${earnings.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Video Player - Takes full remaining space */}
          <div className="flex-1 relative bg-black min-h-0">
            {token && serverUrl ? (
              <LiveVideoPlayer
                roomName={stream.room_name}
                token={token}
                serverUrl={serverUrl}
                isStreamer={true}
                viewerCount={viewerCount}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Connecting...
              </div>
            )}
          </div>

          {/* Bottom Controls - Fixed at bottom */}
          <div className="px-4 py-4 border-t border-gray-800 bg-black/95 backdrop-blur-sm pb-safe-bottom">
            <div className="space-y-3">
              {/* Stream URL */}
              <div className="flex gap-2">
                <Input
                  value={`tipjar.live/live/@${stream.username}`}
                  readOnly
                  className="bg-gray-900 border-gray-700 text-white text-sm font-mono flex-1"
                />
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  size="icon"
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  {urlCopied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Share Button */}
              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full border-gray-700 text-white hover:bg-gray-800"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Stream
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

