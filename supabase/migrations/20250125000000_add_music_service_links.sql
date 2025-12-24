-- Add music_service_links field to crowd_requests table
-- This stores links to Spotify, YouTube, and Tidal for quick admin access

ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS music_service_links JSONB DEFAULT NULL;

-- Add index for faster queries when checking if links exist
CREATE INDEX IF NOT EXISTS idx_crowd_requests_music_links 
ON crowd_requests USING GIN (music_service_links) 
WHERE music_service_links IS NOT NULL;

-- Add comment
COMMENT ON COLUMN crowd_requests.music_service_links IS 'JSONB object storing music service links: {spotify: url, youtube: url, tidal: url, found_at: timestamp, search_method: string}';

