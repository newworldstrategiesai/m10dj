-- Add video_data column to karaoke_signups table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'karaoke_signups' AND column_name = 'video_data') THEN
    ALTER TABLE karaoke_signups ADD COLUMN video_data JSONB NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN karaoke_signups.video_data IS 'JSON data containing YouTube video metadata (title, channel, quality score, etc.)';