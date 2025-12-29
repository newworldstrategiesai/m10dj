#!/usr/bin/env node

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

import * as dotenv from 'dotenv';
import { SupabaseAuth } from './auth/supabase';
import { BackendAPI } from './api/backend';
import { TextFileWatcher, Track } from './detection/text-file';
import { LivePlaylistWatcher, LivePlaylistTrack, validateLivePlaylist } from './detection/live-playlist';
import { findActiveTextFile, getPlatform } from './utils/paths';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Detection method type
type DetectionMethod = 'text_file' | 'live_playlist' | 'auto';

// Configuration
const CONFIG = {
  apiUrl: process.env.API_URL || 'https://m10djcompany.com',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  customTextFilePath: process.env.TEXT_FILE_PATH,
  seratoUsername: process.env.SERATO_USERNAME,  // For Live Playlist mode
  detectionMethod: (process.env.DETECTION_METHOD || 'auto') as DetectionMethod,
  email: process.env.SUPABASE_EMAIL,
  password: process.env.SUPABASE_PASSWORD,
  appVersion: '1.1.0'
};

// Validate configuration
function validateConfig(): boolean {
  if (!CONFIG.supabaseUrl) {
    logger.error('Missing SUPABASE_URL environment variable');
    return false;
  }
  if (!CONFIG.supabaseAnonKey) {
    logger.error('Missing SUPABASE_ANON_KEY environment variable');
    return false;
  }
  return true;
}

async function main() {
  // Show banner
  logger.banner();

  // Validate config
  if (!validateConfig()) {
    logger.error('Configuration invalid. Please check your .env file.');
    process.exit(1);
  }

  logger.info(`Platform: ${getPlatform()}`);
  logger.info(`API URL: ${CONFIG.apiUrl}`);

  // Initialize Supabase auth
  const auth = new SupabaseAuth(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

  // Try to authenticate
  let session = await auth.checkSession();
  
  if (!session) {
    // Try environment credentials first
    if (CONFIG.email && CONFIG.password) {
      try {
        session = await auth.signIn(CONFIG.email, CONFIG.password);
      } catch (error) {
        logger.warn('Environment credentials failed, trying interactive login');
      }
    }

    // Fall back to interactive login
    if (!session) {
      try {
        session = await auth.signInInteractive();
      } catch (error: any) {
        logger.error('Authentication failed', error.message);
        process.exit(1);
      }
    }
  }

  logger.info(`Authenticated as: ${auth.getUserEmail()}`);

  // Initialize backend API
  const backendAPI = new BackendAPI(CONFIG.apiUrl, CONFIG.appVersion);
  backendAPI.setAuthToken(session.access_token);

  // Start heartbeat
  backendAPI.startHeartbeat();

  // Determine detection method
  let useMethod: 'text_file' | 'live_playlists' = 'text_file';
  let watcher: TextFileWatcher | LivePlaylistWatcher | null = null;

  // Check what detection method to use
  if (CONFIG.detectionMethod === 'live_playlist' || 
      (CONFIG.detectionMethod === 'auto' && CONFIG.seratoUsername)) {
    // Try Live Playlist mode first if configured
    if (CONFIG.seratoUsername) {
      logger.info(`Checking Serato Live Playlist for: ${CONFIG.seratoUsername}`);
      const isValid = await validateLivePlaylist(CONFIG.seratoUsername);
      
      if (isValid) {
        useMethod = 'live_playlists';
        logger.info('✓ Live Playlist is active and public!');
      } else {
        logger.warn('Live Playlist not found or not public. Falling back to text file mode.');
      }
    }
  }

  // Create track handler (works for both methods)
  const handleTrack = async (track: Track | LivePlaylistTrack) => {
    try {
      const result = await backendAPI.sendNowPlaying(
        {
          artist: track.artist,
          title: track.title,
          played_at: track.detectedAt
        },
        {
          detection_method: useMethod,
          source_file: 'sourceFile' in track ? track.sourceFile : undefined
        }
      );

      if (result.success) {
        if (result.matched) {
          logger.info(`🎯 Matched to request: ${result.matched_request_id}`);
        }
      } else {
        logger.warn(`Failed to send: ${result.error}`);
      }
    } catch (error: any) {
      logger.error('Error sending track', error.message);
    }
  };

  // Start the appropriate watcher
  if (useMethod === 'live_playlists' && CONFIG.seratoUsername) {
    // Use Live Playlist scraping (no third-party app needed!)
    logger.info('');
    logger.info('📡 Using Serato Live Playlist mode (no third-party app needed!)');
    logger.info(`   Watching: https://serato.com/playlists/${CONFIG.seratoUsername}/live`);
    
    watcher = new LivePlaylistWatcher(CONFIG.seratoUsername, handleTrack);
    await watcher.start();
    
  } else {
    // Use text file watching (requires Now Playing app or similar)
    logger.info('Searching for "Now Playing" text file...');
    const textFilePath = await findActiveTextFile(CONFIG.customTextFilePath);

    if (!textFilePath) {
      logger.warn('No active text file found.');
      logger.info('');
      logger.info('You have two options:');
      logger.info('');
      logger.info('Option 1: Use Serato Live Playlist (recommended - no extra app needed!)');
      logger.info('  Add to your .env file:');
      logger.info(`    SERATO_USERNAME=DJ_Ben_Murray`);
      logger.info('  (Make sure your Live Playlist is PUBLIC)');
      logger.info('');
      logger.info('Option 2: Use a "Now Playing" tool:');
      logger.info('  • Now Playing app: https://djflipside.com/pages/now-playing');
      logger.info('  • Set TEXT_FILE_PATH in your .env file');
      logger.info('');
      logger.info('Waiting for text file to appear...');
      
      // Wait for file to appear
      let foundPath: string | null = null;
      while (!foundPath) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        foundPath = await findActiveTextFile(CONFIG.customTextFilePath);
      }
      
      logger.info(`Found text file: ${foundPath}`);
    }

    const watchPath = textFilePath || await waitForTextFile(CONFIG.customTextFilePath);
    
    if (!watchPath) {
      logger.error('Could not find text file. Try setting SERATO_USERNAME for Live Playlist mode.');
      process.exit(1);
    }

    logger.info(`Watching: ${watchPath}`);
    watcher = new TextFileWatcher(watchPath, handleTrack);
    await watcher.start();
  }

  logger.info('');
  logger.info('🎧 Ready! Play tracks in Serato and they will be detected automatically.');
  logger.info('');
  logger.info('Press Ctrl+C to stop.');

  // Handle graceful shutdown
  const shutdown = async () => {
    logger.info('');
    logger.info('Shutting down...');
    
    if (watcher) {
      watcher.stop();
    }
    await backendAPI.disconnect();
    
    logger.info('Goodbye! 👋');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Handle auth token refresh
  auth.onAuthStateChange((newSession) => {
    if (newSession) {
      backendAPI.setAuthToken(newSession.access_token);
      logger.debug('Auth token refreshed');
    } else {
      logger.warn('Session expired. Please restart and sign in again.');
    }
  });

  // Keep process alive
  await new Promise(() => {});
}

/**
 * Wait for a text file to appear
 */
async function waitForTextFile(customPath?: string): Promise<string | null> {
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (attempts < maxAttempts) {
    const path = await findActiveTextFile(customPath);
    if (path) return path;
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
  
  return null;
}

// Run the app
main().catch((error) => {
  logger.error('Fatal error', error);
  process.exit(1);
});

