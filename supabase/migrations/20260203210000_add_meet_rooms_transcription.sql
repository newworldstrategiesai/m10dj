-- Add transcription settings and stored transcript for meet rooms (TipJar Live)
-- Admin can enable transcription in the UI; LiveKit sends transcription events to webhook,
-- which are persisted here when transcription_enabled is true.
ALTER TABLE meet_rooms
ADD COLUMN IF NOT EXISTS transcription_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transcript TEXT;

COMMENT ON COLUMN meet_rooms.transcription_enabled IS 'When true, LiveKit transcription for this room is stored in transcript (enable in LiveKit project and in this UI)';
COMMENT ON COLUMN meet_rooms.transcript IS 'Accumulated transcript from LiveKit transcription_received/final webhooks (final segments only)';
