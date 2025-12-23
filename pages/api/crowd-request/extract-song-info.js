// Helper function to clean up artist names by removing service suffixes
function cleanArtistName(artist) {
  if (!artist || typeof artist !== 'string') return artist;
  
  // Remove common service suffixes that might be included
  let cleaned = artist
    .replace(/\s*\|\s*Spotify\s*$/i, '') // Remove "| Spotify" suffix
    .replace(/\s*on\s+Spotify\s*$/i, '') // Remove "on Spotify" suffix
    .replace(/\s*[-–—]\s*Spotify\s*$/i, '') // Remove "- Spotify" suffix
    .replace(/\s*·\s*Spotify\s*$/i, '') // Remove "· Spotify" suffix
    .trim();
  
  return cleaned;
}

// Helper function to format artist names (e.g., "djbenmurray" -> "DJ Ben Murray")
function formatArtistName(artist) {
  if (!artist || typeof artist !== 'string') return artist;
  
  // Clean up service suffixes first
  artist = cleanArtistName(artist);
  
  const trimmed = artist.trim();
  
  // If it's already properly formatted (has spaces or mixed case), return as-is
  if (trimmed.includes(' ') || /[A-Z]/.test(trimmed)) {
    return trimmed;
  }
  
  // If it's all lowercase with no spaces, try to format it
  // Handle "dj" prefix specially
  let formatted = trimmed;
  const lowerTrimmed = trimmed.toLowerCase();
  
  if (lowerTrimmed.startsWith('dj') && trimmed.length > 2) {
    // Split "dj" from the rest (case-insensitive)
    const rest = trimmed.substring(2);
    
    // Try to detect word boundaries in the rest
    // For "benmurray" -> "Ben Murray"
    // Common pattern: firstname (3-6 chars) + lastname (rest)
    // Try splitting at common name lengths
    let foundSplit = false;
    
    // Try splitting at various positions (3-6 chars for first name)
    for (let i = 3; i <= Math.min(6, rest.length - 2); i++) {
      const firstPart = rest.substring(0, i);
      const secondPart = rest.substring(i);
      
      // If both parts look reasonable (at least 2 chars each)
      if (firstPart.length >= 2 && secondPart.length >= 2) {
        formatted = 'DJ ' + 
                     firstPart.charAt(0).toUpperCase() + firstPart.slice(1) + ' ' +
                     secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
        foundSplit = true;
        break;
      }
    }
    
    // If no good split found, try common name patterns
    if (!foundSplit) {
      // Try splitting at 4 chars (common first name length)
      if (rest.length >= 6) {
        const firstPart = rest.substring(0, 4);
        const secondPart = rest.substring(4);
        formatted = 'DJ ' + 
                     firstPart.charAt(0).toUpperCase() + firstPart.slice(1) + ' ' +
                     secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
      } else {
        // Fallback: just capitalize first letter of rest
        formatted = 'DJ ' + rest.charAt(0).toUpperCase() + rest.slice(1);
      }
    }
  } else {
    // No "dj" prefix, try to split words
    // Try splitting at common name lengths (3-6 chars for first name)
    let foundSplit = false;
    
    for (let i = 3; i <= Math.min(6, trimmed.length - 2); i++) {
      const firstPart = trimmed.substring(0, i);
      const secondPart = trimmed.substring(i);
      
      if (firstPart.length >= 2 && secondPart.length >= 2) {
        formatted = firstPart.charAt(0).toUpperCase() + firstPart.slice(1) + ' ' +
                     secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
        foundSplit = true;
        break;
      }
    }
    
    // If no split found, just capitalize first letter
    if (!foundSplit) {
      formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }
  }
  
  return formatted;
}

