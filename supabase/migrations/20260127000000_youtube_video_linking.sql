-- =====================================================================================
-- YOUTUBE VIDEO LINKING SYSTEM
-- Automatic YouTube video linking for karaoke songs
-- =====================================================================================

-- Create karaoke_song_videos table for storing YouTube video links
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

-- Add updated_at trigger for karaoke_song_videos
CREATE OR REPLACE FUNCTION update_karaoke_song_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_karaoke_song_videos_updated_at ON karaoke_song_videos;
CREATE TRIGGER trigger_update_karaoke_song_videos_updated_at
  BEFORE UPDATE ON karaoke_song_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_karaoke_song_videos_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_org ON karaoke_song_videos(organization_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_song_key ON karaoke_song_videos(song_key);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_quality ON karaoke_song_videos(video_quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_youtube_id ON karaoke_song_videos(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_status ON karaoke_song_videos(link_status);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_created_at ON karaoke_song_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_validation ON karaoke_song_videos(last_validated_at) WHERE last_validated_at IS NULL;

-- Add video linking columns to karaoke_signups table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_signups' AND column_name = 'video_id') THEN
    ALTER TABLE karaoke_signups ADD COLUMN video_id UUID REFERENCES karaoke_song_videos(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_signups' AND column_name = 'video_url') THEN
    ALTER TABLE karaoke_signups ADD COLUMN video_url TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_signups' AND column_name = 'video_embed_allowed') THEN
    ALTER TABLE karaoke_signups ADD COLUMN video_embed_allowed BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Index for video linking performance
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_video_id ON karaoke_signups(video_id) WHERE video_id IS NOT NULL;

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

  -- Return matching videos ordered by quality and confidence
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
  ORDER BY ksv.video_quality_score DESC, ksv.confidence_score DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate YouTube video exists and get metadata
CREATE OR REPLACE FUNCTION validate_youtube_video(video_id TEXT)
RETURNS JSONB AS $$
-- This function will be called from application code
-- It returns video metadata or NULL if video doesn't exist
-- Implementation will use YouTube API
BEGIN
  -- Placeholder - actual implementation in application code
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update video validation status
CREATE OR REPLACE FUNCTION update_video_validation_status(
  p_video_id UUID,
  p_is_valid BOOLEAN,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE karaoke_song_videos
  SET
    last_validated_at = NOW(),
    validation_attempts = validation_attempts + 1,
    link_status = CASE
      WHEN p_is_valid THEN 'active'
      ELSE 'broken'
    END,
    -- Update metadata if provided
    youtube_view_count = COALESCE(p_metadata->>'view_count', youtube_view_count),
    youtube_like_count = COALESCE(p_metadata->>'like_count', youtube_like_count),
    youtube_video_duration = COALESCE((p_metadata->>'duration_seconds')::INTEGER, youtube_video_duration)
  WHERE id = p_video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON karaoke_song_videos TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION normalize_song_key TO authenticated;
GRANT EXECUTE ON FUNCTION find_song_video TO authenticated;
GRANT EXECUTE ON FUNCTION validate_youtube_video TO authenticated;
GRANT EXECUTE ON FUNCTION update_video_validation_status TO authenticated;

-- Add RLS policies for karaoke_song_videos
ALTER TABLE karaoke_song_videos ENABLE ROW LEVEL SECURITY;

-- Users can view videos for their organizations
CREATE POLICY "Users can view song videos for their organization" ON karaoke_song_videos
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Users can insert videos for their organizations
CREATE POLICY "Users can insert song videos for their organization" ON karaoke_song_videos
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Users can update videos for their organizations
CREATE POLICY "Users can update song videos for their organization" ON karaoke_song_videos
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);

-- Comments for documentation
COMMENT ON TABLE karaoke_song_videos IS 'YouTube video links for karaoke songs with quality scoring and metadata';
COMMENT ON COLUMN karaoke_song_videos.song_key IS 'Normalized song identifier for matching (lowercase, special chars removed)';
COMMENT ON COLUMN karaoke_song_videos.video_quality_score IS 'Quality score 0-100 based on karaoke suitability, view count, etc.';
COMMENT ON COLUMN karaoke_song_videos.confidence_score IS 'How confident we are this is the right video for the song (0.0-1.0)';
COMMENT ON COLUMN karaoke_song_videos.link_status IS 'Status of the video link: active, broken, removed, flagged';
COMMENT ON FUNCTION normalize_song_key IS 'Normalizes song title and artist into a consistent key for matching';
COMMENT ON FUNCTION find_song_video IS 'Finds the best matching video for a song within an organization';
COMMENT ON FUNCTION validate_youtube_video IS 'Validates if a YouTube video exists and returns metadata';
COMMENT ON FUNCTION update_video_validation_status IS 'Updates video validation status and metadata';

-- Add updated_at columns to karaoke_signups if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_signups' AND column_name = 'updated_at') THEN
    ALTER TABLE karaoke_signups ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Create updated_at trigger for karaoke_signups if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_karaoke_signups_updated_at ON karaoke_signups;
CREATE TRIGGER trigger_update_karaoke_signups_updated_at
  BEFORE UPDATE ON karaoke_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Performance analysis
ANALYZE karaoke_song_videos;
ANALYZE karaoke_signups;