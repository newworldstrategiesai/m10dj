-- Create venue_invitations table for managing performer invitations
-- Enables venues to invite performers to join their roster

CREATE TABLE IF NOT EXISTS venue_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  invited_email TEXT NOT NULL,
  performer_slug TEXT NOT NULL, -- Suggested slug for performer
  performer_name TEXT, -- Suggested name
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  invitation_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Note: Unique constraint for pending invitations is handled via partial unique index below
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_venue_invitations_venue_id 
ON venue_invitations(venue_organization_id);

CREATE INDEX IF NOT EXISTS idx_venue_invitations_token 
ON venue_invitations(invitation_token) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_venue_invitations_email 
ON venue_invitations(invited_email) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_venue_invitations_status 
ON venue_invitations(status);

CREATE INDEX IF NOT EXISTS idx_venue_invitations_expires_at 
ON venue_invitations(expires_at) 
WHERE status = 'pending';

-- Partial unique index: ensure one pending invitation per email per venue
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_invitations_unique_pending
ON venue_invitations(venue_organization_id, invited_email)
WHERE status = 'pending';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_venue_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_invitations_updated_at
  BEFORE UPDATE ON venue_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_invitations_updated_at();

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_venue_invitations()
RETURNS void AS $$
BEGIN
  UPDATE venue_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE venue_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Venue owners/admins can view/manage invitations for their venues
CREATE POLICY "Venue admins can manage invitations"
  ON venue_invitations
  FOR ALL
  TO authenticated
  USING (
    venue_organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() 
      AND organization_type = 'venue'
    )
    OR venue_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  )
  WITH CHECK (
    venue_organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() 
      AND organization_type = 'venue'
    )
    OR venue_organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
      AND is_active = true
    )
  );

-- Policy: Invitees can view their own invitations (by email)
-- Note: This allows users to see invitations sent to their email even before they sign up
CREATE POLICY "Users can view invitations sent to their email"
  ON venue_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their own invitations (to accept them)
CREATE POLICY "Users can accept their own invitations"
  ON venue_invitations
  FOR UPDATE
  TO authenticated
  USING (
    invited_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    invited_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE venue_invitations IS 'Manages invitations sent by venues to performers to join their roster';
COMMENT ON COLUMN venue_invitations.venue_organization_id IS 'The venue organization sending the invitation';
COMMENT ON COLUMN venue_invitations.invited_email IS 'Email address of the performer being invited';
COMMENT ON COLUMN venue_invitations.performer_slug IS 'Suggested slug for the performer (e.g., "dj1", "band1")';
COMMENT ON COLUMN venue_invitations.performer_name IS 'Suggested name for the performer';
COMMENT ON COLUMN venue_invitations.invitation_token IS 'Unique token used in invitation acceptance URL';
COMMENT ON COLUMN venue_invitations.status IS 'Status: pending, accepted, expired, or cancelled';
COMMENT ON COLUMN venue_invitations.expires_at IS 'When the invitation expires (default 30 days)';

-- Create a view for venue roster (active performers)
CREATE OR REPLACE VIEW venue_roster AS
SELECT 
  v.id as venue_id,
  v.name as venue_name,
  v.slug as venue_slug,
  p.id as performer_id,
  p.name as performer_name,
  p.performer_slug,
  p.slug as performer_full_slug,
  p.is_active,
  p.created_at as performer_joined_at,
  au.email as performer_email,
  COALESCE(au.raw_user_meta_data->>'full_name', '') as performer_full_name
FROM organizations v
LEFT JOIN organizations p ON p.parent_organization_id = v.id AND p.organization_type = 'performer'
LEFT JOIN auth.users au ON au.id = p.owner_id
WHERE v.organization_type = 'venue'
ORDER BY v.name, p.created_at;

COMMENT ON VIEW venue_roster IS 'View showing all performers (roster) for each venue';

