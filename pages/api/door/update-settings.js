/**
 * POST /api/door/update-settings
 * Updates door customization settings for an organization.
 * Requires auth. Org owner only.
 * Body: { organizationId, header_text?, subtitle_text?, cover_photo_url?, show_cover_photo?, button_color? }
 */
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_KEYS = ['header_text', 'subtitle_text', 'cover_photo_url', 'show_cover_photo', 'button_color'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { organizationId, ...payload } = req.body || {};
    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    const updates = {};
    for (const key of ALLOWED_KEYS) {
      if (payload[key] !== undefined) {
        updates[key] = payload[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Org owner check
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, door_settings')
      .eq('id', organizationId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found or not owner' });
    }

    const existing = org.door_settings || {};
    const merged = { ...existing, ...updates };

    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ door_settings: merged })
      .eq('id', organizationId);

    if (updateError) {
      console.error('[door/update-settings]', updateError);
      return res.status(500).json({ error: 'Failed to save' });
    }

    return res.status(200).json({ ok: true, door_settings: merged });
  } catch (err) {
    console.error('[door/update-settings]', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
}
