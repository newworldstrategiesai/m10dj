-- Store participant email and display name per room for host-only lookup.
-- Filled when a participant joins (POST from client); read by room host via GET API.
CREATE TABLE IF NOT EXISTS public.meet_room_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT NOT NULL,
  participant_identity TEXT NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(room_name, participant_identity)
);

CREATE INDEX IF NOT EXISTS idx_meet_room_participants_room ON meet_room_participants(room_name);
CREATE INDEX IF NOT EXISTS idx_meet_room_participants_identity ON meet_room_participants(room_name, participant_identity);

ALTER TABLE meet_room_participants ENABLE ROW LEVEL SECURITY;

-- Only room owners can read participants of their room (for host "view participant" UI).
CREATE POLICY "Room owners can read own room participants" ON meet_room_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meet_rooms mr
      WHERE mr.room_name = meet_room_participants.room_name
        AND mr.user_id = auth.uid()
    )
  );

-- No direct client INSERT/UPDATE; API uses service role to upsert on join.
COMMENT ON TABLE meet_room_participants IS 'Meet room participant email/display name for host-only lookup; written by API on join, read by room owner.';

CREATE OR REPLACE FUNCTION update_meet_room_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meet_room_participants_updated_at
  BEFORE UPDATE ON meet_room_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_meet_room_participants_updated_at();
