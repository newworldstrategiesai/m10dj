/**
 * Normalizes song input to "Track Name - Artist Name" format
 * Supports extracting info from Spotify, Apple Music, YouTube links
 */

// Extract Spotify track info from URL
async function getSpotifyTrackInfo(url) {
  try {
    const match = url.match(/(?:spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]{22})/);
    if (!match) return null;
    const trackId = match[1];

    // Try to get track info via oembed or API
    try {
      const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        // oembed returns title like "Song Name - Artist Name"
        return parseSongTitle(data.title);
      }
    } catch (e) {
      console.error('Error fetching Spotify oembed:', e);
    }
    return null;
  } catch (error) {
    console.error('Error parsing Spotify URL:', error);
    return null;
  }
}

// Extract Apple Music track info from URL
async function getAppleMusicTrackInfo(url) {
  try {
    // Apple Music URLs are harder to parse without API, but we can try to extract from the URL structure
    // For now, return null and let the user format it manually
    return null;
  } catch (error) {
    console.error('Error parsing Apple Music URL:', error);
    return null;
  }
}

// Extract YouTube track info from URL
async function getYouTubeTrackInfo(url) {
  try {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!match) return null;
    const videoId = match[1];

    // Try to get video info via oembed
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (res.ok) {
        const data = await res.json();
        // YouTube titles are often "Song Name - Artist Name"
        return parseSongTitle(data.title);
      }
    } catch (e) {
      console.error('Error fetching YouTube oembed:', e);
    }
    return null;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}

// Parse song title that might be in "Song - Artist" format
function parseSongTitle(title) {
  if (!title) return null;
  
  // Common separators: " - ", " – ", " — ", " | ", " by "
  const separators = [' - ', ' – ', ' — ', ' | ', ' by '];
  
  for (const sep of separators) {
    const parts = title.split(sep);
    if (parts.length === 2) {
      return {
        track: parts[0].trim(),
        artist: parts[1].trim()
      };
    }
  }
  
  // If no separator found, assume it's just the track name
  return {
    track: title.trim(),
    artist: null
  };
}

// Check if input is a URL
function isUrl(input) {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

// Normalize song input to "Track Name - Artist Name" format
export async function normalizeSongInput(input) {
  if (!input || !input.trim()) {
    return { normalized: '', link: null, track: null, artist: null };
  }

  const trimmed = input.trim();
  
  // If it's already in "Track - Artist" format, just clean it up
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ');
    const track = parts[0].trim();
    const artist = parts.slice(1).join(' - ').trim(); // Handle multiple " - " separators
    
    // Check if there's a link at the end
    const linkMatch = trimmed.match(/(https?:\/\/[^\s]+)$/);
    const link = linkMatch ? linkMatch[1] : null;
    
    return {
      normalized: link ? `${track} - ${artist}` : `${track} - ${artist}`,
      link: link,
      track: track,
      artist: artist
    };
  }

  // If it's a URL, try to extract track info
  if (isUrl(trimmed)) {
    let trackInfo = null;
    let link = trimmed;

    if (trimmed.includes('spotify.com') || trimmed.includes('spotify:')) {
      trackInfo = await getSpotifyTrackInfo(trimmed);
    } else if (trimmed.includes('music.apple.com')) {
      trackInfo = await getAppleMusicTrackInfo(trimmed);
    } else if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      trackInfo = await getYouTubeTrackInfo(trimmed);
    }

    if (trackInfo && trackInfo.track) {
      const normalized = trackInfo.artist 
        ? `${trackInfo.track} - ${trackInfo.artist}`
        : trackInfo.track;
      return {
        normalized: normalized,
        link: link,
        track: trackInfo.track,
        artist: trackInfo.artist
      };
    }

    // If we couldn't extract info, return the URL as-is with a note
    return {
      normalized: trimmed,
      link: link,
      track: null,
      artist: null
    };
  }

  // If it's just a song name (like "Freebird"), we can't determine the artist
  // Return it as-is, but suggest the user add the artist
  return {
    normalized: trimmed,
    link: null,
    track: trimmed,
    artist: null,
    needsArtist: true
  };
}

// Format song for display: "Track Name - Artist Name [Link]"
export function formatSongForDisplay(track, artist, link) {
  let formatted = '';
  
  if (track && artist) {
    formatted = `${track} - ${artist}`;
  } else if (track) {
    formatted = track;
  }
  
  if (link) {
    formatted += ` ${link}`;
  }
  
  return formatted;
}

// Clean up messy input (remove extra spaces, normalize separators)
export function cleanSongInput(input) {
  if (!input) return '';
  
  return input
    .trim()
    // Normalize different dash types to " - "
    .replace(/[–—]/g, ' - ')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Clean up multiple " - " separators
    .replace(/\s*-\s*-\s*/g, ' - ')
    .trim();
}

