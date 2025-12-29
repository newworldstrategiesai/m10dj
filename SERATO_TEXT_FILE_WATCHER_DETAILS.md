# Text File Watcher Approach - Detailed Implementation Guide

## Overview

Many DJ tools that display "Now Playing" on Twitch streams output track information to simple text files that OBS can read. Instead of building our own Serato parser, we can **watch these same text files** that DJs are already using.

## Why This Works

**DJs Already Use This**: Tools like "Now Playing" app, "What's Now Playing", and others write to text files for OBS overlays. If a DJ is streaming to Twitch with track info displayed, they're likely already creating these files.

**Zero Additional Setup**: No new tools needed - we just read what's already there.

**Universal Compatibility**: Works with ANY tool that outputs to text files, regardless of which DJ software it supports.

## Common Text File Locations & Formats

### Tool: "Now Playing" App (by DJ Flipside)
**File Location:**
- macOS: `~/Music/NowPlaying/current.txt`
- Windows: `C:\Users\<username>\Music\NowPlaying\current.txt`

**Format:**
```
Artist Name - Song Title
```

### Tool: "What's Now Playing"
**File Location:**
- Custom configurable, but often: `~/Documents/NowPlaying/current.txt`

**Format:**
```
Artist Name - Song Title
```

### Tool: "Now-Playing-Serato" (Python Script)
**File Location:**
- Typically: `~/Music/_Serato_/nowplaying.txt` or custom location

**Format:**
```
Artist Name - Song Title
```

### Tool: djctl
**File Location:**
- Configurable, often: `~/Documents/djctl/nowplaying.txt`

**Format:**
```
Artist Name - Song Title
```

## Implementation Strategy

### Step 1: Detect Available Text Files

```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

// Common file locations to check
const commonPaths = [
  // macOS paths
  path.join(os.homedir(), 'Music', 'NowPlaying', 'current.txt'),
  path.join(os.homedir(), 'Music', '_Serato_', 'nowplaying.txt'),
  path.join(os.homedir(), 'Documents', 'NowPlaying', 'current.txt'),
  path.join(os.homedir(), 'Documents', 'djctl', 'nowplaying.txt'),
  
  // Windows paths
  path.join(os.homedir(), 'Music', 'NowPlaying', 'current.txt'),
  path.join(os.homedir(), 'Documents', 'NowPlaying', 'current.txt'),
  path.join(os.homedir(), 'Documents', 'djctl', 'nowplaying.txt'),
];

async function findAvailableTextFile() {
  for (const filePath of commonPaths) {
    try {
      // Check if file exists and is readable
      await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
      
      // Check if file has been modified recently (within last 24 hours)
      const stats = await fs.promises.stat(filePath);
      const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceModified < 24) {
        console.log(`Found active text file: ${filePath}`);
        return filePath;
      }
    } catch (error) {
      // File doesn't exist or isn't readable, try next path
      continue;
    }
  }
  
  return null; // No text file found
}
```

### Step 2: Watch File for Changes

```javascript
const chokidar = require('chokidar'); // Better than fs.watch for cross-platform

class TextFileWatcher {
  constructor(filePath, onTrackChange) {
    this.filePath = filePath;
    this.onTrackChange = onTrackChange;
    this.lastContent = null;
    this.watcher = null;
  }
  
  start() {
    // Read initial content
    this.readFile();
    
    // Watch for changes
    this.watcher = chokidar.watch(this.filePath, {
      persistent: true,
      ignoreInitial: false, // Don't ignore initial read
      awaitWriteFinish: {
        stabilityThreshold: 100, // Wait 100ms after file stops changing
        pollInterval: 50 // Check every 50ms
      }
    });
    
    this.watcher.on('change', (path) => {
      console.log(`File changed: ${path}`);
      this.readFile();
    });
    
    this.watcher.on('error', (error) => {
      console.error(`Watcher error: ${error}`);
    });
  }
  
  async readFile() {
    try {
      const content = await fs.promises.readFile(this.filePath, 'utf-8');
      const trimmedContent = content.trim();
      
      // Only process if content actually changed
      if (trimmedContent !== this.lastContent && trimmedContent.length > 0) {
        this.lastContent = trimmedContent;
        this.parseAndEmit(trimmedContent);
      }
    } catch (error) {
      console.error(`Error reading file: ${error.message}`);
    }
  }
  
  parseAndEmit(content) {
    // Parse "Artist - Title" format
    const parts = content.split(' - ');
    
    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const title = parts.slice(1).join(' - ').trim(); // Handle " - " in title
      
      if (artist && title) {
        console.log(`Track detected: ${artist} - ${title}`);
        
        // Emit to callback
        this.onTrackChange({
          artist,
          title,
          source: 'text_file',
          filePath: this.filePath,
          detectedAt: new Date().toISOString()
        });
      }
    } else {
      console.warn(`Could not parse track from: ${content}`);
    }
  }
  
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
```

