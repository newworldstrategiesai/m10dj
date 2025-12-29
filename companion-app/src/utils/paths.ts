/**
 * File path utilities for finding Serato and Now Playing files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * Common locations for "Now Playing" text files
 * These are files created by various DJ tools for OBS/Twitch overlays
 */
export function getCommonTextFilePaths(): string[] {
  const homeDir = os.homedir();
  const isMac = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';

  const paths: string[] = [
    // Now Playing app (by DJ Flipside) - most common
    path.join(homeDir, 'Music', 'NowPlaying', 'current.txt'),
    path.join(homeDir, 'Music', 'NowPlaying', 'nowplaying.txt'),
    
    // What's Now Playing
    path.join(homeDir, 'Documents', 'NowPlaying', 'current.txt'),
    path.join(homeDir, 'Documents', 'NowPlaying', 'nowplaying.txt'),
    
    // djctl
    path.join(homeDir, 'Documents', 'djctl', 'nowplaying.txt'),
    
    // Now-Playing-Serato Python script
    path.join(homeDir, 'Music', '_Serato_', 'nowplaying.txt'),
    
    // Generic locations
    path.join(homeDir, 'nowplaying.txt'),
    path.join(homeDir, 'Documents', 'nowplaying.txt'),
    path.join(homeDir, 'Music', 'nowplaying.txt'),
  ];

  // Windows-specific paths
  if (isWindows) {
    paths.push(
      path.join(homeDir, 'Music', 'NowPlaying', 'current.txt'),
      path.join('C:', 'NowPlaying', 'current.txt'),
    );
  }

  // Mac-specific paths
  if (isMac) {
    paths.push(
      path.join(homeDir, 'Library', 'Application Support', 'NowPlaying', 'current.txt'),
    );
  }

  return paths;
}

/**
 * Get the Serato library path
 */
export function getSeratoPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, 'Music', '_Serato_');
}

/**
 * Get the Serato history directory
 */
export function getSeratoHistoryPath(): string {
  return path.join(getSeratoPath(), 'History');
}

/**
 * Check if a file exists and is readable
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file has been modified recently
 * @param filePath Path to the file
 * @param maxAgeHours Maximum age in hours to consider "recent"
 */
export async function isFileRecent(filePath: string, maxAgeHours: number = 1): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
    return hoursSinceModified < maxAgeHours;
  } catch {
    return false;
  }
}

/**
 * Check if a file has content (non-empty)
 */
export async function fileHasContent(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Find the first available and active text file
 * Returns null if no suitable file is found
 */
export async function findActiveTextFile(customPath?: string): Promise<string | null> {
  // If custom path provided, check it first
  if (customPath) {
    if (await fileExists(customPath)) {
      return customPath;
    }
  }

  // Check common paths
  const paths = getCommonTextFilePaths();
  
  for (const filePath of paths) {
    if (await fileExists(filePath)) {
      // Check if recently modified (active)
      if (await isFileRecent(filePath, 24)) {
        // Check if it has content
        if (await fileHasContent(filePath)) {
          return filePath;
        }
      }
    }
  }

  return null;
}

/**
 * Get platform name for logging/API
 */
export function getPlatform(): 'macos' | 'windows' | 'linux' {
  switch (process.platform) {
    case 'darwin':
      return 'macos';
    case 'win32':
      return 'windows';
    default:
      return 'linux';
  }
}