// API endpoint to extract song information from music service URLs
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Parse the URL to determine the service
    let songInfo = null;

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (urlError) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    try {
      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        songInfo = await extractYouTubeInfo(url);
      }
      // Spotify
      else if (hostname.includes('spotify.com') || hostname.includes('open.spotify.com')) {
        songInfo = await extractSpotifyInfo(url);
      }
      // SoundCloud
      else if (hostname.includes('soundcloud.com')) {
        songInfo = await extractSoundCloudInfo(url);
      }
      // Tidal
      else if (hostname.includes('tidal.com')) {
        songInfo = await extractTidalInfo(url);
      }
      // Apple Music
      else if (hostname.includes('music.apple.com') || hostname.includes('itunes.apple.com')) {
        songInfo = await extractAppleMusicInfo(url);
      }
      else {
        return res.status(400).json({ 
          error: 'Unsupported service. Please use YouTube, Spotify, SoundCloud, Tidal, or Apple Music links.' 
        });
      }
    } catch (extractionError) {
      // Handle timeout and other extraction errors
      if (extractionError.message && extractionError.message.includes('timeout')) {
        return res.status(504).json({ 
          error: extractionError.message 
        });
      }
      throw extractionError;
    }

    if (!songInfo || (!songInfo.title && !songInfo.artist)) {
      return res.status(404).json({ 
        error: 'Could not extract song information from this URL. Please enter the song details manually.' 
      });
    }

    res.status(200).json(songInfo);

  } catch (error) {
    console.error('Error extracting song info:', error);
    res.status(500).json({ 
      error: 'Failed to extract song information',
      details: error.message 
    });
  }
}

