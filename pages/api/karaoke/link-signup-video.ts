import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Link a karaoke video to a signup
 * POST /api/karaoke/link-signup-video
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const { signupId, videoId, organizationId } = req.body;

    if (!signupId || !videoId || !organizationId) {
      return res.status(400).json({ error: 'Signup ID, Video ID, and Organization ID are required' });
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

    // Get the video data
    const { data: video, error: videoError } = await supabase
      .from('karaoke_song_videos')
      .select('*')
      .eq('id', videoId)
      .eq('organization_id', organizationId)
      .single();

    if (videoError || !video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Update the signup with video information
    const { data: signup, error: signupError } = await supabase
      .from('karaoke_signups')
      .update({
        video_id: videoId,
        video_url: `https://www.youtube.com/watch?v=${video.youtube_video_id}`,
        video_data: {
          id: video.id,
          youtube_video_id: video.youtube_video_id,
          youtube_video_title: video.youtube_video_title,
          youtube_channel_name: video.youtube_channel_name,
          youtube_channel_id: video.youtube_channel_id,
          video_quality_score: video.video_quality_score,
          confidence_score: video.confidence_score,
          link_status: video.link_status,
          source: video.source,
          created_at: video.created_at
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', signupId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (signupError) {
      console.error('Signup update error:', signupError);
      return res.status(500).json({ error: 'Failed to link video to signup' });
    }

    // Log the video linking action
    await supabase
      .from('karaoke_audit_log')
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        action: 'link_video_to_signup',
        entity_type: 'signup',
        entity_id: signupId,
        details: {
          video_id: videoId,
          song_title: signup.song_title,
          song_artist: signup.song_artist,
          youtube_video_id: video.youtube_video_id
        }
      });

    return res.status(200).json({
      success: true,
      signup: signup,
      video: video
    });

  } catch (error) {
    console.error('Link signup video error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}