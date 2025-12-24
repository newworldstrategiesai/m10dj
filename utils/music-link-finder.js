/**
 * Utility functions to find music service links via web scraping
 * Uses both simple fetch (for YouTube) and headless browser (for JS-heavy sites)
 * No API keys required - uses public search pages
 */

// Import headless browser search functions
let headlessBrowserSearch = null;
async function getHeadlessBrowserSearch() {
  if (headlessBrowserSearch) {
    return headlessBrowserSearch;
  }
  try {
    headlessBrowserSearch = await import('./headless-browser-search');
    return headlessBrowserSearch;
  } catch (error) {
    console.warn('Headless browser search not available:', error.message);
    return null;
  }
}

/**
 * Extract song title and artist from a YouTube URL
 * Returns { songTitle, artist } or null if extraction fails
 */
export async function extractSongInfoFromYouTubeUrl(youtubeUrl) {
  try {
    if (!youtubeUrl || (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be'))) {
      return null;
    }

    // Extract video ID from URL
    let videoId = null;
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = youtubeUrl.match(youtubeRegex);
    if (match && match[1]) {
      videoId = match[1];
    } else {
      return null;
    }

    // Fetch the YouTube page to extract title
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
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
    
    // Try to extract title from meta tags
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                        html.match(/<title>([^<]+)<\/title>/i);
    
    if (titleMatch && titleMatch[1]) {
      const fullTitle = titleMatch[1].replace(/\s*-\s*YouTube\s*$/i, '').trim();
      
      // Try to parse "Song Title - Artist" format
      const titleParts = fullTitle.split(/\s*-\s*/);
      if (titleParts.length >= 2) {
        return {
          songTitle: titleParts[0].trim(),
          artist: titleParts.slice(1).join(' - ').trim()
        };
      } else {
        // If no dash, assume entire title is song title
        return {
          songTitle: fullTitle,
          artist: null
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting song info from YouTube URL:', error);
    return null;
  }
}

/**
 * Find Spotify link by searching Spotify's web search
 */
export async function findSpotifyLink(songTitle, artist) {
  try {
    // First try simple fetch (faster, works if Spotify has server-rendered content)
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://open.spotify.com/search/${searchQuery}`;
    
    console.log(`Searching Spotify for: "${songTitle}" by "${artist}"`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://open.spotify.com/',
        'Origin': 'https://open.spotify.com'
      }
    });

    let foundLink = null;
    
    if (response.ok) {
      const html = await response.text();
      console.log(`Spotify: Fetched HTML (${html.length} chars), searching for links...`);
      
      // Try multiple extraction methods
      // Method 1: Look for embedded JSON data
      const jsonMatch = html.match(/<script[^>]*id="initial-state"[^>]*>(.*?)<\/script>/i);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          const tracks = data?.entities?.tracks || data?.tracks?.items || [];
          if (tracks.length > 0) {
            const trackId = tracks[0].id || tracks[0].uri?.split(':')[2];
            if (trackId) {
              foundLink = `https://open.spotify.com/track/${trackId}`;
              console.log('✅ Spotify link found via JSON:', foundLink);
              return foundLink;
            }
          }
        } catch (e) {
          console.log('Spotify: Could not parse JSON data');
        }
      }
      
      // Method 2: Look for track URLs in href attributes
      const trackPatterns = [
        /href="(https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]{22})"/i,
        /"uri":"spotify:track:([a-zA-Z0-9]{22})"/i,
        /spotify\.com\/track\/([a-zA-Z0-9]{22})/i,
        /\/track\/([a-zA-Z0-9]{22})/i
      ];

      for (const pattern of trackPatterns) {
        const match = html.match(pattern);
        if (match) {
          const trackId = match[1];
          if (trackId && trackId.length === 22) {
            foundLink = `https://open.spotify.com/track/${trackId}`;
            console.log('✅ Spotify link found via pattern:', foundLink);
            return foundLink;
          }
        }
      }
      
      console.log('Spotify: No links found in HTML, trying headless browser...');
    } else {
      console.log(`Spotify: Fetch failed (${response.status}), trying headless browser...`);
    }

    // If simple fetch didn't find links, try headless browser (for JS-rendered content)
    console.log('Spotify: Attempting headless browser search...');
    const browserSearch = await getHeadlessBrowserSearch();
    if (browserSearch) {
      console.log('Spotify: ✅ Headless browser module loaded');
      try {
        const result = await browserSearch.searchSpotifyWithBrowser(songTitle, artist);
        if (result) {
          console.log('Spotify: ✅ Headless browser found link:', result);
          return result;
        } else {
          console.log('Spotify: ❌ Headless browser found no link');
        }
      } catch (browserError) {
        console.error('Spotify: ❌ Headless browser search error:', browserError.message);
        console.error('Spotify: Error stack:', browserError.stack);
      }
    } else {
      console.warn('Spotify: ⚠️ Headless browser module not available');
    }

    console.log('❌ No Spotify link found');
    return null;
  } catch (error) {
    console.error('Error finding Spotify link:', error.message);
    return null;
  }
}

