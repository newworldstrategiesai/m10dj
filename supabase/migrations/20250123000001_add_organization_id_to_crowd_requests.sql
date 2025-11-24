-- Add organization_id to crowd_requests table for multi-tenant support
-- This is the first step in converting crowd_requests to be organization-scoped

-- First, ensure the organizations table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organizations') THEN
    RAISE EXCEPTION 'Organizations table does not exist. Please run migration 20250123000000_create_organizations_table.sql first.';
  END IF;
END $$;

-- Check if crowd_requests table exists, if not, create it first
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crowd_requests') THEN
    RAISE EXCEPTION 'crowd_requests table does not exist. Please run migration 20250121000000_create_crowd_requests.sql first.';
  END IF;
END $$;

-- Add organization_id column (nullable initially for migration)
ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_crowd_requests_organization_id ON crowd_requests(organization_id);

-- Create a default organization for existing data (if any exists)
-- This will be used to backfill existing crowd_requests
DO $$
DECLARE
  default_org_id UUID;
  admin_user_id UUID;
BEGIN
  -- Get the first admin user (or create a placeholder)
  SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Create default organization for existing data
    INSERT INTO organizations (name, slug, owner_id, subscription_tier, subscription_status)
    VALUES ('M10 DJ Company', 'm10dj', admin_user_id, 'enterprise', 'active')
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO default_org_id;
    
    -- Backfill existing crowd_requests with the default organization
    IF default_org_id IS NOT NULL THEN
      UPDATE crowd_requests 
      SET organization_id = default_org_id
      WHERE organization_id IS NULL;
    END IF;
  END IF;
END $$;

-- Now make organization_id required (after backfilling)
-- Note: We'll keep it nullable for now to allow public requests, but all authenticated requests must have org_id
-- We can add a constraint later if needed

-- Update RLS policies to include organization filtering
-- Drop existing policies first (they may have been created by the original table creation migration)
DROP POLICY IF EXISTS "Admins can view all crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Admins can update crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON crowd_requests;
DROP POLICY IF EXISTS "Anyone can create crowd requests" ON crowd_requests;

-- New policy: Users can view their organization's crowd requests
CREATE POLICY "Users can view their organization's crowd requests"
  ON crowd_requests
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Policy: Anyone can insert crowd requests (for public QR code pages)
-- But we'll set organization_id in the application layer
CREATE POLICY "Anyone can create crowd requests"
  ON crowd_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can update their organization's crowd requests
CREATE POLICY "Users can update their organization's crowd requests"
  ON crowd_requests
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can delete their organization's crowd requests
CREATE POLICY "Users can delete their organization's crowd requests"
  ON crowd_requests
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON COLUMN crowd_requests.organization_id IS 'Organization that owns this crowd request. Required for multi-tenant isolation.';

