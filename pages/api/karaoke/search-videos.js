import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { searchKaraokeVideos, validateYouTubeVideo, YouTubeAPI, parseDuration } from '@/utils/youtube-api';
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

    // Require either songTitle or generalSearch
    if ((!songTitle || songTitle.trim().length < 1) && (!generalSearch || generalSearch.trim().length < 1)) {
      return res.status(400).json({ error: 'Song title or general search query is required' });
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
    let youtubeError = null;
    if (hasYouTubeAPI) {
      try {
        // Use general YouTube search for generalSearch, karaoke-specific search otherwise
        if (generalSearch) {
          // General YouTube search - search all videos
          const api = new YouTubeAPI();
          const rawVideos = await api.searchVideos(searchQuery, {
            maxResults: Math.min(maxResults, 50),
            order: filters?.sortBy === 'viewCount' ? 'viewCount' : filters?.sortBy === 'date' ? 'date' : 'relevance'
          });

          // Convert to search result format with basic scoring
          videos = rawVideos.map(video => ({
            id: video.id,
            title: video.title,
            channelTitle: video.channelTitle,
            karaokeScore: 50, // Default score for general videos
            relevanceScore: 50,
            viewCount: video.viewCount,
            duration: video.duration,
            publishedAt: video.publishedAt,
            thumbnailUrl: video.thumbnailUrl
          }));

          // Apply filters if provided
          if (filters) {
            const { minQuality, maxDuration, channel } = filters;
            videos = videos.filter(video => {
              if (minQuality !== undefined && video.karaokeScore < minQuality) return false;
              if (maxDuration !== undefined) {
                const durationSeconds = parseDuration(video.duration);
                if (durationSeconds > maxDuration) return false;
              }
              if (channel && !video.channelTitle.toLowerCase().includes(channel.toLowerCase())) return false;
              return true;
            });

            // Apply sorting
            if (filters.sortBy === 'viewCount') {
              videos.sort((a, b) => b.viewCount - a.viewCount);
            } else if (filters.sortBy === 'date') {
              videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
            }
          }
        } else {
          // Karaoke-specific search
          videos = await searchKaraokeVideos(searchQuery, searchArtist, {
            maxResults: Math.min(maxResults, 50), // Allow more results for enhanced UI
            filters
          });
        }
      } catch (error) {
        console.error('YouTube search failed:', error);
        youtubeError = error.message || 'YouTube search failed';

        // Log specific error types for monitoring
        if (error.message.includes('Quota Exceeded')) {
          console.warn('YouTube API quota exceeded - consider upgrading API plan');
        } else if (error.message.includes('Authentication Failed')) {
          console.warn('YouTube API key invalid or expired');
        } else if (error.message.includes('Rate Limited')) {
          console.warn('YouTube API rate limit exceeded - temporary issue');
        }

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
      youtubeAvailable: hasYouTubeAPI,
      youtubeError: youtubeError
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