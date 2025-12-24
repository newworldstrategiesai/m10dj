-- Create voice_conversations table for storing all voice AI interactions
-- This includes website voice assistant, inbound calls, and outbound calls

CREATE TABLE IF NOT EXISTS public.voice_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Session tracking
  session_id TEXT NOT NULL, -- Unique session ID (from cookie/localStorage)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  phone_number TEXT, -- If available from call or form submission
  
  -- Conversation metadata
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('website', 'inbound_call', 'outbound_call', 'admin_assistant')),
  room_name TEXT, -- LiveKit room name if applicable
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Conversation content
  messages JSONB DEFAULT '[]'::jsonb, -- Array of {role: 'user'|'assistant', content: string, timestamp: string}
  summary TEXT, -- AI-generated summary of conversation
  context JSONB DEFAULT '{}'::jsonb, -- Additional context (event_type, preferences, etc.)
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_conversations_session_id ON voice_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_contact_id ON voice_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_phone_number ON voice_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_type ON voice_conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_status ON voice_conversations(status);
CREATE INDEX IF NOT EXISTS idx_voice_conversations_last_interaction ON voice_conversations(last_interaction_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_voice_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_interaction_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps
CREATE TRIGGER update_voice_conversations_timestamp
  BEFORE UPDATE ON voice_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_voice_conversations_updated_at();

-- RLS Policies
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;

-- Allow public/anon users to create and read their own conversations (by session_id)
CREATE POLICY "Public can create voice conversations"
  ON voice_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can read own conversations"
  ON voice_conversations FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow if session_id matches (for anonymous users)
    session_id = current_setting('app.session_id', true)
    OR
    -- Allow if contact_id matches authenticated user
    contact_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.uid()
    )
    OR
    -- Allow admins to see all
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

-- Allow service role full access (for API endpoints)
CREATE POLICY "Service role can manage voice conversations"
  ON voice_conversations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to manage all conversations
CREATE POLICY "Admins can manage all voice conversations"
  ON voice_conversations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

COMMENT ON TABLE voice_conversations IS 'Stores all voice AI conversation history for website assistant, calls, and admin assistant';
COMMENT ON COLUMN voice_conversations.session_id IS 'Unique session identifier (from cookie/localStorage) for anonymous users';
COMMENT ON COLUMN voice_conversations.messages IS 'Array of conversation messages with role, content, and timestamp';
COMMENT ON COLUMN voice_conversations.context IS 'Additional context like event_type, preferences, etc.';

