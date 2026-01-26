// API endpoint to search for songs from our database and return autocomplete suggestions
// Falls back to iTunes API if database results are insufficient
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
          'User-Agent': 'Mozilla/5.0 (compatible; SongSearch/1.0)'
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

    // Transform iTunes results to match autocomplete interface
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, organizationId, limit = 10 } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const limitNum = Math.min(parseInt(limit) || 10, 50); // Max 50 results
    const searchQuery = query.trim().toLowerCase();
    const databaseSuggestions = [];

    // Search database if Supabase is configured
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Search for songs in crowd_requests table
        // Match against both song_title and song_artist
        // Group by song_title and song_artist to get unique combinations
        // Order by count (most requested) and recency
        let queryBuilder = supabase
          .from('crowd_requests')
          .select('song_title, song_artist, created_at')
          .not('song_title', 'is', null)
          .not('song_artist', 'is', null)
          .or(`song_title.ilike.%${searchQuery}%,song_artist.ilike.%${searchQuery}%`)
          .limit(50); // Get more results to group and deduplicate

        // Filter by organization if provided
        if (organizationId) {
          queryBuilder = queryBuilder.eq('organization_id', organizationId);
        }

        const { data, error } = await queryBuilder;

        if (!error && data && data.length > 0) {
          // Group by song_title + song_artist combination
          // Count occurrences and get most recent
          const songMap = new Map();
          
          data.forEach(row => {
            const key = `${row.song_title?.toLowerCase().trim()}|${row.song_artist?.toLowerCase().trim()}`;
            if (!songMap.has(key)) {
              songMap.set(key, {
                title: row.song_title?.trim() || '',
                artist: row.song_artist?.trim() || '',
                count: 0,
                mostRecent: row.created_at
              });
            }
            const entry = songMap.get(key);
            entry.count++;
            // Keep the most recent date
            if (new Date(row.created_at) > new Date(entry.mostRecent)) {
              entry.mostRecent = row.created_at;
            }
          });

          // Convert to array and sort by:
          // 1. Count (most requested first)
          // 2. Recency (most recent first)
          const sorted = Array.from(songMap.values())
            .sort((a, b) => {
              // First sort by count (descending)
              if (b.count !== a.count) {
                return b.count - a.count;
              }
              // Then by recency (most recent first)
              return new Date(b.mostRecent) - new Date(a.mostRecent);
            })
            .slice(0, Math.min(limitNum, 10)) // Limit database results
            .map((song, index) => ({
              id: `db-${index}-${song.title}-${song.artist}`, // Generate unique ID
              title: song.title,
              artist: song.artist,
              albumArt: null, // We don't store album art in the database
              source: 'database',
              count: song.count // Include count for potential UI display
            }));

          databaseSuggestions.push(...sorted);
        }
      } catch (dbError) {
        console.error('Database search error:', dbError);
        // Continue with iTunes search even if database fails
      }
    }

    // If we have enough database results, return them
    if (databaseSuggestions.length >= limitNum) {
      return res.status(200).json({ 
        suggestions: databaseSuggestions.slice(0, limitNum) 
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

    // Sort by source (database first) and popularity
    const sortedSuggestions = uniqueSuggestions.sort((a, b) => {
      // Database results first
      if (a.source === 'database' && b.source !== 'database') return -1;
      if (b.source === 'database' && a.source !== 'database') return 1;

      // Then by popularity
      return (b.popularity || 0) - (a.popularity || 0);
    });

    res.status(200).json({ 
      suggestions: sortedSuggestions.slice(0, limitNum) 
    });

  } catch (error) {
    console.error('Error searching songs:', error);
    // Return empty results on error (graceful degradation)
    res.status(200).json({ suggestions: [] });
  }
}

