'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LiveVideoPlayer } from '@/components/LiveVideoPlayer';
import { LiveChat } from '@/components/LiveChat';
import { TipJarInStream } from '@/components/TipJarInStream';
import { TipAlertOverlay } from '@/components/TipAlertOverlay';
import TipJarHeader from '@/components/tipjar/Header';
import { Button } from '@/components/ui/button';
import { Lock, Share2, Users, MessageSquare, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import TipJarAnimatedLoader from '@/components/ui/TipJarAnimatedLoader';

interface LiveStream {
  id: string;
  user_id: string;
  username: string;
  room_name: string;
  title: string | null;
  thumbnail_url: string | null;
  is_live: boolean;
  ppv_price_cents: number | null;
  require_auth: boolean;
}

export default function LiveStreamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  // Decode and clean username parameter with sanitization
  const rawUsername = (params?.username as string) || '';
  const decodedUsername = decodeURIComponent(rawUsername);
  // Sanitize: remove @, trim, and remove any potentially dangerous characters
  const username = decodedUsername
    .replace(/^@/, '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
    .substring(0, 50); // Limit length
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
  const [showChat, setShowChat] = useState(false); // Hidden by default on mobile
  const viewerCountChannelRef = useRef<RealtimeChannel | null>(null);
  const streamStatusChannelRef = useRef<RealtimeChannel | null>(null);
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

        // Load stream info - username is already cleaned above
        const cleanUsername = username.replace(/^@/, '').trim();
        
        if (!cleanUsername) {
          setError('Invalid username');
          setLoading(false);
          return;
        }

        const { data: streamData, error: streamError } = await supabase
          .from('live_streams')
          .select('*')
          .eq('username', cleanUsername)
          .single();

        if (streamError) {
          console.error('Error loading stream:', streamError);
          // Check if it's a 406 error (Not Acceptable) - might be encoding issue
          if (streamError.message?.includes('406') || streamError.code === 'PGRST116') {
            setError('Stream not found. Please check the username.');
          } else {
            setError(`Failed to load stream: ${streamError.message}`);
          }
          setLoading(false);
          return;
        }

        if (!streamData) {
          setError('Stream not found');
          setLoading(false);
          return;
        }

        const typedStreamData = streamData as LiveStream;
        
        // Note: We don't block here if require_auth is true - let the API route handle
        // authorization (it will check if stream owner is admin and allow public access)
        // This allows admins to broadcast public links even if require_auth is set
        
        setStream(typedStreamData);

        // Check if stream is live
        if (!typedStreamData.is_live) {
          setError('Stream is currently offline');
          setLoading(false);
          return;
        }

        // Handle PPV access
        let hasValidPPVToken = false;
        if (typedStreamData.ppv_price_cents && typedStreamData.ppv_price_cents > 0) {
          if (ppvToken) {
            // Validate PPV token (but don't mark as used yet)
            const { data: tokenData } = await supabase
              .from('ppv_tokens')
              .select('*')
              .eq('token', ppvToken)
              .eq('stream_id', typedStreamData.id)
              .eq('used', false)
              .single();

            if (tokenData) {
              hasValidPPVToken = true;
              setPaidAccess(true);
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

        // Get LiveKit token with retry logic
        let tokenResponse;
        let retries = 3;
        let livekitToken: string | null = null;
        let livekitUrl: string | null = null;

        while (retries > 0) {
          try {
            tokenResponse = await fetch('/api/livekit/token', {
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

            if (tokenResponse.ok) {
              const data = await tokenResponse.json();
              livekitToken = data.token;
              livekitUrl = data.url;
              break;
            } else if (retries === 1) {
              // Last retry failed
              const errorData = await tokenResponse.json();
              setError(errorData.error || 'Failed to get access token. Please try again.');
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error getting token (retry):', err);
            if (retries === 1) {
              setError('Connection failed. Please check your internet and try again.');
              setLoading(false);
              return;
            }
          }
          retries--;
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
        }

        if (!livekitToken || !livekitUrl) {
          setError('Failed to connect to stream. Please try again.');
          setLoading(false);
          return;
        }

        // Only mark PPV token as used AFTER successful token generation
        if (hasValidPPVToken && ppvToken) {
          const { data: tokenData } = await supabase
            .from('ppv_tokens')
            .select('*')
            .eq('token', ppvToken)
            .eq('stream_id', typedStreamData.id)
            .eq('used', false)
            .single();

          if (tokenData) {
            await (supabase
              .from('ppv_tokens') as any)
              .update({ used: true, used_at: new Date().toISOString() })
              .eq('id', (tokenData as any).id);
          }
        }

        setToken(livekitToken);
        setServerUrl(livekitUrl);

        // Subscribe to viewer count updates
        const viewerChannel = supabase
          .channel(`viewer_count:${typedStreamData.room_name}`)
          .on(
            'broadcast',
            { event: 'viewer_count_update' },
            (payload: any) => {
              setViewerCount(payload.payload.count || 0);
            }
          )
          .subscribe();

        viewerCountChannelRef.current = viewerChannel;

        // Subscribe to stream status changes (real-time updates when stream ends)
        const statusChannel = supabase
          .channel(`stream_status:${typedStreamData.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'live_streams',
              filter: `id=eq.${typedStreamData.id}`,
            },
            (payload: any) => {
              const updatedStream = payload.new as LiveStream;
              if (!updatedStream.is_live) {
                // Stream ended - show offline message
                setError('Stream has ended');
                setStream(null);
              } else {
                // Stream status updated
                setStream(updatedStream);
              }
            }
          )
          .subscribe();

        streamStatusChannelRef.current = statusChannel;

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
      // Cleanup all subscriptions
      if (viewerCountChannelRef.current) {
        supabase.removeChannel(viewerCountChannelRef.current);
        viewerCountChannelRef.current = null;
      }
      if (streamStatusChannelRef.current) {
        supabase.removeChannel(streamStatusChannelRef.current);
        streamStatusChannelRef.current = null;
      }
    };
  }, [username, ppvToken]);

  async function fetchViewerCount(roomName: string) {
    try {
      // Request initial viewer count from API
      const response = await fetch(`/api/livekit/viewer-count?roomName=${encodeURIComponent(roomName)}`);
      if (response.ok) {
        const data = await response.json();
        setViewerCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching viewer count:', error);
      // Don't set error state, just log - viewer count is not critical
    }
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

  // Check if we're on TipJar domain
  const isTipJarDomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'tipjar.live' || window.location.hostname === 'www.tipjar.live');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          {isTipJarDomain ? (
            <>
              <TipJarAnimatedLoader size={128} className="mx-auto mb-4" />
              <div className="text-lg">Loading stream...</div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-lg">Loading stream...</div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (error || !stream) {
    const isAuthRequired = stream?.require_auth && !currentUserId;
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">{error || 'Stream not found'}</h1>
          
          {isAuthRequired && (
            <div className="space-y-4">
              <p className="text-gray-400">
                This stream is only available to logged-in users.
              </p>
              <Button
                onClick={() => {
                  window.location.href = `/tipjar/signin?redirect=${encodeURIComponent(window.location.pathname)}`;
                }}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Lock className="h-4 w-4 mr-2" />
                Sign In to Watch
              </Button>
            </div>
          )}
          
          {stream?.ppv_price_cents && stream.ppv_price_cents > 0 && !paidAccess && !isAuthRequired && (
            <div className="space-y-4">
              <p className="text-gray-400">
                This stream requires a one-time payment of ${(stream.ppv_price_cents / 100).toFixed(2)}
              </p>
              <Button
                onClick={() => {
                  window.location.href = `/live/@${username}/pay?price=${stream.ppv_price_cents}`;
                }}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock for ${(stream.ppv_price_cents / 100).toFixed(2)}
              </Button>
            </div>
          )}
          {!stream?.is_live && !isAuthRequired && (
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
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Connecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* TipJar Header */}
      <TipJarHeader />

      {/* Tip Alert Overlay */}
      <TipAlertOverlay roomName={stream.room_name} />

      {/* Stream Info Bar - Below TipJar header */}
      <div className="absolute top-12 md:top-14 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-3 sm:px-4 py-2 z-20 pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate">
              {stream.title || `${stream.username}`}
            </h1>
            {viewerCount > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-300 bg-black/40 px-2 py-0.5 rounded-full">
                <Users className="h-3 w-3" />
                <span>{viewerCount}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Mobile: Show chat toggle */}
            <Button
              onClick={() => setShowChat(!showChat)}
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/20 bg-black/40 p-2 h-9 w-9 rounded-full"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 bg-black/40 p-2 h-9 w-9 rounded-full"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <div className="bg-black/40 rounded-full">
              <TipJarInStream
                streamerUserId={stream.user_id}
                streamerUsername={stream.username}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Screen */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Video Player - Full screen on mobile, no placeholder */}
        <div className={`${showChat ? 'hidden lg:flex' : 'flex'} flex-1 bg-black relative min-h-0 overflow-hidden`}>
          <div className="absolute inset-0 w-full h-full">
            <LiveVideoPlayer
              roomName={stream.room_name}
              token={token}
              serverUrl={serverUrl}
              viewerCount={viewerCount}
            />
          </div>
          
          {/* Watermark */}
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white/80">
              TipJar.live
            </div>
          </div>
        </div>

        {/* Chat - Hidden by default on mobile, sidebar on desktop */}
        <div className={`${showChat ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-800/50 bg-gray-900/98 backdrop-blur-md`}>
          {/* Chat Header with close button on mobile */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800/50 lg:hidden bg-gray-900/95">
            <span className="text-sm font-semibold text-white">Live Chat</span>
            <Button
              onClick={() => setShowChat(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1.5 h-7 w-7 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <LiveChat
              streamId={stream.id}
              roomName={stream.room_name}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
              isStreamer={currentUserId === stream.user_id}
              isModerator={false} // TODO: Add moderator role system
            />
          </div>
        </div>
      </div>
    </div>
  );
}
