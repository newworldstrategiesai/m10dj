-- Fix RLS helper functions that use SET statements
-- SET is not allowed in STABLE functions, must use VOLATILE

BEGIN;

-- Drop and recreate check_performer_parent_access as VOLATILE
DROP FUNCTION IF EXISTS public.check_performer_parent_access(UUID, UUID);
CREATE OR REPLACE FUNCTION public.check_performer_parent_access(org_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE  -- Changed from STABLE to allow SET statements
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

-- Drop and recreate check_venue_child_access as VOLATILE
DROP FUNCTION IF EXISTS public.check_venue_child_access(UUID, UUID);
CREATE OR REPLACE FUNCTION public.check_venue_child_access(org_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE  -- Changed from STABLE to allow SET statements
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

-- Drop and recreate check_user_organization_membership as VOLATILE
DROP FUNCTION IF EXISTS public.check_user_organization_membership(UUID);
CREATE OR REPLACE FUNCTION public.check_user_organization_membership(org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE  -- Changed from STABLE to allow SET statements
AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  -- Disable RLS for this function to prevent infinite recursion
  SET LOCAL row_security = off;
  
  -- Check if user is a member of this organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND is_active = true
  ) INTO is_member;
  
  RETURN is_member;
END;
$$;

-- Drop and recreate check_user_owns_organization as VOLATILE
DROP FUNCTION IF EXISTS public.check_user_owns_organization(UUID);
CREATE OR REPLACE FUNCTION public.check_user_owns_organization(org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE  -- Changed from STABLE to allow SET statements
AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  -- Disable RLS for this function to prevent infinite recursion
  SET LOCAL row_security = off;
  
  -- Check if user owns this organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
    AND owner_id = auth.uid()
  ) INTO is_owner;
  
  RETURN is_owner;
END;
$$;

-- Drop and recreate check_can_view_organization_members as VOLATILE
DROP FUNCTION IF EXISTS public.check_can_view_organization_members(UUID);
CREATE OR REPLACE FUNCTION public.check_can_view_organization_members(org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE  -- Changed from STABLE to allow SET statements
AS $$
DECLARE
  is_owner BOOLEAN;
BEGIN
  -- Disable RLS for this function to prevent infinite recursion
  SET LOCAL row_security = off;
  
  -- Check if user owns this organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
    AND owner_id = auth.uid()
  ) INTO is_owner;
  
  RETURN is_owner;
END;
$$;

-- Drop and recreate check_user_is_org_admin as VOLATILE
DROP FUNCTION IF EXISTS public.check_user_is_org_admin(UUID);
CREATE OR REPLACE FUNCTION public.check_user_is_org_admin(org_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE  -- Changed from STABLE to allow SET statements
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Disable RLS for this function to prevent infinite recursion
  SET LOCAL row_security = off;
  
  -- Check if user owns this organization
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
    AND owner_id = auth.uid()
  ) INTO is_admin;
  
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Check if user is an admin member
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_performer_parent_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_performer_parent_access(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_venue_child_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_venue_child_access(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_user_organization_membership(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_organization_membership(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_user_owns_organization(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_owns_organization(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_can_view_organization_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_view_organization_members(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_user_is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_is_org_admin(UUID) TO anon;

COMMIT;

