import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { YouTubeAPI, parseDuration } from '@/utils/youtube-api';

/**
 * General YouTube video search endpoint
 * Searches all of YouTube (not karaoke-specific)
 * POST /api/youtube/search-general
 * 
 * Body:
 * {
 *   query: string (required) - Search query
 *   maxResults?: number (default: 25, max: 50)
 *   order?: 'relevance' | 'viewCount' | 'date' | 'rating'
 *   filters?: {
 *     maxDuration?: number (seconds)
 *     channel?: string (filter by channel name)
 *   }
 * }
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

    const { query, maxResults = 25, order = 'relevance', filters = {} } = req.body;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length < 1) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Validate maxResults
    const validMaxResults = Math.min(Math.max(1, parseInt(maxResults) || 25), 50);

    // Validate order
    const validOrder = ['relevance', 'viewCount', 'date', 'rating'].includes(order)
      ? order
      : 'relevance';

    // Check if YouTube API is configured
    const hasYouTubeAPI = !!process.env.YOUTUBE_API_KEY?.trim();

    if (!hasYouTubeAPI) {
      return res.status(503).json({
        error: 'YouTube API not configured',
        message: 'YOUTUBE_API_KEY environment variable is required'
      });
    }

    let videos = [];
    let youtubeError = null;

    try {
      // Perform general YouTube search
      const api = new YouTubeAPI();
      const rawVideos = await api.searchVideos(query.trim(), {
        maxResults: validMaxResults,
        order: validOrder
      });

      // Convert to response format
      videos = rawVideos.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        channelTitle: video.channelTitle,
        channelId: video.channelId,
        publishedAt: video.publishedAt,
        duration: video.duration,
        durationSeconds: parseDuration(video.duration),
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        thumbnailUrl: video.thumbnailUrl,
        embeddable: video.embeddable,
        tags: video.tags || []
      }));

      // Apply filters if provided
      if (filters.maxDuration !== undefined) {
        const maxDurationSeconds = parseInt(filters.maxDuration);
        if (!isNaN(maxDurationSeconds)) {
          videos = videos.filter(video => {
            return video.durationSeconds <= maxDurationSeconds;
          });
        }
      }

      if (filters.channel && typeof filters.channel === 'string') {
        const channelFilter = filters.channel.toLowerCase();
        videos = videos.filter(video => {
          return video.channelTitle.toLowerCase().includes(channelFilter);
        });
      }

      // Sort by order if not already sorted by API
      if (order === 'viewCount') {
        videos.sort((a, b) => b.viewCount - a.viewCount);
      } else if (order === 'date') {
        videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }

    } catch (error) {
      console.error('YouTube search failed:', error);
      youtubeError = error.message || 'YouTube search failed';

      // Log specific error types for monitoring
      if (error.message?.includes('Quota Exceeded')) {
        console.warn('YouTube API quota exceeded - consider upgrading API plan');
      } else if (error.message?.includes('Authentication Failed')) {
        console.warn('YouTube API key invalid or expired');
      } else if (error.message?.includes('Rate Limited')) {
        console.warn('YouTube API rate limit exceeded - temporary issue');
      }

      // Return error response instead of empty results
      return res.status(503).json({
        error: 'YouTube search temporarily unavailable',
        youtubeError: youtubeError,
        videos: [],
        query: query.trim()
      });
    }

    return res.status(200).json({
      success: true,
      videos,
      query: query.trim(),
      totalResults: videos.length,
      maxResults: validMaxResults,
      order: validOrder,
      filters: filters
    });

  } catch (error) {
    console.error('General YouTube search error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
