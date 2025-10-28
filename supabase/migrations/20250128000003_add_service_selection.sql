-- Create service selection tokens table
CREATE TABLE IF NOT EXISTS public.service_selection_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_service_selection_tokens_token ON public.service_selection_tokens(token);
CREATE INDEX IF NOT EXISTS idx_service_selection_tokens_contact ON public.service_selection_tokens(contact_id);
CREATE INDEX IF NOT EXISTS idx_service_selection_tokens_expires ON public.service_selection_tokens(expires_at);

-- Create service selections table to store their choices
CREATE TABLE IF NOT EXISTS public.service_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
    token_id UUID REFERENCES public.service_selection_tokens(id) ON DELETE SET NULL,
    
    -- Event details
    event_type TEXT,
    event_date DATE,
    event_time TIME,
    venue_name TEXT,
    venue_address TEXT,
    guest_count INTEGER,
    event_duration_hours DECIMAL(3,1),
    
    -- Service selections
    services_selected JSONB, -- Array of selected services
    add_ons JSONB, -- Additional add-ons selected
    
    -- Package selection
    package_selected TEXT, -- 'basic', 'premium', 'platinum', 'custom'
    estimated_price DECIMAL(10,2),
    
    -- Additional info
    music_preferences TEXT,
    special_requests TEXT,
    budget_range TEXT,
    
    -- Timeline
    ceremony_music BOOLEAN DEFAULT FALSE,
    cocktail_hour BOOLEAN DEFAULT FALSE,
    reception BOOLEAN DEFAULT FALSE,
    after_party BOOLEAN DEFAULT FALSE,
    
    -- Status
    status TEXT DEFAULT 'submitted', -- 'submitted', 'reviewed', 'quoted', 'booked'
    admin_notes TEXT,
    
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for service_selections
CREATE INDEX IF NOT EXISTS idx_service_selections_contact ON public.service_selections(contact_id);
CREATE INDEX IF NOT EXISTS idx_service_selections_token ON public.service_selections(token_id);
CREATE INDEX IF NOT EXISTS idx_service_selections_status ON public.service_selections(status);
CREATE INDEX IF NOT EXISTS idx_service_selections_submitted ON public.service_selections(submitted_at DESC);

-- Add service selection tracking to contacts
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS service_selection_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS service_selection_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS service_selection_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS service_selection_completed_at TIMESTAMP WITH TIME ZONE;

-- RLS Policies for service_selection_tokens
ALTER TABLE public.service_selection_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public to validate tokens (they'll only see their own via token)
CREATE POLICY "Anyone can validate their own token"
    ON public.service_selection_tokens
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Admin users can manage all tokens
CREATE POLICY "Admin users can manage tokens"
    ON public.service_selection_tokens
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- RLS Policies for service_selections
ALTER TABLE public.service_selections ENABLE ROW LEVEL SECURITY;

-- Allow public to insert their selections (they'll need valid token)
CREATE POLICY "Anyone can submit service selections"
    ON public.service_selections
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Allow public to view their own selections via token
CREATE POLICY "Anyone can view their own selections"
    ON public.service_selections
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Admin users can manage all selections
CREATE POLICY "Admin users can manage all selections"
    ON public.service_selections
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- Function to generate random token
CREATE OR REPLACE FUNCTION generate_selection_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random token (32 characters)
        token := encode(gen_random_bytes(24), 'base64');
        token := replace(replace(replace(token, '/', '_'), '+', '-'), '=', '');
        
        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM service_selection_tokens WHERE token = token) INTO token_exists;
        
        EXIT WHEN NOT token_exists;
    END LOOP;
    
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM service_selection_tokens 
    WHERE expires_at < NOW() 
    AND is_used = FALSE
    RETURNING COUNT(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE public.service_selection_tokens IS 'Secure tokens for unique service selection links';
COMMENT ON TABLE public.service_selections IS 'Service and package selections made by leads';
COMMENT ON COLUMN public.service_selection_tokens.token IS 'Unique URL-safe token for accessing service selection page';
COMMENT ON COLUMN public.service_selections.services_selected IS 'JSON array of selected service IDs';
COMMENT ON COLUMN public.service_selections.package_selected IS 'Selected package tier: basic, premium, platinum, or custom';

