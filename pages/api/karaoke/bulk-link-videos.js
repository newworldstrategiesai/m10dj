import { createClient } from '@supabase/supabase-js';
import { searchKaraokeVideos } from '@/utils/youtube-api';
import { withSecurity } from '@/utils/rate-limiting';

/**
 * Bulk link YouTube videos to multiple karaoke songs
 * POST /api/karaoke/bulk-link-videos
 */
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      organizationId,
      songQueries, // Array of { songTitle, songArtist, signupId? }
      autoLink = true, // Automatically link best matches
      minQualityScore = 70 // Minimum quality score to auto-link
    } = req.body;

    if (!organizationId || !songQueries || !Array.isArray(songQueries)) {
      return res.status(400).json({
        error: 'Missing required fields: organizationId, songQueries (array)'
      });
    }

    if (songQueries.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 songs per bulk operation'
      });
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

    const results = [];
    let processedCount = 0;
    let linkedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each song
    for (const query of songQueries) {
      const { songTitle, songArtist, signupId } = query;

      try {
        processedCount++;

        // Check if already linked
        const songKey = await supabase.rpc('normalize_song_key', {
          title: songTitle,
          artist: songArtist || null
        });

        const { data: existingLink } = await supabase
          .from('karaoke_song_videos')
          .select('id, video_quality_score')
          .eq('organization_id', organizationId)
          .eq('song_key', songKey)
          .eq('link_status', 'active')
          .single();

        if (existingLink) {
          results.push({
            songTitle,
            songArtist,
            status: 'already_linked',
            existingQualityScore: existingLink.video_quality_score
          });
          skippedCount++;
          continue;
        }

        // Search for videos
        const videos = await searchKaraokeVideos(songTitle, songArtist, { maxResults: 5 });

        if (videos.length === 0) {
          results.push({
            songTitle,
            songArtist,
            status: 'no_videos_found'
          });
          continue;
        }

        const bestMatch = videos[0];

        if (autoLink && bestMatch.karaokeScore >= minQualityScore) {
          // Auto-link the best match
          try {
            const linkResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/karaoke/link-video`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.headers.authorization || ''}`
              },
              body: JSON.stringify({
                songTitle,
                songArtist,
                youtubeVideoId: bestMatch.id,
                organizationId,
                signupId,
                source: 'bulk_import'
              })
            });

            if (linkResponse.ok) {
              const linkData = await linkResponse.json();
              results.push({
                songTitle,
                songArtist,
                status: 'linked',
                videoId: bestMatch.id,
                qualityScore: bestMatch.karaokeScore,
                videoTitle: bestMatch.title
              });
              linkedCount++;
            } else {
              throw new Error('Link API failed');
            }
          } catch (linkError) {
            console.error(`Failed to link video for ${songTitle}:`, linkError);
            results.push({
              songTitle,
              songArtist,
              status: 'link_failed',
              bestMatch: {
                videoId: bestMatch.id,
                qualityScore: bestMatch.karaokeScore,
                title: bestMatch.title
              }
            });
            errorCount++;
          }
        } else {
          // Return suggestions for manual review
          results.push({
            songTitle,
            songArtist,
            status: 'needs_review',
            suggestions: videos.slice(0, 3).map(v => ({
              videoId: v.id,
              title: v.title,
              qualityScore: v.karaokeScore,
              channel: v.channelTitle
            }))
          });
        }

        // Rate limiting: 1 request per second to avoid quota issues
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing ${songTitle}:`, error);
        results.push({
          songTitle,
          songArtist,
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalProcessed: processedCount,
        linked: linkedCount,
        skipped: skippedCount,
        errors: errorCount,
        needsReview: results.filter(r => r.status === 'needs_review').length
      },
      results,
      organizationId
    });

  } catch (error) {
    console.error('Bulk video linking error:', error);
    return res.status(500).json({
      error: 'Bulk video linking failed',
      details: error.message
    });
  }
}

export default withSecurity(handler, 'moderate');