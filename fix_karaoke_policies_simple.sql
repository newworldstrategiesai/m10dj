-- Simple fix for karaoke RLS policies - avoid organization_members entirely
-- Use only organization ownership checks to prevent infinite recursion

BEGIN;

-- Drop all problematic karaoke policies
DROP POLICY IF EXISTS "Users can view their own video library" ON user_video_library;
DROP POLICY IF EXISTS "Users can insert their own videos" ON user_video_library;
DROP POLICY IF EXISTS "Users can update their own videos" ON user_video_library;
DROP POLICY IF EXISTS "Users can delete their own videos" ON user_video_library;

DROP POLICY IF EXISTS "Users can view playlists" ON user_playlists;
DROP POLICY IF EXISTS "Users can insert their own playlists" ON user_playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON user_playlists;
DROP POLICY IF EXISTS "Users can delete their own playlists" ON user_playlists;

DROP POLICY IF EXISTS "Users can view karaoke songs in their organizations" ON karaoke_song_videos;
DROP POLICY IF EXISTS "Users can insert karaoke songs in their organizations" ON karaoke_song_videos;
DROP POLICY IF EXISTS "Users can update karaoke songs in their organizations" ON karaoke_song_videos;
DROP POLICY IF EXISTS "Users can delete karaoke songs in their organizations" ON karaoke_song_videos;

DROP POLICY IF EXISTS "Users can view audit logs for their organization" ON karaoke_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON karaoke_audit_log;

-- Create simple policies that only check organization ownership
-- This avoids any queries to organization_members that cause recursion

CREATE POLICY "Organization owners can manage video library"
  ON user_video_library
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can manage playlists"
  ON user_playlists
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can manage karaoke songs"
  ON karaoke_song_videos
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can view audit logs"
  ON karaoke_audit_log
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Allow system inserts for audit logs (drop if exists first)
DROP POLICY IF EXISTS "System can insert audit logs" ON karaoke_audit_log;

CREATE POLICY "System can insert audit logs"
  ON karaoke_audit_log
  FOR INSERT
  WITH CHECK (true);

COMMIT;

SELECT 'Karaoke policies simplified to prevent infinite recursion!' as status;