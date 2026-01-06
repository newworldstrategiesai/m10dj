-- Add configurable video URL for requests page header
-- This allows each organization to have their own animated header video

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_header_video_url TEXT;

COMMENT ON COLUMN organizations.requests_header_video_url IS 'URL to custom video for requests page header (MP4 format recommended). If not set, falls back to cover photo.';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_requests_header_video_url 
ON organizations(requests_header_video_url) 
WHERE requests_header_video_url IS NOT NULL;

