/**
 * File path utilities for finding Serato and Now Playing files
 */
/**
 * Common locations for "Now Playing" text files
 * These are files created by various DJ tools for OBS/Twitch overlays
 */
export declare function getCommonTextFilePaths(): string[];
/**
 * Get the Serato library path
 */
export declare function getSeratoPath(): string;
/**
 * Get the Serato history directory
 */
export declare function getSeratoHistoryPath(): string;
/**
 * Check if a file exists and is readable
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Check if a file has been modified recently
 * @param filePath Path to the file
 * @param maxAgeHours Maximum age in hours to consider "recent"
 */
export declare function isFileRecent(filePath: string, maxAgeHours?: number): Promise<boolean>;
/**
 * Check if a file has content (non-empty)
 */
export declare function fileHasContent(filePath: string): Promise<boolean>;
/**
 * Find the first available and active text file
 * Returns null if no suitable file is found
 */
export declare function findActiveTextFile(customPath?: string): Promise<string | null>;
/**
 * Get platform name for logging/API
 */
export declare function getPlatform(): 'macos' | 'windows' | 'linux';
//# sourceMappingURL=paths.d.ts.map