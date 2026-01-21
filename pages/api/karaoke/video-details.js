import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { validateYouTubeVideo } from '@/utils/youtube-api';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Get karaoke video details for display
 * GET /api/karaoke/video-details?videoId=...&organizationId=...
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId, organizationId } = req.query;

    if (!videoId || !organizationId) {
      return res.status(400).json({
        error: 'Missing required parameters: videoId, organizationId'
      });
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

    // Get video details from database
    const { data: video, error: videoError } = await supabase
      .from('karaoke_song_videos')
      .select('*')
      .eq('id', videoId)
      .eq('organization_id', organizationId)
      .eq('link_status', 'active')
      .single();

    if (videoError) {
      console.error('Error fetching video details:', videoError);
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if video needs validation (hasn't been validated in 24 hours)
    const needsValidation = !video.last_validated_at ||
      (new Date() - new Date(video.last_validated_at)) > (24 * 60 * 60 * 1000);

    if (needsValidation) {
      // Trigger background validation
      try {
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/karaoke/validate-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || ''
          },
          body: JSON.stringify({
            videoId: video.id,
            youtubeVideoId: video.youtube_video_id,
            organizationId
          })
        }).catch(err => console.error('Background validation failed:', err));
      } catch (err) {
        console.error('Error triggering background validation:', err);
      }
    }

    return res.status(200).json({
      id: video.id,
      youtube_video_id: video.youtube_video_id,
      youtube_video_title: video.youtube_video_title,
      youtube_channel_name: video.youtube_channel_name,
      youtube_channel_id: video.youtube_channel_id,
      youtube_video_duration: video.youtube_video_duration,
      youtube_view_count: video.youtube_view_count,
      youtube_like_count: video.youtube_like_count,
      youtube_publish_date: video.youtube_publish_date,
      video_quality_score: video.video_quality_score,
      is_karaoke_track: video.is_karaoke_track,
      has_lyrics: video.has_lyrics,
      has_instruments: video.has_instruments,
      source: video.source,
      confidence_score: video.confidence_score,
      link_status: video.link_status,
      last_validated_at: video.last_validated_at,
      validation_attempts: video.validation_attempts,
      created_at: video.created_at,
      updated_at: video.updated_at
    });

  } catch (error) {
    console.error('Video details API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch video details',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}