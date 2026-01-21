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
    const { q: query, organizationId } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Query parameter required (minimum 2 characters)'
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Search karaoke songs by title or artist
    const { data, error } = await supabase
      .from('karaoke_song_videos')
      .select('*')
      .or(`song_title.ilike.%${query}%,song_artist.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Database search failed' });
    }

    res.status(200).json({
      songs: data || [],
      query: query.trim(),
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}