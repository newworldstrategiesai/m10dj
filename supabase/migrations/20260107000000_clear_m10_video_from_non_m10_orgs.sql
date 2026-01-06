-- Clear M10-specific video URLs from non-M10 organizations
-- This ensures TipJar users don't see M10 DJ Company's video

UPDATE organizations
SET requests_header_video_url = NULL
WHERE 
  requests_header_video_url IS NOT NULL
  AND (
    -- Block videos with M10-specific keywords
    LOWER(requests_header_video_url) LIKE '%djbenmurray%'
    OR LOWER(requests_header_video_url) LIKE '%m10djcompany%'
    OR LOWER(requests_header_video_url) LIKE '%m10-dj-company%'
    OR LOWER(requests_header_video_url) LIKE '%ben-murray%'
    OR LOWER(requests_header_video_url) LIKE '%dj-ben-murray%'
  )
  -- Only clear from non-M10 organizations
  AND slug != 'm10djcompany'
  AND name NOT ILIKE '%m10%'
  AND name NOT ILIKE '%m 10%';

COMMENT ON COLUMN organizations.requests_header_video_url IS 'URL to custom video for requests page header (MP4 format recommended). If not set, falls back to animated gradient. M10-specific videos are blocked from non-M10 organizations.';

