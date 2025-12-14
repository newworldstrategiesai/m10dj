-- Add require_auth field to live_streams table
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS require_auth BOOLEAN DEFAULT FALSE;

-- Add comment
COMMENT ON COLUMN live_streams.require_auth IS 'If true, users must be logged in to view the stream';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_live_streams_require_auth ON live_streams(require_auth) WHERE require_auth = true;

