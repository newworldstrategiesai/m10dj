import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { searchKaraokeVideos, validateYouTubeVideo } from '@/utils/youtube-api';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Search for YouTube karaoke videos for songs
 * POST /api/karaoke/search-videos
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { songTitle, songArtist, organizationId, maxResults = 10, filters, generalSearch } = req.body;

    if (!songTitle || songTitle.trim().length < 1) {
      return res.status(400).json({ error: 'Song title is required' });
    }

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

    // Search for videos
    let searchQuery = songTitle?.trim();
    let searchArtist = songArtist?.trim();

    // Support general search
    if (generalSearch) {
      searchQuery = generalSearch.trim();
      searchArtist = undefined;
    }

    // Check if YouTube API is configured
    const hasYouTubeAPI = !!process.env.YOUTUBE_API_KEY?.trim();

    let videos = [];
    if (hasYouTubeAPI) {
      try {
        videos = await searchKaraokeVideos(searchQuery, searchArtist, {
          maxResults: Math.min(maxResults, 50), // Allow more results for enhanced UI
          filters
        });
      } catch (youtubeError) {
        console.error('YouTube search failed:', youtubeError);
        // Continue with empty results - graceful degradation
      }
    }

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
      totalResults: videos.length,
      youtubeAvailable: hasYouTubeAPI
    });

  } catch (error) {
    console.error('Video search error:', error);

    // Graceful degradation - return empty results instead of error
    return res.status(200).json({
      videos: [],
      error: 'Video search temporarily unavailable',
      searchQuery: req.body,
      youtubeAvailable: !!process.env.YOUTUBE_API_KEY?.trim()
    });
  }
}