/**
 * Validate if a YouTube video title matches the song search criteria
 * Returns a match score (0-1) where 1 is perfect match
 */
function validateYouTubeVideoMatch(videoTitle, videoDescription, songTitle, artist) {
  if (!videoTitle) return 0;
  
  const titleLower = videoTitle.toLowerCase();
  const descLower = (videoDescription || '').toLowerCase();
  const songLower = songTitle.toLowerCase();
  const artistLower = (artist || '').toLowerCase();
  
  let score = 0;
  let maxScore = 0;
  
  // Check if song title appears in video title (weight: 0.5)
  maxScore += 0.5;
  if (titleLower.includes(songLower)) {
    score += 0.5;
  } else {
    // Partial match - check if key words from song title appear
    const songWords = songLower.split(/\s+/).filter(w => w.length > 2);
    const matchingWords = songWords.filter(word => titleLower.includes(word));
    if (matchingWords.length > 0) {
      score += (matchingWords.length / songWords.length) * 0.3; // Partial credit
    }
  }
  
  // Check if artist name appears in video title or description (weight: 0.3)
  if (artistLower) {
    maxScore += 0.3;
    // Exact artist match in title
    if (titleLower.includes(artistLower)) {
      score += 0.3;
    } else {
      // Check for similar artist names (handle common variations)
      const artistWords = artistLower.split(/\s+/);
      const matchingArtistWords = artistWords.filter(word => 
        word.length > 2 && (titleLower.includes(word) || descLower.includes(word))
      );
      if (matchingArtistWords.length === artistWords.length) {
        score += 0.2; // All words match
      } else if (matchingArtistWords.length > 0) {
        score += 0.1; // Partial match
      }
    }
  }
  
  // Penalty for common non-music keywords (weight: -0.2)
  const nonMusicKeywords = ['choreography', 'dance', 'tutorial', 'cover dance', 'tap dance', 'dance tutorial'];
  const hasNonMusicKeyword = nonMusicKeywords.some(keyword => 
    titleLower.includes(keyword) || descLower.includes(keyword)
  );
  if (hasNonMusicKeyword && !titleLower.includes('remix') && !titleLower.includes('song')) {
    score -= 0.2;
  }
  
  // Bonus for music-related keywords (weight: +0.2)
  const musicKeywords = ['remix', 'official', 'music', 'song', 'audio', 'lyrics'];
  const hasMusicKeyword = musicKeywords.some(keyword => 
    titleLower.includes(keyword) || descLower.includes(keyword)
  );
  if (hasMusicKeyword) {
    score += 0.2;
  }
  
  // Normalize score to 0-1 range
  const normalizedScore = Math.max(0, Math.min(1, score / Math.max(maxScore, 1)));
  
  return normalizedScore;
}

