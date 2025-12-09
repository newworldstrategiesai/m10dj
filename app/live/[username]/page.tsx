'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LiveVideoPlayer } from '@/components/LiveVideoPlayer';
import { LiveChat } from '@/components/LiveChat';
import { TipJarInStream } from '@/components/TipJarInStream';
import { TipAlertOverlay } from '@/components/TipAlertOverlay';
import { Button } from '@/components/ui/button';
import { Lock, Share2, Users } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface LiveStream {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  thumbnail_url: string | null;
  is_live: boolean;
  ppv_price_cents: number | null;
}

export default function LiveStreamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = (params?.username as string) || '';
  const ppvToken = searchParams?.get('token') || null;
  
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [paidAccess, setPaidAccess] = useState(false);
  const viewerCountChannelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadStream() {
      try {
        // Get current user if logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          setCurrentUsername(user.email?.split('@')[0] || null);
        }

        // Load stream info
        const { data: streamData, error: streamError } = await supabase
          .from('live_streams')
          .select('*')
          .eq('username', username.replace('@', ''))
          .single();

        if (streamError || !streamData) {
          setError('Stream not found');
          setLoading(false);
          return;
        }

        const typedStreamData = streamData as LiveStream;
        setStream(typedStreamData);

        // Check if stream is live
        if (!typedStreamData.is_live) {
          setError('Stream is currently offline');
          setLoading(false);
          return;
        }

        // Handle PPV access
        if (typedStreamData.ppv_price_cents && typedStreamData.ppv_price_cents > 0) {
          if (ppvToken) {
            // Validate PPV token
            const { data: tokenData } = await supabase
              .from('ppv_tokens')
              .select('*')
              .eq('token', ppvToken)
              .eq('stream_id', typedStreamData.id)
              .eq('used', false)
              .single();

            if (tokenData) {
              setPaidAccess(true);
              // Mark token as used
              await (supabase
                .from('ppv_tokens') as any)
                .update({ used: true, used_at: new Date().toISOString() })
                .eq('id', (tokenData as any).id);
            } else {
              setError('Invalid or expired access token. Please purchase access.');
              setLoading(false);
              return;
            }
          } else {
            setError('This is a paid stream');
            setLoading(false);
            return;
          }
        }

        // Get LiveKit token
        const tokenResponse = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName: typedStreamData.room_name,
            participantName: user?.email?.split('@')[0] || 'Anonymous',
            participantIdentity: user?.id || `anon-${Date.now()}`,
            ppvToken: ppvToken || undefined,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          setError(errorData.error || 'Failed to get access token');
          setLoading(false);
          return;
        }

        const { token: livekitToken, url: livekitUrl } = await tokenResponse.json();
        setToken(livekitToken);
        setServerUrl(livekitUrl);

        // Subscribe to viewer count updates
        const viewerChannel = supabase
          .channel(`viewer_count:${typedStreamData.room_name}`)
          .on(
            'broadcast',
            { event: 'viewer_count_update' },
            (payload) => {
              setViewerCount(payload.payload.count || 0);
            }
          )
          .subscribe();

        viewerCountChannelRef.current = viewerChannel;

        // Initial viewer count fetch
        fetchViewerCount(typedStreamData.room_name);

        setLoading(false);
      } catch (err) {
        console.error('Error loading stream:', err);
        setError('Failed to load stream');
        setLoading(false);
      }
    }

    if (username) {
      loadStream();
    }

    return () => {
      if (viewerCountChannelRef.current) {
        supabase.removeChannel(viewerCountChannelRef.current);
      }
    };
  }, [username, ppvToken, supabase]);

  async function fetchViewerCount(roomName: string) {
    // This would typically come from LiveKit room stats
    // For now, we'll use a simple counter
    // In production, you'd query LiveKit API for actual participant count
  }

  async function handleShare() {
    const streamUrl = `${window.location.origin}/live/@${username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: stream?.title || `${username}'s Live Stream`,
          text: `Watch ${username} live on TipJar.live!`,
          url: streamUrl,
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(streamUrl);
      alert('Stream URL copied to clipboard!');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading stream...</div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white max-w-md px-4">
          <h1 className="text-2xl font-bold mb-4">{error || 'Stream not found'}</h1>
          {stream?.ppv_price_cents && stream.ppv_price_cents > 0 && !paidAccess && (
            <div className="space-y-4">
              <p className="text-gray-400">
                This stream requires a one-time payment of ${(stream.ppv_price_cents / 100).toFixed(2)}
              </p>
              <Button
                onClick={() => {
                  window.location.href = `/live/${username}/pay?price=${stream.ppv_price_cents}`;
                }}
                size="lg"
                className="w-full"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock for ${(stream.ppv_price_cents / 100).toFixed(2)}
              </Button>
            </div>
          )}
          {!stream?.is_live && (
            <p className="text-gray-400 mt-4">
              Next stream: Check back soon!
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* Tip Alert Overlay */}
      <TipAlertOverlay roomName={stream.room_name} />

      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {stream.title || `${stream.username}'s Stream`}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">LIVE</span>
              {viewerCount > 0 && (
                <>
                  <span className="text-gray-600">•</span>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{viewerCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <TipJarInStream
              streamerUserId={stream.user_id}
              streamerUsername={stream.username}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Video Player */}
        <div className="flex-1 bg-black relative">
          <div className="h-full w-full">
            <LiveVideoPlayer
              roomName={stream.room_name}
              token={token}
              serverUrl={serverUrl}
              viewerCount={viewerCount}
            />
          </div>
          
          {/* Watermark */}
          <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
              Live on TipJar.live
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-96 h-96 lg:h-auto border-t lg:border-t-0 lg:border-l border-gray-800">
          <LiveChat
            roomName={stream.room_name}
            currentUserId={currentUserId || undefined}
            currentUsername={currentUsername || undefined}
          />
        </div>
      </div>
    </div>
  );
}