// Extract YouTube video information
async function extractYouTubeInfo(url) {
  try {
    // Extract video ID from various YouTube URL formats
    let videoId = null;
    
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    // youtu.be/VIDEO_ID
    else {
      const shortMatch = url.match(/youtu\.be\/([^?]+)/);
      if (shortMatch) {
        videoId = shortMatch[1];
      }
    }

    if (!videoId) {
      return null;
    }

    // Use YouTube oEmbed API (no API key required) with timeout
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response;
    try {
      response = await fetch(oEmbedUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('YouTube oEmbed timeout');
        throw new Error('YouTube request timed out. Please try again or enter the song details manually.');
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const title = data.title || '';
    const authorName = data.author_name || ''; // Channel/uploader name
    const thumbnailUrl = data.thumbnail_url || ''; // YouTube thumbnail/album art

    // Try to parse "Artist - Song" or "Song by Artist" format
    let artist = '';
    let songTitle = title;

    // Common patterns (in order of likelihood):
    // "Song Title - Artist Name" (most common on YouTube)
    // "Artist Name - Song Title"
    // "Song Title by Artist Name"
    // "Artist Name: Song Title"
    
    // First try "Song Title by Artist Name" (most explicit)
    const byMatch = title.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) {
      songTitle = byMatch[1].trim();
      artist = byMatch[2].trim();
    } else {
      // Try dash-separated format - could be either direction
      const dashMatch = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
      if (dashMatch) {
        const part1 = dashMatch[1].trim();
        const part2 = dashMatch[2].trim();
        
        // Heuristic: if part2 is shorter or contains common artist indicators, it's likely the artist
        // Also check if part1 looks like a song title (longer, might have parentheses)
        if (part2.length < part1.length || part2.match(/\b(ft\.|feat\.|featuring|official|video|audio|lyrics)\b/i)) {
          // Likely "Song Title - Artist Name"
          songTitle = part1;
          artist = part2.replace(/\s*\(.*?\)\s*$/, '').trim(); // Remove trailing parenthetical info
        } else {
          // Likely "Artist Name - Song Title"
          artist = part1;
          songTitle = part2;
        }
      } else {
        // Try colon format "Artist: Song Title"
        const colonMatch = title.match(/^(.+?):\s*(.+)$/);
        if (colonMatch) {
          artist = colonMatch[1].trim();
          songTitle = colonMatch[2].trim();
        }
      }
    }
    
    // If we still don't have an artist, try using the channel/author name as fallback
    // This works well for music channels that upload specific artists' songs
    if (!artist && authorName) {
      // Only use author name if it doesn't look like a generic channel name
      const genericChannelPatterns = /(official|music|videos?|channel|hq|hd|lyrics?|remix|mix)/i;
      if (!genericChannelPatterns.test(authorName) && authorName.length < 50) {
        // Clean up common YouTube channel suffixes
        let cleanedAuthor = authorName
          .replace(/\s*-\s*Topic\s*$/i, '') // Remove "- Topic" suffix (auto-generated channels)
          .replace(/\s*-\s*VEVO\s*$/i, '') // Remove "- VEVO" suffix
          .replace(/\s*\(.*?\)\s*$/, '') // Remove trailing parenthetical info
          .trim();
        
        artist = cleanedAuthor;
      }
    }

    // Format artist name if it looks like a username
    if (artist) {
      artist = formatArtistName(artist);
    }

    return {
      title: songTitle || title,
      artist: artist || '',
      source: 'youtube',
      url: url,
      albumArt: thumbnailUrl || null
    };
  } catch (error) {
    console.error('YouTube extraction error:', error);
    // Re-throw timeout errors with a user-friendly message
    if (error.message && error.message.includes('timeout')) {
      throw error;
    }
    return null;
  }
}

// Extract Spotify track information
async function extractSpotifyInfo(url) {
  try {
    // Extract track ID from Spotify URL
    // Format: https://open.spotify.com/track/TRACK_ID
    const trackMatch = url.match(/\/track\/([^?]+)/);
    if (!trackMatch) {
      return null;
    }

    const trackId = trackMatch[1];

    // First try oEmbed API
    const oEmbedUrl = `https://embed.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let title = '';
    let artist = '';
    let albumArt = null;
    
    try {
      const response = await fetch(oEmbedUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        albumArt = data.thumbnail_url || null; // Spotify oEmbed thumbnail
        
        // oEmbed title format can be:
        // - "Song Title by Artist Name" (most common)
        // - "Song Title · Artist Name" (bullet separator)
        // - "Artist Name - Song Title" (dash format)
        // - "Song Title - Artist Name" (reverse dash)
        const oEmbedTitle = data.title || '';
        
        if (oEmbedTitle) {
          // Try "Song Title by Artist Name" format first (most common)
          const byMatch = oEmbedTitle.match(/^(.+?)\s+by\s+(.+)$/i);
          if (byMatch) {
            title = byMatch[1].trim();
            artist = byMatch[2]
              .replace(/\s*\|\s*Spotify.*$/i, '') // Remove "| Spotify" suffix
              .replace(/\s*on\s+Spotify.*$/i, '') // Remove "on Spotify" suffix
              .trim();
          } else {
            // Try "Song Title · Artist Name" format (bullet separator - Spotify's preferred)
            const dotMatch = oEmbedTitle.match(/^(.+?)\s*·\s*(.+)$/);
            if (dotMatch) {
              title = dotMatch[1].trim();
              artist = dotMatch[2]
                .replace(/\s*\|\s*Spotify.*$/i, '') // Remove "| Spotify" suffix
                .replace(/\s*on\s+Spotify.*$/i, '') // Remove "on Spotify" suffix
                .trim();
            } else {
              // Try dash format - need to determine which is artist vs song
              const dashMatch = oEmbedTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
              if (dashMatch) {
                const part1 = dashMatch[1].trim();
                const part2 = dashMatch[2].trim();
                
                // Heuristic: If part2 contains common song title indicators or is longer, it's likely the song
                // If part1 is shorter and doesn't have common indicators, it's likely the artist
                // Common patterns: "Artist - Song Title" is more common than "Song - Artist"
                // But also check for song indicators like parentheses, "feat", etc.
                const hasSongIndicators = /\s*\(.*?\)\s*$|feat\.|ft\.|featuring|official|video|audio|lyrics|remix/i;
                
                if (part2.match(hasSongIndicators) || part2.length > part1.length * 1.2) {
                  // Likely "Song Title - Artist Name"
                  title = part1;
                  artist = part2.replace(hasSongIndicators, '').trim();
                } else {
                  // Likely "Artist Name - Song Title"
                  artist = part1;
                  title = part2;
                }
              } else {
                // If no separator found, use the whole title as song title
                title = oEmbedTitle;
              }
            }
          }
        }
        
        // Try to extract from iframe title in HTML as fallback
        if ((!title || !artist) && data.html) {
          const artistMatch = data.html.match(/title="([^"]+)"/);
          if (artistMatch) {
            const fullTitle = artistMatch[1];
            // Format is often "Song Title by Artist Name"
            const htmlByMatch = fullTitle.match(/(.+?)\s+by\s+(.+)/i);
            if (htmlByMatch) {
              if (!title) title = htmlByMatch[1].trim();
              if (!artist) artist = htmlByMatch[2].trim();
            }
          }
        }
        
        // Try description if we still don't have artist
        if (!artist && data.description) {
          const descMatch = data.description.match(/by\s+([^,\.]+)/i);
          if (descMatch) {
            artist = descMatch[1].trim();
          }
        }
      }
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        console.error('Spotify oEmbed timeout');
      } else {
        console.error('Spotify oEmbed error:', fetchError);
      }
    }
    
    // If we still don't have artist (even if we have title), try fetching the actual Spotify page
    if (!artist) {
      try {
        const pageUrl = `https://open.spotify.com/track/${trackId}`;
        const pageController = new AbortController();
        const pageTimeoutId = setTimeout(() => pageController.abort(), 10000);
        
        const pageResponse = await fetch(pageUrl, {
          signal: pageController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          }
        });
        clearTimeout(pageTimeoutId);
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          
          // Extract album art from og:image if not already found
          if (!albumArt) {
            const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
            if (ogImageMatch) {
              albumArt = ogImageMatch[1];
            }
          }
          
          // Extract from JSON-LD structured data
          const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/i);
          if (jsonLdMatch) {
            try {
              const jsonLd = JSON.parse(jsonLdMatch[1]);
              if (jsonLd.name) title = title || jsonLd.name;
              if (jsonLd.byArtist) {
                artist = jsonLd.byArtist.name || jsonLd.byArtist || artist;
              }
              if (jsonLd.album?.byArtist) {
                artist = jsonLd.album.byArtist.name || jsonLd.album.byArtist || artist;
              }
            } catch (e) {
              console.log('Could not parse Spotify JSON-LD:', e);
            }
          }
          
          // Extract from og:title meta tag - prioritize artist extraction
          if (!artist) {
            const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
            if (ogTitleMatch) {
              const ogTitle = ogTitleMatch[1];
              // Format is often "Song Title · Artist Name" (bullet separator)
              const parts = ogTitle.split(/\s*·\s*/);
              if (parts.length === 2) {
                if (!title) title = parts[0].trim();
                if (!artist) {
                  artist = parts[1]
                    .replace(/\s*\|\s*Spotify.*$/i, '') // Remove "| Spotify" suffix
                    .replace(/\s*on\s+Spotify.*$/i, '') // Remove "on Spotify" suffix
                    .trim();
                }
              } else {
                // Try "Song Title by Artist Name"
                const byMatch = ogTitle.match(/(.+?)\s+by\s+(.+)/i);
                if (byMatch) {
                  if (!title) title = byMatch[1].trim();
                  if (!artist) artist = byMatch[2].trim();
                } else {
                  // Try dash format
                  const dashMatch = ogTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
                  if (dashMatch) {
                    // Usually "Song Title · Artist" format, so first part is song, second is artist
                    if (!title) title = dashMatch[1].trim();
                    if (!artist) artist = dashMatch[2].trim();
                  } else {
                    if (!title) title = ogTitle;
                  }
                }
              }
            }
          }
          
          // Extract from title tag as fallback - prioritize artist extraction
          if (!artist) {
            const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
            if (titleTagMatch) {
              const titleTag = titleTagMatch[1];
              // Spotify title format: "Song Title by Artist Name on Spotify"
              const byMatch = titleTag.match(/(.+?)\s+by\s+(.+?)\s+on\s+Spotify/i);
              if (byMatch) {
                if (!title) title = byMatch[1].trim();
                if (!artist) artist = byMatch[2].trim();
              } else {
                // Try parsing without "on Spotify" - but also check for "| Spotify" format
                const byMatch2 = titleTag.match(/(.+?)\s+by\s+(.+)/i);
                if (byMatch2) {
                  if (!title) title = byMatch2[1].trim();
                  if (!artist) {
                    artist = byMatch2[2]
                      .replace(/\s*\|\s*Spotify.*$/i, '') // Remove "| Spotify" suffix
                      .replace(/\s*on\s+Spotify.*$/i, '') // Remove "on Spotify" suffix
                      .trim();
                  }
                } else {
                  // Try bullet separator in title tag
                  const parts = titleTag.split(/\s*·\s*/);
                  if (parts.length === 2) {
                    if (!title) title = parts[0].trim();
                    if (!artist) {
                      artist = parts[1]
                        .replace(/\s*\|\s*Spotify.*$/i, '') // Remove "| Spotify" suffix
                        .replace(/\s*on\s+Spotify.*$/i, '') // Remove "on Spotify" suffix
                        .trim();
                    }
                  } else {
                    if (!title) title = titleTag.replace(/\s*[-–—]\s*Spotify.*$/i, '').trim();
                  }
                }
              }
            }
          }
          
          // Additional fallback: try to find artist in page content
          if (!artist) {
            // Look for common Spotify HTML patterns that contain artist info
            const artistPatterns = [
              /"artist":\s*"([^"]+)"/i,
              /"artistName":\s*"([^"]+)"/i,
              /<span[^>]*data-testid="entityTitle"[^>]*>([^<]+)<\/span>/i,
              /"byArtist":\s*\{\s*"name":\s*"([^"]+)"/i
            ];
            
            for (const pattern of artistPatterns) {
              const match = html.match(pattern);
              if (match && match[1]) {
                artist = match[1].trim();
                break;
              }
            }
          }
        }
      } catch (pageError) {
        if (pageError.name !== 'AbortError') {
          console.error('Spotify page fetch error:', pageError);
        }
      }
    }
    
    if (!title && !artist) {
      return null;
    }

    // Format artist name if it looks like a username
    if (artist) {
      artist = formatArtistName(artist);
    }


    return {
      title: title || '',
      artist: artist || '',
      source: 'spotify',
      url: url,
      albumArt: albumArt
    };
  } catch (error) {
    console.error('Spotify extraction error:', error);
    return null;
  }
}

