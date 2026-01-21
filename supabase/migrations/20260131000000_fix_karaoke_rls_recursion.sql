-- Fix infinite recursion in RLS policies for karaoke tables
-- The karaoke tables use the same problematic pattern as organizations

BEGIN;

-- Drop existing problematic policies for user_video_library
DROP POLICY IF EXISTS "Users can view their own video library" ON user_video_library;
DROP POLICY IF EXISTS "Users can insert their own videos" ON user_video_library;
DROP POLICY IF EXISTS "Users can update their own videos" ON user_video_library;
DROP POLICY IF EXISTS "Users can delete their own videos" ON user_video_library;

-- Drop existing problematic policies for user_playlists
DROP POLICY IF EXISTS "Users can view playlists" ON user_playlists;
DROP POLICY IF EXISTS "Users can insert their own playlists" ON user_playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON user_playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON user_playlists;

-- Drop existing problematic policies for karaoke_song_videos
DROP POLICY IF EXISTS "Users can view karaoke songs in their organizations" ON karaoke_song_videos;
DROP POLICY IF EXISTS "Users can insert karaoke songs in their organizations" ON karaoke_song_videos;
DROP POLICY IF EXISTS "Users can update karaoke songs in their organizations" ON karaoke_song_videos;
DROP POLICY IF EXISTS "Users can delete karaoke songs in their organizations" ON karaoke_song_videos;

-- Recreate user_video_library policies using helper function
CREATE POLICY "Users can view their own video library" ON user_video_library
FOR SELECT USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Users can insert their own videos" ON user_video_library
FOR INSERT WITH CHECK (
  public.check_user_organization_membership(auth.uid(), organization_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own videos" ON user_video_library
FOR UPDATE USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Users can delete their own videos" ON user_video_library
FOR DELETE USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
  AND user_id = auth.uid()
);

-- Recreate user_playlists policies using helper function
CREATE POLICY "Users can view playlists" ON user_playlists
FOR SELECT USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
  AND (user_id = auth.uid() OR is_public = true)
);

CREATE POLICY "Users can insert their own playlists" ON user_playlists
FOR INSERT WITH CHECK (
  public.check_user_organization_membership(auth.uid(), organization_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own playlists" ON user_playlists
FOR UPDATE USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
  AND user_id = auth.uid()
);

CREATE POLICY "Users can delete their own playlists" ON user_playlists
FOR DELETE USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
  AND user_id = auth.uid()
);

-- Recreate karaoke_song_videos policies using helper function
CREATE POLICY "Users can view karaoke songs in their organizations" ON karaoke_song_videos
FOR SELECT USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert karaoke songs in their organizations" ON karaoke_song_videos
FOR INSERT WITH CHECK (
  public.check_user_organization_membership(auth.uid(), organization_id)
);

CREATE POLICY "Users can update karaoke songs in their organizations" ON karaoke_song_videos
FOR UPDATE USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
);

CREATE POLICY "Users can delete karaoke songs in their organizations" ON karaoke_song_videos
FOR DELETE USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
);

-- Fix karaoke_audit_log policy to use helper function
DROP POLICY IF EXISTS "Users can view audit logs for their organization" ON karaoke_audit_log;

CREATE POLICY "Users can view audit logs for their organization" ON karaoke_audit_log
FOR SELECT USING (
  public.check_user_organization_membership(auth.uid(), organization_id)
);

-- Verify all policies exist and are using the helper function
DO $$
DECLARE
  policy_record RECORD;
  problematic_policies TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check user_playlists policies
  FOR policy_record IN
    SELECT schemaname, tablename, policyname, cmd, qual
    FROM pg_policies
    WHERE tablename IN ('user_playlists', 'user_video_library', 'karaoke_song_videos', 'karaoke_audit_log')
    AND qual LIKE '%organization_members%'
  LOOP
    problematic_policies := array_append(problematic_policies, policy_record.policyname || ' on ' || policy_record.tablename);
  END LOOP;

  IF array_length(problematic_policies, 1) > 0 THEN
    RAISE EXCEPTION 'Found % policies still using organization_members directly: %',
      array_length(problematic_policies, 1),
      array_to_string(problematic_policies, ', ');
  END IF;

  RAISE NOTICE 'All karaoke RLS policies updated to use helper functions - infinite recursion should be fixed';
END $$;

COMMIT;