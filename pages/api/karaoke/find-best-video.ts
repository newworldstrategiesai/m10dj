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

    // Get top embeddable videos (up to 5 suggestions)
    const embeddableVideos = videos.filter(video => video.embeddable !== false);

    if (embeddableVideos.length === 0) {
      return res.status(200).json({
        suggestions: [],
        noEmbeddableVideos: true,
        totalVideosFound: videos.length
      });
    }

    // Sort by karaoke score (highest first)
    embeddableVideos.sort((a, b) => (b.karaokeScore || 0) - (a.karaokeScore || 0));

    // Take top 5 suggestions
    const topSuggestions = embeddableVideos.slice(0, 5);

    // Check existing links for each suggestion
    const suggestionsWithLinks = await Promise.all(
      topSuggestions.map(async (video) => {
        let existingLink = null;
        try {
          const { data: existingLinks } = await supabase
            .from('karaoke_song_videos')
            .select('id, video_quality_score, confidence_score')
            .eq('youtube_video_id', video.id)
            .eq('organization_id', organizationId)
            .limit(1);

          if (existingLinks && existingLinks.length > 0) {
            existingLink = existingLinks[0];
          }
        } catch (linkError) {
          console.warn('Error checking existing links for video', video.id, ':', linkError);
        }

        return {
          ...video,
          existingLink
        };
      })
    );

    return res.status(200).json({
      suggestions: suggestionsWithLinks,
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