// Extract SoundCloud track information
async function extractSoundCloudInfo(url) {
  try {
    // Use SoundCloud oEmbed API with timeout
    const oEmbedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for SoundCloud
    
    let response;
    try {
      response = await fetch(oEmbedUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('SoundCloud oEmbed timeout');
        throw new Error('SoundCloud request timed out. Please try again or enter the song details manually.');
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const title = data.title || '';
    const albumArt = data.thumbnail_url || null; // SoundCloud oEmbed thumbnail

    // SoundCloud format can be:
    // 1. "Song Title by Artist" (most common)
    // 2. "Artist - Song Title"
    // 3. Just "Song Title"
    let artist = '';
    let songTitle = title;

    // First, try "Song Title by Artist" format (most common on SoundCloud)
    const byMatch = title.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) {
      songTitle = byMatch[1].trim();
      artist = byMatch[2].trim();
    } else {
      // Try "Artist - Song Title" format
      const dashMatch = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
      if (dashMatch) {
        artist = dashMatch[1].trim();
        songTitle = dashMatch[2].trim();
      }
    }

    // Format artist name if it looks like a username (all lowercase, no spaces)
    if (artist) {
      artist = formatArtistName(artist);
    }

    return {
      title: songTitle || title,
      artist: artist || '',
      source: 'soundcloud',
      url: url,
      albumArt: albumArt
    };
  } catch (error) {
    console.error('SoundCloud extraction error:', error);
    // Re-throw timeout errors with a user-friendly message
    if (error.message && error.message.includes('timeout')) {
      throw error;
    }
    return null;
  }
}

// Extract Tidal track information
async function extractTidalInfo(url) {
  try {
    // Tidal URL formats:
    // https://tidal.com/track/TRACK_ID
    // https://listen.tidal.com/track/TRACK_ID
    // https://tidal.com/browse/track/TRACK_ID
    
    // Normalize URL to use listen.tidal.com
    let normalizedUrl = url;
    if (url.includes('tidal.com/track/')) {
      normalizedUrl = url.replace('tidal.com/track/', 'listen.tidal.com/track/');
    } else if (url.includes('tidal.com/browse/track/')) {
      normalizedUrl = url.replace('tidal.com/browse/track/', 'listen.tidal.com/track/');
    }
    
    // Ensure we have listen.tidal.com format
    if (!normalizedUrl.includes('listen.tidal.com')) {
      normalizedUrl = normalizedUrl.replace('tidal.com', 'listen.tidal.com');
    }

    // Fetch the Tidal page HTML with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response;
    try {
      response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Tidal page fetch timeout');
        throw new Error('Tidal request timed out. Please try again or enter the song details manually.');
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      console.error('Tidal page fetch failed:', response.status);
      return null;
    }

    const html = await response.text();
    
    // Extract album art from og:image
    let albumArt = null;
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      albumArt = ogImageMatch[1];
    }
    
    // Tidal stores track info in JSON-LD structured data or in meta tags
    // Look for JSON-LD script tag with track information
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.name && jsonLd.byArtist) {
          return {
            title: jsonLd.name,
            artist: jsonLd.byArtist.name || jsonLd.byArtist,
            source: 'tidal',
            url: url,
            albumArt: albumArt || jsonLd.image || null
          };
        }
      } catch (e) {
        console.log('Could not parse JSON-LD:', e);
      }
    }
    
    // Fallback: Parse meta tags (og:title, og:description, etc.)
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                       html.match(/<title>([^<]+)<\/title>/i);
    const descriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    
    if (titleMatch) {
      let title = titleMatch[1];
      let artist = '';
      
      // Tidal og:title format is "Artist Name - Song Title"
      // Also check <title> which might be "Song Title by Artist Name on TIDAL"
      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleTagMatch) {
        const titleTag = titleTagMatch[1];
        // Parse "Song Title by Artist Name on TIDAL" format
        const byMatch = titleTag.match(/^(.+?)\s+by\s+(.+?)\s+on\s+TIDAL$/i);
        if (byMatch) {
          title = byMatch[1].trim();
          artist = byMatch[2].trim();
        }
      }
      
      // If we didn't get artist from title tag, parse og:title
      if (!artist && title) {
        const titleParts = title.split(/\s*[-–—]\s*/);
        if (titleParts.length === 2) {
          // Tidal og:title format is "Artist Name - Song Title"
          artist = titleParts[0].trim();
          title = titleParts[1].trim();
        }
      }
      
      // Try to extract from description as fallback
      if (!artist && descriptionMatch) {
        const desc = descriptionMatch[1];
        const artistMatch = desc.match(/(?:by|from)\s+([^,\.]+)/i);
        if (artistMatch) {
          artist = artistMatch[1].trim();
        }
      }
      
      // Also try to extract from page content if meta tags don't work
      if (!artist) {
        const artistMatch = html.match(/<span[^>]*class="[^"]*artist[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                            html.match(/"artist":\s*"([^"]+)"/i) ||
                            html.match(/"artistName":\s*"([^"]+)"/i);
        if (artistMatch) {
          artist = artistMatch[1].trim();
        }
      }
      
      // Format artist name if it looks like a username
      if (artist) {
        artist = formatArtistName(artist);
      }
      
      return {
        title: title || '',
        artist: artist || '',
        source: 'tidal',
        url: url,
        albumArt: albumArt
      };
    }
    
    // If we can't extract, return null so user can enter manually
    return null;
  } catch (error) {
    console.error('Tidal extraction error:', error);
    // Re-throw timeout errors with a user-friendly message
    if (error.message && error.message.includes('timeout')) {
      throw error;
    }
    return null;
  }
}

