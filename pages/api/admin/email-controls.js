/**
 * Email Controls API
 * Manages platform-level and organization-level email master controls
 * 
 * GET: Fetch email control settings
 * POST: Update email control settings
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

    if (organizationId) {
      // Check if user is org admin/owner
      const userRole = await getUserRole(supabase, organizationId, user.id);
      isOrgAdmin = userRole === 'owner' || userRole === 'admin';
    }

    // GET: Fetch email controls
    if (req.method === 'GET') {
      // Platform controls: require super admin
      if (!organizationId && !isSuperAdmin) {
        return res.status(403).json({ error: 'Super admin access required for platform controls' });
      }

      // Organization controls: require org admin
      if (organizationId && !isOrgAdmin && !isSuperAdmin) {
        return res.status(403).json({ error: 'Organization admin access required' });
      }

      // Get platform control
      const { data: platformControl, error: platformError } = await supabase
        .from('email_controls')
        .select('*')
        .is('organization_id', null)
        .maybeSingle();

      if (platformError) {
        console.error('Error fetching platform control:', platformError);
        return res.status(500).json({ error: 'Failed to fetch platform control' });
      }

      // Get organization control if org ID provided
      let orgControl = null;
      if (organizationId) {
        const { data, error: orgError } = await supabase
          .from('email_controls')
          .select('*')
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (orgError) {
          console.error('Error fetching org control:', orgError);
          return res.status(500).json({ error: 'Failed to fetch organization control' });
        }

        orgControl = data;
      }

      return res.status(200).json({
        platform: platformControl,
        organization: orgControl,
        effective: orgControl || platformControl, // Org overrides platform
      });
    }

    // POST: Update email controls
    if (req.method === 'POST') {
      const { control_mode, notes } = req.body;

      if (!control_mode) {
        return res.status(400).json({ error: 'control_mode is required' });
      }

      const validModes = ['all', 'admin_dev_only', 'critical_only', 'disabled'];
      if (!validModes.includes(control_mode)) {
        return res.status(400).json({ 
          error: `Invalid control_mode. Must be one of: ${validModes.join(', ')}` 
        });
      }

      // Platform controls: require super admin
      if (!organizationId && !isSuperAdmin) {
        return res.status(403).json({ error: 'Super admin access required for platform controls' });
      }

      // Organization controls: require org admin
      if (organizationId && !isOrgAdmin && !isSuperAdmin) {
        return res.status(403).json({ error: 'Organization admin access required' });
      }

      // Upsert email control
      const { data, error } = await supabase
        .from('email_controls')
        .upsert(
          {
            organization_id: organizationId || null,
            control_mode,
            updated_by: user.id,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'organization_id',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Error updating email control:', error);
        return res.status(500).json({ error: 'Failed to update email control', details: error.message });
      }

      return res.status(200).json({
        message: organizationId 
          ? 'Organization email control updated successfully'
          : 'Platform email control updated successfully',
        control: data,
      });
    }
  } catch (error) {
    console.error('Error in email controls API:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}
