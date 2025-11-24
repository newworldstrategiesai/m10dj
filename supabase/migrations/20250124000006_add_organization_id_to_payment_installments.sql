-- Add organization_id to payment_installments table for multi-tenant support

-- Add organization_id column
ALTER TABLE payment_installments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_installments_organization_id ON payment_installments(organization_id);

-- Backfill existing installments with default organization
-- Note: Installments should inherit organization_id from their payment_plan
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    -- First, try to get organization_id from payment_plan
    UPDATE payment_installments pi
    SET organization_id = pp.organization_id
    FROM payment_plans pp
    WHERE pi.payment_plan_id = pp.id
    AND pi.organization_id IS NULL
    AND pp.organization_id IS NOT NULL;
    
    -- For any remaining, use default
    UPDATE payment_installments 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Users can insert payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Users can update payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Users can delete payment installments" ON payment_installments;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's payment installments"
  ON payment_installments
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert payment installments for their organization"
  ON payment_installments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's payment installments"
  ON payment_installments
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's payment installments"
  ON payment_installments
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

COMMENT ON COLUMN payment_installments.organization_id IS 'Organization that owns this payment installment. Required for multi-tenant isolation.';

