/**
 * Music Library Management API
 * Handles CRUD operations for music library (boundary list)
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { normalizeSongString } from '@/utils/music-library-validation';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = isPlatformAdmin(session.user.email);
    const orgId = await getOrganizationContext(supabase, session.user.id, session.user.email);

    if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Organization required' });
    }

    const targetOrgId = req.query.organizationId || orgId;
    if (!isAdmin && targetOrgId !== orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // GET: List all songs in library
    if (req.method === 'GET') {
      const { search, limit = 100, offset = 0 } = req.query;

      let query = supabaseService
        .from('music_library')
        .select('*', { count: 'exact' })
        .eq('organization_id', targetOrgId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (search) {
        query = query.or(`song_title.ilike.%${search}%,song_artist.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching music library:', error);
        return res.status(500).json({ error: 'Failed to fetch music library', details: error.message });
      }

      return res.status(200).json({
        songs: data || [],
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }

    // POST: Add songs (single or bulk)
    if (req.method === 'POST') {
      const { songs, importBatchId } = req.body;

      if (!songs || !Array.isArray(songs) || songs.length === 0) {
        return res.status(400).json({ error: 'Songs array is required' });
      }

      const batchId = importBatchId || crypto.randomUUID();
      const songsToInsert = songs.map(song => ({
        organization_id: targetOrgId,
        song_title: song.songTitle || song.title,
        song_artist: song.songArtist || song.artist,
        genre: song.genre || null,
        bpm: song.bpm || null,
        key_signature: song.keySignature || song.key_signature || null,
        notes: song.notes || null,
        import_batch_id: batchId,
        imported_by: session.user.id
      }));

      const { data, error } = await supabaseService
        .from('music_library')
        .insert(songsToInsert)
        .select();

      if (error) {
        // Check for duplicate key violation
        if (error.code === '23505') {
          return res.status(409).json({ 
            error: 'Some songs already exist in library',
            details: error.message 
          });
        }
        console.error('Error adding songs to library:', error);
        return res.status(500).json({ error: 'Failed to add songs', details: error.message });
      }

      return res.status(201).json({
        success: true,
        songs: data,
        count: data.length,
        importBatchId: batchId
      });
    }

    // DELETE: Remove songs
    if (req.method === 'DELETE') {
      const { songIds } = req.body;

      if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
        return res.status(400).json({ error: 'songIds array is required' });
      }

      const { error } = await supabaseService
        .from('music_library')
        .delete()
        .eq('organization_id', targetOrgId)
        .in('id', songIds);

      if (error) {
        console.error('Error deleting songs from library:', error);
        return res.status(500).json({ error: 'Failed to delete songs', details: error.message });
      }

      return res.status(200).json({ success: true, deletedCount: songIds.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Music library API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
