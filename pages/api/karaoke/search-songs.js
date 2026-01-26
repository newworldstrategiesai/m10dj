import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

/**
 * Search iTunes API for songs
 */
async function searchITunes(query, limit = 10) {
  try {
    const searchTerm = query.trim();

    // Search iTunes API
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=${limit}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KaraokeApp/1.0)'
        }
      }
    );

    if (!response.ok) {
      console.error('iTunes API error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    // Transform iTunes results to match SongAutocomplete interface
    return data.results.map(song => ({
      id: `itunes-${song.trackId}`,
      title: song.trackName || song.trackCensoredName || 'Unknown Title',
      artist: song.artistName || 'Unknown Artist',
      albumArt: song.artworkUrl100 ? song.artworkUrl100.replace('100x100', '300x300') : null,
      source: 'itunes',
      popularity: Math.floor(song.trackViewUrl ? 50 : 30) // Estimate popularity
    }));

  } catch (error) {
    console.error('iTunes search error:', error);
    return [];
  }
}

/**
 * GET /api/karaoke/search-songs?q=query&organizationId=id
 * Search for karaoke songs in the database and iTunes
 */
export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res });
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q: query, organizationId, limit = '20' } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Query parameter required (minimum 2 characters)'
      });
    }

    const limitNum = Math.min(parseInt(limit) || 20, 50); // Max 50 results

    // Search karaoke songs by title or artist
    const { data, error } = await supabase
      .from('karaoke_song_videos')
      .select('*')
      .or(`song_title.ilike.%${query}%,song_artist.ilike.%${query}%`)
      .limit(Math.min(limitNum, 10)); // Limit database results to leave room for iTunes

    if (error) {
      console.error('Database search error:', error);
      // Continue with iTunes search even if database fails
    }

    // Transform database results to match SongAutocomplete interface
    const databaseSuggestions = (data || []).map(song => ({
      id: song.id,
      title: song.song_title,
      artist: song.song_artist || 'Unknown Artist',
      albumArt: song.album_art_url || null,
      source: 'database',
      popularity: song.popularity_score || 0
    }));

    // If we have enough database results, return them
    if (databaseSuggestions.length >= limitNum) {
      return res.status(200).json({
        suggestions: databaseSuggestions.slice(0, limitNum),
        query: query.trim(),
        count: databaseSuggestions.length
      });
    }

    // Search iTunes as fallback/supplement
    const iTunesLimit = Math.max(1, limitNum - databaseSuggestions.length);
    const iTunesSuggestions = await searchITunes(query, iTunesLimit);

    // Combine results: database first, then iTunes
    const allSuggestions = [
      ...databaseSuggestions,
      ...iTunesSuggestions
    ];

    // Remove duplicates based on title and artist similarity
    const uniqueSuggestions = [];
    const seen = new Set();

    for (const suggestion of allSuggestions) {
      const key = `${suggestion.title.toLowerCase()}-${suggestion.artist.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSuggestions.push(suggestion);
      }
    }

    // Sort by popularity and source (database first)
    const sortedSuggestions = uniqueSuggestions.sort((a, b) => {
      // Database results first
      if (a.source === 'database' && b.source !== 'database') return -1;
      if (b.source === 'database' && a.source !== 'database') return 1;

      // Then by popularity
      return (b.popularity || 0) - (a.popularity || 0);
    });

    res.status(200).json({
      suggestions: sortedSuggestions.slice(0, limitNum),
      query: query.trim(),
      count: sortedSuggestions.length
    });

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}