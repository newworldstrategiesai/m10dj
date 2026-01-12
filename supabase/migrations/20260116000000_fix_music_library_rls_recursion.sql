-- ============================================================================
-- FIX INFINITE RECURSION IN MUSIC LIBRARY RLS POLICIES
-- ============================================================================
-- The music library policies are directly querying organization_members,
-- which causes infinite recursion. This migration fixes them to use
-- the helper functions that were created to avoid recursion.
-- ============================================================================

BEGIN;

-- Drop existing music library policies
DROP POLICY IF EXISTS "Users can view music library for their organization" ON music_library;
DROP POLICY IF EXISTS "Users can manage music library for their organization" ON music_library;

-- Recreate music library SELECT policy using helper function
CREATE POLICY "Users can view music library for their organization"
  ON music_library FOR SELECT
  TO authenticated
  USING (
    -- User owns the organization (no recursion)
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    -- User is a member of the organization (using helper function to avoid recursion)
    OR public.check_user_organization_membership(auth.uid(), organization_id)
  );

-- Recreate music library ALL policy using helper function
CREATE POLICY "Users can manage music library for their organization"
  ON music_library FOR ALL
  TO authenticated
  USING (
    -- User owns the organization (no recursion)
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    -- User is an admin/owner member (using helper function to avoid recursion)
    OR public.check_user_is_org_admin(auth.uid(), organization_id)
  )
  WITH CHECK (
    -- User owns the organization (no recursion)
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    -- User is an admin/owner member (using helper function to avoid recursion)
    OR public.check_user_is_org_admin(auth.uid(), organization_id)
  );

-- Fix blacklist policies
DROP POLICY IF EXISTS "Users can view blacklist for their organization" ON song_blacklist;
DROP POLICY IF EXISTS "Users can manage blacklist for their organization" ON song_blacklist;

CREATE POLICY "Users can view blacklist for their organization"
  ON song_blacklist FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR public.check_user_organization_membership(auth.uid(), organization_id)
  );

CREATE POLICY "Users can manage blacklist for their organization"
  ON song_blacklist FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR public.check_user_is_org_admin(auth.uid(), organization_id)
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR public.check_user_is_org_admin(auth.uid(), organization_id)
  );

-- Fix pricing rules policies
DROP POLICY IF EXISTS "Users can view pricing rules for their organization" ON song_pricing_rules;
DROP POLICY IF EXISTS "Users can manage pricing rules for their organization" ON song_pricing_rules;

CREATE POLICY "Users can view pricing rules for their organization"
  ON song_pricing_rules FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR public.check_user_organization_membership(auth.uid(), organization_id)
  );

CREATE POLICY "Users can manage pricing rules for their organization"
  ON song_pricing_rules FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR public.check_user_is_org_admin(auth.uid(), organization_id)
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR public.check_user_is_org_admin(auth.uid(), organization_id)
  );

COMMIT;
