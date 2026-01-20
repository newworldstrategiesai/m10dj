import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { validateVideo } from '@/utils/youtube-api';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Validate YouTube video links and update metadata
 * POST /api/karaoke/validate-video
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      videoId, // karaoke_song_videos.id
      youtubeVideoId, // YouTube video ID
      organizationId
    } = req.body;

    if (!videoId && !youtubeVideoId) {
      return res.status(400).json({
        error: 'Either videoId (database record) or youtubeVideoId is required'
      });
    }

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

    let targetVideoId = youtubeVideoId;

    // If we have a database videoId, get the YouTube ID
    if (videoId && !youtubeVideoId) {
      const { data: videoRecord } = await supabase
        .from('karaoke_song_videos')
        .select('youtube_video_id')
        .eq('id', videoId)
        .eq('organization_id', organizationId)
        .single();

      if (!videoRecord) {
        return res.status(404).json({ error: 'Video record not found' });
      }

      targetVideoId = videoRecord.youtube_video_id;
    }

    if (!targetVideoId) {
      return res.status(400).json({ error: 'Could not determine YouTube video ID' });
    }

    // Validate video with YouTube API
    const videoData = await validateVideo(targetVideoId);

    if (!videoData) {
      // Video is broken/unavailable
      if (videoId) {
        await supabase.rpc('update_video_validation_status', {
          p_video_id: videoId,
          p_is_valid: false,
          p_metadata: null
        });
      }

      return res.status(200).json({
        valid: false,
        videoId: targetVideoId,
        reason: 'Video not found or unavailable'
      });
    }

    // Video is valid, update metadata
    const metadata = {
      view_count: videoData.viewCount,
      like_count: videoData.likeCount,
      duration_seconds: parseDuration(videoData.duration)
    };

    if (videoId) {
      await supabase.rpc('update_video_validation_status', {
        p_video_id: videoId,
        p_is_valid: true,
        p_metadata: metadata
      });
    }

    return res.status(200).json({
      valid: true,
      videoId: targetVideoId,
      metadata: {
        title: videoData.title,
        channel: videoData.channelTitle,
        duration: videoData.duration,
        viewCount: videoData.viewCount,
        likeCount: videoData.likeCount,
        publishedAt: videoData.publishedAt,
        thumbnailUrl: videoData.thumbnailUrl
      }
    });

  } catch (error) {
    console.error('Video validation error:', error);
    return res.status(500).json({
      error: 'Video validation failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Helper function to parse ISO 8601 duration
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}