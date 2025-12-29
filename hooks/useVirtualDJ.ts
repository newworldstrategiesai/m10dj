/**
 * Virtual DJ Detection Hook
 * 
 * Virtual DJ has a built-in HTTP API on localhost:8082 that we can poll
 * directly from the browser. No companion app needed!
 * 
 * Setup: Virtual DJ → Settings → Options → Remote Control → Enable HTTP Server
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualDJTrack {
  artist: string;
  title: string;
  deck: number;
  bpm?: number;
  elapsed?: number;
  remaining?: number;
}

interface UseVirtualDJOptions {
  enabled: boolean;
  port?: number;
  pollInterval?: number;
  onTrackDetected?: (track: VirtualDJTrack) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

interface UseVirtualDJReturn {
  isConnected: boolean;
  currentTrack: VirtualDJTrack | null;
  error: string | null;
  lastUpdate: Date | null;
}

export function useVirtualDJ({
  enabled,
  port = 8082,
  pollInterval = 3000,
  onTrackDetected,
  onError,
  onConnectionChange
}: UseVirtualDJOptions): UseVirtualDJReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<VirtualDJTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const lastTrackRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Query Virtual DJ API
  const queryVDJ = useCallback(async (script: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `http://localhost:${port}/query?script=${encodeURIComponent(script)}`,
        { 
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      return text.trim();
    } catch (err) {
      return null;
    }
  }, [port]);

  // Poll for current track
  const pollTrack = useCallback(async () => {
    if (!enabled) return;

    try {
      // Query both decks and find which one is playing (on air)
      const [
        deck1Artist,
        deck1Title,
        deck1IsPlaying,
        deck1BPM,
        deck2Artist,
        deck2Title,
        deck2IsPlaying,
        deck2BPM
      ] = await Promise.all([
        queryVDJ('deck 1 get artist'),
        queryVDJ('deck 1 get title'),
        queryVDJ('deck 1 get isplaying'),
        queryVDJ('deck 1 get bpm'),
        queryVDJ('deck 2 get artist'),
        queryVDJ('deck 2 get title'),
        queryVDJ('deck 2 get isplaying'),
        queryVDJ('deck 2 get bpm')
      ]);

      // If we got responses, we're connected
      if (deck1Artist !== null || deck2Artist !== null) {
        if (!isConnected) {
          setIsConnected(true);
          setError(null);
          onConnectionChange?.(true);
        }
      } else {
        // No response - not connected
        if (isConnected) {
          setIsConnected(false);
          setError('Cannot connect to Virtual DJ. Make sure HTTP Server is enabled.');
          onConnectionChange?.(false);
        }
        return;
      }

      // Determine which deck is currently playing/on air
      let activeDeck = 0;
      let activeArtist = '';
      let activeTitle = '';
      let activeBPM = 0;

      // Check deck 1
      if (deck1IsPlaying === '1' && deck1Artist && deck1Title) {
        activeDeck = 1;
        activeArtist = deck1Artist;
        activeTitle = deck1Title;
        activeBPM = parseFloat(deck1BPM || '0');
      }
      
      // Check deck 2 (prioritize if crossfader is on deck 2 side, but for simplicity just check if playing)
      if (deck2IsPlaying === '1' && deck2Artist && deck2Title) {
        // If both decks are playing, we could check crossfader position
        // For now, prefer deck 2 if both are playing (usually the incoming track)
        if (activeDeck === 0 || deck1IsPlaying !== '1') {
          activeDeck = 2;
          activeArtist = deck2Artist;
          activeTitle = deck2Title;
          activeBPM = parseFloat(deck2BPM || '0');
        }
      }

      if (activeDeck === 0 || !activeArtist || !activeTitle) {
        // No track currently playing
        return;
      }

      // Create track identifier
      const trackId = `${activeArtist}|${activeTitle}`;
      
      // Only notify if track changed
      if (trackId !== lastTrackRef.current) {
        lastTrackRef.current = trackId;
        
        const track: VirtualDJTrack = {
          artist: activeArtist,
          title: activeTitle,
          deck: activeDeck,
          bpm: activeBPM || undefined
        };

        setCurrentTrack(track);
        setLastUpdate(new Date());
        onTrackDetected?.(track);
      }

    } catch (err: any) {
      console.error('[VirtualDJ] Poll error:', err);
      if (isConnected) {
        setIsConnected(false);
        setError('Connection lost to Virtual DJ');
        onConnectionChange?.(false);
      }
      onError?.(err.message);
    }
  }, [enabled, queryVDJ, isConnected, onTrackDetected, onError, onConnectionChange]);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled) {
      // Initial poll
      pollTrack();
      
      // Set up interval
      intervalRef.current = setInterval(pollTrack, pollInterval);
    } else {
      // Clean up
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
      setCurrentTrack(null);
      setError(null);
      lastTrackRef.current = '';
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollInterval, pollTrack]);

  return {
    isConnected,
    currentTrack,
    error,
    lastUpdate
  };
}

export default useVirtualDJ;

