-- Add recording fields to live_streams table
ALTER TABLE live_streams 
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS recording_duration INTEGER, -- duration in seconds
ADD COLUMN IF NOT EXISTS recording_size BIGINT, -- file size in bytes
ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_recording BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_live_streams_recorded_at ON live_streams(recorded_at) WHERE recorded_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_streams_recording_url ON live_streams(recording_url) WHERE recording_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN live_streams.recording_url IS 'URL to the recorded stream video file';
COMMENT ON COLUMN live_streams.recording_duration IS 'Duration of recording in seconds';
COMMENT ON COLUMN live_streams.recording_size IS 'File size of recording in bytes';
COMMENT ON COLUMN live_streams.recorded_at IS 'Timestamp when recording was completed';
COMMENT ON COLUMN live_streams.is_recording IS 'Whether stream is currently being recorded';

