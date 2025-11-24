-- Add organization_id to admin_settings table for multi-tenant support
-- This allows each organization to have their own payment settings

-- Add organization_id column (nullable initially for migration)
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_organization_id ON admin_settings(organization_id);

-- Backfill existing settings with default organization
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the first organization
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    -- Backfill existing settings
    UPDATE admin_settings 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update RLS policies to include organization filtering
-- Drop existing policies if they exist (using the actual policy names from the original migration)
DROP POLICY IF EXISTS "Users can view their own admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Users can insert their own admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Users can update their own admin settings" ON admin_settings;
DROP POLICY IF EXISTS "Users can delete their own admin settings" ON admin_settings;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid() -- Backward compatibility: also allow by user_id
  );

CREATE POLICY "Users can insert settings for their organization"
  ON admin_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid() -- Backward compatibility
  );

CREATE POLICY "Users can update their organization's settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid() -- Backward compatibility
  );

CREATE POLICY "Users can delete their organization's settings"
  ON admin_settings
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid() -- Backward compatibility
  );

-- Add comment
COMMENT ON COLUMN admin_settings.organization_id IS 'Organization that owns this setting. Required for multi-tenant isolation.';

