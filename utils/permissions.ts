/**
 * Permission System for Organization Members
 * 
 * Defines roles and permissions for team members in organizations.
 * Supports solo operators, talent agencies, and venues.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | '*';
}

/**
 * Permission matrix for each role
 */
const ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  owner: [
    { resource: '*', action: '*' }, // All permissions
  ],
  admin: [
    { resource: 'contacts', action: '*' },
    { resource: 'events', action: '*' },
    { resource: 'crowd_requests', action: '*' },
    { resource: 'payments', action: 'read' },
    { resource: 'invoices', action: '*' },
    { resource: 'contracts', action: '*' },
    { resource: 'quotes', action: '*' },
    { resource: 'team', action: 'read' },
    { resource: 'team', action: 'create' }, // Can invite members
    { resource: 'team', action: 'update' }, // Can update member roles
    { resource: 'analytics', action: 'read' },
    { resource: 'settings', action: 'read' },
  ],
  member: [
    { resource: 'contacts', action: 'read' },
    { resource: 'contacts', action: 'create' },
    { resource: 'contacts', action: 'update' },
    { resource: 'events', action: 'read' },
    { resource: 'events', action: 'create' },
    { resource: 'events', action: 'update' },
    { resource: 'crowd_requests', action: 'read' },
    { resource: 'crowd_requests', action: 'create' },
    { resource: 'crowd_requests', action: 'update' },
    { resource: 'quotes', action: 'read' },
    { resource: 'quotes', action: 'create' },
    { resource: 'quotes', action: 'update' },
    { resource: 'analytics', action: 'read' },
  ],
  viewer: [
    { resource: 'contacts', action: 'read' },
    { resource: 'events', action: 'read' },
    { resource: 'crowd_requests', action: 'read' },
    { resource: 'quotes', action: 'read' },
    { resource: 'analytics', action: 'read' },
  ],
};

/**
 * Get user's role in an organization
 * Checks both owner_id and organization_members table
 */
export async function getUserRole(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<OrganizationRole | null> {
  try {
    // First check if user is the owner
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', organizationId)
      .single();
    
    if (org?.owner_id === userId) {
      return 'owner';
    }
    
    // Check members table
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (member?.role) {
      return member.role as OrganizationRole;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if user has permission for a specific resource and action
 */
export async function hasPermission(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> {
  const role = await getUserRole(supabase, organizationId, userId);
  
  if (!role) {
    return false;
  }
  
  const permissions = ROLE_PERMISSIONS[role];
  
  // Check for wildcard permissions
  const hasWildcard = permissions.some(
    p => p.resource === '*' && (p.action === '*' || p.action === action)
  );
  
  if (hasWildcard) {
    return true;
  }
  
  // Check for specific resource permission
  return permissions.some(
    p => (p.resource === resource || p.resource === '*') &&
         (p.action === action || p.action === '*')
  );
}

/**
 * Require permission - throws error if user doesn't have permission
 */
export async function requirePermission(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<void> {
  const allowed = await hasPermission(supabase, organizationId, userId, resource, action);
  
  if (!allowed) {
    throw new Error(`Permission denied: ${action} on ${resource}`);
  }
}

/**
 * Get all organizations a user belongs to (as owner or member)
 */
export async function getUserOrganizations(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ organization: any; role: OrganizationRole }>> {
  try {
    // Get organizations where user is owner
    const { data: ownedOrgs } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', userId);
    
    // Get organizations where user is a member
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    const orgIds = memberships?.map(m => m.organization_id) || [];
    
    let memberOrgs: any[] = [];
    if (orgIds.length > 0) {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);
      
      memberOrgs = data || [];
    }
    
    const result: Array<{ organization: any; role: OrganizationRole }> = [];
    
    // Add owned organizations
    if (ownedOrgs) {
      for (const org of ownedOrgs) {
        result.push({ organization: org, role: 'owner' });
      }
    }
    
    // Add member organizations (avoid duplicates)
    if (memberOrgs && memberships) {
      for (const org of memberOrgs) {
        const membership = memberships.find(m => m.organization_id === org.id);
        if (membership && !result.some(r => r.organization.id === org.id)) {
          result.push({ organization: org, role: membership.role as OrganizationRole });
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error getting user organizations:', error);
    return [];
  }
}

/**
 * Check if user can manage team members
 */
export async function canManageTeam(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, organizationId, userId);
  return role === 'owner' || role === 'admin';
}

/**
 * Check if user can manage organization settings
 */
export async function canManageSettings(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, organizationId, userId);
  return role === 'owner';
}

/**
 * Check if user can access billing/subscription
 */
export async function canAccessBilling(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, organizationId, userId);
  return role === 'owner';
}

