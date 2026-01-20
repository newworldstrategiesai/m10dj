import { createClient } from '@supabase/supabase-js';
import { searchKaraokeVideos, validateVideo } from '@/utils/youtube-api';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Search for YouTube karaoke videos for songs
 * POST /api/karaoke/search-videos
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { songTitle, songArtist, organizationId, maxResults = 10 } = req.body;

    if (!songTitle || songTitle.trim().length < 1) {
      return res.status(400).json({ error: 'Song title is required' });
    }

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

    // Search for videos
    const videos = await searchKaraokeVideos(songTitle.trim(), songArtist?.trim(), {
      maxResults: Math.min(maxResults, 20) // Cap at 20 for performance
    });

    // Check if we already have links for any of these videos
    const videoIds = videos.map(v => v.id);
    if (videoIds.length > 0) {
      const { data: existingLinks } = await supabase
        .from('karaoke_song_videos')
        .select('youtube_video_id, id, video_quality_score, confidence_score')
        .eq('organization_id', organizationId)
        .in('youtube_video_id', videoIds);

      // Mark existing links
      const existingMap = new Map(
        existingLinks?.map(link => [link.youtube_video_id, link]) || []
      );

      videos.forEach(video => {
        const existing = existingMap.get(video.id);
        if (existing) {
          video.existingLink = {
            id: existing.id,
            qualityScore: existing.video_quality_score,
            confidenceScore: existing.confidence_score
          };
        }
      });
    }

    return res.status(200).json({
      videos,
      searchQuery: {
        title: songTitle.trim(),
        artist: songArtist?.trim(),
        organizationId
      },
      totalResults: videos.length
    });

  } catch (error) {
    console.error('Video search error:', error);

    // Graceful degradation - return empty results instead of error
    return res.status(200).json({
      videos: [],
      error: 'Video search temporarily unavailable',
      searchQuery: req.body
    });
  }
}

export default withSecurity(handler, 'search');