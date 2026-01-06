-- SIMPLER FIX: Remove SET statements entirely and use SECURITY DEFINER alone
-- SECURITY DEFINER runs as the function owner (postgres) which bypasses RLS

-- Fix check_performer_parent_access - no SET needed
DROP FUNCTION IF EXISTS public.check_performer_parent_access(UUID, UUID);
CREATE OR REPLACE FUNCTION public.check_performer_parent_access(org_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE owner_id = user_id
    AND organization_type = 'performer'
    AND parent_organization_id = org_id
  );
$$;

-- Fix check_venue_child_access - simplified
DROP FUNCTION IF EXISTS public.check_venue_child_access(UUID, UUID);
CREATE OR REPLACE FUNCTION public.check_venue_child_access(org_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.owner_id = user_id
    AND o.organization_type = 'venue'
    AND o.id = (SELECT parent_organization_id FROM public.organizations WHERE id = org_id)
  ) OR EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = user_id
    AND om.role IN ('owner', 'admin')
    AND om.is_active = true
    AND o.organization_type = 'venue'
    AND o.id = (SELECT parent_organization_id FROM public.organizations WHERE id = org_id)
  );
$$;

-- Fix check_user_organization_membership
DROP FUNCTION IF EXISTS public.check_user_organization_membership(UUID);
CREATE OR REPLACE FUNCTION public.check_user_organization_membership(org_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND is_active = true
  );
$$;

-- Fix check_user_owns_organization
DROP FUNCTION IF EXISTS public.check_user_owns_organization(UUID);
CREATE OR REPLACE FUNCTION public.check_user_owns_organization(org_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id
    AND owner_id = auth.uid()
  );
$$;

-- Fix check_can_view_organization_members
DROP FUNCTION IF EXISTS public.check_can_view_organization_members(UUID);
CREATE OR REPLACE FUNCTION public.check_can_view_organization_members(org_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id
    AND owner_id = auth.uid()
  );
$$;

-- Fix check_user_is_org_admin
DROP FUNCTION IF EXISTS public.check_user_is_org_admin(UUID);
CREATE OR REPLACE FUNCTION public.check_user_is_org_admin(org_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id
    AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND is_active = true
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_performer_parent_access(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_venue_child_access(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_user_organization_membership(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_user_owns_organization(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_can_view_organization_members(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_user_is_org_admin(UUID) TO authenticated, anon;

