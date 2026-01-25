import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@/utils/supabase/server';

/**
 * Playlists API
 * POST /api/karaoke/playlists
 * GET /api/karaoke/playlists - Get user's playlists
 * POST /api/karaoke/playlists/create - Create new playlist
 * POST /api/karaoke/playlists/add-video - Add video to playlist
 * DELETE /api/karaoke/playlists/remove-video - Remove video from playlist
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
    if (action === 'create') {
      return await createPlaylist(req, res, supabase, organizationId, user.id);
    } else if (action === 'delete') {
      return await deletePlaylist(req, res, supabase, organizationId, user.id);
    } else if (action === 'add-video') {
      return await addVideoToPlaylist(req, res, supabase, organizationId, user.id);
    } else if (action === 'remove-video') {
      return await removeVideoFromPlaylist(req, res, supabase, organizationId, user.id);
    } else if (action === 'update') {
      return await updatePlaylist(req, res, supabase, organizationId, user.id);
    } else if (action === 'change-video') {
      return await changePlaylistVideo(req, res, supabase, organizationId, user.id);
    } else if (action === 'unlink-video') {
      return await unlinkPlaylistVideo(req, res, supabase, organizationId, user.id);
    }

    // Default: get playlists
    return await getPlaylists(req, res, supabase, organizationId, user.id);

  } catch (error) {
    console.error('Playlists API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function getPlaylists(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    // Get user's playlists
    const { data: playlists, error } = await supabase
      .from('user_playlists')
      .select(`
        id,
        name,
        description,
        video_ids,
        is_public,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      playlists: playlists || [],
      total: playlists?.length || 0
    });
  } catch (error) {
    console.error('Get playlists error:', error);
    return res.status(500).json({ error: 'Failed to get playlists' });
  }
}

async function createPlaylist(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { name, description, isPublic = false } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    const { data: playlist, error } = await supabase
      .from('user_playlists')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        name: name.trim(),
        description: description?.trim(),
        video_ids: [],
        is_public: isPublic
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      playlist
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    return res.status(500).json({ error: 'Failed to create playlist' });
  }
}

async function deletePlaylist(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { playlistId } = req.body;

    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }

    const { error } = await supabase
      .from('user_playlists')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return res.status(500).json({ error: 'Failed to delete playlist' });
  }
}

async function addVideoToPlaylist(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { playlistId, videoId } = req.body;

    if (!playlistId || !videoId) {
      return res.status(400).json({ error: 'Playlist ID and Video ID are required' });
    }

    // Get current playlist
    const { data: playlist, error: fetchError } = await supabase
      .from('user_playlists')
      .select('video_ids')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .single();

    if (fetchError) throw fetchError;

    // Check if video is already in playlist
    if (playlist.video_ids.includes(videoId)) {
      return res.status(409).json({ error: 'Video already in playlist' });
    }

    // Add video to playlist
    const updatedVideoIds = [...playlist.video_ids, videoId];
    const { data: updatedPlaylist, error: updateError } = await supabase
      .from('user_playlists')
      .update({
        video_ids: updatedVideoIds,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      playlist: updatedPlaylist
    });
  } catch (error) {
    console.error('Add video to playlist error:', error);
    return res.status(500).json({ error: 'Failed to add video to playlist' });
  }
}

async function removeVideoFromPlaylist(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { playlistId, videoId } = req.body;

    if (!playlistId || !videoId) {
      return res.status(400).json({ error: 'Playlist ID and Video ID are required' });
    }

    // Get current playlist
    const { data: playlist, error: fetchError } = await supabase
      .from('user_playlists')
      .select('video_ids')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .single();

    if (fetchError) throw fetchError;

    // Remove video from playlist
    const updatedVideoIds = (playlist.video_ids || []).filter((id: string) => id !== videoId);
    const { data: updatedPlaylist, error: updateError } = await supabase
      .from('user_playlists')
      .update({
        video_ids: updatedVideoIds,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      playlist: updatedPlaylist
    });
  } catch (error) {
    console.error('Remove video from playlist error:', error);
    return res.status(500).json({ error: 'Failed to remove video from playlist' });
  }
}

async function updatePlaylist(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { playlistId, name, description, isPublic } = req.body;

    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist ID is required' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (isPublic !== undefined) updates.is_public = isPublic;
    updates.updated_at = new Date().toISOString();

    const { data: playlist, error } = await supabase
      .from('user_playlists')
      .update(updates)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      playlist
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    return res.status(500).json({ error: 'Failed to update playlist' });
  }
}

async function changePlaylistVideo(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { playlistId, songId, newVideoId } = req.body;

    if (!playlistId || !songId || !newVideoId) {
      return res.status(400).json({ error: 'Playlist ID, Song ID, and New Video ID are required' });
    }

    // Get current playlist
    const { data: playlist, error: fetchError } = await supabase
      .from('user_playlists')
      .select('video_ids')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .single();

    if (fetchError) throw fetchError;

    // Find the position of the song in the playlist
    const songIndex = playlist.video_ids.indexOf(songId);
    if (songIndex === -1) {
      return res.status(404).json({ error: 'Song not found in playlist' });
    }

    // Replace the video ID at that position
    const updatedVideoIds = [...playlist.video_ids];
    updatedVideoIds[songIndex] = newVideoId;

    // Update playlist
    const { data: updatedPlaylist, error: updateError } = await supabase
      .from('user_playlists')
      .update({
        video_ids: updatedVideoIds,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      playlist: updatedPlaylist
    });
  } catch (error) {
    console.error('Change playlist video error:', error);
    return res.status(500).json({ error: 'Failed to change playlist video' });
  }
}

async function unlinkPlaylistVideo(req: NextApiRequest, res: NextApiResponse, supabase: any, organizationId: string, userId: string) {
  try {
    const { playlistId, songId } = req.body;

    if (!playlistId || !songId) {
      return res.status(400).json({ error: 'Playlist ID and Song ID are required' });
    }

    // Get current playlist
    const { data: playlist, error: fetchError } = await supabase
      .from('user_playlists')
      .select('video_ids')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .single();

    if (fetchError) throw fetchError;

    // Find and remove the song from the playlist
    const updatedVideoIds = (playlist.video_ids || []).filter((id: string) => id !== songId);

    // Update playlist
    const { data: updatedPlaylist, error: updateError } = await supabase
      .from('user_playlists')
      .update({
        video_ids: updatedVideoIds,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('id', playlistId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      playlist: updatedPlaylist
    });
  } catch (error) {
    console.error('Unlink playlist video error:', error);
    return res.status(500).json({ error: 'Failed to unlink playlist video' });
  }
}