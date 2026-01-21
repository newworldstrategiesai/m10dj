-- Run missing karaoke migrations in correct order
-- This creates the video library and playlist tables that are needed

-- First, create user_video_library and user_playlists tables
-- (From 20260128000000_user_video_library.sql)

CREATE TABLE IF NOT EXISTS user_video_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Video metadata
  youtube_video_id TEXT NOT NULL,
  youtube_video_title TEXT NOT NULL,
  youtube_channel_name TEXT NULL,
  youtube_channel_id TEXT NULL,
  youtube_video_duration INTEGER NULL,
  youtube_view_count INTEGER DEFAULT 0,
  youtube_like_count INTEGER DEFAULT 0,
  youtube_publish_date TIMESTAMP WITH TIME ZONE NULL,

  -- User notes and organization
  user_notes TEXT NULL,
  is_favorite BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, youtube_video_id)
);

CREATE TABLE IF NOT EXISTS user_playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Playlist metadata
  name TEXT NOT NULL,
  description TEXT NULL,
  video_ids UUID[] DEFAULT '{}', -- References user_video_library.id
  is_public BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (length(name) > 0 AND length(name) <= 100),
  CHECK (length(description) <= 500)
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_user_video_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_video_library_updated_at ON user_video_library;
CREATE TRIGGER trigger_update_user_video_library_updated_at
  BEFORE UPDATE ON user_video_library
  FOR EACH ROW
  EXECUTE FUNCTION update_user_video_library_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_playlists_updated_at ON user_playlists;
CREATE TRIGGER trigger_update_user_playlists_updated_at
  BEFORE UPDATE ON user_playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_user_playlists_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_video_library_org_user ON user_video_library(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_library_created_at ON user_video_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_playlists_org_user ON user_playlists(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_created_at ON user_playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_playlists_public ON user_playlists(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_playlists_video_ids ON user_playlists USING GIN(video_ids);

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_video_library TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_playlists TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_video_library_updated_at TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_playlists_updated_at TO authenticated;

-- Now create karaoke_song_videos table if it doesn't exist
-- (From 20260127000000_youtube_video_linking.sql)

CREATE TABLE IF NOT EXISTS karaoke_song_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Song identification
  song_title TEXT NOT NULL,
  song_artist TEXT NULL,
  song_key TEXT NULL, -- normalized for matching: lowercase, trimmed, special chars removed

  -- YouTube video data
  youtube_video_id TEXT NOT NULL,
  youtube_video_title TEXT NOT NULL,
  youtube_channel_name TEXT NULL,
  youtube_channel_id TEXT NULL,
  youtube_video_duration INTEGER NULL, -- in seconds
  youtube_view_count INTEGER DEFAULT 0,
  youtube_like_count INTEGER DEFAULT 0,
  youtube_publish_date TIMESTAMP WITH TIME ZONE NULL,

  -- Quality scoring (0-100)
  video_quality_score INTEGER DEFAULT 50 CHECK (video_quality_score >= 0 AND video_quality_score <= 100),
  is_karaoke_track BOOLEAN DEFAULT true,
  has_lyrics BOOLEAN DEFAULT false,
  has_instruments BOOLEAN DEFAULT true,

  -- Metadata
  source TEXT DEFAULT 'youtube_search' CHECK (source IN ('youtube_search', 'manual', 'bulk_import', 'admin_override')),
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Status
  link_status TEXT DEFAULT 'active' CHECK (link_status IN ('active', 'broken', 'removed', 'flagged')),
  last_validated_at TIMESTAMP WITH TIME ZONE NULL,
  validation_attempts INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(organization_id, youtube_video_id),
  UNIQUE(song_key, organization_id) -- one video per song per org
);

-- Add indexes for karaoke_song_videos
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_org ON karaoke_song_videos(organization_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_song_key ON karaoke_song_videos(song_key);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_created_at ON karaoke_song_videos(created_at DESC);

-- Permissions for karaoke_song_videos
GRANT SELECT, INSERT, UPDATE, DELETE ON karaoke_song_videos TO authenticated;

-- Function to normalize song key for matching
CREATE OR REPLACE FUNCTION normalize_song_key(title TEXT, artist TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Combine title and artist, convert to lowercase
  normalized := LOWER(COALESCE(title, '') || ' ' || COALESCE(artist, ''));

  -- Remove special characters and extra spaces
  normalized := REGEXP_REPLACE(normalized, '[^a-zA-Z0-9\s]', '', 'g');
  normalized := REGEXP_REPLACE(normalized, '\s+', ' ', 'g');
  normalized := TRIM(normalized);

  RETURN normalized;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find existing video for a song
CREATE OR REPLACE FUNCTION find_song_video(
  p_organization_id UUID,
  p_song_title TEXT,
  p_song_artist TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  youtube_video_id TEXT,
  youtube_video_title TEXT,
  video_quality_score INTEGER,
  confidence_score DECIMAL(3,2),
  link_status TEXT
) AS $$
DECLARE
  search_key TEXT;
BEGIN
  -- Normalize the search key
  search_key := normalize_song_key(p_song_title, p_song_artist);

  RETURN QUERY
  SELECT
    ksv.id,
    ksv.youtube_video_id,
    ksv.youtube_video_title,
    ksv.video_quality_score,
    ksv.confidence_score,
    ksv.link_status
  FROM karaoke_song_videos ksv
  WHERE ksv.organization_id = p_organization_id
    AND ksv.song_key = search_key
    AND ksv.link_status = 'active'
  ORDER BY ksv.confidence_score DESC, ksv.video_quality_score DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION find_song_video(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION normalize_song_key(TEXT, TEXT) TO authenticated;

-- Success message
SELECT 'Missing karaoke tables created successfully!' as status;