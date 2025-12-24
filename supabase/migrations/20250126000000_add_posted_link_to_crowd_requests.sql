-- Add posted_link field to crowd_requests table
-- This stores the original URL if the request was created from a posted link (YouTube, Spotify, etc.)

ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS posted_link TEXT DEFAULT NULL;

-- Add index for faster queries when filtering by posted links
CREATE INDEX IF NOT EXISTS idx_crowd_requests_posted_link 
ON crowd_requests(posted_link) 
WHERE posted_link IS NOT NULL;

-- Add comment
COMMENT ON COLUMN crowd_requests.posted_link IS 'Original URL if request was created from a posted link (YouTube, Spotify, Apple Music, etc.)';

