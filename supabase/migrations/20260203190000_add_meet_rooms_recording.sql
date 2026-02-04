-- Add recording columns to meet_rooms for LiveKit Egress
ALTER TABLE meet_rooms
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS egress_id TEXT;

CREATE INDEX IF NOT EXISTS idx_meet_rooms_egress_id ON meet_rooms(egress_id) WHERE egress_id IS NOT NULL;

COMMENT ON COLUMN meet_rooms.recording_url IS 'URL to recorded meeting (MP4) when LiveKit Egress completes';
COMMENT ON COLUMN meet_rooms.egress_id IS 'LiveKit egress ID for active or last recording';
