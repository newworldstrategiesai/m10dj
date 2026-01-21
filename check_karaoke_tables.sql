-- Check if karaoke_song_videos table exists and its constraints
SELECT
  'karaoke_song_videos exists: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'karaoke_song_videos'
  ) THEN 'YES' ELSE 'NO' END as table_status;

-- Check the source check constraint
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'karaoke_song_videos'::regclass
  AND contype = 'c'
  AND conname LIKE '%source%';

-- Check if video_data column exists in karaoke_signups
SELECT
  'video_data column exists: ' ||
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'karaoke_signups' AND column_name = 'video_data'
  ) THEN 'YES' ELSE 'NO' END as column_status;

-- Check sample karaoke_song_videos records
SELECT id, youtube_video_id, source, created_at
FROM karaoke_song_videos
ORDER BY created_at DESC
LIMIT 5;