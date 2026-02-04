-- Tie scheduling (Calendly clone) to Meet video: meeting types can be "video meet" with a host username.
-- When a booking uses such a type, video_call_link is set and shown on confirmation + in emails.
ALTER TABLE meeting_types
  ADD COLUMN IF NOT EXISTS is_video_meet BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS meet_username TEXT;

COMMENT ON COLUMN meeting_types.is_video_meet IS 'When true, bookings of this type get a Meet video link (meet_username required).';
COMMENT ON COLUMN meeting_types.meet_username IS 'Host Meet room username (e.g. ben) for /meet/{username}. Used when is_video_meet is true.';

CREATE INDEX IF NOT EXISTS idx_meeting_types_video_meet ON meeting_types(is_video_meet) WHERE is_video_meet = TRUE;
