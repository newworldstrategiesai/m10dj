import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Get karaoke signups that don't have video links
 * POST /api/karaoke/unlinked-songs
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { organizationId, limit = 100 } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify organization access
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
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
      details: error instanceof Error ? error.message : String(error)
    });
  }
}