-- ============================================
-- Serato Play Detection & Notifications System
-- ============================================
-- This migration creates the tables and functions needed for
-- detecting when songs play in Serato DJ Pro and notifying requesters.

-- ============================================
-- Table: serato_play_history
-- ============================================
-- Stores all tracks played in Serato, detected by companion app
CREATE TABLE IF NOT EXISTS serato_play_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Track metadata
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_artist TEXT, -- For matching (lowercase, trimmed, no punctuation)
  normalized_title TEXT,  -- For matching
  
  -- Play details
  played_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deck TEXT, -- 'A', 'B', or NULL if unknown
  bpm DECIMAL(5,2), -- BPM if available
  
  -- Matching status
  matched_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL,
  matched_at TIMESTAMP WITH TIME ZONE,
  
  -- Detection method
  detection_method TEXT DEFAULT 'text_file' 
    CHECK (detection_method IN ('text_file', 'serato_history', 'live_playlists', 'websocket', 'manual')),
  source_file TEXT, -- File path if from text file watcher
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate plays (same track within seconds)
  CONSTRAINT unique_play UNIQUE (dj_id, artist, title, played_at)
);

-- ============================================
-- Table: serato_connections
-- ============================================
-- Tracks companion app connections and heartbeats
CREATE TABLE IF NOT EXISTS serato_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Connection details
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disconnected_at TIMESTAMP WITH TIME ZONE,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_connected BOOLEAN DEFAULT TRUE,
  connection_ip TEXT,
  
  -- Companion app info
  app_version TEXT,
  platform TEXT CHECK (platform IN ('macos', 'windows', 'linux')),
  detection_method TEXT DEFAULT 'text_file',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for active connections per DJ
CREATE UNIQUE INDEX IF NOT EXISTS idx_serato_connections_active_dj 
  ON serato_connections(dj_id) 
  WHERE is_connected = TRUE;

