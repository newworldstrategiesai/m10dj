-- Check which karaoke-related tables exist
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename LIKE '%karaoke%'
   OR tablename LIKE '%user_playlist%'
   OR tablename LIKE '%user_video%'
ORDER BY tablename;