-- Add organization_id to payment_plans table for multi-tenant support

-- Add organization_id column
ALTER TABLE payment_plans 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_plans_organization_id ON payment_plans(organization_id);

-- Backfill existing payment plans with default organization
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    UPDATE payment_plans 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can insert payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can update payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can delete payment plans" ON payment_plans;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's payment plans"
  ON payment_plans
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert payment plans for their organization"
  ON payment_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's payment plans"
  ON payment_plans
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's payment plans"
  ON payment_plans
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

COMMENT ON COLUMN payment_plans.organization_id IS 'Organization that owns this payment plan. Required for multi-tenant isolation.';

