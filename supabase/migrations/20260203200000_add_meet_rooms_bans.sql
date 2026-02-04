-- Add banned participants to meet_rooms (kick removes from room, ban blocks rejoin)
ALTER TABLE meet_rooms
ADD COLUMN IF NOT EXISTS banned_identities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS banned_names TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_meet_rooms_banned_identities ON meet_rooms USING GIN(banned_identities) WHERE banned_identities IS NOT NULL AND array_length(banned_identities, 1) > 0;

COMMENT ON COLUMN meet_rooms.banned_identities IS 'Participant identities banned from this room (cannot rejoin)';
COMMENT ON COLUMN meet_rooms.banned_names IS 'Display names banned from this room (case-insensitive, for anonymous users)';
