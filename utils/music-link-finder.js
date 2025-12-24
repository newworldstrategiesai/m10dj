/**
 * Utility functions to find music service links via web scraping
 * No API keys required - uses public search pages
 */

/**
 * Find Spotify link by searching Spotify's web search
 */
export async function findSpotifyLink(songTitle, artist) {
  try {
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://open.spotify.com/search/${searchQuery}`;
    
    // Fetch the search page
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // Try to extract track URL from the page
    // Spotify embeds track URLs in various formats
    const trackPatterns = [
      /href="(https:\/\/open\.spotify\.com\/track\/[^"]+)"/i,
      /"uri":"spotify:track:([^"]+)"/i,
      /spotify\.com\/track\/([a-zA-Z0-9]+)/i
    ];

    for (const pattern of trackPatterns) {
      const match = html.match(pattern);
      if (match) {
        const trackId = match[1] || match[0];
        // If we got a full URL, return it
        if (trackId.startsWith('http')) {
          return trackId.split('"')[0].split("'")[0];
        }
        // Otherwise construct the URL
        return `https://open.spotify.com/track/${trackId}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding Spotify link:', error);
    return null;
  }
}

/**
 * Find YouTube link by searching YouTube
 */
export async function findYouTubeLink(songTitle, artist) {
  try {
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // YouTube embeds video IDs in ytInitialData JSON
    // Try to extract from JSON first
    const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const videos = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
        
        for (const item of videos) {
          const videoId = item?.videoRenderer?.videoId;
          if (videoId) {
            return `https://www.youtube.com/watch?v=${videoId}`;
          }
        }
      } catch (e) {
        // Fall through to regex method
      }
    }
    
    // Fallback: regex pattern for video IDs
    const videoIdPattern = /watch\?v=([a-zA-Z0-9_-]{11})/;
    const match = html.match(videoIdPattern);
    if (match && match[1]) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }

    return null;
  } catch (error) {
    console.error('Error finding YouTube link:', error);
    return null;
  }
}

/**
 * Find Tidal link by searching Tidal
 */
export async function findTidalLink(songTitle, artist) {
  try {
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://listen.tidal.com/search?q=${searchQuery}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // Tidal track URLs follow pattern: /track/{id}
    const trackPattern = /href="(\/track\/\d+)"|"\/track\/(\d+)"/i;
    const match = html.match(trackPattern);
    if (match) {
      const trackId = match[1]?.replace('/track/', '') || match[2];
      if (trackId) {
        return `https://tidal.com/track/${trackId}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding Tidal link:', error);
    return null;
  }
}

/**
 * Find all music service links for a song
 * Returns object with spotify, youtube, tidal URLs (or null if not found)
 */
export async function findMusicLinks(songTitle, artist, options = {}) {
  const { timeout = 10000, services = ['spotify', 'youtube', 'tidal'] } = options;
  
  if (!songTitle || !artist) {
    return {
      spotify: null,
      youtube: null,
      tidal: null,
      found_at: null,
      search_method: 'web_scrape'
    };
  }

  const results = {
    spotify: null,
    youtube: null,
    tidal: null,
    found_at: new Date().toISOString(),
    search_method: 'web_scrape'
  };

  // Search all services in parallel with timeout
  const searchPromises = [];

  if (services.includes('spotify')) {
    searchPromises.push(
      Promise.race([
        findSpotifyLink(songTitle, artist),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]).catch(() => null).then(url => { results.spotify = url; })
    );
  }

  if (services.includes('youtube')) {
    searchPromises.push(
      Promise.race([
        findYouTubeLink(songTitle, artist),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]).catch(() => null).then(url => { results.youtube = url; })
    );
  }

  if (services.includes('tidal')) {
    searchPromises.push(
      Promise.race([
        findTidalLink(songTitle, artist),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]).catch(() => null).then(url => { results.tidal = url; })
    );
  }

  await Promise.allSettled(searchPromises);

  // Only set found_at if at least one link was found
  if (!results.spotify && !results.youtube && !results.tidal) {
    results.found_at = null;
  }

  return results;
}

