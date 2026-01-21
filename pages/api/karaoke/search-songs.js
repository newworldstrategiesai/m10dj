import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/karaoke/search-songs?q=query&organizationId=id
 * Search for karaoke songs in the database
 */
export default async function handler(req, res) {
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Search karaoke songs by title or artist
    const { data, error } = await supabase
      .from('karaoke_song_videos')
      .select('*')
      .or(`song_title.ilike.%${query}%,song_artist.ilike.%${query}%`)
      .limit(limitNum);

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Database search failed' });
    }

    // Transform database results to match SongAutocomplete interface
    const suggestions = (data || []).map(song => ({
      id: song.id,
      title: song.song_title,
      artist: song.song_artist || 'Unknown Artist',
      albumArt: song.album_art_url || null,
      source: 'database',
      popularity: song.popularity_score || 0
    }));

    res.status(200).json({
      suggestions,
      query: query.trim(),
      count: suggestions.length
    });

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}