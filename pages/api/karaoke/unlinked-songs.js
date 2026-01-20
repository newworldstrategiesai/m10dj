import { createClient } from '@supabase/supabase-js';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Get karaoke signups that don't have video links
 * GET /api/karaoke/unlinked-songs?organizationId=...
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { organizationId, limit = 100 } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Verify organization access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', organizationId)
      .eq('user_id', req.user?.id)
      .single();

    if (orgError || !orgMember) {
      return res.status(403).json({ error: 'Access denied to organization' });
    }

    // Get signups without video links
    const { data: unlinkedSignups, error } = await supabase
      .from('karaoke_signups')
      .select('id, song_title, song_artist, created_at')
      .eq('organization_id', organizationId)
      .is('video_id', null)
      .not('song_title', 'is', null)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching unlinked songs:', error);
      return res.status(500).json({ error: 'Failed to fetch unlinked songs' });
    }

    // Remove duplicates based on song title/artist combination
    const uniqueSongs = [];
    const seen = new Set();

    for (const signup of unlinkedSignups || []) {
      const key = `${signup.song_title?.toLowerCase().trim()}-${signup.song_artist?.toLowerCase().trim() || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSongs.push({
          id: signup.id,
          song_title: signup.song_title,
          song_artist: signup.song_artist,
          created_at: signup.created_at
        });
      }
    }

    return res.status(200).json({
      songs: uniqueSongs,
      totalCount: uniqueSongs.length,
      organizationId
    });

  } catch (error) {
    console.error('Unlinked songs API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch unlinked songs',
      details: error.message
    });
  }
}

export default withSecurity(handler, 'search');