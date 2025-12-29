'use client';

/**
 * Serato Play Detection Dashboard - Client Component
 * 
 * DJs can enable Serato detection directly from the browser - no separate app needed!
 * Just enter your Serato username and click "Start Watching".
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NowPlayingDisplay } from '@/components/serato/NowPlayingDisplay';
import { 
  Music, 
  Play, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Radio,
  Square,
} from 'lucide-react';

interface SeratoDashboardClientProps {
  userId: string;
  userEmail: string;
}

export default function SeratoDashboardClient({ userId, userEmail }: SeratoDashboardClientProps) {
  const [testArtist, setTestArtist] = useState('Daft Punk');
  const [testTitle, setTestTitle] = useState('Get Lucky');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  // Live Playlist watching state
  const [seratoUsername, setSeratoUsername] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [watchStatus, setWatchStatus] = useState<string>('');
  const [lastDetectedTrack, setLastDetectedTrack] = useState<any>(null);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Load saved Serato username from localStorage
    const savedUsername = localStorage.getItem('serato_username');
    if (savedUsername) {
      setSeratoUsername(savedUsername);
    }
    
    // Cleanup on unmount
    return () => {
      if (watchIntervalRef.current) {
        clearInterval(watchIntervalRef.current);
      }
    };
  }, []);

  // Function to scrape and process tracks
  const scrapePlaylist = useCallback(async () => {
    if (!seratoUsername) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/serato/scrape-live-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ serato_username: seratoUsername })
      });

      const data = await response.json();
      
      if (data.success && data.track && !data.duplicate) {
        setLastDetectedTrack(data.track);
        setWatchStatus(`🎵 Detected: ${data.track.artist} - ${data.track.title}`);
        
        if (data.matched) {
          setWatchStatus(`🎯 Matched! ${data.track.artist} - ${data.track.title}`);
        }
      }
    } catch (error) {
      console.error('Scrape error:', error);
    }
  }, [seratoUsername, supabase]);

  // Start watching
  const startWatching = () => {
    if (!seratoUsername) {
      setWatchStatus('Please enter your Serato username');
      return;
    }

    // Save username
    localStorage.setItem('serato_username', seratoUsername);
    
    setIsWatching(true);
    setWatchStatus('Watching for tracks...');
    
    // Initial scrape
    scrapePlaylist();
    
    // Scrape every 5 seconds
    watchIntervalRef.current = setInterval(scrapePlaylist, 5000);
  };

  // Stop watching
  const stopWatching = () => {
    if (watchIntervalRef.current) {
      clearInterval(watchIntervalRef.current);
      watchIntervalRef.current = null;
    }
    setIsWatching(false);
    setWatchStatus('Stopped');
  };

  const handleTestTrack = async () => {
    setIsSending(true);
    setTestResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/serato/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          artist: testArtist,
          title: testTitle
        })
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({ error: error.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Music className="w-8 h-8 text-primary" />
            </div>
            Serato Play Detection
          </h1>
          <p className="text-muted-foreground">
            Automatically detect when songs play in Serato DJ Pro and notify requesters.
          </p>
          <p className="text-sm text-muted-foreground">
            Logged in as: <span className="font-medium">{userEmail}</span>
          </p>
        </div>

        {/* Live Playlist Watcher - Main Feature! */}
        <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-xl border-2 border-primary/20 shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary" />
            Serato Live Playlist Watcher
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">No App Needed!</span>
          </h2>
          
          <p className="text-sm text-muted-foreground mb-4">
            Enter your Serato username and we&apos;ll automatically detect tracks from your Live Playlist.
            Make sure your playlist is <strong>PUBLIC</strong>.
          </p>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={seratoUsername}
              onChange={(e) => setSeratoUsername(e.target.value)}
              placeholder="DJ_Ben_Murray"
              disabled={isWatching}
              className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            
            {isWatching ? (
              <button
                onClick={stopWatching}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                onClick={startWatching}
                disabled={!seratoUsername}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Watching
              </button>
            )}
          </div>

          {/* Status */}
          {watchStatus && (
            <div className={`p-3 rounded-lg ${isWatching ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted'}`}>
              <div className="flex items-center gap-2">
                {isWatching && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
                <span className="text-sm">{watchStatus}</span>
              </div>
            </div>
          )}

          {seratoUsername && (
            <p className="text-xs text-muted-foreground mt-3">
              <a 
                href={`https://serato.com/playlists/${seratoUsername}/live`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                View your Live Playlist on Serato
              </a>
            </p>
          )}
        </div>

        {/* Now Playing Card */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5" />
            Now Playing
          </h2>
          <NowPlayingDisplay 
            djId={userId}
            showRecentTracks={true}
          />
        </div>

        {/* Test Track */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Test Track Detection
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Simulate playing a track to test the matching and notification system.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Artist</label>
              <input
                type="text"
                value={testArtist}
                onChange={(e) => setTestArtist(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Artist name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Song title"
              />
            </div>
          </div>

          <button
            onClick={handleTestTrack}
            disabled={isSending || !testArtist || !testTitle}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Simulate Track Play
              </>
            )}
          </button>

          {/* Test Result */}
          {testResult && (
            <div className={`mt-4 p-4 rounded-lg ${testResult.error ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
              {testResult.error ? (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{testResult.error}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Play ID: <code className="bg-muted px-1 rounded">{testResult.play_id}</code></p>
                    <p>Normalized: {testResult.normalized_artist} - {testResult.normalized_title}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <p className="text-sm font-medium">Play Track</p>
              <p className="text-xs text-muted-foreground mt-1">Drop a track in Serato DJ</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <p className="text-sm font-medium">Detected</p>
              <p className="text-xs text-muted-foreground mt-1">We scrape your Live Playlist</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <p className="text-sm font-medium">Matched</p>
              <p className="text-xs text-muted-foreground mt-1">Fuzzy match to requests</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">4</span>
              </div>
              <p className="text-sm font-medium">Notified</p>
              <p className="text-xs text-muted-foreground mt-1">Requester gets SMS/email</p>
            </div>
          </div>
        </div>

        {/* Setup Requirements */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Setup Requirements</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Enable Serato Live Playlist</p>
                <p className="text-muted-foreground">Settings → Expansion Packs → Serato Playlists → Enable Live Playlists</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Start a Live Playlist</p>
                <p className="text-muted-foreground">In Serato, go to History → Start Live Playlist</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Make it PUBLIC</p>
                <p className="text-muted-foreground">Click &quot;Edit Details&quot; on the Serato website and set visibility to Public</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Enter your Serato username above</p>
                <p className="text-muted-foreground">This is your display name from serato.com (e.g., DJ_Ben_Murray)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

