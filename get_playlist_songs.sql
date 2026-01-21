-- Get all song names from all playlists
-- This query joins playlists with their songs to show complete playlist contents

SELECT
  p.name as playlist_name,
  p.description as playlist_description,
  ksv.song_title,
  ksv.song_artist,
  ksv.song_key,
  ksv.source,
  ksv.created_at as song_added_at
FROM user_playlists p
CROSS JOIN LATERAL unnest(p.video_ids) AS song_id
JOIN karaoke_song_videos ksv ON ksv.id = song_id::uuid
ORDER BY p.name, ksv.song_title;

-- Alternative: Get playlist summary with song counts
SELECT
  p.name as playlist_name,
  COUNT(ksv.id) as total_songs,
  ARRAY_AGG(
    ksv.song_title || ' - ' || ksv.song_artist
    ORDER BY ksv.song_title
  ) as song_list
FROM user_playlists p
LEFT JOIN LATERAL unnest(p.video_ids) AS song_id ON true
LEFT JOIN karaoke_song_videos ksv ON ksv.id = song_id::uuid
GROUP BY p.id, p.name
ORDER BY p.name;

-- Simple version: Just playlist names and their song titles
SELECT
  p.name as playlist,
  ksv.song_title as song,
  ksv.song_artist as artist
FROM user_playlists p
CROSS JOIN LATERAL unnest(p.video_ids) AS song_id
JOIN karaoke_song_videos ksv ON ksv.id = song_id::uuid
ORDER BY p.name, ksv.song_title;