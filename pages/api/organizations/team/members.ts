import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getUserRole } from '@/utils/permissions';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { organizationId } = req.query;

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'Missing organizationId' });
    }

    // Check if user has access to this organization
    const userRole = await getUserRole(supabase, organizationId, user.id);
    const isAdmin = isPlatformAdmin(user.email || '');

    if (!userRole && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all members of the organization
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        id,
        role,
        invited_by,
        invited_at,
        joined_at,
        is_active,
        created_at,
        user_id,
        users:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (membersError) {
      return res.status(500).json({ error: 'Failed to fetch members', details: membersError.message });
    }

    // Also include the owner if not already in members list
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id, users:owner_id (id, email, raw_user_meta_data)')
      .eq('id', organizationId)
      .single();

    const membersList = members || [];
    
    // Check if owner is already in members list
    const ownerInMembers = membersList.some(m => m.user_id === org?.owner_id);
    
    if (org && !ownerInMembers) {
      // Add owner to the list
      membersList.unshift({
        id: null,
        role: 'owner',
        invited_by: null,
        invited_at: null,
        joined_at: null,
        is_active: true,
        created_at: null,
        user_id: org.owner_id,
        users: org.users,
      });
    }

    // Format response
    const formattedMembers = membersList.map((member: any) => ({
      id: member.id,
      userId: member.user_id,
      email: member.users?.email || null,
      fullName: member.users?.raw_user_meta_data?.full_name || null,
      role: member.role,
      invitedBy: member.invited_by,
      invitedAt: member.invited_at,
      joinedAt: member.joined_at,
      isActive: member.is_active,
      createdAt: member.created_at,
      isOwner: member.role === 'owner' || member.user_id === org?.owner_id,
    }));

    return res.status(200).json({
      success: true,
      members: formattedMembers,
      count: formattedMembers.length,
    });
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