/**
 * Find YouTube link by searching YouTube with validation
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
    // Try to extract from JSON first with validation
    const jsonMatch = html.match(/var ytInitialData = ({.+?});/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const videos = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
        
        // Collect all videos with their metadata and match scores
        const videoCandidates = [];
        
        for (const item of videos) {
          const videoRenderer = item?.videoRenderer;
          if (!videoRenderer?.videoId) continue;
          
          const videoId = videoRenderer.videoId;
          const videoTitle = videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || '';
          const videoDescription = videoRenderer.descriptionSnippet?.runs?.map(r => r.text).join(' ') || '';
          
          // Calculate match score
          const matchScore = validateYouTubeVideoMatch(videoTitle, videoDescription, songTitle, artist);
          
          videoCandidates.push({
            videoId,
            videoTitle,
            matchScore,
            url: `https://www.youtube.com/watch?v=${videoId}`
          });
        }
        
        // Sort by match score (highest first) and return best match if score is above threshold
        videoCandidates.sort((a, b) => b.matchScore - a.matchScore);
        
        // Only return if match score is above 0.4 (40% confidence)
        // This prevents false positives like "Ben Murphy" matching "Ben Murray"
        const bestMatch = videoCandidates[0];
        if (bestMatch && bestMatch.matchScore >= 0.4) {
          console.log(`YouTube match found: "${bestMatch.videoTitle}" (score: ${bestMatch.matchScore.toFixed(2)})`);
          return bestMatch.url;
        } else if (bestMatch) {
          console.log(`YouTube match rejected: "${bestMatch.videoTitle}" (score: ${bestMatch.matchScore.toFixed(2)} below threshold)`);
        }
      } catch (e) {
        console.error('Error parsing YouTube JSON data:', e);
        // Fall through to regex method
      }
    }
    
    // Fallback: regex pattern for video IDs (less reliable, no validation)
    // Only use as last resort
    const videoIdPattern = /watch\?v=([a-zA-Z0-9_-]{11})/;
    const match = html.match(videoIdPattern);
    if (match && match[1]) {
      console.warn('Using fallback YouTube link extraction (no validation)');
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
    // First try simple fetch
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://listen.tidal.com/search?q=${searchQuery}`;
    
    console.log(`Searching Tidal for: "${songTitle}" by "${artist}"`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://listen.tidal.com/',
        'Origin': 'https://listen.tidal.com'
      }
    });

    let foundLink = null;
    
    if (response.ok) {
      const html = await response.text();
      console.log(`Tidal: Fetched HTML (${html.length} chars), searching for links...`);
      
      // Tidal uses various patterns for track URLs
      const trackPatterns = [
        /href="(https:\/\/listen\.tidal\.com\/track\/\d+)"/i,
        /href="(\/track\/\d+)"/i,
        /"\/track\/(\d+)"/i,
        /tidal\.com\/track\/(\d+)/i,
        /data-track-id="(\d+)"/i
      ];

      for (const pattern of trackPatterns) {
        const match = html.match(pattern);
        if (match) {
          const trackId = match[1]?.replace('/track/', '') || match[1];
          if (trackId && /^\d+$/.test(trackId)) {
            foundLink = `https://listen.tidal.com/track/${trackId}`;
            console.log('✅ Tidal link found:', foundLink);
            return foundLink;
          }
        }
      }
      
      console.log('Tidal: No links found in HTML, trying headless browser...');
    } else {
      console.log(`Tidal: Fetch failed (${response.status}), trying headless browser...`);
    }

    // If simple fetch didn't work, try headless browser
    console.log('Tidal: Attempting headless browser search...');
    const browserSearch = await getHeadlessBrowserSearch();
    if (browserSearch) {
      console.log('Tidal: ✅ Headless browser module loaded');
      try {
        const result = await browserSearch.searchTidalWithBrowser(songTitle, artist);
        if (result) {
          console.log('Tidal: ✅ Headless browser found link:', result);
          return result;
        } else {
          console.log('Tidal: ❌ Headless browser found no link');
        }
      } catch (browserError) {
        console.error('Tidal: ❌ Headless browser search error:', browserError.message);
        console.error('Tidal: Error stack:', browserError.stack);
      }
    } else {
      console.warn('Tidal: ⚠️ Headless browser module not available');
    }

    console.log('❌ No Tidal link found');
    return null;
  } catch (error) {
    console.error('Error finding Tidal link:', error.message);
    return null;
  }
}

/**
 * Find Apple Music link by searching Apple Music
 */
