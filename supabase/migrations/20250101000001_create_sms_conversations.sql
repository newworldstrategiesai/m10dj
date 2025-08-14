-- Create SMS conversations table for ChatGPT assistant
CREATE TABLE IF NOT EXISTS public.sms_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message_content TEXT NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(50) DEFAULT 'customer' CHECK (message_type IN ('customer', 'ai_assistant', 'admin', 'auto_reply')),
    
    -- AI Context
    ai_model VARCHAR(50), -- 'gpt-4', 'gpt-3.5-turbo', etc.
    ai_tokens_used INTEGER,
    ai_response_time_ms INTEGER,
    
    -- Message Metadata
    twilio_message_sid VARCHAR(100),
    message_status VARCHAR(20) DEFAULT 'sent',
    error_message TEXT,
    
    -- Customer Context
    customer_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
    conversation_session_id uuid, -- Group related messages
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS sms_conversations_phone_idx ON public.sms_conversations(phone_number);
CREATE INDEX IF NOT EXISTS sms_conversations_created_at_idx ON public.sms_conversations(created_at);
CREATE INDEX IF NOT EXISTS sms_conversations_customer_id_idx ON public.sms_conversations(customer_id);
CREATE INDEX IF NOT EXISTS sms_conversations_session_idx ON public.sms_conversations(conversation_session_id);
CREATE INDEX IF NOT EXISTS sms_conversations_direction_idx ON public.sms_conversations(direction);

-- Create a function to generate conversation session IDs
CREATE OR REPLACE FUNCTION generate_conversation_session()
RETURNS uuid AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Create a function to get or create conversation session
CREATE OR REPLACE FUNCTION get_or_create_conversation_session(phone_num TEXT)
RETURNS uuid AS $$
DECLARE
    session_id uuid;
    last_message_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the most recent conversation session for this phone number
    SELECT conversation_session_id, created_at 
    INTO session_id, last_message_time
    FROM public.sms_conversations 
    WHERE phone_number = phone_num 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- If no previous session or last message was more than 2 hours ago, create new session
    IF session_id IS NULL OR last_message_time < (NOW() - INTERVAL '2 hours') THEN
        session_id := generate_conversation_session();
    END IF;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE public.sms_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can see all conversations
CREATE POLICY "Admin users can manage all SMS conversations"
    ON public.sms_conversations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Policy: Service role can manage all (for API endpoints)
CREATE POLICY "Service role can manage SMS conversations"
    ON public.sms_conversations
    FOR ALL
    TO service_role
    USING (true);

-- Create a view for conversation summaries
CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT 
    sc.phone_number,
    sc.conversation_session_id,
    COUNT(*) as message_count,
    MIN(sc.created_at) as conversation_start,
    MAX(sc.created_at) as last_message,
    COUNT(CASE WHEN sc.direction = 'inbound' THEN 1 END) as inbound_messages,
    COUNT(CASE WHEN sc.direction = 'outbound' THEN 1 END) as outbound_messages,
    COUNT(CASE WHEN sc.message_type = 'ai_assistant' THEN 1 END) as ai_responses,
    ARRAY_AGG(
        CASE WHEN sc.direction = 'inbound' 
        THEN sc.message_content 
        END ORDER BY sc.created_at
    ) FILTER (WHERE sc.direction = 'inbound') as customer_messages,
    -- Get customer info if available
    c.first_name,
    c.last_name,
    c.event_type,
    c.event_date,
    c.lead_status
FROM public.sms_conversations sc
LEFT JOIN public.contacts c ON sc.customer_id = c.id
WHERE sc.conversation_session_id IS NOT NULL
GROUP BY sc.phone_number, sc.conversation_session_id, c.first_name, c.last_name, c.event_type, c.event_date, c.lead_status
ORDER BY MAX(sc.created_at) DESC;

-- Grant access to the view
GRANT SELECT ON public.conversation_summaries TO authenticated;
GRANT SELECT ON public.conversation_summaries TO service_role;

-- Create a function to update contact message counts
CREATE OR REPLACE FUNCTION increment_contact_message_count(phone_num TEXT, count_type TEXT)
RETURNS void AS $$
DECLARE
    clean_phone TEXT;
BEGIN
    -- Clean phone number
    clean_phone := regexp_replace(phone_num, '[^0-9]', '', 'g');
    
    IF count_type = 'received' THEN
        UPDATE public.contacts 
        SET messages_received_count = COALESCE(messages_received_count, 0) + 1,
            last_contacted_date = NOW(),
            last_contact_type = 'sms'
        WHERE phone ILIKE '%' || clean_phone || '%'
        AND deleted_at IS NULL;
    ELSIF count_type = 'sent' THEN
        UPDATE public.contacts 
        SET messages_sent_count = COALESCE(messages_sent_count, 0) + 1
        WHERE phone ILIKE '%' || clean_phone || '%'
        AND deleted_at IS NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update contact message counts
CREATE OR REPLACE FUNCTION update_contact_message_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.direction = 'inbound' THEN
        PERFORM increment_contact_message_count(NEW.phone_number, 'received');
    ELSIF NEW.direction = 'outbound' THEN
        PERFORM increment_contact_message_count(NEW.phone_number, 'sent');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_message_counts_trigger
    AFTER INSERT ON public.sms_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_message_counts();
