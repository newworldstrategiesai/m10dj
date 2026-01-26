import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

/**
 * Video Library API
 * POST /api/karaoke/library
 * GET /api/karaoke/library - Get user's video library
 * POST /api/karaoke/library/add - Add video to library
 * DELETE /api/karaoke/library/:id - Remove video from library
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

    const { organizationId, action } = req.body;

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

    // Handle different actions
    if (action === 'add') {
      return await addToLibrary(req, res, supabase, organizationId, user.id);
    } else if (action === 'remove') {
      return await removeFromLibrary(req, res, supabase, organizationId, user.id);
    } else if (action === 'get') {
      return await getLibrary(req, res, supabase, organizationId, user.id);
    } else if (action === 'toggle-favorite') {
      return await toggleFavorite(req, res, supabase, organizationId, user.id);
    }

    // Default: get library
    return await getLibrary(req, res, supabase, organizationId, user.id);

  } catch (error) {
    console.error('Library API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

async function getLibrary(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    console.log('Get library called with:', { organizationId, userId });

    // First check if user_video_library table exists and is accessible
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_video_library')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      // If table doesn't exist or column is missing, return empty result gracefully
      if (tableError.code === '42P01' || tableError.code === '42703') {
        console.warn('user_video_library table not available:', tableError.message);
        return res.status(200).json({
          videos: [],
          total: 0,
          message: 'Video library feature not yet available - migration required'
        });
      }
      console.error('Table check error:', tableError);
      throw new Error(`Table access error: ${tableError.message}`);
    }

    console.log('Table exists, count:', tableCheck);

    // Get user's video library
    // Use select('*') to get all available columns, then map to expected structure
    const { data: libraryVideos, error } = await supabase
      .from('user_video_library')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      // If column doesn't exist, the table might not be migrated yet
      if (error.code === '42703' && error.message?.includes('title')) {
        console.warn('user_video_library table missing title column - migration may not have run');
        return res.status(200).json({
          videos: [],
          total: 0,
          message: 'Video library feature not yet available - migration required'
        });
      }
      console.error('Query error:', error);
      throw error;
    }

    // Map the data to ensure consistent structure (handle missing columns gracefully)
    const mappedVideos = (libraryVideos || []).map((video: any) => ({
      id: video.id,
      title: video.title || video.youtube_video_title || 'Unknown Title',
      artist: video.artist || null,
      youtube_video_id: video.youtube_video_id,
      thumbnail_url: video.thumbnail_url,
      duration: video.duration,
      channel_title: video.channel_title,
      quality_score: video.quality_score || 50,
      is_favorite: video.is_favorite || false,
      tags: video.tags || [],
      added_at: video.added_at,
      play_count: video.play_count || 0,
      created_at: video.created_at
    }));

    console.log('Query successful, returned videos:', mappedVideos?.length || 0);

    return res.status(200).json({
      videos: mappedVideos || [],
      total: mappedVideos?.length || 0
    });
  } catch (error) {
    console.error('Get library error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint
    });
    return res.status(500).json({
      error: 'Failed to get library',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function addToLibrary(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { video } = req.body;

    if (!video || !video.youtubeVideoId || !video.title) {
      return res.status(400).json({ error: 'Video data is required' });
    }

    // Check if video already exists in library
    const { data: existingVideo, error: checkError } = await supabase
      .from('user_video_library')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('youtube_video_id', video.youtubeVideoId)
      .single();

    if (existingVideo) {
      return res.status(409).json({ error: 'Video already in library' });
    }

    // Add video to library
    const { data: newVideo, error: insertError } = await supabase
      .from('user_video_library')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        title: video.title,
        artist: video.artist,
        youtube_video_id: video.youtubeVideoId,
        thumbnail_url: video.thumbnailUrl,
        duration: video.duration,
        channel_title: video.channelTitle,
        quality_score: video.qualityScore || 50,
        is_favorite: video.isFavorite || false,
        tags: video.tags || [],
        play_count: 0
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      video: newVideo
    });
  } catch (error) {
    console.error('Add to library error:', error);
    return res.status(500).json({ error: 'Failed to add video to library' });
  }
}

async function removeFromLibrary(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const { error } = await supabase
      .from('user_video_library')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', videoId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Remove from library error:', error);
    return res.status(500).json({ error: 'Failed to remove video from library' });
  }
}

async function toggleFavorite(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Get current favorite status
    const { data: video, error: fetchError } = await supabase
      .from('user_video_library')
      .select('is_favorite')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', videoId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle favorite status
    const { data: updatedVideo, error: updateError } = await supabase
      .from('user_video_library')
      .update({ is_favorite: !video.is_favorite })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', videoId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      video: updatedVideo
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
}