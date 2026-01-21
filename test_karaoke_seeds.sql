-- Test Karaoke Database Seeds
-- Run these queries to verify the seeding was successful

-- 1. Check total song count (should be 111)
SELECT COUNT(*) as total_songs FROM karaoke_song_videos;

-- 2. Check total playlist count (should be 7)
SELECT COUNT(*) as total_playlists FROM user_playlists;

-- 3. Check songs by organization (should show organization-specific data)
SELECT
  organization_id,
  COUNT(*) as songs_per_org
FROM karaoke_song_videos
GROUP BY organization_id
ORDER BY songs_per_org DESC;

-- 4. Check playlists by organization
SELECT
  organization_id,
  COUNT(*) as playlists_per_org,
  ARRAY_AGG(name ORDER BY created_at DESC) as playlist_names
FROM user_playlists
GROUP BY organization_id;

-- 5. Sample of seeded songs (first 10)
SELECT
  song_title,
  song_artist,
  source,
  created_at
FROM karaoke_song_videos
ORDER BY created_at DESC
LIMIT 10;

-- 6. Sample playlists with song counts
SELECT
  name,
  description,
  ARRAY_LENGTH(video_ids, 1) as song_count,
  is_public,
  created_at
FROM user_playlists
ORDER BY created_at DESC;

-- 7. Check for specific popular songs (should exist)
SELECT
  song_title,
  song_artist,
  song_key
FROM karaoke_song_videos
WHERE song_title ILIKE '%bohemian rhapsody%'
   OR song_title ILIKE '%stairway to heaven%'
   OR song_title ILIKE '%hotel california%'
   OR song_title ILIKE '%imagine%'
LIMIT 5;

-- 8. Verify RLS policies are working (should return results if authenticated)
-- This will test if the policies allow access
SELECT
  COUNT(*) as accessible_songs
FROM karaoke_song_videos;

-- 9. Check organization data
SELECT
  id,
  name,
  owner_id,
  subscription_tier
FROM organizations
WHERE id IN (
  SELECT DISTINCT organization_id
  FROM user_playlists
);

-- 10. Verify playlist contents (check if video_ids arrays are populated)
SELECT
  name,
  ARRAY_LENGTH(video_ids, 1) as songs_in_playlist,
  video_ids[1:3] as first_three_song_ids
FROM user_playlists
ORDER BY created_at DESC;