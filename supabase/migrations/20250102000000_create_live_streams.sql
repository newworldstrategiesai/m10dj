-- Live Streams Table
-- Stores information about active and past live streams

CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL UNIQUE,
  room_name TEXT NOT NULL UNIQUE,
  title TEXT,
  thumbnail_url TEXT,
  is_live BOOLEAN DEFAULT FALSE,
  ppv_price_cents INTEGER, -- Pay-per-view price in cents (null = free)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_username ON live_streams(username);
CREATE INDEX IF NOT EXISTS idx_live_streams_room_name ON live_streams(room_name);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON live_streams(is_live);

-- Enable RLS
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all live streams (public)
CREATE POLICY "Anyone can view live streams" ON live_streams
  FOR SELECT USING (true);

-- Users can only insert/update their own streams
CREATE POLICY "Users can manage own streams" ON live_streams
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_streams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_live_streams_updated_at();

