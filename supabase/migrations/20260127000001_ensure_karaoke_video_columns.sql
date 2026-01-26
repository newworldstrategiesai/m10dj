-- Ensure all required columns exist in karaoke_song_videos table
-- This migration adds any missing columns that might cause 42703 errors

DO $$ 
BEGIN
  -- Add youtube_channel_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'karaoke_song_videos' 
    AND column_name = 'youtube_channel_name'
  ) THEN
    ALTER TABLE karaoke_song_videos ADD COLUMN youtube_channel_name TEXT NULL;
    COMMENT ON COLUMN karaoke_song_videos.youtube_channel_name IS 'YouTube channel name for the video';
  END IF;

  -- Add video_quality_score if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'karaoke_song_videos' 
    AND column_name = 'video_quality_score'
  ) THEN
    ALTER TABLE karaoke_song_videos ADD COLUMN video_quality_score INTEGER DEFAULT 50 CHECK (video_quality_score >= 0 AND video_quality_score <= 100);
    COMMENT ON COLUMN karaoke_song_videos.video_quality_score IS 'Quality score 0-100 based on karaoke suitability';
  END IF;

  -- Add confidence_score if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'karaoke_song_videos' 
    AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE karaoke_song_videos ADD COLUMN confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1);
    COMMENT ON COLUMN karaoke_song_videos.confidence_score IS 'How confident we are this is the right video for the song (0.0-1.0)';
  END IF;

  -- Add link_status if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'karaoke_song_videos' 
    AND column_name = 'link_status'
  ) THEN
    ALTER TABLE karaoke_song_videos ADD COLUMN link_status TEXT DEFAULT 'active' CHECK (link_status IN ('active', 'broken', 'removed', 'flagged'));
    COMMENT ON COLUMN karaoke_song_videos.link_status IS 'Status of the video link: active, broken, removed, flagged';
  END IF;

  -- Add youtube_video_title if it doesn't exist (should exist but being safe)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'karaoke_song_videos' 
    AND column_name = 'youtube_video_title'
  ) THEN
    ALTER TABLE karaoke_song_videos ADD COLUMN youtube_video_title TEXT NOT NULL DEFAULT '';
    COMMENT ON COLUMN karaoke_song_videos.youtube_video_title IS 'Title of the YouTube video';
  END IF;

END $$;

-- Verify all columns exist
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT array_agg(column_name) INTO missing_columns
  FROM (
    SELECT 'youtube_channel_name' AS column_name
    UNION SELECT 'video_quality_score'
    UNION SELECT 'confidence_score'
    UNION SELECT 'link_status'
    UNION SELECT 'youtube_video_title'
  ) AS required
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'karaoke_song_videos' 
    AND column_name = required.column_name
  );

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE WARNING 'Some columns are still missing: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'All required columns exist in karaoke_song_videos table';
  END IF;
END $$;
