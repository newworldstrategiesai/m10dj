-- Fix RLS errors causing 500 and 406 errors
-- This migration addresses:
-- 1. 500 errors on organization_members (infinite recursion)
-- 2. 406 errors on contact_submissions (RLS blocking duplicate checks)
-- 3. 406 errors on crowd_requests (RLS blocking queries)

BEGIN;

-- ============================================================================
-- 1. Fix organization_members RLS recursion
-- ============================================================================

-- The issue is that the policy might still cause recursion in some cases
-- Let's ensure the helper function properly disables RLS
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
  -- Explicitly disable RLS for this function to prevent recursion
  SET LOCAL row_security = off;
  
  -- Check if user owns the organization (this is safe, no recursion)
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
    AND owner_id = check_can_view_organization_members.user_id
  ) INTO can_view;
  
  -- Also check if user is a team member (but do it safely without recursion)
  IF NOT can_view THEN
    -- Use row_security = off to prevent RLS from blocking this query
    SET LOCAL row_security = off;
    SELECT EXISTS (
      SELECT 1
      FROM public.organization_members
      WHERE organization_id = org_id
      AND user_id = check_can_view_organization_members.user_id
      AND is_active = true
    ) INTO can_view;
  END IF;
  
  RETURN can_view;
END;
$$;

-- Recreate the policy to be more explicit
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
CREATE POLICY "Users can view members of their organizations"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can always see their own membership (no recursion)
    user_id = auth.uid()
    -- User can see members if they own the organization (checked via organizations table, no recursion)
    OR public.check_can_view_organization_members(auth.uid(), organization_id)
    -- Platform admins can see all
    OR is_platform_admin()
  );

-- ============================================================================
-- 2. Fix contact_submissions RLS to allow duplicate checks
-- ============================================================================

-- The issue is that duplicate check queries might not include organization_id
-- We need to allow platform admins and service role to query without organization_id
-- Also allow queries that check for duplicates (which might not have org_id set yet)

-- Update the SELECT policy to be more permissive for duplicate checks
DROP POLICY IF EXISTS "Users can view their organization's contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Platform admins can view all contact submissions" ON contact_submissions;

-- Create separate policy for platform admins
CREATE POLICY "Platform admins can view all contact submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Create policy for organization owners (with team member support)
CREATE POLICY "Users can view their organization's contact submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ============================================================================
-- 3. Fix crowd_requests RLS to allow duplicate checks
-- ============================================================================

-- Update crowd_requests policies to allow platform admins and handle NULL organization_id
DROP POLICY IF EXISTS "Users can view their organization's crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Platform admins can view all crowd requests" ON crowd_requests;

-- Create separate policy for platform admins
CREATE POLICY "Platform admins can view all crowd requests"
  ON crowd_requests
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());

-- Create policy for organization owners (with team member support)
CREATE POLICY "Users can view their organization's crowd requests"
  ON crowd_requests
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    -- Allow viewing requests with NULL organization_id (for public/legacy requests)
    OR organization_id IS NULL
  );

COMMIT;