export async function findAppleMusicLink(songTitle, artist) {
  try {
    // First try simple fetch
    const searchQuery = encodeURIComponent(`${songTitle} ${artist}`);
    const searchUrl = `https://music.apple.com/us/search?term=${searchQuery}`;
    
    console.log(`Searching Apple Music for: "${songTitle}" by "${artist}"`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://music.apple.com/',
        'Origin': 'https://music.apple.com'
      }
    });

    let foundLink = null;
    
    if (response.ok) {
      const html = await response.text();
      console.log(`Apple Music: Fetched HTML (${html.length} chars), searching for links...`);
      
      // Apple Music uses various patterns for song URLs
      const songPatterns = [
        /href="(https:\/\/music\.apple\.com\/[^"]*\/song\/[^"]+)"/i,
        /href="(\/us\/song\/[^"]+)"/i,
        /href="(\/[^"]*\/song\/[^"]+)"/i,
        /music\.apple\.com\/[^"]*\/song\/([^"\/\?]+)/i,
        /data-url="([^"]*\/song\/[^"]+)"/i
      ];

      for (const pattern of songPatterns) {
        const match = html.match(pattern);
        if (match) {
          let url = match[1];
          url = url.replace(/^["']|["']$/g, '');
          if (url.startsWith('/')) {
            url = `https://music.apple.com${url}`;
          }
          if (!url.startsWith('http')) {
            const songIdMatch = url.match(/song\/([^\/\?]+)/);
            if (songIdMatch) {
              url = `https://music.apple.com/us/song/${songIdMatch[1]}`;
            } else {
              continue;
            }
          }
          if (url.includes('music.apple.com') && url.includes('/song/')) {
            foundLink = url;
            console.log('✅ Apple Music link found:', foundLink);
            return foundLink;
          }
        }
      }
      
      console.log('Apple Music: No links found in HTML, trying headless browser...');
    } else {
      console.log(`Apple Music: Fetch failed (${response.status}), trying headless browser...`);
    }

    // If simple fetch didn't work, try headless browser
    console.log('Apple Music: Attempting headless browser search...');
    const browserSearch = await getHeadlessBrowserSearch();
    if (browserSearch) {
      console.log('Apple Music: ✅ Headless browser module loaded');
      try {
        const result = await browserSearch.searchAppleMusicWithBrowser(songTitle, artist);
        if (result) {
          console.log('Apple Music: ✅ Headless browser found link:', result);
          return result;
        } else {
          console.log('Apple Music: ❌ Headless browser found no link');
        }
      } catch (browserError) {
        console.error('Apple Music: ❌ Headless browser search error:', browserError.message);
        console.error('Apple Music: Error stack:', browserError.stack);
      }
    } else {
      console.warn('Apple Music: ⚠️ Headless browser module not available');
    }

    console.log('❌ No Apple Music link found');
    return null;
  } catch (error) {
    console.error('Error finding Apple Music link:', error.message);
    return null;
  }
}

/**
 * Find all music service links for a song
 * Returns object with spotify, youtube, tidal, apple_music URLs (or null if not found)
 * Can also accept a YouTube URL and extract song info from it, then find other services
 */
