-- Fix circular dependency in organization RLS policies
-- The "Performers can view parent venue" policy queries organizations from within
-- an organizations policy, which can cause 500 errors with REST API calls

-- Drop the problematic policy
DROP POLICY IF EXISTS "Performers can view parent venue" ON organizations;

-- Recreate it using a more efficient approach that avoids circular dependency
-- Use a function to check parent organization access
CREATE OR REPLACE FUNCTION public.check_performer_parent_access(org_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  performer_org_id UUID;
BEGIN
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_performer_parent_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_performer_parent_access(UUID, UUID) TO anon;

-- Recreate the policy using the function (avoids circular dependency)
CREATE POLICY "Performers can view parent venue"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    public.check_performer_parent_access(id, auth.uid())
  );

-- Also optimize the "Venues can view child performers" policy to use a function
DROP POLICY IF EXISTS "Venues can view child performers" ON organizations;

CREATE OR REPLACE FUNCTION public.check_venue_child_access(org_id UUID, user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  venue_org_id UUID;
  is_member_admin BOOLEAN;
BEGIN
  -- Check if user owns a venue organization that has this org as a child
  SELECT id INTO venue_org_id
  FROM public.organizations
  WHERE owner_id = user_id
  AND organization_type = 'venue'
  AND id = (SELECT parent_organization_id FROM public.organizations WHERE id = org_id)
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
    AND o.id = (SELECT parent_organization_id FROM public.organizations WHERE id = org_id)
  ) INTO is_member_admin;
  
  RETURN is_member_admin;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_venue_child_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_venue_child_access(UUID, UUID) TO anon;

CREATE POLICY "Venues can view child performers"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    public.check_venue_child_access(id, auth.uid())
  );

-- Verify policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Users can view own organizations'
  ) THEN
    RAISE EXCEPTION 'Policy "Users can view own organizations" is missing';
  END IF;
  
  RAISE NOTICE 'All organization RLS policies verified';
END $$;

