-- Add Instagram integration fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS instagram_id TEXT,
ADD COLUMN IF NOT EXISTS instagram_username TEXT,
ADD COLUMN IF NOT EXISTS instagram_profile_url TEXT;

-- Create index for Instagram lookups
CREATE INDEX IF NOT EXISTS idx_contacts_instagram_id ON public.contacts(instagram_id);
CREATE INDEX IF NOT EXISTS idx_contacts_instagram_username ON public.contacts(instagram_username);

-- Create instagram_messages table to store all Instagram interactions
CREATE TABLE IF NOT EXISTS public.instagram_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_id TEXT,
    message_text TEXT,
    message_type TEXT DEFAULT 'dm', -- 'dm', 'comment', 'mention'
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_lead_inquiry BOOLEAN DEFAULT FALSE,
    processed BOOLEAN DEFAULT FALSE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for instagram_messages
CREATE INDEX IF NOT EXISTS idx_instagram_messages_sender ON public.instagram_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_timestamp ON public.instagram_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_lead_inquiry ON public.instagram_messages(is_lead_inquiry) WHERE is_lead_inquiry = true;

-- Create instagram_sync_log table to track sync status
CREATE TABLE IF NOT EXISTS public.instagram_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type TEXT NOT NULL, -- 'messages', 'comments', 'mentions'
    sync_status TEXT NOT NULL, -- 'success', 'failed', 'in_progress'
    messages_synced INTEGER DEFAULT 0,
    leads_created INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for instagram_messages
ALTER TABLE public.instagram_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all Instagram messages"
    ON public.instagram_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admin users can manage Instagram messages"
    ON public.instagram_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- RLS Policies for instagram_sync_log
ALTER TABLE public.instagram_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view sync logs"
    ON public.instagram_sync_log
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
COMMENT ON TABLE public.instagram_messages IS 'Stores Instagram DMs, comments, and mentions for lead tracking';
COMMENT ON TABLE public.instagram_sync_log IS 'Tracks Instagram sync operations and their results';

-- Comment on columns
COMMENT ON COLUMN public.contacts.instagram_id IS 'Instagram user ID';
COMMENT ON COLUMN public.contacts.instagram_username IS 'Instagram username without @';
COMMENT ON COLUMN public.contacts.instagram_profile_url IS 'Full Instagram profile URL';

