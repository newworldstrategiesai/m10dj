-- Manual SQL to create the user_playlists table if migration didn't run
-- Run this in your Supabase SQL editor if the user_playlists table is missing

-- Create user_playlists table for organizing videos
CREATE TABLE IF NOT EXISTS user_playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Playlist metadata
  name TEXT NOT NULL,
  description TEXT NULL,
  video_ids UUID[] DEFAULT '{}', -- References user_video_library.id or karaoke_song_videos.id
  is_public BOOLEAN DEFAULT false,

  -- Additional fields for better functionality
  category_id UUID NULL, -- For categorization
  tags TEXT[] DEFAULT '{}',
  play_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE NULL,

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
CREATE INDEX IF NOT EXISTS idx_user_playlists_public ON user_playlists(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_user_playlists_created_at ON user_playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_playlists_category ON user_playlists(category_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_tags ON user_playlists USING GIN(tags);

-- RLS Policies for user_playlists
ALTER TABLE user_playlists ENABLE ROW LEVEL SECURITY;

-- Users can see their own playlists and public playlists from their organization
CREATE POLICY "user_playlists_select" ON user_playlists
  FOR SELECT USING (
    user_id = auth.uid() OR
    (is_public = true AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ))
  );

-- Users can only modify their own playlists
CREATE POLICY "user_playlists_insert" ON user_playlists
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "user_playlists_update" ON user_playlists
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_playlists_delete" ON user_playlists
  FOR DELETE USING (user_id = auth.uid());