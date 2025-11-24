-- Add organization_id to contracts table for multi-tenant support

-- Add organization_id column
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contracts_organization_id ON contracts(organization_id);

-- Backfill existing contracts with default organization
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    UPDATE contracts 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete contracts" ON contracts;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's contracts"
  ON contracts
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert contracts for their organization"
  ON contracts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's contracts"
  ON contracts
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's contracts"
  ON contracts
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

COMMENT ON COLUMN contracts.organization_id IS 'Organization that owns this contract. Required for multi-tenant isolation.';

