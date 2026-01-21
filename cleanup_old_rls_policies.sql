-- Clean up remaining old RLS policies that cause infinite recursion
-- These policies still query organization_members and need to be removed

BEGIN;

-- Remove old karaoke_song_videos policies that use organization_members
DROP POLICY IF EXISTS "Users can insert song videos for their organization" ON karaoke_song_videos;
DROP POLICY IF EXISTS "Users can update song videos for their organization" ON karaoke_song_videos;
DROP POLICY IF EXISTS "Users can view song videos for their organization" ON karaoke_song_videos;
DROP POLICY IF EXISTS "karaoke_song_videos_premium_access" ON karaoke_song_videos;

-- Create safe premium access policy that doesn't use organization_members
CREATE POLICY "Premium karaoke access"
  ON karaoke_song_videos
  FOR SELECT
  TO authenticated
  USING (
    NOT is_premium
    OR organization_id IN (
      SELECT id FROM organizations
      WHERE owner_id = auth.uid()
      AND subscription_tier <> 'free'
    )
  );

-- Remove old user_playlists policies that use organization_members
DROP POLICY IF EXISTS "user_playlists_insert" ON user_playlists;
DROP POLICY IF EXISTS "user_playlists_select" ON user_playlists;
DROP POLICY IF EXISTS "user_playlists_update" ON user_playlists;
DROP POLICY IF EXISTS "user_playlists_delete" ON user_playlists;

-- Verify only the safe policies remain
DO $$
DECLARE
  policy_record RECORD;
  bad_policies TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for any remaining policies that query organization_members
  FOR policy_record IN
    SELECT schemaname, tablename, policyname, qual
    FROM pg_policies
    WHERE tablename IN ('user_playlists', 'user_video_library', 'karaoke_song_videos', 'karaoke_audit_log')
    AND (qual LIKE '%organization_members%' OR with_check LIKE '%organization_members%')
  LOOP
    bad_policies := array_append(bad_policies, policy_record.policyname || ' on ' || policy_record.tablename);
  END LOOP;

  IF array_length(bad_policies, 1) > 0 THEN
    RAISE EXCEPTION 'Found % problematic policies still using organization_members: %',
      array_length(bad_policies, 1),
      array_to_string(bad_policies, ', ');
  END IF;

  RAISE NOTICE 'All problematic RLS policies removed! Only safe organization ownership policies remain.';
END $$;

COMMIT;

SELECT 'Old problematic RLS policies cleaned up successfully!' as status;