-- Add audio tracking enabled field to events table
-- This allows admins to enable/disable automatic song recognition per event

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS audio_tracking_enabled BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_audio_tracking_enabled 
ON events(audio_tracking_enabled) 
WHERE audio_tracking_enabled = true;

-- Add comment
COMMENT ON COLUMN events.audio_tracking_enabled IS 'When true, enables automatic song recognition for this event. Songs detected will auto-match to crowd_requests.';

