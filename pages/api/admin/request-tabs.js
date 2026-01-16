/**
 * Request Tab Visibility API
 * Manages platform-level and organization-level request tab visibility controls
 * 
 * GET: Fetch request tab settings
 * POST: Update request tab settings
 */

import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/utils/auth-helpers/api-auth';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { getUserRole } from '@/utils/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const user = await requireAuth(req, res);
    if (!user || !user.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organizationId from query (for org-level controls) or body
    const organizationId = req.query.organizationId || req.body?.organizationId || null;

    // Check permissions
    const isSuperAdmin = isSuperAdminEmail(user.email);
    let isOrgAdmin = false;
    let isTipJarOrg = false;

    if (organizationId) {
      // Check if user is org admin/owner
      const userRole = await getUserRole(supabase, organizationId, user.id);
      isOrgAdmin = userRole === 'owner' || userRole === 'admin';

      // Check if organization is TipJar
      const { data: org } = await supabase
        .from('organizations')
        .select('product_context')
        .eq('id', organizationId)
        .single();
      
      isTipJarOrg = org?.product_context === 'tipjar';
    }

    // GET: Fetch request tab settings
    if (req.method === 'GET') {
      // Platform controls: require super admin
      if (!organizationId && !isSuperAdmin) {
        return res.status(403).json({ error: 'Super admin access required for platform controls' });
      }

      // Organization controls: require org admin OR TipJar org
      if (organizationId && !isOrgAdmin && !isSuperAdmin && !isTipJarOrg) {
        return res.status(403).json({ error: 'Organization admin access required or TipJar organization required' });
      }

      // Get platform defaults
      const { data: platformDefaults, error: platformError } = await supabase
        .from('request_tab_defaults')
        .select('*')
        .is('organization_id', null)
        .maybeSingle();

      if (platformError) {
        console.error('Error fetching platform defaults:', platformError);
        return res.status(500).json({ error: 'Failed to fetch platform defaults' });
      }

      // Get organization defaults if org ID provided
      let orgDefaults = null;
      if (organizationId) {
        const { data, error: orgError } = await supabase
          .from('request_tab_defaults')
          .select('*')
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (orgError) {
          console.error('Error fetching org defaults:', orgError);
          return res.status(500).json({ error: 'Failed to fetch organization defaults' });
        }

        orgDefaults = data;
      }

      // Effective defaults: org overrides platform
      const effective = orgDefaults || platformDefaults || {
        song_request_enabled: true,
        shoutout_enabled: true,
        tip_enabled: true,
      };

      return res.status(200).json({
        platform: platformDefaults,
        organization: orgDefaults,
        effective,
      });
    }

    // POST: Update request tab settings
    if (req.method === 'POST') {
      const { song_request_enabled, shoutout_enabled, tip_enabled, notes } = req.body;

      // Validate inputs
      if (song_request_enabled !== undefined && typeof song_request_enabled !== 'boolean') {
        return res.status(400).json({ error: 'song_request_enabled must be a boolean' });
      }
      if (shoutout_enabled !== undefined && typeof shoutout_enabled !== 'boolean') {
        return res.status(400).json({ error: 'shoutout_enabled must be a boolean' });
      }
      if (tip_enabled !== undefined && typeof tip_enabled !== 'boolean') {
        return res.status(400).json({ error: 'tip_enabled must be a boolean' });
      }

      // Platform controls: require super admin
      if (!organizationId && !isSuperAdmin) {
        return res.status(403).json({ error: 'Super admin access required for platform controls' });
      }

      // Organization controls: require org admin OR TipJar org
      if (organizationId && !isOrgAdmin && !isSuperAdmin && !isTipJarOrg) {
        return res.status(403).json({ error: 'Organization admin access required or TipJar organization required' });
      }

      // Build update object (only include fields that are provided)
      const updateData = {
        organization_id: organizationId || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        notes: notes || null,
      };

      if (song_request_enabled !== undefined) {
        updateData.song_request_enabled = song_request_enabled;
      }
      if (shoutout_enabled !== undefined) {
        updateData.shoutout_enabled = shoutout_enabled;
      }
      if (tip_enabled !== undefined) {
        updateData.tip_enabled = tip_enabled;
      }

      // Upsert request tab defaults
      const { data, error } = await supabase
        .from('request_tab_defaults')
        .upsert(
          updateData,
          {
            onConflict: 'organization_id',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Error updating request tab defaults:', error);
        return res.status(500).json({ error: 'Failed to update request tab defaults', details: error.message });
      }

      return res.status(200).json({
        message: organizationId 
          ? 'Organization request tab settings updated successfully'
          : 'Platform request tab settings updated successfully',
        defaults: data,
      });
    }
  } catch (error) {
    console.error('Error in request tabs API:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
