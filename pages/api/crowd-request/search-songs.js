// API endpoint to search for songs from our database and return autocomplete suggestions
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, organizationId } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return res.status(200).json({ suggestions: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const searchQuery = query.trim().toLowerCase();

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

    if (error) {
      console.error('Database search error:', error);
      return res.status(200).json({ suggestions: [] });
    }

    if (!data || data.length === 0) {
      return res.status(200).json({ suggestions: [] });
    }

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
    const suggestions = Array.from(songMap.values())
      .sort((a, b) => {
        // First sort by count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // Then by recency (most recent first)
        return new Date(b.mostRecent) - new Date(a.mostRecent);
      })
      .slice(0, 10) // Limit to top 10
      .map((song, index) => ({
        id: `db-${index}-${song.title}-${song.artist}`, // Generate unique ID
        title: song.title,
        artist: song.artist,
        albumArt: null, // We don't store album art in the database
        count: song.count // Include count for potential UI display
      }));

    res.status(200).json({ suggestions });

  } catch (error) {
    console.error('Error searching songs:', error);
    // Return empty results on error (graceful degradation)
    res.status(200).json({ suggestions: [] });
  }
}

