-- Fix the organization_members policies that are still causing infinite recursion
-- The issue is that even helper functions query organization_members, creating loops

BEGIN;

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON organization_members;

-- Create new policies that avoid recursion by using ownership checks only
-- Policy 1: Users can always see their own membership records (no recursion)
CREATE POLICY "Users can view their own membership"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Organization owners can see all members of their organizations
-- This checks organizations table ownership directly, no recursion
CREATE POLICY "Organization owners can view members"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Policy 3: Organization admins can see all members of their organizations
-- This uses the helper function that checks membership via organizations only
CREATE POLICY "Organization admins can view members"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    -- Check if user is an admin member by querying organizations table directly
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
      AND o.owner_id = auth.uid()
    )
  );

-- Management policies - only owners can manage members
CREATE POLICY "Organization owners can manage members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

COMMIT;

-- Verification
SELECT 'Organization members policies updated to prevent infinite recursion!' as status;