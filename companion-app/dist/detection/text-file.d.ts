/**
 * Text File Watcher for "Now Playing" detection
 *
 * Watches text files that DJ tools (Now Playing, What's Now Playing, djctl, etc.)
 * write to for OBS/Twitch overlays. This is the primary detection method.
 */
export interface Track {
    artist: string;
    title: string;
    detectedAt: string;
    sourceFile: string;
}
export interface TextFileWatcherOptions {
    stabilityThreshold?: number;
    pollInterval?: number;
    dedupeWindowMs?: number;
}
export declare class TextFileWatcher {
    private watcher;
    private lastContent;
    private lastTrack;
    private lastTrackTime;
    private onTrackChange;
    private filePath;
    private options;
    constructor(filePath: string, onTrackChange: (track: Track) => void, options?: TextFileWatcherOptions);
    /**
     * Start watching the text file
     */
    start(): Promise<void>;
    /**
     * Read and process the text file
     */
    private readFile;
    /**
     * Parse track content and emit if it's a new track
     */
    private parseAndEmit;
    /**
     * Parse track from various text formats
     */
    private parseTrack;
    /**
     * Check if this is a duplicate of the last track
     */
    private isDuplicateTrack;
    /**
     * Stop watching
     */
    stop(): void;
    /**
     * Get the current file path being watched
     */
    getFilePath(): string;
    /**
     * Check if watcher is active
     */
    isActive(): boolean;
}
//# sourceMappingURL=text-file.d.ts.map