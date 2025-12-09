import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getUserRole, canManageTeam } from '@/utils/permissions';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { organizationId, memberId, role } = req.body;

    if (!organizationId || !memberId || !role) {
      return res.status(400).json({ error: 'Missing required fields: organizationId, memberId, role' });
    }

    // Validate role
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, member, or viewer' });
    }

    // Check if user can manage team
    const canManage = await canManageTeam(supabase, organizationId, user.id);
    const isAdmin = isPlatformAdmin(user.email || '');

    if (!canManage && !isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions to update team member roles' });
    }

    // Prevent changing owner role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .single();

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Check if trying to change owner
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', organizationId)
      .single();

    if (org?.owner_id === member.user_id) {
      return res.status(400).json({ error: 'Cannot change owner role. Transfer ownership first.' });
    }

    // Update role
    const { data: updatedMember, error: updateError } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update role', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      member: updatedMember,
    });
  } catch (error: any) {
    console.error('Error updating team member role:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

