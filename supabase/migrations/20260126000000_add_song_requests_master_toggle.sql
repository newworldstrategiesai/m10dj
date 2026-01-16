-- Add master toggle for song requests functionality
-- This allows TipJar users to easily enable/disable all song requests
-- When disabled, song requests are completely disabled regardless of tab visibility settings

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS requests_song_requests_enabled BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN organizations.requests_song_requests_enabled IS 'Master toggle for song requests functionality. When false, song requests are completely disabled regardless of tab visibility settings. Only affects TipJar organizations.';
