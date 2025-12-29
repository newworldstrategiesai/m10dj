'use client';

/**
 * Component: NowPlayingDisplay
 * 
 * Shows the current "Now Playing" track from Serato
 * and connection status for the companion app.
 */

import { useSeratoNowPlaying } from '@/hooks/useSeratoNowPlaying';
import { Music, Wifi, WifiOff, RefreshCw, Clock, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NowPlayingDisplayProps {
  djId: string | null;
  showRecentTracks?: boolean;
  compact?: boolean;
}

export function NowPlayingDisplay({ 
  djId, 
  showRecentTracks = false,
  compact = false 
}: NowPlayingDisplayProps) {
  const { 
    nowPlaying, 
    recentTracks, 
    connection, 
    isLoading, 
    error,
    refresh 
  } = useSeratoNowPlaying(djId);

  if (!djId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-12 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {connection.connected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                Serato Connected
              </span>
              {connection.platform && (
                <span className="text-muted-foreground text-xs">
                  ({connection.platform})
                </span>
              )}
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                Serato Disconnected
              </span>
            </>
          )}
        </div>

        <button
          onClick={refresh}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          Error: {error}
        </div>
      )}

      {/* Now Playing Card */}
      {nowPlaying ? (
        <div className={`
          bg-gradient-to-br from-primary/10 via-primary/5 to-transparent
          border border-primary/20 rounded-lg overflow-hidden
          ${compact ? 'p-3' : 'p-4'}
        `}>
          <div className="flex items-start gap-3">
            <div className={`
              bg-primary/10 rounded-lg flex items-center justify-center
              ${compact ? 'w-10 h-10' : 'w-14 h-14'}
            `}>
              <Music className={`text-primary ${compact ? 'w-5 h-5' : 'w-7 h-7'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                Now Playing
              </p>
              <h3 className={`font-semibold truncate ${compact ? 'text-base' : 'text-lg'}`}>
                {nowPlaying.title}
              </h3>
              <p className="text-muted-foreground truncate">
                {nowPlaying.artist}
              </p>
              {!compact && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(nowPlaying.playedAt), { addSuffix: true })}
                  </span>
                  {nowPlaying.matchedRequestId && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Matched to request
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No tracks played yet</p>
          <p className="text-sm mt-1">
            {connection.connected 
              ? 'Play a track in Serato to see it here'
              : 'Connect the companion app to start tracking'
            }
          </p>
        </div>
      )}

      {/* Recent Tracks */}
      {showRecentTracks && recentTracks.length > 1 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Recent Tracks
          </h4>
          <div className="space-y-2">
            {recentTracks.slice(1, 6).map((track) => (
              <div 
                key={track.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                  <Music className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  {track.matchedRequestId && (
                    <span className="text-green-600 dark:text-green-400" title="Matched to request">
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(track.playedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup Instructions (when not connected) */}
      {!connection.connected && !compact && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            Setup Required
          </h4>
          <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
            <li>Install a "Now Playing" tool for Serato</li>
            <li>Download and run the companion app</li>
            <li>Sign in with your DJ account</li>
            <li>Start playing tracks in Serato</li>
          </ol>
        </div>
      )}
    </div>
  );
}

