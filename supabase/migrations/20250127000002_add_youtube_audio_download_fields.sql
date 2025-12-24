-- Add fields to track YouTube audio downloads for super admin
-- This allows downloading audio from YouTube links for use in external DJ software

ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS downloaded_audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_download_status TEXT DEFAULT 'pending'
  CHECK (audio_download_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS audio_download_error TEXT,
ADD COLUMN IF NOT EXISTS audio_downloaded_at TIMESTAMP WITH TIME ZONE;

-- Add index for filtering by download status
CREATE INDEX IF NOT EXISTS idx_crowd_requests_audio_download 
ON crowd_requests(audio_download_status, created_at) 
WHERE audio_download_status IN ('processing', 'completed', 'failed');

-- Add comment
COMMENT ON COLUMN crowd_requests.downloaded_audio_url IS 'URL to downloaded MP3 file (super admin only feature)';
COMMENT ON COLUMN crowd_requests.audio_download_status IS 'Status of YouTube audio download: pending (not attempted), processing (in progress), completed (download available), failed (error occurred)';
COMMENT ON COLUMN crowd_requests.audio_download_error IS 'Error message if audio download failed';
COMMENT ON COLUMN crowd_requests.audio_downloaded_at IS 'Timestamp when audio was successfully downloaded';

