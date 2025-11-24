-- Add organization_id to contacts table for multi-tenant support

-- Add organization_id column (nullable initially for migration)
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON contacts(organization_id);

-- Backfill existing contacts with default organization
-- This assumes you have a default organization created
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the first organization (or create one if none exists)
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    -- Backfill existing contacts
    UPDATE contacts 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update RLS policies to include organization filtering
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts for their organization"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's contacts"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON COLUMN contacts.organization_id IS 'Organization that owns this contact. Required for multi-tenant isolation.';

