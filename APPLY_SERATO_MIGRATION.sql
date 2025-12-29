-- ============================================
-- Serato Play Detection Migration
-- ============================================
-- Run this in Supabase SQL Editor to enable Serato play detection
-- 
-- This creates:
-- 1. serato_play_history table
-- 2. serato_connections table
-- 3. Adds columns to crowd_requests for matching
-- 4. Adds feature flag to organizations
-- 5. Normalization functions and triggers
-- ============================================

-- ============================================
-- 1. CREATE SERATO_PLAY_HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS serato_play_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Track metadata
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_artist TEXT,
  normalized_title TEXT,
  
  -- Play details
  played_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deck TEXT,
  bpm DECIMAL(5,2),
  
  -- Matching status
  matched_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL,
  matched_at TIMESTAMP WITH TIME ZONE,
  
  -- Detection method
  detection_method TEXT DEFAULT 'text_file' 
    CHECK (detection_method IN ('text_file', 'serato_history', 'live_playlists', 'websocket', 'manual')),
  source_file TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate plays
  CONSTRAINT unique_play UNIQUE (dj_id, artist, title, played_at)
);

-- ============================================
-- 2. CREATE SERATO_CONNECTIONS TABLE
-- ============================================
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

-- Unique index for active connections per DJ
CREATE UNIQUE INDEX IF NOT EXISTS idx_serato_connections_active_dj 
  ON serato_connections(dj_id) 
  WHERE is_connected = TRUE;

-- ============================================
-- 3. ADD COLUMNS TO CROWD_REQUESTS
-- ============================================
ALTER TABLE crowd_requests 
  ADD COLUMN IF NOT EXISTS normalized_artist TEXT,
  ADD COLUMN IF NOT EXISTS normalized_title TEXT,
  ADD COLUMN IF NOT EXISTS matched_play_id UUID,
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Add foreign key for matched_play_id (if column didn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'crowd_requests_matched_play_id_fkey'
  ) THEN
    ALTER TABLE crowd_requests 
      ADD CONSTRAINT crowd_requests_matched_play_id_fkey 
      FOREIGN KEY (matched_play_id) 
      REFERENCES serato_play_history(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  NULL; -- Ignore if constraint already exists
END $$;

-- ============================================
-- 4. ADD FEATURE FLAG TO ORGANIZATIONS
-- ============================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS serato_play_detection_enabled BOOLEAN DEFAULT FALSE;

-- ============================================
-- 5. CREATE INDEXES
-- ============================================
-- Play history indexes
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

-- Connection indexes
CREATE INDEX IF NOT EXISTS idx_serato_connections_dj_id 
  ON serato_connections(dj_id);

CREATE INDEX IF NOT EXISTS idx_serato_connections_heartbeat 
  ON serato_connections(last_heartbeat DESC) 
  WHERE is_connected = TRUE;

-- Crowd requests indexes
CREATE INDEX IF NOT EXISTS idx_crowd_requests_normalized 
  ON crowd_requests(normalized_artist, normalized_title) 
  WHERE normalized_artist IS NOT NULL 
    AND normalized_title IS NOT NULL 
    AND request_type = 'song_request';

-- ============================================
-- 6. CREATE NORMALIZATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION normalize_track_string(str TEXT)
RETURNS TEXT AS $$
BEGIN
  IF str IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN lower(
    trim(
      regexp_replace(
        regexp_replace(str, '[^\w\s]', '', 'g'),
        '\s+', ' ', 'g'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 7. CREATE TRIGGERS
-- ============================================

-- Auto-normalize crowd_requests
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

-- Auto-normalize serato_play_history
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

-- Update timestamps for connections
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
-- 8. RLS POLICIES
-- ============================================
ALTER TABLE serato_play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE serato_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "DJs can view own play history" ON serato_play_history;
DROP POLICY IF EXISTS "Service role can insert play history" ON serato_play_history;
DROP POLICY IF EXISTS "Service role can update play history" ON serato_play_history;
DROP POLICY IF EXISTS "DJs can view own connections" ON serato_connections;
DROP POLICY IF EXISTS "Service role can manage connections" ON serato_connections;

-- serato_play_history policies
CREATE POLICY "DJs can view own play history"
  ON serato_play_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = dj_id);

CREATE POLICY "Service role can insert play history"
  ON serato_play_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update play history"
  ON serato_play_history
  FOR UPDATE
  TO service_role
  USING (true);

-- serato_connections policies
CREATE POLICY "DJs can view own connections"
  ON serato_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = dj_id);

CREATE POLICY "Service role can manage connections"
  ON serato_connections
  FOR ALL
  TO service_role
  USING (true);

-- ============================================
-- 9. ENABLE REALTIME
-- ============================================
DO $$
BEGIN
  -- Add tables to realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE serato_play_history;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE serato_connections;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- 10. BACKFILL EXISTING DATA
-- ============================================
UPDATE crowd_requests
SET 
  normalized_artist = normalize_track_string(song_artist),
  normalized_title = normalize_track_string(song_title)
WHERE request_type = 'song_request'
  AND normalized_artist IS NULL
  AND song_artist IS NOT NULL;

-- ============================================
-- 11. ADD COMMENTS
-- ============================================
COMMENT ON TABLE serato_play_history IS 'Stores track play events detected from Serato DJ Pro via companion app';
COMMENT ON TABLE serato_connections IS 'Tracks companion app connections and heartbeats for Serato play detection';
COMMENT ON COLUMN serato_play_history.detection_method IS 'How the track was detected: text_file (Now Playing tools), serato_history (direct parsing), live_playlists (Serato cloud), websocket (What''s Now Playing), manual';
COMMENT ON COLUMN serato_play_history.matched_request_id IS 'If this play matched a song request, the ID of that request';
COMMENT ON COLUMN crowd_requests.normalized_artist IS 'Normalized artist name for fuzzy matching';
COMMENT ON COLUMN crowd_requests.normalized_title IS 'Normalized song title for fuzzy matching';
COMMENT ON COLUMN crowd_requests.notification_sent IS 'Whether the requester has been notified that their song is playing';
COMMENT ON COLUMN organizations.serato_play_detection_enabled IS 'Whether Serato play detection is enabled for this organization';

-- ============================================
-- DONE!
-- ============================================
SELECT 'Serato Play Detection migration completed successfully!' as result;

