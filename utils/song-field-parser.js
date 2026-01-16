/**
 * Song Field Parser Utility
 * Parses combined "Song Title - Artist Name" input into separate title and artist fields
 * Supports multiple formats: "Title - Artist", "Title by Artist", "Artist - Title", etc.
 */

/**
 * Detects if input is in a combined format (title and artist together)
 * @param {string} input - The combined input string
 * @returns {boolean} - True if input appears to be in combined format
 */
export function isCombinedFormat(input) {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim();
  
  // Check for common separators
  const separators = [
    /\s+-\s+/,      // "Title - Artist" (space-dash-space)
    /\s+–\s+/,      // "Title – Artist" (en dash)
    /\s+—\s+/,      // "Title — Artist" (em dash)
    /\s+by\s+/i,    // "Title by Artist"
    /\s+BY\s+/,     // "Title BY Artist"
    /^(.+)\s*-\s*(.+)$/, // "Title-Artist" (no spaces around dash)
  ];
  
  for (const separator of separators) {
    if (separator.test(trimmed)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Determines if input is likely in "Artist - Title" format vs "Title - Artist" format
 * Uses heuristics based on word count, length, and common patterns
 * @param {string} part1 - First part of split input
 * @param {string} part2 - Second part of split input
 * @returns {boolean} - True if likely "Artist - Title", false if likely "Title - Artist"
 */
function isArtistFirstFormat(part1, part2) {
  const part1Trimmed = part1.trim();
  const part2Trimmed = part2.trim();
  
  // Word count heuristics
  const part1Words = part1Trimmed.split(/\s+/).length;
  const part2Words = part2Trimmed.split(/\s+/).length;
  
  // Length heuristics
  const part1Length = part1Trimmed.length;
  const part2Length = part2Trimmed.length;
  
  // Check for song title indicators in part2 (official, video, remix, etc.)
  const songTitleIndicators = /\b(ft\.|feat\.|featuring|official|video|audio|lyrics|remix|mix|extended|version|edit|radio|explicit)\b/i;
  const hasSongIndicators = songTitleIndicators.test(part2Trimmed);
  
  // Artist names are typically:
  // - 1-3 words (e.g., "Taylor Swift", "The Weeknd", "Post Malone")
  // - Shorter length (usually < 30 chars for single artist, < 50 for featured artists)
  // Song titles are typically:
  // - Longer, more varied
  // - Can contain common words like "the", "to", "me", etc.
  // - May have indicators like "Official Video", "Remix", etc.
  
  const looksLikeArtist = part1Words <= 4 && part1Length < 40;
  const looksLikeSong = part2Words >= 2 || part2Length > part1Length || hasSongIndicators;
  
  // Decision logic:
  // 1. If part2 has song indicators, it's definitely "Artist - Title"
  // 2. If part1 looks like artist (short, 1-4 words) AND part2 looks like song (longer, more words), it's "Artist - Title"
  // 3. Otherwise, default to "Title - Artist" (more common on YouTube and most services)
  
  if (hasSongIndicators) {
    return true; // Definitely "Artist - Title"
  }
  
  if (looksLikeArtist && looksLikeSong) {
    return true; // Likely "Artist - Title"
  }
  
  // Default to "Title - Artist" (more common format)
  return false;
}

/**
 * Splits combined input into title and artist parts
 * Handles multiple separator formats and determines correct order
 * @param {string} input - The combined input string
 * @returns {{title: string, artist: string, separator: string|null, format: string}} - Parsed parts
 */
export function splitCombinedInput(input) {
  if (!input || typeof input !== 'string') {
    return { title: '', artist: '', separator: null, format: 'none' };
  }
  
  const trimmed = input.trim();
  
  // Try "by" format first (most unambiguous: "Title by Artist")
  const byMatch = trimmed.match(/^(.+?)\s+by\s+(.+)$/i);
  if (byMatch) {
    return {
      title: byMatch[1].trim(),
      artist: byMatch[2].trim(),
      separator: 'by',
      format: 'title_by_artist'
    };
  }
  
  // Try various dash formats
  const dashFormats = [
    { pattern: /\s+-\s+/, name: 'space-dash-space' },  // "Title - Artist"
    { pattern: /\s+–\s+/, name: 'space-endash-space' }, // "Title – Artist"
    { pattern: /\s+—\s+/, name: 'space-emdash-space' }, // "Title — Artist"
    { pattern: /\s*-\s+/, name: 'dash-space' },         // "Title- Artist" or "Title -Artist"
    { pattern: /\s+-\s*/, name: 'space-dash' },         // "Title -Artist"
  ];
  
  for (const { pattern, name } of dashFormats) {
    if (pattern.test(trimmed)) {
      const parts = trimmed.split(pattern);
      if (parts.length >= 2) {
        const part1 = parts[0].trim();
        const part2 = parts.slice(1).join(' - ').trim(); // Handle multiple dashes
        
        // Determine if "Artist - Title" or "Title - Artist"
        const isArtistFirst = isArtistFirstFormat(part1, part2);
        
        if (isArtistFirst) {
          return {
            title: part2,
            artist: part1,
            separator: name,
            format: 'artist_dash_title'
          };
        } else {
          return {
            title: part1,
            artist: part2,
            separator: name,
            format: 'title_dash_artist'
          };
        }
      }
    }
  }
  
  // No separator found - treat as title only
  return {
    title: trimmed,
    artist: '',
    separator: null,
    format: 'title_only'
  };
}

/**
 * Parses combined song input into separate title and artist fields
 * Main entry point for parsing combined input
 * @param {string} input - The combined input string
 * @returns {{title: string, artist: string, format: string, needsArtist: boolean}} - Parsed result
 */
export function parseCombinedSongInput(input) {
  if (!input || typeof input !== 'string') {
    return {
      title: '',
      artist: '',
      format: 'empty',
      needsArtist: false
    };
  }
  
  const trimmed = input.trim();
  
  // If empty, return empty result
  if (!trimmed) {
    return {
      title: '',
      artist: '',
      format: 'empty',
      needsArtist: false
    };
  }
  
  // Check if it's in combined format
  if (!isCombinedFormat(trimmed)) {
    // No separator found - treat as title only
    return {
      title: trimmed,
      artist: '',
      format: 'title_only',
      needsArtist: true // Hint that artist might be needed
    };
  }
  
  // Split the input
  const parsed = splitCombinedInput(trimmed);
  
  // Clean up extracted parts
  // Remove common suffixes from title (Official Video, etc.)
  let cleanTitle = parsed.title
    .replace(/\s*\(Official.*?\)\s*/gi, '')
    .replace(/\s*\[Official.*?\]\s*/gi, '')
    .replace(/\s*\(Official Music Video.*?\)\s*/gi, '')
    .replace(/\s*\(Official Video.*?\)\s*/gi, '')
    .trim();
  
  // Clean up artist (remove trailing info)
  let cleanArtist = parsed.artist
    .replace(/\s*\(.*?\)\s*$/, '') // Remove trailing parenthetical info
    .replace(/\s*\[.*?\]\s*$/, '') // Remove trailing bracketed info
    .trim();
  
  return {
    title: cleanTitle,
    artist: cleanArtist,
    format: parsed.format,
    needsArtist: !cleanArtist // Mark if artist is missing
  };
}

/**
 * Formats title and artist into combined display format
 * Used for displaying existing data in combined field
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @param {string} format - Preferred format ('dash' or 'by')
 * @returns {string} - Combined format string
 */
export function formatCombinedDisplay(title, artist, format = 'dash') {
  if (!title) return '';
  if (!artist) return title;
  
  if (format === 'by') {
    return `${title} by ${artist}`;
  }
  
  // Default to dash format
  return `${title} - ${artist}`;
}

/**
 * Validates that combined input can be parsed into both title and artist
 * @param {string} input - The combined input string
 * @returns {{valid: boolean, error?: string}} - Validation result
 */
export function validateCombinedInput(input) {
  if (!input || !input.trim()) {
    return {
      valid: false,
      error: 'Song information is required'
    };
  }
  
  const parsed = parseCombinedSongInput(input);
  
  if (!parsed.title) {
    return {
      valid: false,
      error: 'Song title is required'
    };
  }
  
  if (!parsed.artist) {
    return {
      valid: false,
      error: 'Artist name is required. Format: "Song Title - Artist Name"'
    };
  }
  
  return {
    valid: true
  };
}
