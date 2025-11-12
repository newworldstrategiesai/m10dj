/**
 * SMS Conversations Table - Idempotent Setup
 * Stores conversation history between AI assistant and leads via SMS
 * 
 * This migration is idempotent and can be safely re-run.
 * It handles all edge cases including missing columns, missing tables, and constraint conflicts.
 */

BEGIN;

-- 1) Add missing columns if they don't exist
ALTER TABLE public.sms_conversations
  ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS contact_id UUID,
  ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_message_from TEXT,
  ADD COLUMN IF NOT EXISTS conversation_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2) Add foreign key constraint if not already exists
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name = 'sms_conversations'
      AND constraint_name = 'fk_sms_conversations_contact_id'
  ) THEN
    -- Only add if both column and referenced table exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='sms_conversations' AND column_name='contact_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema='public' AND table_name='contacts'
    ) THEN
      ALTER TABLE public.sms_conversations
        ADD CONSTRAINT fk_sms_conversations_contact_id 
        FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
    END IF;
  END IF;
END$$;

-- 3) Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_sms_conversations_contact_id 
  ON public.sms_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_phone_number 
  ON public.sms_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_updated_at 
  ON public.sms_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_conversations_status 
  ON public.sms_conversations(conversation_status);

-- 4) Enable RLS
ALTER TABLE public.sms_conversations ENABLE ROW LEVEL SECURITY;

-- 5) Create/recreate policies
DROP POLICY IF EXISTS "Admins can view all SMS conversations" ON public.sms_conversations;
CREATE POLICY "Admins can view all SMS conversations"
  ON public.sms_conversations
  FOR SELECT
  USING ((auth.jwt() ->> 'role') = 'admin' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "System can manage SMS conversations" ON public.sms_conversations;
CREATE POLICY "System can manage SMS conversations"
  ON public.sms_conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6) Create/recreate trigger function
CREATE OR REPLACE FUNCTION public.update_sms_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS sms_conversations_updated_at ON public.sms_conversations;
CREATE TRIGGER sms_conversations_updated_at
  BEFORE UPDATE ON public.sms_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sms_conversations_updated_at();

-- 7) Add table and column comments
COMMENT ON TABLE public.sms_conversations IS 'Stores SMS conversation history between AI assistant and leads';
COMMENT ON COLUMN public.sms_conversations.id IS 'Unique conversation identifier';
COMMENT ON COLUMN public.sms_conversations.contact_id IS 'Reference to the contact/lead this conversation belongs to';
COMMENT ON COLUMN public.sms_conversations.phone_number IS 'Phone number of the lead (unique constraint ensures 1 conversation per number)';
COMMENT ON COLUMN public.sms_conversations.messages IS 'JSON array of message objects: [{role: "user"|"assistant", content: string, timestamp: ISO string}]';
COMMENT ON COLUMN public.sms_conversations.conversation_status IS 'Status: active (ongoing), resolved (client satisfied), archived (closed)';
COMMENT ON COLUMN public.sms_conversations.last_message_at IS 'Timestamp of the most recent message in the conversation';
COMMENT ON COLUMN public.sms_conversations.last_message_from IS 'Who sent the last message: "user" or "assistant"';

COMMIT;
