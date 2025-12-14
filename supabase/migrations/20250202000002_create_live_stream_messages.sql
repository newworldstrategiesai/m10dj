-- Create live_stream_messages table for chat functionality
CREATE TABLE IF NOT EXISTS live_stream_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_until TIMESTAMP WITH TIME ZONE,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_moderator BOOLEAN DEFAULT FALSE,
  is_streamer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_stream_messages_stream_id ON live_stream_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_messages_created_at ON live_stream_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_stream_messages_user_id ON live_stream_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_messages_is_deleted ON live_stream_messages(is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_live_stream_messages_is_banned ON live_stream_messages(is_banned, banned_until) WHERE is_banned = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_live_stream_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_live_stream_messages_updated_at
  BEFORE UPDATE ON live_stream_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_live_stream_messages_updated_at();

-- RLS Policies
ALTER TABLE live_stream_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-deleted messages for live streams
CREATE POLICY "Anyone can view live stream messages"
ON live_stream_messages FOR SELECT
TO public
USING (
  is_deleted = false AND
  (is_banned = false OR banned_until IS NOT NULL AND banned_until < NOW())
);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages"
ON live_stream_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Streamers and moderators can update/delete messages
CREATE POLICY "Streamers can moderate messages"
ON live_stream_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM live_streams
    WHERE live_streams.id = live_stream_messages.stream_id
    AND live_streams.user_id = auth.uid()
  )
  OR is_moderator = true
);

CREATE POLICY "Streamers can delete messages"
ON live_stream_messages FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM live_streams
    WHERE live_streams.id = live_stream_messages.stream_id
    AND live_streams.user_id = auth.uid()
  )
  OR is_moderator = true
);

-- Create banned_users table for global bans
CREATE TABLE IF NOT EXISTS live_stream_banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  banned_until TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  is_permanent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stream_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_stream_banned_users_stream_id ON live_stream_banned_users(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_banned_users_user_id ON live_stream_banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_banned_users_banned_until ON live_stream_banned_users(banned_until) WHERE banned_until IS NOT NULL;

ALTER TABLE live_stream_banned_users ENABLE ROW LEVEL SECURITY;

-- Streamers can view bans for their streams
CREATE POLICY "Streamers can view bans"
ON live_stream_banned_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM live_streams
    WHERE live_streams.id = live_stream_banned_users.stream_id
    AND live_streams.user_id = auth.uid()
  )
);

-- Streamers can create bans
CREATE POLICY "Streamers can create bans"
ON live_stream_banned_users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM live_streams
    WHERE live_streams.id = live_stream_banned_users.stream_id
    AND live_streams.user_id = auth.uid()
  )
);

-- Streamers can update/delete bans
CREATE POLICY "Streamers can manage bans"
ON live_stream_banned_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM live_streams
    WHERE live_streams.id = live_stream_banned_users.stream_id
    AND live_streams.user_id = auth.uid()
  )
);

