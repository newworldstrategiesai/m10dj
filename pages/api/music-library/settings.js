/**
 * Music Library Settings API
 * Handles organization-level settings for music library management
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

    // GET: Get settings
    if (req.method === 'GET') {
      const { data, error } = await supabaseService
        .from('organizations')
        .select('music_library_enabled, music_library_action, music_library_premium_multiplier, music_library_premium_fixed_cents')
        .eq('id', targetOrgId)
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
      }

      return res.status(200).json({
        music_library_enabled: data.music_library_enabled || false,
        music_library_action: data.music_library_action || 'premium_price',
        music_library_premium_multiplier: data.music_library_premium_multiplier || 2.0,
        music_library_premium_fixed_cents: data.music_library_premium_fixed_cents || null
      });
    }

    // POST/PUT: Update settings
    if (req.method === 'POST' || req.method === 'PUT') {
      const {
        musicLibraryEnabled,
        musicLibraryAction,
        musicLibraryPremiumMultiplier,
        musicLibraryPremiumFixedCents
      } = req.body;

      const updateData = {};

      if (musicLibraryEnabled !== undefined) {
        updateData.music_library_enabled = musicLibraryEnabled;
      }
      if (musicLibraryAction) {
        updateData.music_library_action = musicLibraryAction;
      }
      if (musicLibraryPremiumMultiplier !== undefined) {
        updateData.music_library_premium_multiplier = musicLibraryPremiumMultiplier;
      }
      if (musicLibraryPremiumFixedCents !== undefined) {
        updateData.music_library_premium_fixed_cents = musicLibraryPremiumFixedCents;
      }

      const { data, error } = await supabaseService
        .from('organizations')
        .update(updateData)
        .eq('id', targetOrgId)
        .select('music_library_enabled, music_library_action, music_library_premium_multiplier, music_library_premium_fixed_cents')
        .single();

      if (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ error: 'Failed to update settings', details: error.message });
      }

      return res.status(200).json({ success: true, settings: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
