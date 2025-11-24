-- Add organization_id to invoices table for multi-tenant support

-- Add organization_id column
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);

-- Backfill existing invoices with default organization
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    UPDATE invoices 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
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
    OR is_platform_admin()
  );

COMMENT ON COLUMN invoices.organization_id IS 'Organization that owns this invoice. Required for multi-tenant isolation.';

