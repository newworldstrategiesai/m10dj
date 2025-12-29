/**
 * Song Title Cleanup Utility
 * 
 * Cleans up common issues with user-entered song titles:
 * - Removes artist name from end of title (e.g., "Latch Disclosure" → "Latch")
 * - Removes "by Artist" patterns (e.g., "Wish by Alien Ant Farm" → "Wish")
 * - Removes "- Artist" patterns (e.g., "Latch - Disclosure" → "Latch")
 * - Trims whitespace and normalizes spacing
 */

/**
 * Clean up a song title by removing artist name if present
 * @param {string} title - The song title to clean
 * @param {string} artist - The artist name to check for
 * @returns {string} - The cleaned song title
 */
function cleanSongTitle(title, artist) {
  if (!title) return title;
  if (!artist) return title.trim();

  let cleanedTitle = title.trim();
  const artistLower = artist.toLowerCase().trim();
  const titleLower = cleanedTitle.toLowerCase();

  // Skip if title and artist are the same (edge case)
  if (titleLower === artistLower) {
    return cleanedTitle;
  }

  // Pattern 1: Title ends with artist name (e.g., "Latch Disclosure" when artist is "Disclosure")
  if (titleLower.endsWith(artistLower)) {
    const potentialTitle = cleanedTitle.slice(0, -artist.length).trim();
    // Only use if we have something left
    if (potentialTitle.length > 0) {
      cleanedTitle = potentialTitle;
    }
  }

  // Pattern 2: Title ends with " - Artist" (e.g., "Latch - Disclosure")
  const dashPattern = new RegExp(`\\s*-\\s*${escapeRegex(artist)}\\s*$`, 'i');
  if (dashPattern.test(cleanedTitle)) {
    cleanedTitle = cleanedTitle.replace(dashPattern, '').trim();
  }

  // Pattern 3: Title ends with " by Artist" (e.g., "Wish by Alien Ant Farm")
  const byPattern = new RegExp(`\\s+by\\s+${escapeRegex(artist)}\\s*$`, 'i');
  if (byPattern.test(cleanedTitle)) {
    cleanedTitle = cleanedTitle.replace(byPattern, '').trim();
  }

  // Pattern 4: Title starts with "Artist - " (e.g., "Disclosure - Latch")
  const startDashPattern = new RegExp(`^${escapeRegex(artist)}\\s*-\\s*`, 'i');
  if (startDashPattern.test(cleanedTitle)) {
    cleanedTitle = cleanedTitle.replace(startDashPattern, '').trim();
  }

  // Pattern 5: Title contains " ft. Artist" or " feat. Artist" at the end
  // We'll keep featured artists but this could be extended
  
  // Pattern 6: Remove trailing parentheses with artist name
  // e.g., "Latch (Disclosure)" → "Latch"
  const parenPattern = new RegExp(`\\s*\\(${escapeRegex(artist)}\\)\\s*$`, 'i');
  if (parenPattern.test(cleanedTitle)) {
    cleanedTitle = cleanedTitle.replace(parenPattern, '').trim();
  }

  // Final cleanup - remove any trailing punctuation that might be left over
  cleanedTitle = cleanedTitle.replace(/[-:,]\s*$/, '').trim();

  return cleanedTitle || title.trim(); // Fallback to original if we somehow emptied it
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} - Escaped string safe for use in RegExp
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Clean up both song title and artist name
 * Also handles cases where artist might be in wrong field
 * @param {string} title - The song title
 * @param {string} artist - The artist name
 * @returns {{ cleanedTitle: string, cleanedArtist: string }}
 */
function cleanSongData(title, artist) {
  if (!title && !artist) {
    return { cleanedTitle: '', cleanedArtist: '' };
  }

  let cleanedTitle = (title || '').trim();
  let cleanedArtist = (artist || '').trim();

  // If no artist but title contains " - ", try to split
  if (!cleanedArtist && cleanedTitle.includes(' - ')) {
    const parts = cleanedTitle.split(' - ');
    if (parts.length === 2) {
      // Could be "Artist - Title" or "Title - Artist"
      // Heuristic: if first part is shorter, it's likely the artist
      if (parts[0].length < parts[1].length) {
        cleanedArtist = parts[0].trim();
        cleanedTitle = parts[1].trim();
      } else {
        cleanedTitle = parts[0].trim();
        cleanedArtist = parts[1].trim();
      }
    }
  }

  // If no artist but title contains " by ", try to split
  if (!cleanedArtist && / by /i.test(cleanedTitle)) {
    const byMatch = cleanedTitle.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) {
      cleanedTitle = byMatch[1].trim();
      cleanedArtist = byMatch[2].trim();
    }
  }

  // Now clean the title to remove duplicate artist info
  if (cleanedArtist) {
    cleanedTitle = cleanSongTitle(cleanedTitle, cleanedArtist);
  }

  return {
    cleanedTitle,
    cleanedArtist
  };
}

module.exports = {
  cleanSongTitle,
  cleanSongData
};

