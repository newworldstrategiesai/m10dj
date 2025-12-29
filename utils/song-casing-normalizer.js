/**
 * Utility to normalize song titles and artist names to proper casing
 * Uses typical English language casing by default, but can be overridden
 * with special casing from music service APIs
 */

/**
 * Convert a string to Title Case (typical English casing)
 * Handles common words correctly (and, or, the, etc.)
 */
function toTitleCase(str) {
  if (!str) return '';
  
  // List of words that should remain lowercase (unless first word)
  const lowercaseWords = ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from'];
  
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // First word is always capitalized
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      // Small words stay lowercase unless they're single-letter words
      if (lowercaseWords.includes(word) && word.length > 1) {
        return word;
      }
      // Capitalize first letter of other words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Extract title and artist from YouTube video title
 * Format is typically "Song Title - Artist Name" or "Artist Name - Song Title"
 * Returns { title, artist } with original casing preserved
 */
export function parseYouTubeTitle(videoTitle) {
  if (!videoTitle) return null;
  
  // Remove common suffixes
  const cleaned = videoTitle
    .replace(/\s*\(Official.*?\)/gi, '')
    .replace(/\s*\(Official Music Video.*?\)/gi, '')
    .replace(/\s*\(Official Video.*?\)/gi, '')
    .replace(/\s*\[Official.*?\]/gi, '')
    .replace(/\s*- YouTube\s*$/i, '')
    .trim();
  
  // Try splitting by " - " or " – " (en dash)
  const separators = [' - ', ' – ', ' — '];
  let parts = null;
  let separator = null;
  
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      parts = cleaned.split(sep);
      separator = sep;
      break;
    }
  }
  
  if (!parts || parts.length < 2) {
    // No separator found, return the whole thing as title
    return { title: cleaned, artist: null };
  }
  
  // Determine which part is the artist and which is the title
  // Common patterns:
  // "Song Title - Artist Name" (more common)
  // "Artist Name - Song Title" (less common, but happens)
  
  // Try pattern 1: "Song Title - Artist Name"
  // Usually the first part is longer or contains more words
  const part1 = parts[0].trim();
  const part2 = parts.slice(1).join(separator).trim();
  
  // Heuristic: if part2 is shorter and seems like an artist name (fewer words), 
  // it's likely "Title - Artist"
  // Otherwise, it might be "Artist - Title"
  const part1Words = part1.split(/\s+/).length;
  const part2Words = part2.split(/\s+/).length;
  
  if (part2Words <= 3 && part1Words >= part2Words) {
    // Likely "Title - Artist"
    return { title: part1, artist: part2 };
  } else if (part1Words <= 3 && part2Words >= part1Words) {
    // Likely "Artist - Title"
    return { title: part2, artist: part1 };
  }
  
  // Default: assume first is title, rest is artist
  return { title: part1, artist: part2 };
}

/**
 * Normalize song title and artist name to proper casing
 * Uses typical English title case by default
 * Can accept special casing from APIs to override default
 * 
 * @param {string} title - Song title (user input)
 * @param {string} artist - Artist name (user input)
 * @param {Object} options - Options for normalization
 * @param {string} options.apiTitle - Title from API (with special casing)
 * @param {string} options.apiArtist - Artist from API (with special casing)
 * @returns {Object} { normalizedTitle, normalizedArtist }
 */
export function normalizeSongCasing(title, artist, options = {}) {
  const { apiTitle, apiArtist } = options;
  
  // If we have API data with special casing, use it
  // Otherwise, use title case
  const normalizedTitle = apiTitle || toTitleCase(title || '');
  const normalizedArtist = apiArtist || toTitleCase(artist || '');
  
  return {
    normalizedTitle,
    normalizedArtist
  };
}

/**
 * Extract normalized casing from YouTube search results
 * Returns { title, artist } with proper casing from the best match
 */
export function extractCasingFromYouTube(videoTitle) {
  if (!videoTitle) return null;
  
  const parsed = parseYouTubeTitle(videoTitle);
  if (!parsed) return null;
  
  return {
    title: parsed.title,
    artist: parsed.artist
  };
}

/**
 * Extract normalized casing from Spotify track data
 * This would need to be called with actual Spotify API response data
 * For now, returns null (will be enhanced when we have Spotify API access)
 */
export function extractCasingFromSpotify(spotifyData) {
  // TODO: When we have Spotify API access, extract title and artist from track object
  // For now, return null to fall back to title case
  return null;
}