-- ============================================
-- Add columns to crowd_requests table
-- ============================================
-- Add normalized fields for better matching
ALTER TABLE crowd_requests 
  ADD COLUMN IF NOT EXISTS normalized_artist TEXT,
  ADD COLUMN IF NOT EXISTS normalized_title TEXT,
  ADD COLUMN IF NOT EXISTS matched_play_id UUID REFERENCES serato_play_history(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- Add feature flag to organizations table
-- ============================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS serato_play_detection_enabled BOOLEAN DEFAULT FALSE;

-- ============================================
-- Indexes for serato_play_history
-- ============================================
CREATE INDEX IF NOT EXISTS idx_serato_play_history_dj_id 
  ON serato_play_history(dj_id);

CREATE INDEX IF NOT EXISTS idx_serato_play_history_played_at 
  ON serato_play_history(played_at DESC);

CREATE INDEX IF NOT EXISTS idx_serato_play_history_matched_request 
  ON serato_play_history(matched_request_id) 
  WHERE matched_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_serato_play_history_normalized 
  ON serato_play_history(normalized_artist, normalized_title);

CREATE INDEX IF NOT EXISTS idx_serato_play_history_organization 
  ON serato_play_history(organization_id) 
  WHERE organization_id IS NOT NULL;

-- ============================================
-- Indexes for serato_connections
-- ============================================
CREATE INDEX IF NOT EXISTS idx_serato_connections_dj_id 
  ON serato_connections(dj_id);

CREATE INDEX IF NOT EXISTS idx_serato_connections_heartbeat 
  ON serato_connections(last_heartbeat DESC) 
  WHERE is_connected = TRUE;

-- ============================================
-- Index for crowd_requests normalized fields
-- ============================================
CREATE INDEX IF NOT EXISTS idx_crowd_requests_normalized 
  ON crowd_requests(normalized_artist, normalized_title) 
  WHERE normalized_artist IS NOT NULL 
    AND normalized_title IS NOT NULL 
    AND request_type = 'song_request';

-- ============================================
-- Function: normalize_track_string
-- ============================================
-- Normalizes a track string for matching:
-- - Lowercase
-- - Trim whitespace
-- - Remove punctuation
-- - Normalize whitespace
CREATE OR REPLACE FUNCTION normalize_track_string(str TEXT)
RETURNS TEXT AS $$
BEGIN
  IF str IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN lower(
    trim(
      regexp_replace(
        regexp_replace(str, '[^\w\s]', '', 'g'),  -- Remove punctuation
        '\s+', ' ', 'g'                            -- Normalize whitespace
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Trigger: Auto-normalize crowd_requests
-- ============================================
-- Automatically normalize artist/title when request is created/updated
CREATE OR REPLACE FUNCTION trigger_normalize_crowd_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_type = 'song_request' THEN
    NEW.normalized_artist := normalize_track_string(NEW.song_artist);
    NEW.normalized_title := normalize_track_string(NEW.song_title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_crowd_request_trigger ON crowd_requests;
CREATE TRIGGER normalize_crowd_request_trigger
  BEFORE INSERT OR UPDATE OF song_artist, song_title ON crowd_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_crowd_request();

-- ============================================
-- Trigger: Auto-normalize serato_play_history
-- ============================================
CREATE OR REPLACE FUNCTION trigger_normalize_serato_play()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_artist := normalize_track_string(NEW.artist);
  NEW.normalized_title := normalize_track_string(NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS normalize_serato_play_trigger ON serato_play_history;
CREATE TRIGGER normalize_serato_play_trigger
  BEFORE INSERT OR UPDATE OF artist, title ON serato_play_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_normalize_serato_play();

-- ============================================
-- Trigger: Update serato_connections timestamp
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_serato_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_serato_connection_timestamp ON serato_connections;
CREATE TRIGGER update_serato_connection_timestamp
  BEFORE UPDATE ON serato_connections
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_serato_connection_timestamp();

-- ============================================
-- RLS Policies: serato_play_history
-- ============================================
ALTER TABLE serato_play_history ENABLE ROW LEVEL SECURITY;

-- DJs can view their own play history
CREATE POLICY "DJs can view own play history"
  ON serato_play_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = dj_id);

-- Service role can insert play history (for API)
CREATE POLICY "Service role can insert play history"
  ON serato_play_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can update play history (for matching)
CREATE POLICY "Service role can update play history"
  ON serato_play_history
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================
-- RLS Policies: serato_connections
-- ============================================
ALTER TABLE serato_connections ENABLE ROW LEVEL SECURITY;

-- DJs can view their own connections
CREATE POLICY "DJs can view own connections"
  ON serato_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = dj_id);

-- Service role can manage all connections
CREATE POLICY "Service role can manage connections"
  ON serato_connections
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- Enable Realtime for relevant tables
-- ============================================
-- Add to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE serato_play_history;
ALTER PUBLICATION supabase_realtime ADD TABLE serato_connections;

-- ============================================
-- Backfill: Normalize existing crowd_requests
-- ============================================
-- Update existing song requests with normalized fields
UPDATE crowd_requests
SET 
  normalized_artist = normalize_track_string(song_artist),
  normalized_title = normalize_track_string(song_title)
WHERE request_type = 'song_request'
  AND normalized_artist IS NULL
  AND song_artist IS NOT NULL;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE serato_play_history IS 'Stores track play events detected from Serato DJ Pro via companion app';
COMMENT ON TABLE serato_connections IS 'Tracks companion app connections and heartbeats for Serato play detection';
COMMENT ON COLUMN serato_play_history.detection_method IS 'How the track was detected: text_file (Now Playing tools), serato_history (direct parsing), live_playlists (Serato cloud), websocket (What''s Now Playing), manual';
COMMENT ON COLUMN serato_play_history.matched_request_id IS 'If this play matched a song request, the ID of that request';
COMMENT ON COLUMN crowd_requests.normalized_artist IS 'Normalized artist name for fuzzy matching';
COMMENT ON COLUMN crowd_requests.normalized_title IS 'Normalized song title for fuzzy matching';
COMMENT ON COLUMN crowd_requests.notification_sent IS 'Whether the requester has been notified that their song is playing';
COMMENT ON COLUMN organizations.serato_play_detection_enabled IS 'Whether Serato play detection is enabled for this organization';

