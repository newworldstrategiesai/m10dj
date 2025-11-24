-- Add organization_id to contact_submissions table for multi-tenant support

-- Add organization_id column
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_submissions_organization_id ON contact_submissions(organization_id);

-- Backfill existing submissions with default organization
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

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Users can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Users can update contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Users can delete contact submissions" ON contact_submissions;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's contact submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Anyone can create contact submissions"
  ON contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true); -- Public form submissions

CREATE POLICY "Users can update their organization's contact submissions"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

CREATE POLICY "Users can delete their organization's contact submissions"
  ON contact_submissions
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR is_platform_admin()
  );

COMMENT ON COLUMN contact_submissions.organization_id IS 'Organization that owns this submission. Required for multi-tenant isolation.';

