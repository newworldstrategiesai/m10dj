import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Get karaoke videos for an organization
 * GET /api/karaoke/videos?organizationId=...
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { organizationId, limit = 50, offset = 0, status, search } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
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

    // Build query
    let query = supabase
      .from('karaoke_song_videos')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('link_status', status);
    }

    if (search) {
      query = query.or(`song_title.ilike.%${search}%,song_artist.ilike.%${search}%,youtube_video_title.ilike.%${search}%`);
    }

    const { data: videos, error: videosError, count } = await query;

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      return res.status(500).json({ error: 'Failed to fetch videos' });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('karaoke_song_videos')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return res.status(200).json({
      videos: videos || [],
      totalCount: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0),
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Videos API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch videos',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}