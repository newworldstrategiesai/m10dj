/**
 * Hook: useSeratoNowPlaying
 * 
 * Provides real-time "Now Playing" data and connection status
 * for the DJ dashboard using Supabase Realtime subscriptions.
 */

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface NowPlaying {
  id: string;
  artist: string;
  title: string;
  playedAt: string;
  matchedRequestId?: string;
}

export interface SeratoConnection {
  connected: boolean;
  lastHeartbeat: string | null;
  platform: string | null;
  appVersion: string | null;
  detectionMethod: string | null;
}

export interface UseSeratoNowPlayingResult {
  nowPlaying: NowPlaying | null;
  recentTracks: NowPlaying[];
  connection: SeratoConnection;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MAX_RECENT_TRACKS = 10;
const CONNECTION_STALE_MS = 120000; // 2 minutes

export function useSeratoNowPlaying(djId: string | null): UseSeratoNowPlayingResult {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [recentTracks, setRecentTracks] = useState<NowPlaying[]>([]);
  const [connection, setConnection] = useState<SeratoConnection>({
    connected: false,
    lastHeartbeat: null,
    platform: null,
    appVersion: null,
    detectionMethod: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!djId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch recent tracks
      const { data: tracks, error: tracksError } = await supabase
        .from('serato_play_history')
        .select('id, artist, title, played_at, matched_request_id')
        .eq('dj_id', djId)
        .order('played_at', { ascending: false })
        .limit(MAX_RECENT_TRACKS);

      if (tracksError) throw tracksError;

      if (tracks && tracks.length > 0) {
        const formattedTracks = tracks.map(t => ({
          id: t.id,
          artist: t.artist,
          title: t.title,
          playedAt: t.played_at,
          matchedRequestId: t.matched_request_id || undefined
        }));

        setRecentTracks(formattedTracks);
        setNowPlaying(formattedTracks[0]);
      }

      // Fetch connection status
      const { data: conn, error: connError } = await supabase
        .from('serato_connections')
        .select('*')
        .eq('dj_id', djId)
        .single();

      if (connError && connError.code !== 'PGRST116') {
        throw connError;
      }

      if (conn) {
        const isStale = conn.last_heartbeat
          ? (Date.now() - new Date(conn.last_heartbeat).getTime()) > CONNECTION_STALE_MS
          : true;

        setConnection({
          connected: conn.is_connected && !isStale,
          lastHeartbeat: conn.last_heartbeat,
          platform: conn.platform,
          appVersion: conn.app_version,
          detectionMethod: conn.detection_method
        });
      }

    } catch (err: any) {
      console.error('[useSeratoNowPlaying] Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [djId, supabase]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!djId) return;

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Subscribe to play history changes
      channel = supabase
        .channel(`serato-${djId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'serato_play_history',
            filter: `dj_id=eq.${djId}`
          },
          (payload) => {
            const newTrack = payload.new;
            const formattedTrack: NowPlaying = {
              id: newTrack.id,
              artist: newTrack.artist,
              title: newTrack.title,
              playedAt: newTrack.played_at,
              matchedRequestId: newTrack.matched_request_id || undefined
            };

            setNowPlaying(formattedTrack);
            setRecentTracks(prev => [formattedTrack, ...prev.slice(0, MAX_RECENT_TRACKS - 1)]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'serato_connections',
            filter: `dj_id=eq.${djId}`
          },
          (payload) => {
            const conn = payload.new as any;
            if (conn) {
              const isStale = conn.last_heartbeat
                ? (Date.now() - new Date(conn.last_heartbeat).getTime()) > CONNECTION_STALE_MS
                : true;

              setConnection({
                connected: conn.is_connected && !isStale,
                lastHeartbeat: conn.last_heartbeat,
                platform: conn.platform,
                appVersion: conn.app_version,
                detectionMethod: conn.detection_method
              });
            }
          }
        )
        .subscribe();
    };

    // Initial fetch
    fetchData();

    // Setup subscription
    setupSubscription();

    // Periodic connection check (every 30s)
    const connectionInterval = setInterval(() => {
      // Re-check if connection is stale
      setConnection(prev => {
        if (prev.lastHeartbeat) {
          const isStale = (Date.now() - new Date(prev.lastHeartbeat).getTime()) > CONNECTION_STALE_MS;
          if (isStale && prev.connected) {
            return { ...prev, connected: false };
          }
        }
        return prev;
      });
    }, 30000);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      clearInterval(connectionInterval);
    };
  }, [djId, supabase, fetchData]);

  return {
    nowPlaying,
    recentTracks,
    connection,
    isLoading,
    error,
    refresh: fetchData
  };
}

