import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { searchKaraokeVideos } from '@/utils/youtube-api';

/**
 * Find the best karaoke video for a song
 * POST /api/karaoke/find-best-video
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

    const { songTitle, songArtist, organizationId, prioritizeKarafun = true } = req.body;

    if (!songTitle || !organizationId) {
      return res.status(400).json({ error: 'Song title and organization ID are required' });
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

    // Search for karaoke videos
    let videos = [];
    try {
      videos = await searchKaraokeVideos(songTitle, songArtist, {
        maxResults: 10,
        filters: {
          minQuality: prioritizeKarafun ? 60 : 50 // Higher quality threshold for Karafun
        }
      });
    } catch (searchError) {
      console.error('Video search failed:', searchError);
      return res.status(200).json({
        bestVideo: null,
        searchFailed: true,
        error: 'Video search temporarily unavailable'
      });
    }

    if (!videos || videos.length === 0) {
      return res.status(200).json({
        bestVideo: null,
        noVideosFound: true
      });
    }

    // Find the best video (prioritize Karafun, then highest quality)
    let bestVideo = null;

    if (prioritizeKarafun) {
      // First try to find a Karafun video
      const karafunVideos = videos.filter(video => {
        const karafunTerms = (process.env.KARAFUN_CHANNEL_IDS || 'karafun').split(',');
        return karafunTerms.some(term =>
          video.channelTitle?.toLowerCase().includes(term.toLowerCase()) ||
          video.channelId?.toLowerCase().includes(term.toLowerCase())
        );
      });

      if (karafunVideos.length > 0) {
        // Get the highest quality Karafun video
        bestVideo = karafunVideos.reduce((best, current) =>
          (current.karaokeScore || 0) > (best.karaokeScore || 0) ? current : best
        );
      }
    }

    // If no Karafun video found, get the highest quality video
    if (!bestVideo) {
      bestVideo = videos.reduce((best, current) =>
        (current.karaokeScore || 0) > (best.karaokeScore || 0) ? current : best
      );
    }

    // Check if this video is already linked
    let existingLink = null;
    if (bestVideo) {
      try {
        const { data: existingLinks } = await supabase
          .from('karaoke_song_videos')
          .select('id, video_quality_score, confidence_score')
          .eq('youtube_video_id', bestVideo.id)
          .eq('organization_id', organizationId)
          .limit(1);

        if (existingLinks && existingLinks.length > 0) {
          existingLink = existingLinks[0];
        }
      } catch (linkError) {
        console.warn('Error checking existing links:', linkError);
      }
    }

    return res.status(200).json({
      bestVideo: bestVideo ? {
        ...bestVideo,
        existingLink
      } : null,
      totalVideosFound: videos.length,
      karafunPrioritized: prioritizeKarafun
    });

  } catch (error) {
    console.error('Find best video error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}