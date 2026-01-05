-- Fix infinite recursion in RLS policies for organizations and organization_members
-- The issue is that SECURITY DEFINER functions still trigger RLS policies
-- We need to explicitly disable RLS inside the functions

BEGIN;

-- Drop existing policies that depend on the functions first
DROP POLICY IF EXISTS "Performers can view parent venue" ON organizations;
DROP POLICY IF EXISTS "Venues can view child performers" ON organizations;

-- Drop existing functions that cause recursion (now safe since policies are dropped)
DROP FUNCTION IF EXISTS public.check_performer_parent_access(UUID, UUID);
DROP FUNCTION IF EXISTS public.check_venue_child_access(UUID, UUID);

-- Recreate check_performer_parent_access with RLS disabled
CREATE OR REPLACE FUNCTION public.check_performer_parent_access(org_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  performer_org_id UUID;
BEGIN
  -- Disable RLS for this function to prevent infinite recursion
  SET LOCAL row_security = off;
  
  -- Check if user owns a performer organization that has this org as parent
  SELECT id INTO performer_org_id
  FROM public.organizations
  WHERE owner_id = user_id
  AND organization_type = 'performer'
  AND parent_organization_id = org_id
  LIMIT 1;
  
  RETURN performer_org_id IS NOT NULL;
END;
$$;

-- Recreate check_venue_child_access with RLS disabled
CREATE OR REPLACE FUNCTION public.check_venue_child_access(org_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  venue_org_id UUID;
  is_member_admin BOOLEAN;
BEGIN
  -- Disable RLS for this function to prevent infinite recursion
  SET LOCAL row_security = off;
  
  -- Check if user owns a venue organization that has this org as a child
  SELECT id INTO venue_org_id
  FROM public.organizations
  WHERE owner_id = user_id
  AND organization_type = 'venue'
  AND id = (
    SELECT parent_organization_id 
    FROM public.organizations 
    WHERE id = org_id
    LIMIT 1
  )
  LIMIT 1;
  
  IF venue_org_id IS NOT NULL THEN
    RETURN true;
  END IF;
  
  -- Check if user is an admin/owner member of a venue that has this org as a child
  -- Note: We query organization_members directly without RLS since we disabled it
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = user_id
    AND om.role IN ('owner', 'admin')
    AND om.is_active = true
    AND o.organization_type = 'venue'
    AND o.id = (
      SELECT parent_organization_id 
      FROM public.organizations 
      WHERE id = org_id
      LIMIT 1
    )
  ) INTO is_member_admin;
  
  RETURN is_member_admin;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_performer_parent_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_performer_parent_access(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_venue_child_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_venue_child_access(UUID, UUID) TO anon;

-- Now fix the organization_members policies that are causing recursion
-- The issue is that organization_members policies query organizations,
-- which then query organization_members, creating a loop

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON organizations;

-- Create a helper function to check organization membership without triggering RLS
CREATE OR REPLACE FUNCTION public.check_user_organization_membership(user_id UUID, org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  -- Disable RLS for this function
  SET LOCAL row_security = off;
  
  -- Check if user is a member of the organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = check_user_organization_membership.user_id
    AND is_active = true
  ) INTO is_member;
  
  RETURN is_member;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_organization_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_organization_membership(UUID, UUID) TO anon;

-- Create a helper function to check if user owns an organization
CREATE OR REPLACE FUNCTION public.check_user_owns_organization(user_id UUID, org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  -- Disable RLS for this function
  SET LOCAL row_security = off;
  
  -- Check if user owns the organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
    AND owner_id = check_user_owns_organization.user_id
  ) INTO is_owner;
  
  RETURN is_owner;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_owns_organization(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_owns_organization(UUID, UUID) TO anon;

-- Drop all existing organization_members policies that might cause recursion
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Users can insert into organization_members" ON organization_members;
DROP POLICY IF EXISTS "Users can update organization_members" ON organization_members;
DROP POLICY IF EXISTS "Users can delete organization_members" ON organization_members;

-- Create a helper function to check if user can view organization members
CREATE OR REPLACE FUNCTION public.check_can_view_organization_members(user_id UUID, org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  can_view BOOLEAN;
BEGIN
  -- Disable RLS for this function
  SET LOCAL row_security = off;
  
  -- Check if user owns the organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
    AND owner_id = check_can_view_organization_members.user_id
  ) INTO can_view;
  
  IF can_view THEN
    RETURN true;
  END IF;
  
  -- Check if user is a member of the organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = check_can_view_organization_members.user_id
    AND is_active = true
  ) INTO can_view;
  
  RETURN can_view;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_can_view_organization_members(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_view_organization_members(UUID, UUID) TO anon;

-- Create a helper function to check if user is admin/owner of organization
CREATE OR REPLACE FUNCTION public.check_user_is_org_admin(user_id UUID, org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Disable RLS for this function
  SET LOCAL row_security = off;
  
  -- Check if user owns the organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
    AND owner_id = check_user_is_org_admin.user_id
  ) INTO is_admin;
  
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Check if user is an admin/owner member
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = check_user_is_org_admin.user_id
    AND role IN ('owner', 'admin')
    AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_is_org_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_is_org_admin(UUID, UUID) TO anon;

-- Recreate organization_members SELECT policy using the helper function
CREATE POLICY "Users can view members of their organizations"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.check_can_view_organization_members(auth.uid(), organization_id)
  );

-- Recreate organization_members INSERT/UPDATE/DELETE policy using helper function
CREATE POLICY "Owners and admins can manage members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    public.check_user_is_org_admin(auth.uid(), organization_id)
  )
  WITH CHECK (
    public.check_user_is_org_admin(auth.uid(), organization_id)
  );

-- Recreate organizations SELECT policy for members using the helper function
CREATE POLICY "Users can view organizations they are members of"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    public.check_user_organization_membership(auth.uid(), id)
  );

-- Verify all policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Users can view own organizations'
  ) THEN
    RAISE EXCEPTION 'Policy "Users can view own organizations" is missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_members' 
    AND policyname = 'Users can view members of their organizations'
  ) THEN
    RAISE EXCEPTION 'Policy "Users can view members of their organizations" is missing';
  END IF;
  
  RAISE NOTICE 'All RLS policies verified - infinite recursion should be fixed';
END $$;

COMMIT;

