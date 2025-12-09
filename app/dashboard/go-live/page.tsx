'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LiveVideoPlayer } from '@/components/LiveVideoPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, Play, Square, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  
  // Form state
  const [title, setTitle] = useState('');
  const [ppvEnabled, setPpvEnabled] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadStream() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/tipjar/signin');
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
    // Subscribe to viewer count updates
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

    // Poll for viewer count (in production, use LiveKit API)
    const interval = setInterval(async () => {
      // This would query LiveKit API for actual participant count
      // For now, we'll use a placeholder
    }, 2000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }

  async function loadInitialEarnings(streamId: string) {
    if (!stream) return;
    
    try {
      // Query actual earnings from stream start time
      const streamStartTime = stream.is_live ? new Date().toISOString() : null;
      if (!streamStartTime) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: tips } = await supabase
        .from('stream_alert_events')
        .select('event_data, created_at')
        .eq('user_id', user.id)
        .eq('event_type', 'tip')
        .gte('created_at', streamStartTime);
      
      if (tips) {
        const total = (tips as Array<{ event_data?: { amount?: string | number } }>).reduce((sum, event) => {
          return sum + (parseFloat(String(event.event_data?.amount || 0)) || 0);
        }, 0);
        setEarnings(total);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  }

  function startEarningsTracking(streamId: string) {
    // Load initial earnings
    loadInitialEarnings(streamId);
    
    // Subscribe to earnings updates from tips
    const channel = supabase
      .channel(`earnings:${streamId}`)
      .on(
        'broadcast',
        { event: 'earnings_update' },
        (payload) => {
          // Increment earnings by tip amount
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
    const streamUrl = `${window.location.origin}/live/@${stream.username}`;
    navigator.clipboard.writeText(streamUrl);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div>Failed to load stream</div>
      </div>
    );
  }

  const streamUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://tipjar.live'}/live/@${stream.username}`;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Go Live</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start streaming to your audience in seconds
          </p>
        </div>

        {!streaming ? (
          // Pre-Stream Setup
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stream Setup</CardTitle>
                <CardDescription>
                  Configure your stream before going live
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Stream Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`Live with @${stream.username}`}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="ppv" className="text-base font-semibold">
                      Pay-Per-View
                    </Label>
                    <p className="text-sm text-gray-500">
                      Charge viewers a one-time fee to watch
                    </p>
                  </div>
                  <Switch
                    id="ppv"
                    checked={ppvEnabled}
                    onCheckedChange={setPpvEnabled}
                  />
                </div>

                {ppvEnabled && (
                  <div>
                    <Label htmlFor="ppvPrice">Price ($)</Label>
                    <Input
                      id="ppvPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={ppvPrice}
                      onChange={(e) => setPpvPrice(e.target.value)}
                      placeholder="9.99"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="goal">Tip Goal (optional)</Label>
                  <Input
                    id="goal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    placeholder="500.00"
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleStartStream}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Go Live
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Live Streaming View
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold">Status</span>
                    </div>
                    <span className="text-red-600 dark:text-red-400 font-bold">LIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Viewers</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{viewerCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">Earnings</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">${earnings.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stream URL</CardTitle>
                  <CardDescription>
                    Share this link with your viewers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={streamUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(streamUrl);
                        alert('URL copied!');
                      }}
                      size="icon"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(streamUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Viewer Page
                  </Button>
                </CardContent>
              </Card>

              <Button
                onClick={handleStopStream}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                <Square className="h-5 w-5 mr-2" />
                End Stream
              </Button>
            </div>

            {/* Right Column - Video Preview */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Stream</CardTitle>
                  <CardDescription>
                    This is what your viewers see
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
