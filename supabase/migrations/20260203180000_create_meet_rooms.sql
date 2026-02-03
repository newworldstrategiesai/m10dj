-- Meet Rooms Table
-- TipJar Live video conferencing (LiveKit Meet-style, multi-participant)
-- Similar to live_streams but for N:N video meetings (everyone can publish)

CREATE TABLE IF NOT EXISTS public.meet_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  room_name TEXT NOT NULL UNIQUE,
  title TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meet_rooms_user_id ON meet_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_meet_rooms_username ON meet_rooms(username);
CREATE INDEX IF NOT EXISTS idx_meet_rooms_room_name ON meet_rooms(room_name);
CREATE INDEX IF NOT EXISTS idx_meet_rooms_is_active ON meet_rooms(is_active);

ALTER TABLE meet_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active meet rooms" ON meet_rooms
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own meet rooms" ON meet_rooms
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_meet_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meet_rooms_updated_at
  BEFORE UPDATE ON meet_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_meet_rooms_updated_at();

COMMENT ON TABLE meet_rooms IS 'TipJar Live video meeting rooms - multi-participant video conferencing';
