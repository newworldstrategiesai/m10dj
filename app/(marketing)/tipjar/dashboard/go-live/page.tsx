'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LiveVideoPlayer } from '@/components/LiveVideoPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Play, Square, DollarSign, Users, X, Share2, Check, Circle, StopCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface LiveStream {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  is_live: boolean;
  ppv_price_cents: number | null;
  require_auth: boolean;
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [ppvEnabled, setPpvEnabled] = useState(false);
  const [ppvPrice, setPpvPrice] = useState('');
  const [requireAuth, setRequireAuth] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();
  const viewerCountChannelRef = useRef<RealtimeChannel | null>(null);
  const earningsChannelRef = useRef<RealtimeChannel | null>(null);

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
        setRequireAuth(typedStream.require_auth || false);
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
    // Clean up existing channel if any
    if (viewerCountChannelRef.current) {
      supabase.removeChannel(viewerCountChannelRef.current);
    }

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

    viewerCountChannelRef.current = channel;
    return channel;
  }

  function startEarningsTracking(streamId: string) {
    // Clean up existing channel if any
    if (earningsChannelRef.current) {
      supabase.removeChannel(earningsChannelRef.current);
    }

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

    earningsChannelRef.current = channel;
    return channel;
  }

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (viewerCountChannelRef.current) {
        supabase.removeChannel(viewerCountChannelRef.current);
        viewerCountChannelRef.current = null;
      }
      if (earningsChannelRef.current) {
        supabase.removeChannel(earningsChannelRef.current);
        earningsChannelRef.current = null;
      }
    };
  }, [supabase]);

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
        require_auth: requireAuth,
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

    try {
      // 1. Disconnect from LiveKit room (if connected)
      // This is handled by LiveVideoPlayer component cleanup
      
      // 2. Stop all media tracks
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const tracks = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        tracks.getTracks().forEach(track => {
          track.stop();
        });
      }

      // 3. Update stream status in database - this will trigger real-time update for viewers
      const { error } = await (supabase
        .from('live_streams') as any)
        .update({
          is_live: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stream.id);

      if (error) {
        console.error('Error stopping stream:', error);
        alert('Failed to stop stream. Please try again.');
        return;
      }

      // 4. Clean up subscriptions
      if (viewerCountChannelRef.current) {
        supabase.removeChannel(viewerCountChannelRef.current);
        viewerCountChannelRef.current = null;
      }
      if (earningsChannelRef.current) {
        supabase.removeChannel(earningsChannelRef.current);
        earningsChannelRef.current = null;
      }

      // Stop recording if active
      if (isRecording && mediaRecorderRef.current) {
        stopRecording();
      }

      // 5. Clean up local state
      setStream({ ...stream, is_live: false });
      setStreaming(false);
      setToken(null);
      setServerUrl(null);
      setViewerCount(0);
      setEarnings(0);
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Error in handleStopStream:', err);
      alert('An error occurred while stopping the stream. Please refresh the page.');
    }
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

  async function startRecording() {
    if (!stream || !token || !serverUrl) {
      alert('Please start streaming first');
      return;
    }

    try {
      // Request screen/window capture for recording
      // This captures what the streamer sees (their own stream + any overlays)
      const captureStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });

      // Determine best MIME type
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(captureStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      });

      recordingChunksRef.current = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        captureStream.getTracks().forEach(track => track.stop());
        
        // Upload recording
        await uploadRecording();
        
        // Reset state
        setIsRecording(false);
        setRecordingDuration(0);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        console.error('Recording error:', event);
        alert('An error occurred while recording. Please try again.');
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      recorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Update database
      await (supabase
        .from('live_streams') as any)
        .update({ is_recording: true })
        .eq('id', stream.id);

      // Start duration timer
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingDuration(elapsed);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      if ((error as Error).name === 'NotAllowedError') {
        alert('Please allow screen sharing to record your stream.');
      } else {
        alert('Failed to start recording. Please check permissions and try again.');
      }
    }
  }

  async function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Update database
      if (stream) {
        await (supabase
          .from('live_streams') as any)
          .update({ is_recording: false })
          .eq('id', stream.id);
      }
    }
  }

  async function uploadRecording() {
    if (!stream || recordingChunksRef.current.length === 0) {
      console.error('No recording data to upload');
      return;
    }

    try {
      // Combine all chunks into a single blob
      const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
      const fileSize = blob.size;
      const duration = recordingDuration;

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording-${stream.id}-${timestamp}.webm`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('stream-recordings')
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload recording. Please try again.');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('stream-recordings')
        .getPublicUrl(fileName);

      // Update stream record with recording info
      const { error: updateError } = await (supabase
        .from('live_streams') as any)
        .update({
          recording_url: urlData.publicUrl,
          recording_duration: duration,
          recording_size: fileSize,
          recorded_at: new Date().toISOString(),
        })
        .eq('id', stream.id);

      if (updateError) {
        console.error('Error updating stream:', updateError);
      } else {
        alert(`Recording saved! Duration: ${formatDuration(duration)}, Size: ${formatFileSize(fileSize)}`);
      }

      // Clear chunks
      recordingChunksRef.current = [];
    } catch (error) {
      console.error('Error uploading recording:', error);
      alert('Failed to upload recording. Please try again.');
    }
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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
                onChange={(e) => {
                  // Sanitize input: limit length and remove dangerous characters
                  const sanitized = e.target.value.substring(0, 100);
                  setTitle(sanitized);
                }}
                placeholder={`Live with @${stream.username}`}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                maxLength={100}
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

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label htmlFor="requireAuth" className="text-white font-semibold">
                    Require Login
                  </Label>
                  <p className="text-gray-400 text-sm mt-1">
                    Only logged-in users can view
                  </p>
                </div>
                <Switch
                  id="requireAuth"
                  checked={requireAuth}
                  onCheckedChange={setRequireAuth}
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
                  max="999.99"
                  value={ppvPrice}
                  onChange={(e) => {
                    // Sanitize: only allow numbers and one decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = value.split('.');
                    const sanitized = parts.length > 2 
                      ? parts[0] + '.' + parts.slice(1).join('')
                      : value;
                    setPpvPrice(sanitized.substring(0, 6)); // Max 999.99
                  }}
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
                {isRecording && (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-500 font-bold text-xs">REC</span>
                    <span className="text-gray-400 text-xs font-mono">
                      {formatDuration(recordingDuration)}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <StopCircle className="h-4 w-4 mr-1" />
                    Stop Rec
                  </Button>
                ) : (
                  <Button
                    onClick={startRecording}
                    variant="outline"
                    size="sm"
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Circle className="h-4 w-4 mr-1" />
                    Record
                  </Button>
                )}
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

