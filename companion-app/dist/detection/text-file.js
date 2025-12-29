"use strict";
/**
 * Text File Watcher for "Now Playing" detection
 *
 * Watches text files that DJ tools (Now Playing, What's Now Playing, djctl, etc.)
 * write to for OBS/Twitch overlays. This is the primary detection method.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextFileWatcher = void 0;
const chokidar = __importStar(require("chokidar"));
const fs = __importStar(require("fs/promises"));
const logger_1 = require("../utils/logger");
const DEFAULT_OPTIONS = {
    stabilityThreshold: 100,
    pollInterval: 50,
    dedupeWindowMs: 5000, // 5 seconds
};
class TextFileWatcher {
    watcher = null;
    lastContent = null;
    lastTrack = null;
    lastTrackTime = 0;
    onTrackChange;
    filePath;
    options;
    constructor(filePath, onTrackChange, options = {}) {
        this.filePath = filePath;
        this.onTrackChange = onTrackChange;
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    /**
     * Start watching the text file
     */
    async start() {
        logger_1.logger.info(`Starting text file watcher: ${this.filePath}`);
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
            logger_1.logger.debug(`File changed: ${path}`);
            await this.readFile();
        });
        this.watcher.on('error', (error) => {
            logger_1.logger.error('File watcher error', error);
        });
        this.watcher.on('unlink', () => {
            logger_1.logger.warn('File was deleted, will continue watching for recreation');
        });
        this.watcher.on('add', async () => {
            logger_1.logger.info('File was recreated');
            await this.readFile();
        });
        logger_1.logger.info('Text file watcher started');
    }
    /**
     * Read and process the text file
     */
    async readFile() {
        try {
            const content = await fs.readFile(this.filePath, 'utf-8');
            const trimmedContent = content.trim();
            // Only process if content actually changed
            if (trimmedContent !== this.lastContent && trimmedContent.length > 0) {
                this.lastContent = trimmedContent;
                this.parseAndEmit(trimmedContent);
            }
        }
        catch (error) {
            // File might not exist temporarily during write
            if (error.code !== 'ENOENT') {
                logger_1.logger.error(`Error reading file: ${error.message}`);
            }
        }
    }
    /**
     * Parse track content and emit if it's a new track
     */
    parseAndEmit(content) {
        const track = this.parseTrack(content);
        if (!track) {
            logger_1.logger.warn(`Could not parse track from content: "${content}"`);
            return;
        }
        // Deduplicate: don't emit same track within dedupeWindowMs
        if (this.isDuplicateTrack(track)) {
            logger_1.logger.debug('Duplicate track ignored');
            return;
        }
        // Update last track
        this.lastTrack = track;
        this.lastTrackTime = Date.now();
        // Log and emit
        logger_1.logger.track(track.artist, track.title);
        this.onTrackChange(track);
    }
    /**
     * Parse track from various text formats
     */
    parseTrack(content) {
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
        }
        catch {
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
    isDuplicateTrack(track) {
        if (!this.lastTrack)
            return false;
        const isSameTrack = this.lastTrack.artist.toLowerCase() === track.artist.toLowerCase() &&
            this.lastTrack.title.toLowerCase() === track.title.toLowerCase();
        const isWithinWindow = (Date.now() - this.lastTrackTime) < this.options.dedupeWindowMs;
        return isSameTrack && isWithinWindow;
    }
    /**
     * Stop watching
     */
    stop() {
        if (this.watcher) {
            logger_1.logger.info('Stopping text file watcher');
            this.watcher.close();
            this.watcher = null;
        }
    }
    /**
     * Get the current file path being watched
     */
    getFilePath() {
        return this.filePath;
    }
    /**
     * Check if watcher is active
     */
    isActive() {
        return this.watcher !== null;
    }
}
exports.TextFileWatcher = TextFileWatcher;
//# sourceMappingURL=text-file.js.map