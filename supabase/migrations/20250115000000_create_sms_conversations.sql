/**
 * SMS Conversations Table
 * Stores conversation history between AI assistant and leads via SMS
 */

CREATE TABLE IF NOT EXISTS sms_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID,
  phone_number TEXT NOT NULL UNIQUE,
  messages JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_from TEXT, -- 'user' or 'assistant'
  conversation_status TEXT DEFAULT 'active', -- active, resolved, archived
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint (separate from table creation for safety)
ALTER TABLE sms_conversations
ADD CONSTRAINT fk_sms_conversations_contact_id
FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_conversations_contact_id ON sms_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_phone_number ON sms_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_updated_at ON sms_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_status ON sms_conversations(conversation_status);

-- Enable RLS (Row Level Security)
ALTER TABLE sms_conversations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admin) to view all conversations
CREATE POLICY "Admins can view all SMS conversations"
  ON sms_conversations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow system to insert/update conversations
CREATE POLICY "System can manage SMS conversations"
  ON sms_conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_sms_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER sms_conversations_updated_at
  BEFORE UPDATE ON sms_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_conversations_updated_at();

-- Add comment
COMMENT ON TABLE sms_conversations IS 'Stores SMS conversation history between AI assistant and leads';
COMMENT ON COLUMN sms_conversations.messages IS 'JSON array of message objects: [{role: "user"|"assistant", content: string, timestamp: ISO string}]';
COMMENT ON COLUMN sms_conversations.conversation_status IS 'Status: active (ongoing), resolved (client satisfied), archived (closed)';

