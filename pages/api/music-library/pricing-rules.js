/**
 * Song Pricing Rules Management API
 * Handles CRUD operations for special pricing rules
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

    // GET: List pricing rules
    if (req.method === 'GET') {
      const { search, limit = 100, offset = 0 } = req.query;

      let query = supabaseService
        .from('song_pricing_rules')
        .select('*', { count: 'exact' })
        .eq('organization_id', targetOrgId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (search) {
        query = query.or(`song_title.ilike.%${search}%,song_artist.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching pricing rules:', error);
        return res.status(500).json({ error: 'Failed to fetch pricing rules', details: error.message });
      }

      return res.status(200).json({
        rules: data || [],
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }

    // POST: Create or update pricing rule
    if (req.method === 'POST') {
      const { 
        songTitle, 
        songArtist, 
        customPriceCents, 
        appliesToFastTrack = true,
        appliesToRegular = true,
        notes 
      } = req.body;

      if (!songTitle || !songArtist || customPriceCents === undefined) {
        return res.status(400).json({ 
          error: 'songTitle, songArtist, and customPriceCents are required' 
        });
      }

      // Validate price: -1 = deny, 0 = free, or positive number
      if (customPriceCents < -1) {
        return res.status(400).json({ error: 'customPriceCents must be -1 (deny), 0 (free), or positive' });
      }

      const { data, error } = await supabaseService
        .from('song_pricing_rules')
        .upsert({
          organization_id: targetOrgId,
          song_title: songTitle,
          song_artist: songArtist,
          custom_price_cents: customPriceCents,
          applies_to_fast_track: appliesToFastTrack,
          applies_to_regular: appliesToRegular,
          notes: notes || null,
          created_by: session.user.id
        }, {
          onConflict: 'organization_id,normalized_title,normalized_artist'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving pricing rule:', error);
        return res.status(500).json({ error: 'Failed to save pricing rule', details: error.message });
      }

      return res.status(200).json({ success: true, rule: data });
    }

    // DELETE: Remove pricing rule
    if (req.method === 'DELETE') {
      const { ruleIds } = req.body;

      if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
        return res.status(400).json({ error: 'ruleIds array is required' });
      }

      const { error } = await supabaseService
        .from('song_pricing_rules')
        .delete()
        .eq('organization_id', targetOrgId)
        .in('id', ruleIds);

      if (error) {
        console.error('Error deleting pricing rules:', error);
        return res.status(500).json({ error: 'Failed to delete pricing rules', details: error.message });
      }

      return res.status(200).json({ success: true, deletedCount: ruleIds.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Pricing rules API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
