-- Check current RLS policies on karaoke tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('user_playlists', 'user_video_library', 'karaoke_song_videos', 'karaoke_audit_log')
ORDER BY tablename, policyname;