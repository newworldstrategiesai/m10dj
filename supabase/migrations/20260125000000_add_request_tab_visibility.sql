-- Add request tab visibility controls to organizations table
-- Allows super admin and TipJar users to control which tabs appear on requests page
-- Tabs: song_request, shoutout, tip

-- Add columns for each tab type (default to true for backward compatibility)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS requests_tab_song_request_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requests_tab_shoutout_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requests_tab_tip_enabled BOOLEAN DEFAULT true;

-- Add platform-level defaults table (similar to email_controls pattern)
CREATE TABLE IF NOT EXISTS request_tab_defaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Platform-level defaults (organization_id is NULL)
  -- Organization-level overrides (organization_id is set)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  song_request_enabled BOOLEAN DEFAULT true,
  shoutout_enabled BOOLEAN DEFAULT true,
  tip_enabled BOOLEAN DEFAULT true,
  
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Only one platform default, one per organization
  UNIQUE(organization_id) -- NULL for platform, UUID for org
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_request_tab_defaults_org_id ON request_tab_defaults(organization_id);
CREATE INDEX IF NOT EXISTS idx_request_tab_defaults_platform ON request_tab_defaults(organization_id) WHERE organization_id IS NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_request_tab_defaults_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_request_tab_defaults_updated_at ON request_tab_defaults;
CREATE TRIGGER update_request_tab_defaults_updated_at
  BEFORE UPDATE ON request_tab_defaults
  FOR EACH ROW
  EXECUTE FUNCTION update_request_tab_defaults_updated_at();

-- Insert default platform defaults (all enabled)
INSERT INTO request_tab_defaults (organization_id, song_request_enabled, shoutout_enabled, tip_enabled) 
VALUES (NULL, true, true, true)
ON CONFLICT (organization_id) DO NOTHING;

-- Enable RLS
ALTER TABLE request_tab_defaults ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Platform admins can manage platform request tab defaults" ON request_tab_defaults;
DROP POLICY IF EXISTS "Org admins can manage their org request tab defaults" ON request_tab_defaults;
DROP POLICY IF EXISTS "Platform admins can view all request tab defaults" ON request_tab_defaults;
DROP POLICY IF EXISTS "Org admins can view their org request tab defaults" ON request_tab_defaults;
DROP POLICY IF EXISTS "Service role has full access" ON request_tab_defaults;

-- Platform admins can view/update platform defaults
CREATE POLICY "Platform admins can manage platform request tab defaults"
  ON request_tab_defaults FOR ALL
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

-- Organization owners/admins can view/update their org defaults
CREATE POLICY "Org admins can manage their org request tab defaults"
  ON request_tab_defaults FOR ALL
  USING (
    organization_id IS NOT NULL
    AND (
      -- User is owner of the organization
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND owner_id = auth.uid()
      )
      -- OR user is admin/owner member
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = request_tab_defaults.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
      -- OR organization is TipJar (product_context = 'tipjar')
      OR EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND product_context = 'tipjar'
        AND (
          owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = request_tab_defaults.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
          )
        )
      )
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = request_tab_defaults.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND product_context = 'tipjar'
        AND (
          owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = request_tab_defaults.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
          )
        )
      )
    )
  );

-- Platform admins can view all defaults
CREATE POLICY "Platform admins can view all request tab defaults"
  ON request_tab_defaults FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Organization admins can view their org's defaults
CREATE POLICY "Org admins can view their org request tab defaults"
  ON request_tab_defaults FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = request_tab_defaults.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND product_context = 'tipjar'
        AND (
          owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = request_tab_defaults.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
          )
        )
      )
    )
  );

-- Service role can do everything (for migrations and server-side operations)
CREATE POLICY "Service role has full access"
  ON request_tab_defaults FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON request_tab_defaults TO authenticated;
GRANT SELECT ON request_tab_defaults TO anon;

-- Add helpful comments
COMMENT ON TABLE request_tab_defaults IS 'Controls which tabs (song request, shoutout, tip) are visible on the requests page. Platform-level (organization_id NULL) and organization-level (organization_id set) controls. Organization controls override platform controls.';
COMMENT ON COLUMN request_tab_defaults.organization_id IS 'NULL for platform-level defaults, UUID for organization-specific overrides';
COMMENT ON COLUMN request_tab_defaults.song_request_enabled IS 'Whether the song request tab is visible';
COMMENT ON COLUMN request_tab_defaults.shoutout_enabled IS 'Whether the shoutout tab is visible';
COMMENT ON COLUMN request_tab_defaults.tip_enabled IS 'Whether the tip tab is visible';

-- Add comments to organizations table columns
COMMENT ON COLUMN organizations.requests_tab_song_request_enabled IS 'Whether song request tab is enabled for this organization (legacy, use request_tab_defaults for new features)';
COMMENT ON COLUMN organizations.requests_tab_shoutout_enabled IS 'Whether shoutout tab is enabled for this organization (legacy, use request_tab_defaults for new features)';
COMMENT ON COLUMN organizations.requests_tab_tip_enabled IS 'Whether tip tab is enabled for this organization (legacy, use request_tab_defaults for new features)';
