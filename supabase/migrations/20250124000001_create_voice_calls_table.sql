-- Create voice_calls table for tracking phone calls with LiveKit
CREATE TABLE IF NOT EXISTS public.voice_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT UNIQUE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_phone TEXT,
  admin_phone TEXT,
  direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'connected', 'completed', 'failed', 'missed')),
  call_type TEXT, -- 'follow_up', 'qualification', 'reminder', 'confirmation', etc.
  transcript TEXT,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_calls_contact_id ON voice_calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_room_name ON voice_calls(room_name);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_calls_created_at ON voice_calls(created_at DESC);

-- RLS policies (adjust based on your auth setup)
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all calls
CREATE POLICY "Admins can view all voice calls"
  ON voice_calls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE admin_roles.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND admin_roles.is_active = true
    )
  );

-- Allow service role to insert/update (for webhooks)
CREATE POLICY "Service role can manage voice calls"
  ON voice_calls FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE voice_calls IS 'Tracks phone calls routed through LiveKit with transcription and AI analysis';