export async function findMusicLinks(songTitle, artist, options = {}) {
  const { timeout = 10000, services = ['spotify', 'youtube', 'tidal', 'apple_music'], youtubeUrl = null } = options;
  
  // If a YouTube URL is provided, try to extract song info from it first
  let extractedSongTitle = songTitle;
  let extractedArtist = artist;
  
  if (youtubeUrl && (!songTitle || !artist)) {
    console.log('Extracting song info from YouTube URL:', youtubeUrl);
    const extracted = await extractSongInfoFromYouTubeUrl(youtubeUrl);
    if (extracted) {
      extractedSongTitle = extracted.songTitle || songTitle;
      extractedArtist = extracted.artist || artist;
      console.log('Extracted:', { songTitle: extractedSongTitle, artist: extractedArtist });
    }
  }
  
  // If we still don't have both title and artist, we can't search effectively
  // But still try to search with what we have (some services might work with just title)
  if (!extractedSongTitle) {
    console.warn('No song title available for search');
    return {
      spotify: null,
      youtube: youtubeUrl || null,
      tidal: null,
      apple_music: null,
      found_at: null,
      search_method: 'web_scrape'
    };
  }

  const results = {
    spotify: null,
    youtube: youtubeUrl || null, // Use provided YouTube URL if available
    tidal: null,
    apple_music: null,
    found_at: new Date().toISOString(),
    search_method: 'web_scrape'
  };

  console.log(`Searching for: "${extractedSongTitle}" by "${extractedArtist || 'Unknown'}"`);
  console.log('Services to search:', services);

  // Search all services in parallel with timeout
  const searchPromises = [];

  if (services.includes('spotify')) {
    searchPromises.push(
      Promise.race([
        findSpotifyLink(extractedSongTitle, extractedArtist).then(url => {
          console.log('Spotify result:', url ? 'Found' : 'Not found');
          return url;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]).catch((err) => {
        console.error('Spotify search error:', err.message);
        return null;
      }).then(url => { 
        results.spotify = url;
        if (url) console.log('✅ Spotify link found:', url);
      })
    );
  }

  // Only search YouTube if we don't already have a URL
  if (services.includes('youtube') && !results.youtube) {
    searchPromises.push(
      Promise.race([
        findYouTubeLink(extractedSongTitle, extractedArtist).then(url => {
          console.log('YouTube result:', url ? 'Found' : 'Not found');
          return url;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]).catch((err) => {
        console.error('YouTube search error:', err.message);
        return null;
      }).then(url => { 
        results.youtube = url;
        if (url) console.log('✅ YouTube link found:', url);
      })
    );
  } else if (results.youtube) {
    console.log('✅ YouTube link already provided:', results.youtube);
  }

  if (services.includes('tidal')) {
    searchPromises.push(
      Promise.race([
        findTidalLink(extractedSongTitle, extractedArtist).then(url => {
          console.log('Tidal result:', url ? 'Found' : 'Not found');
          return url;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]).catch((err) => {
        console.error('Tidal search error:', err.message);
        return null;
      }).then(url => { 
        results.tidal = url;
        if (url) console.log('✅ Tidal link found:', url);
      })
    );
  }

  if (services.includes('apple_music')) {
    searchPromises.push(
      Promise.race([
        findAppleMusicLink(extractedSongTitle, extractedArtist).then(url => {
          console.log('Apple Music result:', url ? 'Found' : 'Not found');
          return url;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]).catch((err) => {
        console.error('Apple Music search error:', err.message);
        return null;
      }).then(url => { 
        results.apple_music = url;
        if (url) console.log('✅ Apple Music link found:', url);
      })
    );
  }

  console.log(`Waiting for ${searchPromises.length} search promises to complete...`);
  await Promise.allSettled(searchPromises);

  // Log final results
  const foundCount = [results.spotify, results.youtube, results.tidal, results.apple_music].filter(Boolean).length;
  console.log(`Search complete. Found ${foundCount} link(s):`, {
    spotify: !!results.spotify,
    youtube: !!results.youtube,
    tidal: !!results.tidal,
    apple_music: !!results.apple_music
  });

  // Only set found_at if at least one link was found
  if (!results.spotify && !results.youtube && !results.tidal && !results.apple_music) {
    results.found_at = null;
  }

  return results;
}

