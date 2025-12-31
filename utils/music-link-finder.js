/**
 * Utility functions to find music service links via web scraping
 * Uses both simple fetch (for YouTube) and headless browser (for JS-heavy sites)
 * No API keys required - uses public search pages
 */

// Import song casing normalizer
import { normalizeSongCasing } from './song-casing-normalizer.js';

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
 * Returns { url, trackName, artistName } or null
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
    let trackName = null;
    let artistName = null;
    
    if (response.ok) {
      const html = await response.text();
      console.log(`Spotify: Fetched HTML (${html.length} chars), searching for links...`);
      
      // Check if page is mostly empty or just a loading screen (indicates JS-rendered content)
      const isLikelyJSRendered = html.length < 50000 || 
                                  html.includes('Loading...') || 
                                  html.includes('loading') ||
                                  !html.includes('spotify.com/track');
      
      if (isLikelyJSRendered) {
        console.log('Spotify: HTML appears to be JS-rendered (small size or loading indicators), trying headless browser...');
      } else {
        // Try multiple extraction methods
        // Method 1: Look for embedded JSON data (best for getting track name and artist)
        const jsonMatch = html.match(/<script[^>]*id="initial-state"[^>]*>(.*?)<\/script>/i);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            const tracks = data?.entities?.tracks || data?.tracks?.items || [];
            if (tracks.length > 0) {
              const track = tracks[0];
              const trackId = track.id || track.uri?.split(':')[2];
              if (trackId) {
                foundLink = `https://open.spotify.com/track/${trackId}`;
                // Extract track name and artist from track data
                trackName = track.name || track.title || null;
                artistName = track.artists?.[0]?.name || track.artist?.[0]?.name || null;
                console.log('✅ Spotify link found via JSON:', foundLink);
                console.log('✅ Spotify track data:', { trackName, artistName });
                return { url: foundLink, trackName, artistName };
              }
            }
          } catch (e) {
            console.log('Spotify: Could not parse JSON data:', e.message);
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
              // Try to extract track name and artist from HTML
              // Look for track name near the link
              const trackNameMatch = html.match(new RegExp(`"name":"([^"]+)"[^}]*"uri":"spotify:track:${trackId}`, 'i')) ||
                                    html.match(new RegExp(`spotify:track:${trackId}[^}]*"name":"([^"]+)"`, 'i'));
              if (trackNameMatch) {
                trackName = trackNameMatch[1];
              }
              // Look for artist name
              const artistMatch = html.match(new RegExp(`"artists":\\[\\{[^}]*"name":"([^"]+)"[^}]*\\}[^}]*spotify:track:${trackId}`, 'i')) ||
                                html.match(new RegExp(`spotify:track:${trackId}[^}]*"artists":\\[\\{[^}]*"name":"([^"]+)"`, 'i'));
              if (artistMatch) {
                artistName = artistMatch[1];
              }
              return { url: foundLink, trackName, artistName };
            }
          }
        }
        
        console.log('Spotify: No links found in HTML, trying headless browser...');
      }
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
          // If headless browser returns just a URL, return it with null track data
          // (we'll fall back to title case)
          return typeof result === 'string' ? { url: result, trackName: null, artistName: null } : result;
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
 * Returns { url, videoTitle } or null
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
          return {
            url: bestMatch.url,
            videoTitle: bestMatch.videoTitle
          };
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
      return {
        url: `https://www.youtube.com/watch?v=${match[1]}`,
        videoTitle: null // No title available in fallback
      };
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
    // Still normalize casing even if we can't search
    const normalized = normalizeSongCasing(songTitle, artist);
    return {
      spotify: null,
      youtube: youtubeUrl || null,
      tidal: null,
      apple_music: null,
      found_at: null,
      search_method: 'web_scrape',
      normalized_title: normalized.normalizedTitle,
      normalized_artist: normalized.normalizedArtist
    };
  }

  const results = {
    spotify: null,
    youtube: youtubeUrl || null, // Use provided YouTube URL if available
    tidal: null,
    apple_music: null,
    found_at: new Date().toISOString(),
    search_method: 'web_scrape',
    // Add fields for normalized casing
    normalized_title: null,
    normalized_artist: null
  };

  console.log(`Searching for: "${extractedSongTitle}" by "${extractedArtist || 'Unknown'}"`);
  console.log('Services to search:', services);

  // Track Spotify track data for casing extraction
  let spotifyTrackData = null;

  // Search all services in parallel with timeout
  // Note: Headless browser operations can take longer (15s navigation + 10s selector wait)
  // So we use a longer timeout for services that might use headless browsers
  const headlessBrowserTimeout = timeout * 3; // 30 seconds for headless browser operations
  const searchPromises = [];

  if (services.includes('spotify')) {
    searchPromises.push(
      Promise.race([
        findSpotifyLink(extractedSongTitle, extractedArtist).then(result => {
          if (result) {
            console.log('Spotify result: Found', result.url ? 'with link' : 'without link');
            return result;
          }
          console.log('Spotify result: Not found');
          return null;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), headlessBrowserTimeout))
      ]).catch((err) => {
        console.error('Spotify search error:', err.message);
        return null;
      }).then(result => { 
        if (result) {
          results.spotify = result.url;
          // Store track data for casing extraction
          if (result.trackName || result.artistName) {
            spotifyTrackData = {
              trackName: result.trackName,
              artistName: result.artistName
            };
            console.log('✅ Spotify track data for casing:', spotifyTrackData);
          }
          if (result.url) console.log('✅ Spotify link found:', result.url);
        }
      })
    );
  }

  // Only search YouTube if we don't already have a URL
  // Note: We don't use YouTube for casing extraction anymore - only Spotify
  if (services.includes('youtube') && !results.youtube) {
    searchPromises.push(
      Promise.race([
        findYouTubeLink(extractedSongTitle, extractedArtist).then(result => {
          console.log('YouTube result:', result ? 'Found' : 'Not found');
          return result?.url || result || null;
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
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), headlessBrowserTimeout))
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
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), headlessBrowserTimeout))
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

  // Extract normalized casing from Spotify track data if available
  // Spotify has the most accurate casing, so we prioritize it
  let apiTitle = null;
  let apiArtist = null;
  
  if (spotifyTrackData) {
    apiTitle = spotifyTrackData.trackName;
    apiArtist = spotifyTrackData.artistName;
    console.log('Using Spotify casing:', { apiTitle, apiArtist });
  }
  // Note: We no longer use YouTube for casing as it's less reliable

  // Normalize casing (uses Spotify API casing if available, otherwise title case)
  const normalized = normalizeSongCasing(extractedSongTitle, extractedArtist, {
    apiTitle,
    apiArtist
  });
  
  results.normalized_title = normalized.normalizedTitle;
  results.normalized_artist = normalized.normalizedArtist;
  
  console.log('Normalized casing:', {
    original: { title: extractedSongTitle, artist: extractedArtist },
    normalized: { title: results.normalized_title, artist: results.normalized_artist },
    source: spotifyTrackData ? 'Spotify' : 'Title Case (fallback)'
  });

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

