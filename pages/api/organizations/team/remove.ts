import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getUserRole, canManageTeam } from '@/utils/permissions';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { organizationId, memberId } = req.query;

    if (!organizationId || !memberId) {
      return res.status(400).json({ error: 'Missing required fields: organizationId, memberId' });
    }

    // Check if user can manage team
    const canManage = await canManageTeam(supabase, organizationId as string, user.id);
    const isAdmin = isPlatformAdmin(user.email || '');

    if (!canManage && !isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions to remove team members' });
    }

    // Get member info
    const { data: member } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .single();

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Prevent removing owner
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', organizationId)
      .single();

    if (org?.owner_id === member.user_id) {
      return res.status(400).json({ error: 'Cannot remove owner. Transfer ownership first.' });
    }

    // Prevent removing yourself if you're the only admin
    if (member.user_id === user.id) {
      const userRole = await getUserRole(supabase, organizationId as string, user.id);
      if (userRole === 'admin') {
        // Check if there are other admins or owners
        const { data: otherAdmins } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .in('role', ['owner', 'admin'])
          .neq('user_id', user.id);

        if (!otherAdmins || otherAdmins.length === 0) {
          return res.status(400).json({
            error: 'Cannot remove yourself',
            message: 'You are the only admin. Add another admin first, or transfer ownership.',
          });
        }
      }
    }

    // Deactivate member (soft delete)
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ is_active: false })
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to remove member', details: updateError.message });
    }

    return res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing team member:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

