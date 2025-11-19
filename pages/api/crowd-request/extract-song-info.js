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

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

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
    } catch (urlError) {
      return res.status(400).json({ error: 'Invalid URL format' });
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

    // Use YouTube oEmbed API (no API key required)
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oEmbedUrl);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const title = data.title || '';

    // Try to parse "Artist - Song" or "Song by Artist" format
    let artist = '';
    let songTitle = title;

    // Common patterns:
    // "Artist - Song Title"
    // "Song Title - Artist"
    // "Artist: Song Title"
    // "Song Title by Artist"
    
    const dashMatch = title.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (dashMatch) {
      // Usually "Artist - Song"
      artist = dashMatch[1].trim();
      songTitle = dashMatch[2].trim();
    } else {
      const colonMatch = title.match(/^(.+?):\s*(.+)$/);
      if (colonMatch) {
        artist = colonMatch[1].trim();
        songTitle = colonMatch[2].trim();
      } else {
        const byMatch = title.match(/^(.+?)\s+by\s+(.+)$/i);
        if (byMatch) {
          songTitle = byMatch[1].trim();
          artist = byMatch[2].trim();
        }
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

    // Use Spotify oEmbed API
    const oEmbedUrl = `https://embed.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oEmbedUrl);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const title = data.title || '';

    // Spotify oEmbed usually returns "Song Title" in title
    // Artist info might be in HTML description, but we can try to parse title
    // Format is often "Song Title" and artist is in the iframe HTML
    
    // Try to get more info from the HTML if available
    let artist = '';
    if (data.html) {
      // Extract from iframe title or other metadata
      const artistMatch = data.html.match(/title="([^"]+)"/);
      if (artistMatch) {
        const fullTitle = artistMatch[1];
        const byMatch = fullTitle.match(/(.+?)\s+by\s+(.+)/i);
        if (byMatch) {
          artist = byMatch[2].trim();
        }
      }
    }

    // If we have the HTML, try to extract from description
    if (!artist && data.description) {
      const descMatch = data.description.match(/by\s+([^,]+)/i);
      if (descMatch) {
        artist = descMatch[1].trim();
      }
    }

    return {
      title: title,
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
    // Use SoundCloud oEmbed API
    const oEmbedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oEmbedUrl);
    
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
    return null;
  }
}

// Extract Tidal track information
async function extractTidalInfo(url) {
  try {
    // Tidal doesn't have a public oEmbed API, so we'll try to extract from URL
    // Format: https://tidal.com/track/TRACK_ID or https://listen.tidal.com/track/TRACK_ID
    
    // For Tidal, we can try to fetch the page and parse metadata
    // But this is more complex and might be blocked by CORS
    // For now, return a basic response indicating we need manual input
    
    // Try to extract track ID
    const trackMatch = url.match(/\/track\/(\d+)/);
    if (!trackMatch) {
      return null;
    }

    // Since Tidal doesn't have oEmbed, we'll return a message
    // In a production app, you might want to use a scraping service or Tidal API
    return {
      title: '',
      artist: '',
      source: 'tidal',
      url: url,
      note: 'Tidal links require manual entry. Please enter the song title and artist name.'
    };
  } catch (error) {
    console.error('Tidal extraction error:', error);
    return null;
  }
}

