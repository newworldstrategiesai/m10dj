-- Add organization_id to payments table for multi-tenant support

-- Add organization_id column
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);

-- Backfill existing payments with default organization
-- This assigns existing payments to the first organization (platform admin's org)
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the first organization
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    -- Backfill existing payments
    UPDATE payments 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update RLS policies to include organization filtering
-- Drop existing policies if they exist (adjust names based on your actual policy names)
DROP POLICY IF EXISTS "Users can view payments" ON payments;
DROP POLICY IF EXISTS "Users can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can update payments" ON payments;
DROP POLICY IF EXISTS "Users can delete payments" ON payments;

-- Create helper function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email IN (
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert payments for their organization"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

-- Add comment
COMMENT ON COLUMN payments.organization_id IS 'Organization that owns this payment. Required for multi-tenant isolation.';

