-- Create organization_members table for team management
-- This enables multi-user support for organizations (agencies, venues, etc.)

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);
CREATE INDEX IF NOT EXISTS idx_organization_members_active ON organization_members(is_active) WHERE is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_organization_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_members_updated_at();

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of organizations they belong to
CREATE POLICY "Users can view members of their organizations"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND is_active = true
    )
    OR is_platform_admin()
  );

-- Policy: Owners and admins can manage members
CREATE POLICY "Owners and admins can manage members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
    OR is_platform_admin()
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
    OR is_platform_admin()
  );

-- Policy: Users can update their own membership (e.g., accept invitation)
CREATE POLICY "Users can update their own membership"
  ON organization_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-create owner membership when organization is created
-- This ensures the owner is also in the members table
-- Only create membership for claimed organizations (owner_id IS NOT NULL)
CREATE OR REPLACE FUNCTION create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create membership for organizations with an owner (claimed orgs)
  -- Unclaimed organizations (owner_id IS NULL) don't get members
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO organization_members (
      organization_id,
      user_id,
      role,
      joined_at,
      is_active
    ) VALUES (
      NEW.id,
      NEW.owner_id,
      'owner',
      NOW(),
      true
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_owner_membership_on_org_create
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_owner_membership();

-- Backfill existing organizations: create owner memberships for existing orgs
INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  joined_at,
  is_active
)
SELECT 
  id,
  owner_id,
  'owner',
  created_at,
  true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members 
  WHERE organization_members.organization_id = organizations.id 
  AND organization_members.user_id = organizations.owner_id
)
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Remove UNIQUE constraint on organizations.owner_id to allow multiple owners via members table
-- Note: We keep owner_id for backwards compatibility and to identify the primary owner
-- But we don't enforce uniqueness anymore since members table handles multiple users
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_owner_id_key;

-- Add comment
COMMENT ON TABLE organization_members IS 'Team members for organizations. Enables multi-user support for agencies, venues, etc.';
COMMENT ON COLUMN organization_members.role IS 'Role: owner (full access), admin (manage team + data), member (create/edit data), viewer (read-only)';
COMMENT ON COLUMN organization_members.invited_by IS 'User who sent the invitation';
COMMENT ON COLUMN organization_members.joined_at IS 'When the user accepted the invitation and joined';

