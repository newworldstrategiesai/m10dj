#!/usr/bin/env node
"use strict";
/**
 * Serato Play Detection Companion App
 *
 * Detects "Now Playing" tracks from Serato DJ Pro and sends them to the
 * SaaS backend for request matching and notifications.
 *
 * Detection Methods:
 * 1. Text File: Watch a file written by "Now Playing" tools (default)
 * 2. Live Playlist: Scrape your Serato Live Playlist directly (built-in!)
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
const dotenv = __importStar(require("dotenv"));
const supabase_1 = require("./auth/supabase");
const backend_1 = require("./api/backend");
const text_file_1 = require("./detection/text-file");
const live_playlist_1 = require("./detection/live-playlist");
const paths_1 = require("./utils/paths");
const logger_1 = require("./utils/logger");
// Load environment variables
dotenv.config();
// Configuration
const CONFIG = {
    apiUrl: process.env.API_URL || 'https://m10djcompany.com',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    customTextFilePath: process.env.TEXT_FILE_PATH,
    seratoUsername: process.env.SERATO_USERNAME, // For Live Playlist mode
    detectionMethod: (process.env.DETECTION_METHOD || 'auto'),
    email: process.env.SUPABASE_EMAIL,
    password: process.env.SUPABASE_PASSWORD,
    appVersion: '1.1.0'
};
// Validate configuration
function validateConfig() {
    if (!CONFIG.supabaseUrl) {
        logger_1.logger.error('Missing SUPABASE_URL environment variable');
        return false;
    }
    if (!CONFIG.supabaseAnonKey) {
        logger_1.logger.error('Missing SUPABASE_ANON_KEY environment variable');
        return false;
    }
    return true;
}
async function main() {
    // Show banner
    logger_1.logger.banner();
    // Validate config
    if (!validateConfig()) {
        logger_1.logger.error('Configuration invalid. Please check your .env file.');
        process.exit(1);
    }
    logger_1.logger.info(`Platform: ${(0, paths_1.getPlatform)()}`);
    logger_1.logger.info(`API URL: ${CONFIG.apiUrl}`);
    // Initialize Supabase auth
    const auth = new supabase_1.SupabaseAuth(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    // Try to authenticate
    let session = await auth.checkSession();
    if (!session) {
        // Try environment credentials first
        if (CONFIG.email && CONFIG.password) {
            try {
                session = await auth.signIn(CONFIG.email, CONFIG.password);
            }
            catch (error) {
                logger_1.logger.warn('Environment credentials failed, trying interactive login');
            }
        }
        // Fall back to interactive login
        if (!session) {
            try {
                session = await auth.signInInteractive();
            }
            catch (error) {
                logger_1.logger.error('Authentication failed', error.message);
                process.exit(1);
            }
        }
    }
    logger_1.logger.info(`Authenticated as: ${auth.getUserEmail()}`);
    // Initialize backend API
    const backendAPI = new backend_1.BackendAPI(CONFIG.apiUrl, CONFIG.appVersion);
    backendAPI.setAuthToken(session.access_token);
    // Start heartbeat
    backendAPI.startHeartbeat();
    // Determine detection method
    let useMethod = 'text_file';
    let watcher = null;
    // Check what detection method to use
    if (CONFIG.detectionMethod === 'live_playlist' ||
        (CONFIG.detectionMethod === 'auto' && CONFIG.seratoUsername)) {
        // Try Live Playlist mode first if configured
        if (CONFIG.seratoUsername) {
            logger_1.logger.info(`Checking Serato Live Playlist for: ${CONFIG.seratoUsername}`);
            const isValid = await (0, live_playlist_1.validateLivePlaylist)(CONFIG.seratoUsername);
            if (isValid) {
                useMethod = 'live_playlists';
                logger_1.logger.info('✓ Live Playlist is active and public!');
            }
            else {
                logger_1.logger.warn('Live Playlist not found or not public. Falling back to text file mode.');
            }
        }
    }
    // Create track handler (works for both methods)
    const handleTrack = async (track) => {
        try {
            const result = await backendAPI.sendNowPlaying({
                artist: track.artist,
                title: track.title,
                played_at: track.detectedAt
            }, {
                detection_method: useMethod,
                source_file: 'sourceFile' in track ? track.sourceFile : undefined
            });
            if (result.success) {
                if (result.matched) {
                    logger_1.logger.info(`🎯 Matched to request: ${result.matched_request_id}`);
                }
            }
            else {
                logger_1.logger.warn(`Failed to send: ${result.error}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending track', error.message);
        }
    };
    // Start the appropriate watcher
    if (useMethod === 'live_playlists' && CONFIG.seratoUsername) {
        // Use Live Playlist scraping (no third-party app needed!)
        logger_1.logger.info('');
        logger_1.logger.info('📡 Using Serato Live Playlist mode (no third-party app needed!)');
        logger_1.logger.info(`   Watching: https://serato.com/playlists/${CONFIG.seratoUsername}/live`);
        watcher = new live_playlist_1.LivePlaylistWatcher(CONFIG.seratoUsername, handleTrack);
        await watcher.start();
    }
    else {
        // Use text file watching (requires Now Playing app or similar)
        logger_1.logger.info('Searching for "Now Playing" text file...');
        const textFilePath = await (0, paths_1.findActiveTextFile)(CONFIG.customTextFilePath);
        if (!textFilePath) {
            logger_1.logger.warn('No active text file found.');
            logger_1.logger.info('');
            logger_1.logger.info('You have two options:');
            logger_1.logger.info('');
            logger_1.logger.info('Option 1: Use Serato Live Playlist (recommended - no extra app needed!)');
            logger_1.logger.info('  Add to your .env file:');
            logger_1.logger.info(`    SERATO_USERNAME=DJ_Ben_Murray`);
            logger_1.logger.info('  (Make sure your Live Playlist is PUBLIC)');
            logger_1.logger.info('');
            logger_1.logger.info('Option 2: Use a "Now Playing" tool:');
            logger_1.logger.info('  • Now Playing app: https://djflipside.com/pages/now-playing');
            logger_1.logger.info('  • Set TEXT_FILE_PATH in your .env file');
            logger_1.logger.info('');
            logger_1.logger.info('Waiting for text file to appear...');
            // Wait for file to appear
            let foundPath = null;
            while (!foundPath) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                foundPath = await (0, paths_1.findActiveTextFile)(CONFIG.customTextFilePath);
            }
            logger_1.logger.info(`Found text file: ${foundPath}`);
        }
        const watchPath = textFilePath || await waitForTextFile(CONFIG.customTextFilePath);
        if (!watchPath) {
            logger_1.logger.error('Could not find text file. Try setting SERATO_USERNAME for Live Playlist mode.');
            process.exit(1);
        }
        logger_1.logger.info(`Watching: ${watchPath}`);
        watcher = new text_file_1.TextFileWatcher(watchPath, handleTrack);
        await watcher.start();
    }
    logger_1.logger.info('');
    logger_1.logger.info('🎧 Ready! Play tracks in Serato and they will be detected automatically.');
    logger_1.logger.info('');
    logger_1.logger.info('Press Ctrl+C to stop.');
    // Handle graceful shutdown
    const shutdown = async () => {
        logger_1.logger.info('');
        logger_1.logger.info('Shutting down...');
        if (watcher) {
            watcher.stop();
        }
        await backendAPI.disconnect();
        logger_1.logger.info('Goodbye! 👋');
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    // Handle auth token refresh
    auth.onAuthStateChange((newSession) => {
        if (newSession) {
            backendAPI.setAuthToken(newSession.access_token);
            logger_1.logger.debug('Auth token refreshed');
        }
        else {
            logger_1.logger.warn('Session expired. Please restart and sign in again.');
        }
    });
    // Keep process alive
    await new Promise(() => { });
}
/**
 * Wait for a text file to appear
 */
async function waitForTextFile(customPath) {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max
    while (attempts < maxAttempts) {
        const path = await (0, paths_1.findActiveTextFile)(customPath);
        if (path)
            return path;
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
    }
    return null;
}
// Run the app
main().catch((error) => {
    logger_1.logger.error('Fatal error', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map