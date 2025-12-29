"use strict";
/**
 * File path utilities for finding Serato and Now Playing files
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
exports.getCommonTextFilePaths = getCommonTextFilePaths;
exports.getSeratoPath = getSeratoPath;
exports.getSeratoHistoryPath = getSeratoHistoryPath;
exports.fileExists = fileExists;
exports.isFileRecent = isFileRecent;
exports.fileHasContent = fileHasContent;
exports.findActiveTextFile = findActiveTextFile;
exports.getPlatform = getPlatform;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Common locations for "Now Playing" text files
 * These are files created by various DJ tools for OBS/Twitch overlays
 */
function getCommonTextFilePaths() {
    const homeDir = os.homedir();
    const isMac = process.platform === 'darwin';
    const isWindows = process.platform === 'win32';
    const paths = [
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
        paths.push(path.join(homeDir, 'Music', 'NowPlaying', 'current.txt'), path.join('C:', 'NowPlaying', 'current.txt'));
    }
    // Mac-specific paths
    if (isMac) {
        paths.push(path.join(homeDir, 'Library', 'Application Support', 'NowPlaying', 'current.txt'));
    }
    return paths;
}
/**
 * Get the Serato library path
 */
function getSeratoPath() {
    const homeDir = os.homedir();
    return path.join(homeDir, 'Music', '_Serato_');
}
/**
 * Get the Serato history directory
 */
function getSeratoHistoryPath() {
    return path.join(getSeratoPath(), 'History');
}
/**
 * Check if a file exists and is readable
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if a file has been modified recently
 * @param filePath Path to the file
 * @param maxAgeHours Maximum age in hours to consider "recent"
 */
async function isFileRecent(filePath, maxAgeHours = 1) {
    try {
        const stats = await fs.stat(filePath);
        const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        return hoursSinceModified < maxAgeHours;
    }
    catch {
        return false;
    }
}
/**
 * Check if a file has content (non-empty)
 */
async function fileHasContent(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.trim().length > 0;
    }
    catch {
        return false;
    }
}
/**
 * Find the first available and active text file
 * Returns null if no suitable file is found
 */
async function findActiveTextFile(customPath) {
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
function getPlatform() {
    switch (process.platform) {
        case 'darwin':
            return 'macos';
        case 'win32':
            return 'windows';
        default:
            return 'linux';
    }
}
//# sourceMappingURL=paths.js.map