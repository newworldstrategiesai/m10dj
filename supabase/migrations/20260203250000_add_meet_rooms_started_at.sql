-- Add started_at to meet_rooms for master meeting timer.
-- Set when host starts the meeting (is_active = true); cleared when meeting ends.
-- All participants (including re-joining) see elapsed time from this timestamp.

ALTER TABLE meet_rooms
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

COMMENT ON COLUMN meet_rooms.started_at IS 'When the host started this meeting (is_active = true). Cleared when meeting ends. Used for master timer.';
