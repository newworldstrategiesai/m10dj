import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { validateVideo } from '@/utils/youtube-api';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Link a YouTube video to a karaoke song
 * POST /api/karaoke/link-video
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      songTitle,
      songArtist,
      youtubeVideoId,
      organizationId,
      signupId, // Optional: link to specific signup
      source = 'manual',
      override = false // Allow overriding existing links
    } = req.body;

    if (!songTitle || !youtubeVideoId || !organizationId) {
      return res.status(400).json({
        error: 'Missing required fields: songTitle, youtubeVideoId, organizationId'
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

    // Validate YouTube video exists
    const videoData = await validateVideo(youtubeVideoId);
    if (!videoData) {
      return res.status(400).json({ error: 'YouTube video not found or unavailable' });
    }

    // Check for existing link (unless override is true)
    const songKey = await supabase.rpc('normalize_song_key', {
      title: songTitle,
      artist: songArtist || null
    });

    if (!override) {
      const { data: existingLink } = await supabase
        .from('karaoke_song_videos')
        .select('id, youtube_video_id, link_status')
        .eq('organization_id', organizationId)
        .eq('song_key', songKey)
        .single();

      if (existingLink && existingLink.link_status === 'active') {
        return res.status(409).json({
          error: 'Video already linked to this song',
          existingLink: existingLink
        });
      }
    }

    // Calculate quality score
    const { calculateKaraokeScore, parseDuration } = await import('@/utils/youtube-api');
    const qualityScore = calculateKaraokeScore(videoData, songTitle, songArtist);
    const durationSeconds = parseDuration(videoData.duration);

    // Create or update video link
    const videoRecord = {
      organization_id: organizationId,
      song_title: songTitle.trim(),
      song_artist: songArtist?.trim() || null,
      song_key: songKey,
      youtube_video_id: youtubeVideoId,
      youtube_video_title: videoData.title,
      youtube_channel_name: videoData.channelTitle,
      youtube_channel_id: videoData.channelId,
      youtube_video_duration: durationSeconds,
      youtube_view_count: videoData.viewCount,
      youtube_like_count: videoData.likeCount || 0,
      youtube_publish_date: videoData.publishedAt,
      video_quality_score: qualityScore,
      is_karaoke_track: qualityScore > 60, // Consider karaoke if score > 60
      has_lyrics: videoData.description?.toLowerCase().includes('lyrics') || false,
      has_instruments: !videoData.title.toLowerCase().includes('acapella'),
      source: source,
      confidence_score: 0.9, // High confidence for manual links
      link_status: 'active',
      created_by: req.user?.id || null
    };

    const { data: savedVideo, error: saveError } = await supabase
      .from('karaoke_song_videos')
      .upsert(videoRecord, {
        onConflict: 'organization_id,song_key',
        returning: 'representation'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving video link:', saveError);
      return res.status(500).json({ error: 'Failed to save video link' });
    }

    // If signupId provided, link to the signup
    if (signupId) {
      const { error: signupError } = await supabase
        .from('karaoke_signups')
        .update({
          video_id: savedVideo.id,
          video_url: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
          video_embed_allowed: true
        })
        .eq('id', signupId)
        .eq('organization_id', organizationId);

      if (signupError) {
        console.error('Error linking video to signup:', signupError);
        // Don't fail the whole operation for this
      }
    }

    return res.status(200).json({
      success: true,
      video: savedVideo,
      qualityScore,
      embedUrl: `https://www.youtube.com/embed/${youtubeVideoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`
    });

  } catch (error) {
    console.error('Video linking error:', error);
    return res.status(500).json({
      error: 'Failed to link video',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}