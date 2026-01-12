/**
 * Duplicate Rules Management API
 * Handles organization-level duplicate handling rules
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

    // GET: Get duplicate rules for organization
    if (req.method === 'GET') {
      const { data, error } = await supabaseService
        .from('song_duplicate_rules')
        .select('*')
        .eq('organization_id', targetOrgId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching duplicate rules:', error);
        return res.status(500).json({ error: 'Failed to fetch duplicate rules', details: error.message });
      }

      // Return default rules if none exist
      if (!data) {
        return res.status(200).json({
          organization_id: targetOrgId,
          enable_duplicate_detection: true,
          duplicate_action: 'premium_price',
          duplicate_time_window_minutes: 60,
          duplicate_premium_multiplier: 1.5,
          duplicate_premium_fixed_cents: null,
          match_by_exact_title: true,
          match_by_exact_artist: true,
          match_case_sensitive: false
        });
      }

      return res.status(200).json(data);
    }

    // POST/PUT: Update duplicate rules
    if (req.method === 'POST' || req.method === 'PUT') {
      const {
        enableDuplicateDetection,
        duplicateAction,
        duplicateTimeWindowMinutes,
        duplicatePremiumMultiplier,
        duplicatePremiumFixedCents,
        matchByExactTitle,
        matchByExactArtist,
        matchCaseSensitive
      } = req.body;

      const updateData = {
        organization_id: targetOrgId,
        enable_duplicate_detection: enableDuplicateDetection !== undefined ? enableDuplicateDetection : true,
        duplicate_action: duplicateAction || 'premium_price',
        duplicate_time_window_minutes: duplicateTimeWindowMinutes || 60,
        duplicate_premium_multiplier: duplicatePremiumMultiplier || 1.5,
        duplicate_premium_fixed_cents: duplicatePremiumFixedCents !== undefined ? duplicatePremiumFixedCents : null,
        match_by_exact_title: matchByExactTitle !== undefined ? matchByExactTitle : true,
        match_by_exact_artist: matchByExactArtist !== undefined ? matchByExactArtist : true,
        match_case_sensitive: matchCaseSensitive !== undefined ? matchCaseSensitive : false,
        updated_by: session.user.id
      };

      const { data, error } = await supabaseService
        .from('song_duplicate_rules')
        .upsert(updateData, {
          onConflict: 'organization_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving duplicate rules:', error);
        return res.status(500).json({ error: 'Failed to save duplicate rules', details: error.message });
      }

      return res.status(200).json({ success: true, rules: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Duplicate rules API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
