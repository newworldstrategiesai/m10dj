-- Add setting to control whether artist name is shown over video header
-- Some users have videos with their name already embedded, others don't

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_show_artist_name_over_video BOOLEAN DEFAULT true;

COMMENT ON COLUMN organizations.requests_show_artist_name_over_video IS 
'Whether to display the artist name text over the video header. Set to false if your video already contains your name/logo.';

