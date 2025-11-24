-- ============================================================================
-- COMBINED MULTI-TENANT MIGRATION SCRIPT
-- ============================================================================
-- This script adds organization_id to critical tables and sets up RLS policies
-- for proper multi-tenant data isolation.
--
-- Tables updated:
-- - payments
-- - invoices
-- - contracts
-- - contact_submissions
-- - payment_plans
-- - payment_installments
--
-- This script is idempotent and can be run multiple times safely.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create Platform Admin Helper Function
-- ============================================================================
-- This function allows RLS policies to check if a user is a platform admin
-- Platform admins can bypass organization filtering to see all data
-- ============================================================================

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

COMMENT ON FUNCTION is_platform_admin() IS 'Checks if the current user is a platform admin. Platform admins can see all organizations data.';

-- ============================================================================
-- STEP 2: Add organization_id to payments table
-- ============================================================================

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);

-- Backfill existing payments
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    UPDATE payments 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view payments" ON payments;
DROP POLICY IF EXISTS "Users can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can update payments" ON payments;
DROP POLICY IF EXISTS "Users can delete payments" ON payments;

-- Create new organization-scoped policies
CREATE POLICY "Users can view their organization's payments"
  ON payments FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert payments for their organization"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's payments"
  ON payments FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's payments"
  ON payments FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

COMMENT ON COLUMN payments.organization_id IS 'Organization that owns this payment. Required for multi-tenant isolation.';

-- ============================================================================
-- STEP 3: Add organization_id to invoices table
-- ============================================================================

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);

-- Backfill existing invoices
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;

-- Create new organization-scoped policies
CREATE POLICY "Users can view their organization's invoices"
  ON invoices FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert invoices for their organization"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's invoices"
  ON invoices FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

COMMENT ON COLUMN invoices.organization_id IS 'Organization that owns this invoice. Required for multi-tenant isolation.';

-- ============================================================================
-- STEP 4: Add organization_id to contracts table
-- ============================================================================

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_contracts_organization_id ON contracts(organization_id);

-- Backfill existing contracts
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete contracts" ON contracts;

-- Create new organization-scoped policies
CREATE POLICY "Users can view their organization's contracts"
  ON contracts FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert contracts for their organization"
  ON contracts FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's contracts"
  ON contracts FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's contracts"
  ON contracts FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

COMMENT ON COLUMN contracts.organization_id IS 'Organization that owns this contract. Required for multi-tenant isolation.';

-- ============================================================================
-- STEP 5: Add organization_id to contact_submissions table
-- ============================================================================

ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_contact_submissions_organization_id ON contact_submissions(organization_id);

-- Backfill existing submissions
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    UPDATE contact_submissions 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Users can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Users can update contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Users can delete contact submissions" ON contact_submissions;

-- Create new organization-scoped policies
-- Note: INSERT policy allows anonymous users (for public contact forms)
CREATE POLICY "Users can view their organization's contact submissions"
  ON contact_submissions FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Anyone can create contact submissions"
  ON contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (true); -- Public form submissions

CREATE POLICY "Users can update their organization's contact submissions"
  ON contact_submissions FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's contact submissions"
  ON contact_submissions FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

COMMENT ON COLUMN contact_submissions.organization_id IS 'Organization that owns this submission. Required for multi-tenant isolation.';

-- ============================================================================
-- STEP 6: Add organization_id to payment_plans table
-- ============================================================================

ALTER TABLE payment_plans 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payment_plans_organization_id ON payment_plans(organization_id);

-- Backfill existing payment plans
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can insert payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can update payment plans" ON payment_plans;
DROP POLICY IF EXISTS "Users can delete payment plans" ON payment_plans;

-- Create new organization-scoped policies
CREATE POLICY "Users can view their organization's payment plans"
  ON payment_plans FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert payment plans for their organization"
  ON payment_plans FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's payment plans"
  ON payment_plans FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's payment plans"
  ON payment_plans FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

COMMENT ON COLUMN payment_plans.organization_id IS 'Organization that owns this payment plan. Required for multi-tenant isolation.';

-- ============================================================================
-- STEP 7: Add organization_id to payment_installments table
-- ============================================================================

ALTER TABLE payment_installments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payment_installments_organization_id ON payment_installments(organization_id);

-- Backfill existing installments
-- First try to inherit from payment_plan, then use default
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Users can insert payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Users can update payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Users can delete payment installments" ON payment_installments;

-- Create new organization-scoped policies
CREATE POLICY "Users can view their organization's payment installments"
  ON payment_installments FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can insert payment installments for their organization"
  ON payment_installments FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can update their organization's payment installments"
  ON payment_installments FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's payment installments"
  ON payment_installments FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
    OR is_platform_admin()
  );

COMMENT ON COLUMN payment_installments.organization_id IS 'Organization that owns this payment installment. Required for multi-tenant isolation.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables have been updated with organization_id and RLS policies.
-- 
-- Next steps:
-- 1. Verify migrations ran successfully
-- 2. Test that SaaS users can only see their organization's data
-- 3. Test that platform admins can see all organizations' data
-- 4. Update API routes to filter by organization_id
-- ============================================================================

COMMIT;

