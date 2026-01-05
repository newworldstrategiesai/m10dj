-- Add venue account hierarchy support to organizations table
-- Enables venues to invite performers and create nested tip pages

-- Add organization type and hierarchy columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS organization_type TEXT DEFAULT 'individual' 
  CHECK (organization_type IN ('individual', 'venue', 'performer')),
ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS performer_slug TEXT, -- Unique within parent venue
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS billing_covered_by_parent BOOLEAN DEFAULT FALSE;

-- Create composite unique constraint for performer slugs within venue
-- This ensures performer_slug is unique within each parent venue
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_venue_performer_slug 
ON organizations(parent_organization_id, performer_slug) 
WHERE parent_organization_id IS NOT NULL AND performer_slug IS NOT NULL;

-- Index for fast venue lookups (finding all performers under a venue)
CREATE INDEX IF NOT EXISTS idx_organizations_parent_id 
ON organizations(parent_organization_id) 
WHERE parent_organization_id IS NOT NULL;

-- Index for organization type filtering
CREATE INDEX IF NOT EXISTS idx_organizations_type 
ON organizations(organization_type);

-- Index for active status filtering
CREATE INDEX IF NOT EXISTS idx_organizations_is_active 
ON organizations(is_active) 
WHERE is_active = true;

-- Add comments for documentation
COMMENT ON COLUMN organizations.organization_type IS 'Type of organization: individual (default), venue (parent), or performer (child of venue)';
COMMENT ON COLUMN organizations.parent_organization_id IS 'For performer organizations, references the parent venue organization';
COMMENT ON COLUMN organizations.performer_slug IS 'Unique slug for performer within their parent venue (e.g., "dj1" in tipjar.live/silkys/dj1)';
COMMENT ON COLUMN organizations.is_active IS 'Whether the organization is active (venues can deactivate performers)';
COMMENT ON COLUMN organizations.billing_covered_by_parent IS 'For performers, indicates if billing is covered by parent venue subscription';

-- Update RLS policies to support hierarchical access

-- Drop ALL existing policies that we'll recreate (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete own organizations" ON organizations;

-- Policy: Users can view their own organizations
CREATE POLICY "Users can view own organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy: Performers can view their parent venue
CREATE POLICY "Performers can view parent venue"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT parent_organization_id 
      FROM organizations 
      WHERE owner_id = auth.uid() 
      AND organization_type = 'performer'
    )
  );

-- Policy: Venues can view their child performers
CREATE POLICY "Venues can view child performers"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    parent_organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() 
      AND organization_type = 'venue'
    )
    OR parent_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- Policy: Users can view organizations they are members of (via organization_members table)
CREATE POLICY "Users can view organizations they are members of"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Policy: Users can create their own organizations (including performers accepting invitations)
CREATE POLICY "Users can create own organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Policy: Users can update their own organizations
CREATE POLICY "Users can update own organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy: Venues can update their child performers (for activation/deactivation, slug changes)
CREATE POLICY "Venues can update child performers"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    parent_organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() 
      AND organization_type = 'venue'
    )
    OR parent_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  )
  WITH CHECK (
    parent_organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() 
      AND organization_type = 'venue'
    )
    OR parent_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- Policy: Users can delete their own organizations
CREATE POLICY "Users can delete own organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Add constraints: Drop existing if they exist, then create new ones
ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS check_performer_has_parent;

ALTER TABLE organizations
ADD CONSTRAINT check_performer_has_parent 
CHECK (
  (organization_type = 'performer' AND parent_organization_id IS NOT NULL)
  OR (organization_type != 'performer')
);

ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS check_venue_no_parent;

ALTER TABLE organizations
ADD CONSTRAINT check_venue_no_parent 
CHECK (
  (organization_type = 'venue' AND parent_organization_id IS NULL)
  OR (organization_type != 'venue')
);

ALTER TABLE organizations
DROP CONSTRAINT IF EXISTS check_performer_has_slug;

ALTER TABLE organizations
ADD CONSTRAINT check_performer_has_slug 
CHECK (
  (organization_type = 'performer' AND performer_slug IS NOT NULL)
  OR (organization_type != 'performer')
);

