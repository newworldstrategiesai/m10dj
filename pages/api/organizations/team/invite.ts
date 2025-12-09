import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getUserRole, canManageTeam } from '@/utils/permissions';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { canAddTeamMembers } from '@/utils/subscription-helpers';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { organizationId, email, role } = req.body;

    if (!organizationId || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields: organizationId, email, role' });
    }

    // Validate role
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, member, or viewer' });
    }

    // Check if user can manage team
    const canManage = await canManageTeam(supabase, organizationId, user.id);
    const isAdmin = isPlatformAdmin(user.email || '');

    if (!canManage && !isAdmin) {
      return res.status(403).json({ error: 'Insufficient permissions to invite team members' });
    }

    // Check if organization exists and get full org data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Enforce subscription limits (skip for platform admins)
    if (!isAdmin) {
      const featureCheck = canAddTeamMembers(org);
      
      if (!featureCheck.allowed) {
        return res.status(403).json({
          error: 'Team members not available',
          message: featureCheck.reason,
          upgradeRequired: featureCheck.upgradeRequired,
          upgradeTier: featureCheck.upgradeTier,
        });
      }
    }

    // Check if user exists in auth
    let inviteeUserId: string | null = null;
    
    try {
      // Try to get user by email (requires admin access)
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (!listError && users) {
        const invitee = users.find(u => u.email === email);
        if (invitee) {
          inviteeUserId = invitee.id;
        }
      }
    } catch (error) {
      // If we can't list users, we'll create an invitation record
      console.log('Cannot check existing users, will create invitation');
    }

    if (inviteeUserId) {
      // User exists - add to members table
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: inviteeUserId,
          role,
          invited_by: user.id,
          joined_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (memberError) {
        // Check if already a member
        if (memberError.code === '23505') { // Unique constraint violation
          return res.status(400).json({ error: 'User is already a member of this organization' });
        }
        return res.status(500).json({ error: 'Failed to add member', details: memberError.message });
      }

      // TODO: Send notification email to the invited user
      // await sendInvitationEmail(email, org.name, role);

      return res.status(200).json({
        success: true,
        message: 'Team member added successfully',
        member,
      });
    } else {
      // User doesn't exist - create invitation record
      // For now, we'll return an error suggesting the user sign up first
      // In a full implementation, you'd create an invitations table and send an email
      return res.status(400).json({
        error: 'User not found',
        message: 'The user must sign up first before being added to the organization',
        suggestion: 'Send them an invitation link to sign up, then add them to the team',
      });
    }
  } catch (error: any) {
    console.error('Error inviting team member:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

