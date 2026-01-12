-- ============================================================================
-- FIX INFINITE RECURSION IN ORGANIZATIONS UPDATE RLS POLICIES
-- ============================================================================
-- The "Venues can update child performers" policy was recreated but may still
-- cause recursion if it queries organization_members directly. This migration
-- ensures all UPDATE policies use helper functions to avoid recursion.
-- ============================================================================

BEGIN;

-- Ensure the helper functions exist (they should from previous migrations)
-- If they don't exist, the migration will fail, which is good - it means
-- the previous migration wasn't run

-- Drop and recreate "Venues can update child performers" policy using helper function
DROP POLICY IF EXISTS "Venues can update child performers" ON organizations;

CREATE POLICY "Venues can update child performers"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    public.check_venue_child_access(id, auth.uid())
  )
  WITH CHECK (
    public.check_venue_child_access(id, auth.uid())
  );

COMMIT;
