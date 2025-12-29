'use client';

/**
 * Unified DJ Dashboard - Supports Multiple DJ Software
 * 
 * Currently supported:
 * - Serato DJ Pro (via Live Playlists)
 * - Virtual DJ (via built-in HTTP API)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { NowPlayingDisplay } from '@/components/serato/NowPlayingDisplay';
import { useVirtualDJ } from '@/hooks/useVirtualDJ';
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
  Disc3,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';

type DJSoftware = 'serato' | 'virtualdj';

interface DJDashboardClientProps {
  userId: string;
  userEmail: string;
}

export default function DJDashboardClient({ userId, userEmail }: DJDashboardClientProps) {
  // DJ Software selection
  const [selectedSoftware, setSelectedSoftware] = useState<DJSoftware>('serato');
  
  // Test track state
  const [testArtist, setTestArtist] = useState('Daft Punk');
  const [testTitle, setTestTitle] = useState('Get Lucky');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  // Serato Live Playlist watching state
  const [seratoUsername, setSeratoUsername] = useState('');
  const [isSeratoWatching, setIsSeratoWatching] = useState(false);
  const [seratoWatchStatus, setSeratoWatchStatus] = useState<string>('');
  const seratoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Virtual DJ state
  const [isVDJEnabled, setIsVDJEnabled] = useState(false);
  const [vdjStatus, setVdjStatus] = useState<string>('');

  const supabase = createClientComponentClient();

  // Virtual DJ hook
  const {
    isConnected: vdjConnected,
    currentTrack: vdjCurrentTrack,
    error: vdjError,
    lastUpdate: vdjLastUpdate
  } = useVirtualDJ({
    enabled: isVDJEnabled && selectedSoftware === 'virtualdj',
    pollInterval: 3000,
    onTrackDetected: async (track) => {
      console.log('[VirtualDJ] Track detected:', track);
      setVdjStatus(`🎵 Detected: ${track.artist} - ${track.title}`);
      
      // Send to backend
      await sendTrackToBackend(track.artist, track.title, 'virtualdj', track.deck, track.bpm);
    },
    onConnectionChange: (connected) => {
      if (connected) {
        setVdjStatus('✅ Connected to Virtual DJ');
      } else {
        setVdjStatus('');
      }
    },
    onError: (error) => {
      console.error('[VirtualDJ] Error:', error);
    }
  });

  // Load saved preferences
  useEffect(() => {
    const savedSoftware = localStorage.getItem('dj_software') as DJSoftware | null;
    if (savedSoftware) {
      setSelectedSoftware(savedSoftware);
    }
    
    const savedUsername = localStorage.getItem('serato_username');
    if (savedUsername) {
      setSeratoUsername(savedUsername);
    }
    
    // Cleanup on unmount
    return () => {
      if (seratoIntervalRef.current) {
        clearInterval(seratoIntervalRef.current);
      }
    };
  }, []);

  // Save software preference
  const handleSoftwareChange = (software: DJSoftware) => {
    // Stop any active watchers
    stopSeratoWatching();
    setIsVDJEnabled(false);
    
    setSelectedSoftware(software);
    localStorage.setItem('dj_software', software);
  };

  // Send track to backend
  const sendTrackToBackend = async (
    artist: string, 
    title: string, 
    detectionMethod: string,
    deck?: number,
    bpm?: number
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/serato/now-playing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          track: {
            artist,
            title,
            played_at: new Date().toISOString(),
            deck,
            bpm
          },
          detection_method: detectionMethod,
          platform: detectionMethod === 'virtualdj' ? 'Virtual DJ' : 'Serato DJ Pro'
        })
      });

      const data = await response.json();
      
      if (data.matched) {
        if (detectionMethod === 'virtualdj') {
          setVdjStatus(`🎯 Matched! ${artist} - ${title}`);
        } else {
          setSeratoWatchStatus(`🎯 Matched! ${artist} - ${title}`);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error sending track to backend:', error);
      return null;
    }
  };

  // Serato: Scrape playlist
  const scrapeSeratoPlaylist = useCallback(async () => {
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
        setSeratoWatchStatus(`🎵 Detected: ${data.track.artist} - ${data.track.title}`);
        
        if (data.matched) {
          setSeratoWatchStatus(`🎯 Matched! ${data.track.artist} - ${data.track.title}`);
        }
      }
    } catch (error) {
      console.error('Serato scrape error:', error);
    }
  }, [seratoUsername, supabase]);

  // Serato: Start watching
  const startSeratoWatching = () => {
    if (!seratoUsername) {
      setSeratoWatchStatus('Please enter your Serato username');
      return;
    }

    localStorage.setItem('serato_username', seratoUsername);
    setIsSeratoWatching(true);
    setSeratoWatchStatus('Watching for tracks...');
    
    scrapeSeratoPlaylist();
    seratoIntervalRef.current = setInterval(scrapeSeratoPlaylist, 5000);
  };

  // Serato: Stop watching
  const stopSeratoWatching = () => {
    if (seratoIntervalRef.current) {
      clearInterval(seratoIntervalRef.current);
      seratoIntervalRef.current = null;
    }
    setIsSeratoWatching(false);
    setSeratoWatchStatus('Stopped');
  };

  // Test track
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
              <Disc3 className="w-8 h-8 text-primary" />
            </div>
            DJ Play Detection
          </h1>
          <p className="text-muted-foreground">
            Automatically detect when songs play and notify requesters in real-time.
          </p>
          <p className="text-sm text-muted-foreground">
            Logged in as: <span className="font-medium">{userEmail}</span>
          </p>
        </div>

        {/* Software Selector */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Select Your DJ Software
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Serato */}
            <button
              onClick={() => handleSoftwareChange('serato')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedSoftware === 'serato'
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedSoftware === 'serato' ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                }`}>
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Serato DJ Pro</p>
                  <p className="text-xs text-muted-foreground">Via Live Playlists</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Uses Serato's cloud-based Live Playlist feature. Requires a Serato account.
              </p>
            </button>

            {/* Virtual DJ */}
            <button
              onClick={() => handleSoftwareChange('virtualdj')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedSoftware === 'virtualdj'
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedSoftware === 'virtualdj' ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                }`}>
                  <Disc3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Virtual DJ</p>
                  <p className="text-xs text-muted-foreground">Via HTTP API</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Direct connection to Virtual DJ. Works locally, no cloud needed.
              </p>
            </button>
          </div>
        </div>

        {/* Serato Configuration */}
        {selectedSoftware === 'serato' && (
          <div className="bg-gradient-to-br from-primary/5 via-card to-card rounded-xl border-2 border-primary/20 shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Serato Live Playlist Watcher
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">No App Needed!</span>
            </h2>
            
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Serato username and we'll automatically detect tracks from your Live Playlist.
              Make sure your playlist is <strong>PUBLIC</strong>.
            </p>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={seratoUsername}
                onChange={(e) => setSeratoUsername(e.target.value)}
                placeholder="DJ_Ben_Murray"
                disabled={isSeratoWatching}
                className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              
              {isSeratoWatching ? (
                <button
                  onClick={stopSeratoWatching}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={startSeratoWatching}
                  disabled={!seratoUsername}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Watching
                </button>
              )}
            </div>

            {seratoWatchStatus && (
              <div className={`p-3 rounded-lg ${isSeratoWatching ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted'}`}>
                <div className="flex items-center gap-2">
                  {isSeratoWatching && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  )}
                  <span className="text-sm">{seratoWatchStatus}</span>
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

            {/* Serato Setup Steps */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-3">Setup Requirements</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Enable Live Playlists in Serato settings</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Start a Live Playlist from History panel</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Make the playlist PUBLIC on serato.com</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Virtual DJ Configuration */}
        {selectedSoftware === 'virtualdj' && (
          <div className="bg-gradient-to-br from-purple-500/5 via-card to-card rounded-xl border-2 border-purple-500/20 shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-purple-500" />
              Virtual DJ Connection
              <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">Direct API</span>
            </h2>
            
            <p className="text-sm text-muted-foreground mb-4">
              Virtual DJ has a built-in HTTP API. Just enable it and click Start - no username or cloud account needed!
            </p>

            <div className="flex items-center gap-4 mb-4">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                vdjConnected 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {vdjConnected ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm">Not Connected</span>
                  </>
                )}
              </div>

              {isVDJEnabled ? (
                <button
                  onClick={() => setIsVDJEnabled(false)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => setIsVDJEnabled(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Detection
                </button>
              )}
            </div>

            {/* Status */}
            {(vdjStatus || vdjError) && (
              <div className={`p-3 rounded-lg ${
                vdjError 
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                  : isVDJEnabled 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-muted'
              }`}>
                <div className="flex items-center gap-2">
                  {isVDJEnabled && vdjConnected && (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                    </span>
                  )}
                  <span className={`text-sm ${vdjError ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {vdjError || vdjStatus || 'Ready to connect'}
                  </span>
                </div>
              </div>
            )}

            {/* Current Track */}
            {vdjCurrentTrack && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Now Playing (Deck {vdjCurrentTrack.deck})</p>
                <p className="text-lg font-bold">{vdjCurrentTrack.artist} - {vdjCurrentTrack.title}</p>
                {vdjCurrentTrack.bpm && (
                  <p className="text-sm text-muted-foreground">{vdjCurrentTrack.bpm.toFixed(1)} BPM</p>
                )}
              </div>
            )}

            {/* VDJ Setup Steps */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold mb-3">Setup Requirements</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Open Virtual DJ Settings → Options</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Find "Remote Control" section</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Enable "HTTP Server" (default port 8082)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Click "Start Detection" above</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Now Playing Card */}
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5" />
            Play History
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
              <p className="text-xs text-muted-foreground mt-1">Drop a track in your DJ software</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <p className="text-sm font-medium">Detected</p>
              <p className="text-xs text-muted-foreground mt-1">We detect via API or playlist</p>
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
      </div>
    </div>
  );
}