### Step 3: Handle Multiple Format Variations

Some tools might use different formats:

```javascript
parseTrackContent(content) {
  // Try different parsing strategies
  
  // Format 1: "Artist - Title"
  let match = content.match(/^(.+?)\s*-\s*(.+)$/);
  if (match) {
    return { artist: match[1].trim(), title: match[2].trim() };
  }
  
  // Format 2: "Title by Artist"
  match = content.match(/^(.+?)\s+by\s+(.+)$/i);
  if (match) {
    return { artist: match[2].trim(), title: match[1].trim() };
  }
  
  // Format 3: JSON (some tools output JSON)
  try {
    const parsed = JSON.parse(content);
    if (parsed.artist && parsed.title) {
      return { artist: parsed.artist, title: parsed.title };
    }
  } catch (e) {
    // Not JSON, continue
  }
  
  // Format 4: Single line (assume entire content is title, no artist)
  if (content.trim().length > 0) {
    return { artist: 'Unknown', title: content.trim() };
  }
  
  return null;
}
```

### Step 4: Complete Integration Example

```javascript
const chokidar = require('chokidar');
const path = require('path');
const os = require('os');
const fs = require('fs');

class SeratoTextFileDetector {
  constructor(backendApi) {
    this.backendApi = backendApi; // Your API endpoint
    this.watchers = [];
    this.detectedFiles = [];
  }
  
  async initialize() {
    console.log('🔍 Searching for existing "Now Playing" text files...');
    
    const filePath = await this.findAvailableTextFile();
    
    if (!filePath) {
      console.log('❌ No text file found. DJ may not be using a "Now Playing" tool.');
      return false;
    }
    
    console.log(`✅ Found text file: ${filePath}`);
    
    // Start watching
    const watcher = new TextFileWatcher(filePath, (track) => {
      this.handleTrackChange(track);
    });
    
    watcher.start();
    this.watchers.push(watcher);
    this.detectedFiles.push(filePath);
    
    return true;
  }
  
  async findAvailableTextFile() {
    const homeDir = os.homedir();
    const isMac = process.platform === 'darwin';
    
    const pathsToCheck = [
      // Now Playing app (most common)
      path.join(homeDir, 'Music', 'NowPlaying', 'current.txt'),
      
      // What's Now Playing
      path.join(homeDir, 'Documents', 'NowPlaying', 'current.txt'),
      
      // djctl
      path.join(homeDir, 'Documents', 'djctl', 'nowplaying.txt'),
      
      // Now-Playing-Serato script
      path.join(homeDir, 'Music', '_Serato_', 'nowplaying.txt'),
      
      // Windows alternatives
      ...(isMac ? [] : [
        path.join(homeDir, 'Music', 'NowPlaying', 'current.txt'),
        path.join(homeDir, 'Documents', 'NowPlaying', 'current.txt'),
      ])
    ];
    
    for (const filePath of pathsToCheck) {
      if (await this.isActiveFile(filePath)) {
        return filePath;
      }
    }
    
    return null;
  }
  
  async isActiveFile(filePath) {
    try {
      // Check if file exists
      await fs.promises.access(filePath, fs.constants.F_OK);
      
      // Check if recently modified (active within last hour)
      const stats = await fs.promises.stat(filePath);
      const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceModified < 1) {
        // Read file to verify it has content
        const content = await fs.promises.readFile(filePath, 'utf-8');
        if (content.trim().length > 0) {
          return true;
        }
      }
    } catch (error) {
      // File doesn't exist or can't be accessed
      return false;
    }
    
    return false;
  }
  
  async handleTrackChange(track) {
    console.log(`🎵 Track detected via text file: ${track.artist} - ${track.title}`);
    
    // Send to your backend
    try {
      const response = await fetch(`${this.backendApi}/api/serato/now-playing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          event: 'NOW_PLAYING',
          track: {
            artist: track.artist,
            title: track.title,
            played_at: track.detectedAt,
            detection_method: 'text_file',
            source_file: track.filePath
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Track sent to backend: ${result.play_id}`);
      }
    } catch (error) {
      console.error(`❌ Error sending track to backend: ${error.message}`);
    }
  }
  
  stop() {
    this.watchers.forEach(watcher => watcher.stop());
    this.watchers = [];
  }
}
```

## Advantages

### ✅ **Zero DJ Setup Required**
- If DJ is already streaming to Twitch with track info, they're already creating these files
- No new tools to install
- No configuration needed

### ✅ **Universal Compatibility**
- Works with ANY tool that outputs text files
- Doesn't matter if it's "Now Playing", "What's Now Playing", djctl, or custom scripts
- Future-proof: works with new tools too

### ✅ **Simple & Reliable**
- Text files are easy to parse
- File watching is a well-understood pattern
- No complex binary parsing needed

### ✅ **Lightweight**
- Minimal CPU/memory usage
- Only reads file when it changes
- Uses standard Node.js libraries (chokidar)

## Limitations

### ⚠️ **Requires DJ to Use Text File Tool**
- Won't work if DJ isn't using a tool that outputs text files
- Need fallback to direct Serato history parsing

### ⚠️ **File Format Variations**
- Different tools might use slightly different formats
- Need robust parsing logic
- Some edge cases (songs with " - " in title)

### ⚠️ **File Location Discovery**
- Need to search multiple common locations
- Some tools allow custom file paths (harder to find)

### ⚠️ **Latency**
- Slight delay if file watching has a stability threshold
- But usually < 200ms, which is acceptable

## Best Practices

### 1. **Multi-File Discovery**
Don't just check one location - scan multiple common paths:

```javascript
// Check multiple locations in order of likelihood
const priorityPaths = [
  '~/Music/NowPlaying/current.txt',      // Most common
  '~/Documents/NowPlaying/current.txt',   // Alternative
  '~/Music/_Serato_/nowplaying.txt',     // Direct script output
  // ... etc
];
```

### 2. **Active File Detection**
Only watch files that have been recently modified (active):

```javascript
// Only watch files modified in last hour
const stats = await fs.promises.stat(filePath);
const hoursSinceModified = (Date.now() - stats.mtime) / (1000 * 60 * 60);
if (hoursSinceModified > 1) {
  // File is stale, skip it
}
```

### 3. **Deduplication**
Prevent duplicate events for the same track:

```javascript
class Deduplicator {
  constructor() {
    this.lastTrack = null;
    this.lastTrackTime = null;
  }
  
  isNewTrack(track) {
    const isDifferent = 
      !this.lastTrack ||
      this.lastTrack.artist !== track.artist ||
      this.lastTrack.title !== track.title;
    
    // Also check time (prevent same track within 10 seconds)
    const timeDiff = Date.now() - this.lastTrackTime;
    const isTimeDiffSignificant = !this.lastTrackTime || timeDiff > 10000;
    
    if (isDifferent && isTimeDiffSignificant) {
      this.lastTrack = track;
      this.lastTrackTime = Date.now();
      return true;
    }
    
    return false;
  }
}
```

### 4. **Error Handling**
Handle file deletion, permission errors, etc.:

```javascript
watcher.on('unlink', (path) => {
  console.log(`File deleted: ${path}`);
  // Attempt to find alternative file
  this.initialize();
});

watcher.on('error', (error) => {
  console.error(`Watcher error: ${error}`);
  // Try to recover or switch to backup method
});
```

### 5. **Fallback Strategy**
If text file isn't found, fall back to direct Serato history parsing:

```javascript
async function initializeDetection() {
  // Try text file first (easiest)
  const textFileDetector = new SeratoTextFileDetector();
  if (await textFileDetector.initialize()) {
    console.log('✅ Using text file detection');
    return textFileDetector;
  }
  
  // Fallback to direct Serato history parsing
  console.log('⚠️ Text file not found, using direct Serato history');
  const seratoDetector = new SeratoHistoryDetector();
  if (await seratoDetector.initialize()) {
    return seratoDetector;
  }
  
  // No detection method available
  return null;
}
```

## Integration with Companion App

The text file watcher should be part of your companion app, with this priority:

```
Priority 1: Text File Watcher (if DJ uses existing tools)
Priority 2: Direct Serato History Parser (if no text file found)
Priority 3: Manual input (fallback)
```

## Package Dependencies

```json
{
  "dependencies": {
    "chokidar": "^3.5.3",  // File watching (better than fs.watch)
    "fs-extra": "^11.1.1"   // Enhanced file system operations
  }
}
```

## Testing Strategy

### Test Cases:

1. **File Discovery**
   - Create test files in common locations
   - Verify detection logic finds them
   - Test with recently modified vs stale files

2. **Parsing**
   - Test various formats: "Artist - Title", "Title by Artist", JSON
   - Test edge cases: titles with " - ", special characters
   - Test empty/invalid files

3. **File Watching**
   - Write to file, verify change detection
   - Test rapid changes (multiple writes quickly)
   - Test file deletion/recreation

4. **Deduplication**
   - Same track twice quickly (should ignore)
   - Different tracks (should process)
   - Track with slight variation (should process)

## Summary

The text file watcher approach is the **fastest path to MVP** because:

1. **Works immediately** for DJs already streaming to Twitch
2. **No Serato parsing needed** - leverage existing tools
3. **Simple implementation** - standard file watching pattern
4. **Universal compatibility** - works with any text-output tool

This should be your **Phase 1** implementation, with direct Serato history parsing as Phase 2 (for DJs not using Twitch tools).

