-- Add Facebook Messenger integration fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS facebook_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_profile_url TEXT;

-- Create indexes for Facebook lookups
CREATE INDEX IF NOT EXISTS idx_contacts_facebook_id ON public.contacts(facebook_id);

-- Create messenger_messages table to store all Messenger interactions
CREATE TABLE IF NOT EXISTS public.messenger_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_id TEXT,
    message_text TEXT,
    message_type TEXT DEFAULT 'message', -- 'message', 'postback', 'referral'
    message_id TEXT, -- Facebook message ID
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_lead_inquiry BOOLEAN DEFAULT FALSE,
    processed BOOLEAN DEFAULT FALSE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messenger_messages
CREATE INDEX IF NOT EXISTS idx_messenger_messages_sender ON public.messenger_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messenger_messages_timestamp ON public.messenger_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messenger_messages_lead_inquiry ON public.messenger_messages(is_lead_inquiry) WHERE is_lead_inquiry = true;
CREATE INDEX IF NOT EXISTS idx_messenger_messages_message_id ON public.messenger_messages(message_id);

-- Create messenger_sync_log table to track sync status
CREATE TABLE IF NOT EXISTS public.messenger_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type TEXT NOT NULL, -- 'messages', 'conversations'
    sync_status TEXT NOT NULL, -- 'success', 'failed', 'in_progress'
    messages_synced INTEGER DEFAULT 0,
    leads_created INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for messenger_messages
ALTER TABLE public.messenger_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all Messenger messages"
    ON public.messenger_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admin users can manage Messenger messages"
    ON public.messenger_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- RLS Policies for messenger_sync_log
ALTER TABLE public.messenger_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view Messenger sync logs"
    ON public.messenger_sync_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Comment on tables
COMMENT ON TABLE public.messenger_messages IS 'Stores Facebook Messenger messages for lead tracking';
COMMENT ON TABLE public.messenger_sync_log IS 'Tracks Messenger sync operations and their results';

-- Comment on columns
COMMENT ON COLUMN public.contacts.facebook_id IS 'Facebook user ID (PSID)';
COMMENT ON COLUMN public.contacts.facebook_profile_url IS 'Facebook profile picture URL';