// Extract Apple Music track information
async function extractAppleMusicInfo(url) {
  try {
    // Apple Music URL formats:
    // https://music.apple.com/us/album/song-name/123456789?i=987654321
    // https://music.apple.com/us/album/album-name/123456789
    // https://itunes.apple.com/us/album/song-name/id123456789?i=987654321
    
    // Normalize URL to use music.apple.com
    let normalizedUrl = url;
    if (url.includes('itunes.apple.com')) {
      normalizedUrl = url.replace('itunes.apple.com', 'music.apple.com');
    }
    
    // Extract track ID from URL if present
    const trackIdMatch = url.match(/[?&]i=(\d+)/);
    const albumIdMatch = url.match(/\/(\d+)(?:\?|$)/);
    
    // Fetch the Apple Music page HTML with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let response;
    try {
      response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Apple Music page fetch timeout');
        throw new Error('Apple Music request timed out. Please try again or enter the song details manually.');
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      console.error('Apple Music page fetch failed:', response.status);
      return null;
    }

    const html = await response.text();
    
    // Extract album art from og:image
    let albumArt = null;
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
      albumArt = ogImageMatch[1];
    }
    
    // Apple Music stores track info in JSON-LD structured data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        
        // Handle different JSON-LD structures
        if (Array.isArray(jsonLd)) {
          // Find the track/recording object
          const track = jsonLd.find(item => item['@type'] === 'MusicRecording' || item['@type'] === 'MusicComposition');
          if (track) {
            const title = track.name || '';
            const artist = track.byArtist?.name || track.artist?.name || '';
            
            if (title || artist) {
              return {
                title: title || '',
                artist: artist || '',
                source: 'apple_music',
                url: url,
                albumArt: albumArt || track.image || null
              };
            }
          }
        } else if (jsonLd['@type'] === 'MusicRecording' || jsonLd['@type'] === 'MusicComposition') {
          const title = jsonLd.name || '';
          const artist = jsonLd.byArtist?.name || jsonLd.artist?.name || '';
          
          if (title || artist) {
            return {
              title: title || '',
              artist: artist || '',
              source: 'apple_music',
              url: url,
              albumArt: albumArt || jsonLd.image || null
            };
          }
        }
      } catch (e) {
        console.log('Could not parse Apple Music JSON-LD:', e);
      }
    }
    
    // Fallback: Parse meta tags (og:title, og:description, etc.)
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const ogDescriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
    
    let title = '';
    let artist = '';
    
    if (ogTitleMatch) {
      const ogTitle = ogTitleMatch[1];
      // Apple Music og:title format is often "Song Title by Artist Name"
      const byMatch = ogTitle.match(/^(.+?)\s+by\s+(.+)$/i);
      if (byMatch) {
        title = byMatch[1].trim();
        artist = byMatch[2].trim();
      } else {
        // Try dash format "Artist - Song"
        const dashMatch = ogTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
        if (dashMatch) {
          artist = dashMatch[1].trim();
          title = dashMatch[2].trim();
        } else {
          title = ogTitle;
        }
      }
    }
    
    // Try title tag as fallback
    if ((!title || !artist) && titleTagMatch) {
      const titleTag = titleTagMatch[1];
      // Apple Music title format: "Song Title by Artist Name on Apple Music"
      const byMatch = titleTag.match(/^(.+?)\s+by\s+(.+?)\s+on\s+Apple\s+Music/i);
      if (byMatch) {
        if (!title) title = byMatch[1].trim();
        if (!artist) artist = byMatch[2].trim();
      } else {
        // Try without "on Apple Music"
        const byMatch2 = titleTag.match(/^(.+?)\s+by\s+(.+)/i);
        if (byMatch2) {
          if (!title) title = byMatch2[1].trim();
          if (!artist) artist = byMatch2[2].trim();
        } else if (!title) {
          title = titleTag.replace(/\s*[-–—]\s*Apple\s+Music.*$/i, '').trim();
        }
      }
    }
    
    // Try description as fallback for artist
    if (!artist && ogDescriptionMatch) {
      const desc = ogDescriptionMatch[1];
      const artistMatch = desc.match(/(?:by|from)\s+([^,\.]+)/i);
      if (artistMatch) {
        artist = artistMatch[1].trim();
      }
    }
    
    // Format artist name if it looks like a username
    if (artist) {
      artist = formatArtistName(artist);
    }
    
    if (!title && !artist) {
      return null;
    }

    return {
      title: title || '',
      artist: artist || '',
      source: 'apple_music',
      url: url,
      albumArt: albumArt
    };
  } catch (error) {
    console.error('Apple Music extraction error:', error);
    // Re-throw timeout errors with a user-friendly message
    if (error.message && error.message.includes('timeout')) {
      throw error;
    }
    return null;
  }
}

