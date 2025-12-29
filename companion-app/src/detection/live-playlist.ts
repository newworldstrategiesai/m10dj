/**
 * Serato Live Playlist Scraper
 * 
 * Scrapes the Serato Live Playlist webpage to detect "Now Playing" tracks.
 * This eliminates the need for third-party tools like "Now Playing" app.
 * 
 * Requires:
 * - User has Serato Live Playlist enabled
 * - Playlist is set to PUBLIC
 * - Internet connection
 */

import { logger } from '../utils/logger';

export interface LivePlaylistTrack {
  artist: string;
  title: string;
  timestamp: string;
  detectedAt: string;
}

export interface LivePlaylistWatcherOptions {
  pollIntervalMs?: number;  // How often to check for new tracks (default: 5000ms)
  dedupeWindowMs?: number;  // Ignore duplicate tracks within this window
}

const DEFAULT_OPTIONS: Required<LivePlaylistWatcherOptions> = {
  pollIntervalMs: 5000,     // Check every 5 seconds
  dedupeWindowMs: 30000,    // 30 second dedupe window
};

export class LivePlaylistWatcher {
  private seratoUsername: string;
  private onTrackChange: (track: LivePlaylistTrack) => void;
  private options: Required<LivePlaylistWatcherOptions>;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastTrack: LivePlaylistTrack | null = null;
  private lastTrackTime: number = 0;

  constructor(
    seratoUsername: string,
    onTrackChange: (track: LivePlaylistTrack) => void,
    options: LivePlaylistWatcherOptions = {}
  ) {
    this.seratoUsername = seratoUsername;
    this.onTrackChange = onTrackChange;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start watching the Live Playlist
   */
  async start(): Promise<void> {
    logger.info(`Starting Live Playlist watcher for: ${this.seratoUsername}`);
    
    // Initial fetch
    await this.fetchAndProcess();

    // Start polling
    this.pollInterval = setInterval(async () => {
      await this.fetchAndProcess();
    }, this.options.pollIntervalMs);

    logger.info('Live Playlist watcher started');
  }

  /**
   * Fetch the Live Playlist page and extract the current track
   */
  private async fetchAndProcess(): Promise<void> {
    try {
      const url = `https://serato.com/playlists/${this.seratoUsername}/live`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`Live Playlist not found for ${this.seratoUsername}. Make sure it's enabled and public.`);
        }
        return;
      }

      const html = await response.text();
      const track = this.parseTrackFromHtml(html);

      if (track && !this.isDuplicate(track)) {
        this.lastTrack = track;
        this.lastTrackTime = Date.now();
        
        logger.track(track.artist, track.title);
        this.onTrackChange(track);
      }

    } catch (error: any) {
      logger.debug(`Error fetching Live Playlist: ${error.message}`);
    }
  }

  /**
   * Parse track info from the Live Playlist HTML
   */
  private parseTrackFromHtml(html: string): LivePlaylistTrack | null {
    // The Live Playlist page shows tracks in a list
    // We want the most recent one (first in the list after "Live now!")
    
    // Look for the track pattern in the HTML
    // Format: "Artist - Title" or similar patterns
    
    // Method 1: Look for the first track entry
    // The Serato page structure has track info in specific elements
    
    // Try to find artist and title from the page content
    // This regex looks for common patterns in Serato's Live Playlist HTML
    
    // Pattern for "Artist - Title" format
    const trackPatterns = [
      // Look for track entries (based on typical Serato HTML structure)
      /<div[^>]*class="[^"]*track[^"]*"[^>]*>[\s\S]*?<[^>]*>([^<]+)<\/[^>]*>[\s\S]*?<[^>]*>([^<]+)<\/[^>]*>/i,
      // Fallback: Look for "Artist - Title" pattern anywhere
      /(?:ago|now)[^<]*<\/[^>]+>[\s\S]*?([^<-]+)\s*-\s*([^<]+)/i,
      // Another pattern based on Serato's structure
      /class="[^"]*artist[^"]*"[^>]*>([^<]+)<[\s\S]*?class="[^"]*title[^"]*"[^>]*>([^<]+)</i,
    ];

    for (const pattern of trackPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[2]) {
        return {
          artist: this.cleanText(match[1]),
          title: this.cleanText(match[2]),
          timestamp: new Date().toISOString(),
          detectedAt: new Date().toISOString()
        };
      }
    }

    // Try a more specific approach - look for the most recent track
    // Serato shows "X mins ago" or "Live now!" next to tracks
    const recentTrackMatch = html.match(
      /(?:secs?\s+ago|mins?\s+ago|Live\s+now)[^<]*<\/[^>]+>[\s\S]{0,500}?([A-Za-z0-9\s\.\,\'\"\!\?\-]+)\s*[-–]\s*([A-Za-z0-9\s\.\,\'\"\!\?\(\)\-]+)/i
    );

    if (recentTrackMatch) {
      const artist = this.cleanText(recentTrackMatch[1]);
      const title = this.cleanText(recentTrackMatch[2]);
      
      if (artist.length > 1 && title.length > 1) {
        return {
          artist,
          title,
          timestamp: new Date().toISOString(),
          detectedAt: new Date().toISOString()
        };
      }
    }

    return null;
  }

  /**
   * Clean extracted text
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')      // Remove any HTML tags
      .replace(/&amp;/g, '&')        // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .trim();
  }

  /**
   * Check if this is a duplicate of the last track
   */
  private isDuplicate(track: LivePlaylistTrack): boolean {
    if (!this.lastTrack) return false;

    const isSameTrack = 
      this.lastTrack.artist.toLowerCase() === track.artist.toLowerCase() &&
      this.lastTrack.title.toLowerCase() === track.title.toLowerCase();

    const isWithinWindow = (Date.now() - this.lastTrackTime) < this.options.dedupeWindowMs;

    return isSameTrack && isWithinWindow;
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.info('Live Playlist watcher stopped');
    }
  }

  /**
   * Check if watcher is active
   */
  isActive(): boolean {
    return this.pollInterval !== null;
  }

  /**
   * Get the Serato username being watched
   */
  getUsername(): string {
    return this.seratoUsername;
  }
}

/**
 * Validate that a Serato username has an active Live Playlist
 */
export async function validateLivePlaylist(username: string): Promise<boolean> {
  try {
    const url = `https://serato.com/playlists/${username}/live`;
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}

