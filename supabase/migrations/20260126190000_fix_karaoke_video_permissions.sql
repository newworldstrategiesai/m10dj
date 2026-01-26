-- Fix permissions for karaoke video auto-linking
-- This ensures the normalize_song_key function and karaoke_song_videos table
-- can be accessed during public signup auto-linking

-- Grant execute on normalize_song_key to anon for public signups
GRANT EXECUTE ON FUNCTION public.normalize_song_key(TEXT, TEXT) TO anon;

-- Grant necessary permissions on karaoke_song_videos for service role and anon
-- Service role should already have full access, but this ensures consistency
GRANT SELECT, INSERT, UPDATE ON karaoke_song_videos TO anon;

-- Ensure the sequence for karaoke_song_videos is accessible
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename LIKE '%karaoke_song_videos%') THEN
    EXECUTE 'GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon';
  END IF;
END $$;

-- Add a more permissive RLS policy for auto-linking via service role or during signup
-- This policy allows inserts when organization_id is valid
DROP POLICY IF EXISTS "Allow auto-link inserts for valid organizations" ON karaoke_song_videos;
CREATE POLICY "Allow auto-link inserts for valid organizations" ON karaoke_song_videos
FOR INSERT WITH CHECK (
  organization_id IS NOT NULL 
  AND EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)
);

-- Also allow updates for auto-linking
DROP POLICY IF EXISTS "Allow auto-link updates for valid organizations" ON karaoke_song_videos;
CREATE POLICY "Allow auto-link updates for valid organizations" ON karaoke_song_videos
FOR UPDATE USING (
  organization_id IS NOT NULL 
  AND EXISTS (SELECT 1 FROM organizations WHERE id = organization_id)
);

-- Comment
COMMENT ON POLICY "Allow auto-link inserts for valid organizations" ON karaoke_song_videos IS 'Allows video auto-linking during public karaoke signup';
