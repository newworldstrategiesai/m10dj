-- =====================================================================================
-- USER VIDEO LIBRARY SYSTEM
-- Personal video collections for karaoke users
-- =====================================================================================

-- Create user_video_library table for storing personal video collections
CREATE TABLE IF NOT EXISTS user_video_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Video metadata
  title TEXT NOT NULL,
  artist TEXT NULL,
  youtube_video_id TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  duration TEXT NOT NULL, -- ISO 8601 duration
  channel_title TEXT NOT NULL,
  quality_score INTEGER DEFAULT 50 CHECK (quality_score >= 0 AND quality_score <= 100),

  -- User preferences
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE NULL,

  -- Metadata
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(organization_id, user_id, youtube_video_id)
);

-- Add updated_at trigger for user_video_library
CREATE OR REPLACE FUNCTION update_user_video_library_updated_at()
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_video_library_org_user ON user_video_library(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_video_library_youtube_id ON user_video_library(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_user_video_library_favorite ON user_video_library(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_user_video_library_added_at ON user_video_library(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_video_library_play_count ON user_video_library(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_video_library_tags ON user_video_library USING GIN(tags);

-- =====================================================================================
-- USER PLAYLISTS SYSTEM
-- Organize videos into custom playlists
-- =====================================================================================

-- Create user_playlists table for organizing videos
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

-- Add updated_at trigger for user_playlists
CREATE OR REPLACE FUNCTION update_user_playlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_playlists_updated_at ON user_playlists;
CREATE TRIGGER trigger_update_user_playlists_updated_at
  BEFORE UPDATE ON user_playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_user_playlists_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_playlists_org_user ON user_playlists(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_created_at ON user_playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_playlists_public ON user_playlists(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_playlists_video_ids ON user_playlists USING GIN(video_ids);

-- =====================================================================================
-- PERMISSIONS AND POLICIES
-- =====================================================================================

-- Grant permissions for user_video_library
GRANT SELECT, INSERT, UPDATE, DELETE ON user_video_library TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_video_library_updated_at TO authenticated;

-- Grant permissions for user_playlists
GRANT SELECT, INSERT, UPDATE, DELETE ON user_playlists TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_playlists_updated_at TO authenticated;

-- RLS policies for user_video_library
ALTER TABLE user_video_library ENABLE ROW LEVEL SECURITY;

-- Users can view their own videos in their organizations
CREATE POLICY "Users can view their own video library" ON user_video_library
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

-- Users can insert videos to their library
CREATE POLICY "Users can insert videos to their library" ON user_video_library
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

-- Users can update their own videos
CREATE POLICY "Users can update their own videos" ON user_video_library
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

-- Users can delete their own videos
CREATE POLICY "Users can delete their own videos" ON user_video_library
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

-- RLS policies for user_playlists
ALTER TABLE user_playlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own playlists and public playlists in their organizations
CREATE POLICY "Users can view playlists" ON user_playlists
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ) AND (user_id = auth.uid() OR is_public = true)
);

-- Users can insert their own playlists
CREATE POLICY "Users can insert their own playlists" ON user_playlists
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

-- Users can update their own playlists
CREATE POLICY "Users can update their own playlists" ON user_playlists
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

-- Users can delete their own playlists
CREATE POLICY "Users can delete their own playlists" ON user_playlists
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

-- =====================================================================================
-- UTILITY FUNCTIONS
-- =====================================================================================

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_video_play_count(video_library_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_video_library
  SET
    play_count = play_count + 1,
    last_played_at = NOW(),
    updated_at = NOW()
  WHERE id = video_library_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular videos for an organization
CREATE OR REPLACE FUNCTION get_popular_videos(
  p_organization_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  youtube_video_id TEXT,
  thumbnail_url TEXT,
  play_count INTEGER,
  user_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uvl.id,
    uvl.title,
    uvl.artist,
    uvl.youtube_video_id,
    uvl.thumbnail_url,
    uvl.play_count,
    COUNT(DISTINCT uvl.user_id)::INTEGER as user_count
  FROM user_video_library uvl
  WHERE uvl.organization_id = p_organization_id
  GROUP BY uvl.id, uvl.title, uvl.artist, uvl.youtube_video_id, uvl.thumbnail_url, uvl.play_count
  ORDER BY uvl.play_count DESC, user_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for utility functions
GRANT EXECUTE ON FUNCTION increment_video_play_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_videos TO authenticated;

-- =====================================================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================================================

COMMENT ON TABLE user_video_library IS 'Personal video collections for karaoke users';
COMMENT ON TABLE user_playlists IS 'User-created playlists for organizing karaoke videos';
COMMENT ON COLUMN user_video_library.is_favorite IS 'Whether this video is marked as favorite by the user';
COMMENT ON COLUMN user_video_library.tags IS 'User-defined tags for organizing videos';
COMMENT ON COLUMN user_video_library.play_count IS 'How many times this video has been played by the user';
COMMENT ON COLUMN user_playlists.video_ids IS 'Array of user_video_library IDs in this playlist';
COMMENT ON COLUMN user_playlists.is_public IS 'Whether other users in the organization can see this playlist';

COMMENT ON FUNCTION increment_video_play_count IS 'Increment play count and update last played timestamp for a video';
COMMENT ON FUNCTION get_popular_videos IS 'Get most popular videos across all users in an organization';

-- Performance analysis
ANALYZE user_video_library;
ANALYZE user_playlists;