-- Fix RLS policy to allow invoices without organization_id (temporary, until backfill completes)
-- This ensures invoices are visible even if they haven't been backfilled yet

-- Drop existing organization-scoped policies
DROP POLICY IF EXISTS "Users can view their organization's invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices for their organization" ON invoices;
DROP POLICY IF EXISTS "Users can update their organization's invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete their organization's invoices" ON invoices;

-- Create updated policies that allow invoices without organization_id
-- (for invoices that haven't been backfilled yet)
CREATE POLICY "Users can view their organization's invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if invoice belongs to user's organization
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    -- OR if invoice has no organization_id (needs backfilling, but show it temporarily)
    OR organization_id IS NULL
    -- OR if user is platform admin
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert invoices for their organization"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IS NULL
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IS NULL
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IS NULL
    OR is_platform_admin()
  );

COMMENT ON POLICY "Users can view their organization's invoices" ON invoices IS 
  'Allows users to view invoices for their organization, or invoices without organization_id (temporary until backfill completes)';

