-- Add email integration fields to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS primary_email TEXT,
ADD COLUMN IF NOT EXISTS secondary_email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_contacts_primary_email ON public.contacts(primary_email);
CREATE INDEX IF NOT EXISTS idx_contacts_secondary_email ON public.contacts(secondary_email);

-- Create email_messages table to store all email interactions
CREATE TABLE IF NOT EXISTS public.email_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL, -- Gmail message ID
    thread_id TEXT, -- Gmail thread ID for grouping
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_email TEXT NOT NULL,
    cc_email TEXT[],
    bcc_email TEXT[],
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    message_type TEXT DEFAULT 'inbox', -- 'inbox', 'sent', 'draft'
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_lead_inquiry BOOLEAN DEFAULT FALSE,
    processed BOOLEAN DEFAULT FALSE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    has_attachments BOOLEAN DEFAULT FALSE,
    labels TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for email_messages
CREATE INDEX IF NOT EXISTS idx_email_messages_from ON public.email_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_to ON public.email_messages(to_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON public.email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_timestamp ON public.email_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_lead_inquiry ON public.email_messages(is_lead_inquiry) WHERE is_lead_inquiry = true;
CREATE INDEX IF NOT EXISTS idx_email_messages_contact ON public.email_messages(contact_id) WHERE contact_id IS NOT NULL;

-- Create email_attachments table
CREATE TABLE IF NOT EXISTS public.email_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_message_id UUID REFERENCES public.email_messages(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    attachment_id TEXT, -- Gmail attachment ID
    storage_path TEXT, -- Path in storage bucket
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email_attachments
CREATE INDEX IF NOT EXISTS idx_email_attachments_message ON public.email_attachments(email_message_id);

-- Create email_sync_log table to track sync status
CREATE TABLE IF NOT EXISTS public.email_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type TEXT NOT NULL, -- 'full', 'incremental', 'manual'
    sync_status TEXT NOT NULL, -- 'success', 'failed', 'in_progress'
    messages_synced INTEGER DEFAULT 0,
    leads_created INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create email_oauth_tokens table to store Gmail OAuth tokens securely
CREATE TABLE IF NOT EXISTS public.email_oauth_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email_oauth_tokens
CREATE INDEX IF NOT EXISTS idx_email_oauth_tokens_user ON public.email_oauth_tokens(user_email);
CREATE INDEX IF NOT EXISTS idx_email_oauth_tokens_expires ON public.email_oauth_tokens(expires_at);

-- RLS Policies for email_messages
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all email messages"
    ON public.email_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admin users can manage email messages"
    ON public.email_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- RLS Policies for email_attachments
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all email attachments"
    ON public.email_attachments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Admin users can manage email attachments"
    ON public.email_attachments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- RLS Policies for email_sync_log
ALTER TABLE public.email_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view sync logs"
    ON public.email_sync_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- RLS Policies for email_oauth_tokens (very restrictive)
ALTER TABLE public.email_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view oauth tokens"
    ON public.email_oauth_tokens
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

CREATE POLICY "Service role can manage oauth tokens"
    ON public.email_oauth_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comment on tables
COMMENT ON TABLE public.email_messages IS 'Stores all email messages (inbox and sent) for lead tracking';
COMMENT ON TABLE public.email_attachments IS 'Stores metadata for email attachments';
COMMENT ON TABLE public.email_sync_log IS 'Tracks email sync operations and their results';
COMMENT ON TABLE public.email_oauth_tokens IS 'Stores Gmail OAuth tokens for API access';

-- Comment on columns
COMMENT ON COLUMN public.contacts.primary_email IS 'Primary email address for contact';
COMMENT ON COLUMN public.contacts.secondary_email IS 'Secondary email address for contact';
COMMENT ON COLUMN public.email_messages.message_id IS 'Unique Gmail message ID';
COMMENT ON COLUMN public.email_messages.thread_id IS 'Gmail thread ID for conversation grouping';

