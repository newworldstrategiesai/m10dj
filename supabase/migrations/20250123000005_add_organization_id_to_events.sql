-- Add organization_id to events table for multi-tenant support

-- Add organization_id column (nullable initially for migration)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);

-- Backfill existing events with default organization
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the first organization
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    -- Backfill existing events
    UPDATE events 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update RLS policies to include organization filtering
-- Drop existing policies if they exist (adjust names based on your actual policy names)
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Users can insert events" ON events;
DROP POLICY IF EXISTS "Users can update events" ON events;
DROP POLICY IF EXISTS "Users can delete events" ON events;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's events"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert events for their organization"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's events"
  ON events
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON COLUMN events.organization_id IS 'Organization that owns this event. Required for multi-tenant isolation.';

