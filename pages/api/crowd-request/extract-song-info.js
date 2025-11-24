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
      else {
        return res.status(400).json({ 
          error: 'Unsupported service. Please use YouTube, Spotify, SoundCloud, or Tidal links.' 
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

    return {
      title: songTitle || title,
      artist: artist || '',
      source: 'youtube',
      url: url
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
    
    try {
      const response = await fetch(oEmbedUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // oEmbed title format can be:
        // - "Song Title by Artist Name"
        // - "Artist Name - Song Title"
        // - "Song Title · Artist Name"
        const oEmbedTitle = data.title || '';
        
        if (oEmbedTitle) {
          // Try "Song Title by Artist Name" format first (most common)
          const byMatch = oEmbedTitle.match(/^(.+?)\s+by\s+(.+)$/i);
          if (byMatch) {
            title = byMatch[1].trim();
            artist = byMatch[2].trim();
          } else {
            // Try "Artist Name - Song Title" format
            const dashMatch = oEmbedTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/);
            if (dashMatch) {
              // Usually "Artist - Song" but could be "Song - Artist", check both
              artist = dashMatch[1].trim();
              title = dashMatch[2].trim();
            } else {
              // Try "Song Title · Artist Name" format
              const dotMatch = oEmbedTitle.match(/^(.+?)\s*·\s*(.+)$/);
              if (dotMatch) {
                title = dotMatch[1].trim();
                artist = dotMatch[2].trim();
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
    
    // If we still don't have artist, try fetching the actual Spotify page
    if (!artist || !title) {
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
          
          // Extract from og:title meta tag
          if (!title || !artist) {
            const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
            if (ogTitleMatch) {
              const ogTitle = ogTitleMatch[1];
              // Format is often "Song Title · Artist Name"
              const parts = ogTitle.split(/\s*·\s*/);
              if (parts.length === 2) {
                title = title || parts[0].trim();
                artist = artist || parts[1].trim();
              } else {
                // Try "Song Title by Artist Name"
                const byMatch = ogTitle.match(/(.+?)\s+by\s+(.+)/i);
                if (byMatch) {
                  title = title || byMatch[1].trim();
                  artist = artist || byMatch[2].trim();
                } else {
                  title = title || ogTitle;
                }
              }
            }
          }
          
          // Extract from title tag as fallback
          if (!title || !artist) {
            const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
            if (titleTagMatch) {
              const titleTag = titleTagMatch[1];
              const byMatch = titleTag.match(/(.+?)\s+by\s+(.+?)\s+on\s+Spotify/i);
              if (byMatch) {
                title = title || byMatch[1].trim();
                artist = artist || byMatch[2].trim();
              } else {
                title = title || titleTag.replace(/\s*[-–—]\s*Spotify.*$/i, '').trim();
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

    return {
      title: title || '',
      artist: artist || '',
      source: 'spotify',
      url: url
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

    // SoundCloud format is usually "Artist - Song Title"
    let artist = '';
    let songTitle = title;

    const dashMatch = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dashMatch) {
      artist = dashMatch[1].trim();
      songTitle = dashMatch[2].trim();
    }

    return {
      title: songTitle || title,
      artist: artist || '',
      source: 'soundcloud',
      url: url
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
            url: url
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
      
      return {
        title: title || '',
        artist: artist || '',
        source: 'tidal',
        url: url
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

