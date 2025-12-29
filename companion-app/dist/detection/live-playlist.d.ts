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
export interface LivePlaylistTrack {
    artist: string;
    title: string;
    timestamp: string;
    detectedAt: string;
}
export interface LivePlaylistWatcherOptions {
    pollIntervalMs?: number;
    dedupeWindowMs?: number;
}
export declare class LivePlaylistWatcher {
    private seratoUsername;
    private onTrackChange;
    private options;
    private pollInterval;
    private lastTrack;
    private lastTrackTime;
    constructor(seratoUsername: string, onTrackChange: (track: LivePlaylistTrack) => void, options?: LivePlaylistWatcherOptions);
    /**
     * Start watching the Live Playlist
     */
    start(): Promise<void>;
    /**
     * Fetch the Live Playlist page and extract the current track
     */
    private fetchAndProcess;
    /**
     * Parse track info from the Live Playlist HTML
     */
    private parseTrackFromHtml;
    /**
     * Clean extracted text
     */
    private cleanText;
    /**
     * Check if this is a duplicate of the last track
     */
    private isDuplicate;
    /**
     * Stop watching
     */
    stop(): void;
    /**
     * Check if watcher is active
     */
    isActive(): boolean;
    /**
     * Get the Serato username being watched
     */
    getUsername(): string;
}
/**
 * Validate that a Serato username has an active Live Playlist
 */
export declare function validateLivePlaylist(username: string): Promise<boolean>;
//# sourceMappingURL=live-playlist.d.ts.map