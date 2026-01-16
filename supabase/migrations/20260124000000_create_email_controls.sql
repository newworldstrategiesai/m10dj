-- Create email_controls table for platform and organization-level email master controls
-- Allows super admin to control platform-wide emails and org admins to control org-specific emails

CREATE TABLE IF NOT EXISTS email_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Platform-level control (organization_id is NULL)
  -- Organization-level control (organization_id is set)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  control_mode TEXT NOT NULL DEFAULT 'all' 
    CHECK (control_mode IN ('all', 'admin_dev_only', 'critical_only', 'disabled')),
  
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Only one platform control, one per organization
  UNIQUE(organization_id) -- NULL for platform, UUID for org
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_controls_org_id ON email_controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_controls_platform ON email_controls(organization_id) WHERE organization_id IS NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_email_controls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_controls_updated_at ON email_controls;
CREATE TRIGGER update_email_controls_updated_at
  BEFORE UPDATE ON email_controls
  FOR EACH ROW
  EXECUTE FUNCTION update_email_controls_updated_at();

-- Insert default platform control (all enabled)
INSERT INTO email_controls (organization_id, control_mode) 
VALUES (NULL, 'all')
ON CONFLICT (organization_id) DO NOTHING;

-- Enable RLS
ALTER TABLE email_controls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Platform admins can manage platform email controls" ON email_controls;
DROP POLICY IF EXISTS "Org admins can manage their org email controls" ON email_controls;
DROP POLICY IF EXISTS "Platform admins can view all email controls" ON email_controls;
DROP POLICY IF EXISTS "Org admins can view their org email controls" ON email_controls;
DROP POLICY IF EXISTS "Service role has full access" ON email_controls;

-- Platform admins can view/update platform controls
CREATE POLICY "Platform admins can manage platform email controls"
  ON email_controls FOR ALL
  USING (
    organization_id IS NULL
    AND EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IS NULL
    AND EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Organization owners/admins can view/update their org controls
CREATE POLICY "Org admins can manage their org email controls"
  ON email_controls FOR ALL
  USING (
    organization_id IS NOT NULL
    AND (
      -- User is owner of the organization
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = email_controls.organization_id
        AND owner_id = auth.uid()
      )
      -- OR user is admin/owner member
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = email_controls.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = email_controls.organization_id
        AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = email_controls.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
    )
  );

-- Platform admins can view all controls
CREATE POLICY "Platform admins can view all email controls"
  ON email_controls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Organization admins can view their org's control
CREATE POLICY "Org admins can view their org email controls"
  ON email_controls FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = email_controls.organization_id
        AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = email_controls.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
    )
  );

-- Service role can do everything (for migrations and server-side operations)
CREATE POLICY "Service role has full access"
  ON email_controls FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_controls TO authenticated;
GRANT SELECT ON email_controls TO anon;

-- Add helpful comments
COMMENT ON TABLE email_controls IS 'Master controls for email communications. Platform-level (organization_id NULL) and organization-level (organization_id set) controls. Organization controls override platform controls.';
COMMENT ON COLUMN email_controls.organization_id IS 'NULL for platform-level control, UUID for organization-specific control';
COMMENT ON COLUMN email_controls.control_mode IS 'Control mode: all (all emails), admin_dev_only (only admin/dev emails), critical_only (only critical system emails), disabled (all blocked except critical)';
COMMENT ON COLUMN email_controls.updated_by IS 'User who last updated this control setting';
