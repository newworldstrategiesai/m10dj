-- Check if user_video_library table exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_video_library'
) as table_exists;

-- If it doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_video_library'
  ) THEN
    -- Create the table
    CREATE TABLE user_video_library (
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

    -- Add updated_at trigger
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

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_user_video_library_org_user ON user_video_library(organization_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_user_video_library_youtube_id ON user_video_library(youtube_video_id);
    CREATE INDEX IF NOT EXISTS idx_user_video_library_favorite ON user_video_library(is_favorite) WHERE is_favorite = true;
    CREATE INDEX IF NOT EXISTS idx_user_video_library_added_at ON user_video_library(added_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_video_library_play_count ON user_video_library(play_count DESC);
    CREATE INDEX IF NOT EXISTS idx_user_video_library_tags ON user_video_library USING GIN(tags);

    -- RLS policies
    ALTER TABLE user_video_library ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own video library" ON user_video_library
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ) AND user_id = auth.uid()
    );

    CREATE POLICY "Users can insert videos to their library" ON user_video_library
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ) AND user_id = auth.uid()
    );

    CREATE POLICY "Users can update their own videos" ON user_video_library
    FOR UPDATE USING (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ) AND user_id = auth.uid()
    );

    CREATE POLICY "Users can delete their own videos" ON user_video_library
    FOR DELETE USING (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      ) AND user_id = auth.uid()
    );

    RAISE NOTICE 'user_video_library table created successfully';
  ELSE
    RAISE NOTICE 'user_video_library table already exists';
  END IF;
END $$;