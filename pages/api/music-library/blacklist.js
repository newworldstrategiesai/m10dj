/**
 * Song Blacklist Management API
 * Handles CRUD operations for blacklisted songs
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationContext } from '@/utils/organization-helpers';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

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

    // GET: List blacklisted songs
    if (req.method === 'GET') {
      const { search, limit = 100, offset = 0 } = req.query;

      let query = supabaseService
        .from('song_blacklist')
        .select('*', { count: 'exact' })
        .eq('organization_id', targetOrgId)
        .order('blacklisted_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (search) {
        query = query.or(`song_title.ilike.%${search}%,song_artist.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching blacklist:', error);
        return res.status(500).json({ error: 'Failed to fetch blacklist', details: error.message });
      }

      return res.status(200).json({
        songs: data || [],
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }

    // POST: Add to blacklist
    if (req.method === 'POST') {
      const { songTitle, songArtist, reason } = req.body;

      if (!songTitle || !songArtist) {
        return res.status(400).json({ error: 'songTitle and songArtist are required' });
      }

      const { data, error } = await supabaseService
        .from('song_blacklist')
        .insert({
          organization_id: targetOrgId,
          song_title: songTitle,
          song_artist: songArtist,
          reason: reason || null,
          blacklisted_by: session.user.id
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Song is already blacklisted' });
        }
        console.error('Error adding to blacklist:', error);
        return res.status(500).json({ error: 'Failed to add to blacklist', details: error.message });
      }

      return res.status(201).json({ success: true, song: data });
    }

    // DELETE: Remove from blacklist
    if (req.method === 'DELETE') {
      const { songIds } = req.body;

      if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
        return res.status(400).json({ error: 'songIds array is required' });
      }

      const { error } = await supabaseService
        .from('song_blacklist')
        .delete()
        .eq('organization_id', targetOrgId)
        .in('id', songIds);

      if (error) {
        console.error('Error removing from blacklist:', error);
        return res.status(500).json({ error: 'Failed to remove from blacklist', details: error.message });
      }

      return res.status(200).json({ success: true, deletedCount: songIds.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Blacklist API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
