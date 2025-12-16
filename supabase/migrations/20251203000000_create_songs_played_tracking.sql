-- Create songs_played table for automatic song recognition tracking
-- This table tracks songs detected via audio recognition during events

-- Ensure is_platform_admin function exists (if not already created)
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email IN (
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TABLE IF NOT EXISTS songs_played (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Event linkage
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organization_id UUID, -- For multi-tenant isolation
  
  -- Song identification (from recognition service)
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  recognition_confidence DECIMAL(3,2), -- 0.00 to 1.00 confidence score
  recognition_service TEXT DEFAULT 'audd', -- 'audd', 'shazam', 'acrcloud', 'manual'
  
  -- Recognition metadata
  recognition_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  audio_sample_duration_seconds INTEGER, -- How long the sample was (typically 3-5 seconds)
  recognition_response JSONB, -- Full API response for debugging/audit
  
  -- Matching to requests
  matched_crowd_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL,
  auto_marked_as_played BOOLEAN DEFAULT FALSE, -- Whether we auto-updated crowd_request status
  
  -- Manual overrides
  is_manual_entry BOOLEAN DEFAULT FALSE, -- If DJ manually added this
  is_false_positive BOOLEAN DEFAULT FALSE, -- If recognition was wrong
  verified_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_songs_played_event_id ON songs_played(event_id);
CREATE INDEX IF NOT EXISTS idx_songs_played_contact_id ON songs_played(contact_id);
CREATE INDEX IF NOT EXISTS idx_songs_played_organization_id ON songs_played(organization_id);
CREATE INDEX IF NOT EXISTS idx_songs_played_recognition_timestamp ON songs_played(recognition_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_songs_played_matched_request ON songs_played(matched_crowd_request_id);
CREATE INDEX IF NOT EXISTS idx_songs_played_song_lookup ON songs_played(song_title, song_artist);

-- Composite index for event song queries
CREATE INDEX IF NOT EXISTS idx_songs_played_event_time ON songs_played(event_id, recognition_timestamp DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_songs_played_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_songs_played_updated_at ON songs_played;
CREATE TRIGGER update_songs_played_updated_at
  BEFORE UPDATE ON songs_played
  FOR EACH ROW
  EXECUTE FUNCTION update_songs_played_updated_at();

-- Enable RLS
ALTER TABLE songs_played ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view songs for their organization" ON songs_played;
DROP POLICY IF EXISTS "Users can insert songs for their organization" ON songs_played;
DROP POLICY IF EXISTS "Users can update songs for their organization" ON songs_played;

-- Policy: Users can view songs played for their organization's events
CREATE POLICY "Users can view songs for their organization"
  ON songs_played
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is platform admin
    is_platform_admin()
    OR
    -- Allow if organization_id matches user's organization (via organization_members or owner)
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id as organization_id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
    OR
    -- Allow if linked to an event the user has access to
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = songs_played.event_id
      AND (
        e.organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.uid() AND is_active = true
          UNION
          SELECT id as organization_id
          FROM organizations
          WHERE owner_id = auth.uid()
        )
        OR is_platform_admin()
      )
    )
  );

-- Policy: Users can insert songs for their organization's events
CREATE POLICY "Users can insert songs for their organization"
  ON songs_played
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_platform_admin()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id as organization_id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = songs_played.event_id
      AND (
        e.organization_id IN (
          SELECT organization_id 
          FROM organization_members 
          WHERE user_id = auth.uid() AND is_active = true
          UNION
          SELECT id as organization_id
          FROM organizations
          WHERE owner_id = auth.uid()
        )
        OR is_platform_admin()
      )
    )
  );

-- Policy: Users can update songs for their organization's events
CREATE POLICY "Users can update songs for their organization"
  ON songs_played
  FOR UPDATE
  TO authenticated
  USING (
    is_platform_admin()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id as organization_id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    is_platform_admin()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id as organization_id
      FROM organizations
      WHERE owner_id = auth.uid()
    )
  );

-- Function to auto-match and mark crowd_requests as played
CREATE OR REPLACE FUNCTION auto_mark_crowd_request_played()
RETURNS TRIGGER AS $$
DECLARE
  matched_request_id UUID;
BEGIN
  -- Try to find a matching crowd_request for this event
  -- Match by song_title and song_artist (case-insensitive, fuzzy)
  SELECT id INTO matched_request_id
  FROM crowd_requests
  WHERE event_id = NEW.event_id
    OR event_qr_code IN (
      SELECT event_qr_code FROM events WHERE id = NEW.event_id
    )
  AND request_type = 'song_request'
  AND status IN ('new', 'acknowledged', 'playing')
  AND (
    LOWER(TRIM(song_title)) = LOWER(TRIM(NEW.song_title))
    OR LOWER(TRIM(song_artist)) = LOWER(TRIM(NEW.song_artist))
  )
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- If we found a match, update it
  IF matched_request_id IS NOT NULL THEN
    UPDATE crowd_requests
    SET 
      status = 'played',
      played_at = NEW.recognition_timestamp,
      updated_at = NOW()
    WHERE id = matched_request_id;
    
    -- Link the songs_played record to the matched request
    NEW.matched_crowd_request_id := matched_request_id;
    NEW.auto_marked_as_played := TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-match when a song is detected
-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS auto_match_crowd_request_on_song_detected ON songs_played;
CREATE TRIGGER auto_match_crowd_request_on_song_detected
  BEFORE INSERT ON songs_played
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_crowd_request_played();

-- Add comment for documentation
COMMENT ON TABLE songs_played IS 'Tracks songs automatically detected via audio recognition during events. Links to events, contacts, and crowd_requests for comprehensive tracking.';
COMMENT ON COLUMN songs_played.recognition_confidence IS 'Confidence score from recognition service (0.00 to 1.00). Higher is better.';
COMMENT ON COLUMN songs_played.auto_marked_as_played IS 'True if this detection automatically updated a crowd_request status to played';

