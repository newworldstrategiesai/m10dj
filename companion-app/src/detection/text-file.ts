/**
 * Text File Watcher for "Now Playing" detection
 * 
 * Watches text files that DJ tools (Now Playing, What's Now Playing, djctl, etc.)
 * write to for OBS/Twitch overlays. This is the primary detection method.
 */

import * as chokidar from 'chokidar';
import * as fs from 'fs/promises';
import { logger } from '../utils/logger';

export interface Track {
  artist: string;
  title: string;
  detectedAt: string;
  sourceFile: string;
}

export interface TextFileWatcherOptions {
  stabilityThreshold?: number; // ms to wait after file stops changing
  pollInterval?: number;       // ms between poll checks
  dedupeWindowMs?: number;     // ms to ignore duplicate tracks
}

const DEFAULT_OPTIONS: Required<TextFileWatcherOptions> = {
  stabilityThreshold: 100,
  pollInterval: 50,
  dedupeWindowMs: 5000, // 5 seconds
};

export class TextFileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private lastContent: string | null = null;
  private lastTrack: Track | null = null;
  private lastTrackTime: number = 0;
  private onTrackChange: (track: Track) => void;
  private filePath: string;
  private options: Required<TextFileWatcherOptions>;

  constructor(
    filePath: string,
    onTrackChange: (track: Track) => void,
    options: TextFileWatcherOptions = {}
  ) {
    this.filePath = filePath;
    this.onTrackChange = onTrackChange;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start watching the text file
   */
  async start(): Promise<void> {
    logger.info(`Starting text file watcher: ${this.filePath}`);

    // Read initial content
    await this.readFile();

    // Watch for changes
    this.watcher = chokidar.watch(this.filePath, {
      persistent: true,
      ignoreInitial: true, // We already read initial content
      awaitWriteFinish: {
        stabilityThreshold: this.options.stabilityThreshold,
        pollInterval: this.options.pollInterval
      }
    });

    this.watcher.on('change', async (path) => {
      logger.debug(`File changed: ${path}`);
      await this.readFile();
    });

    this.watcher.on('error', (error) => {
      logger.error('File watcher error', error);
    });

    this.watcher.on('unlink', () => {
      logger.warn('File was deleted, will continue watching for recreation');
    });

    this.watcher.on('add', async () => {
      logger.info('File was recreated');
      await this.readFile();
    });

    logger.info('Text file watcher started');
  }

  /**
   * Read and process the text file
   */
  private async readFile(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const trimmedContent = content.trim();

      // Only process if content actually changed
      if (trimmedContent !== this.lastContent && trimmedContent.length > 0) {
        this.lastContent = trimmedContent;
        this.parseAndEmit(trimmedContent);
      }
    } catch (error: any) {
      // File might not exist temporarily during write
      if (error.code !== 'ENOENT') {
        logger.error(`Error reading file: ${error.message}`);
      }
    }
  }

  /**
   * Parse track content and emit if it's a new track
   */
  private parseAndEmit(content: string): void {
    const track = this.parseTrack(content);
    
    if (!track) {
      logger.warn(`Could not parse track from content: "${content}"`);
      return;
    }

    // Deduplicate: don't emit same track within dedupeWindowMs
    if (this.isDuplicateTrack(track)) {
      logger.debug('Duplicate track ignored');
      return;
    }

    // Update last track
    this.lastTrack = track;
    this.lastTrackTime = Date.now();

    // Log and emit
    logger.track(track.artist, track.title);
    this.onTrackChange(track);
  }

  /**
   * Parse track from various text formats
   */
  private parseTrack(content: string): Track | null {
    // Try different parsing strategies

    // Format 1: "Artist - Title" (most common)
    const dashMatch = content.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dashMatch) {
      return {
        artist: dashMatch[1].trim(),
        title: dashMatch[2].trim(),
        detectedAt: new Date().toISOString(),
        sourceFile: this.filePath
      };
    }

    // Format 2: "Title by Artist"
    const byMatch = content.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) {
      return {
        artist: byMatch[2].trim(),
        title: byMatch[1].trim(),
        detectedAt: new Date().toISOString(),
        sourceFile: this.filePath
      };
    }

    // Format 3: JSON (some tools output JSON)
    try {
      const parsed = JSON.parse(content);
      if (parsed.artist && parsed.title) {
        return {
          artist: String(parsed.artist).trim(),
          title: String(parsed.title).trim(),
          detectedAt: new Date().toISOString(),
          sourceFile: this.filePath
        };
      }
    } catch {
      // Not JSON, continue
    }

    // Format 4: Multi-line (Artist on line 1, Title on line 2)
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length >= 2) {
      return {
        artist: lines[0].trim(),
        title: lines[1].trim(),
        detectedAt: new Date().toISOString(),
        sourceFile: this.filePath
      };
    }

    return null;
  }

  /**
   * Check if this is a duplicate of the last track
   */
  private isDuplicateTrack(track: Track): boolean {
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
    if (this.watcher) {
      logger.info('Stopping text file watcher');
      this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Get the current file path being watched
   */
  getFilePath(): string {
    return this.filePath;
  }

  /**
   * Check if watcher is active
   */
  isActive(): boolean {
    return this.watcher !== null;
  }
}

