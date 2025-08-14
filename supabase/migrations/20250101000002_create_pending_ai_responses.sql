-- Create table for tracking pending AI responses
CREATE TABLE IF NOT EXISTS public.pending_ai_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    original_message TEXT NOT NULL,
    original_message_id VARCHAR(100), -- Twilio MessageSid
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,
    ai_response TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS pending_ai_responses_phone_idx ON public.pending_ai_responses(phone_number);
CREATE INDEX IF NOT EXISTS pending_ai_responses_scheduled_idx ON public.pending_ai_responses(scheduled_for);
CREATE INDEX IF NOT EXISTS pending_ai_responses_status_idx ON public.pending_ai_responses(status);
CREATE INDEX IF NOT EXISTS pending_ai_responses_message_id_idx ON public.pending_ai_responses(original_message_id);

-- Add RLS policies
ALTER TABLE public.pending_ai_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can manage pending responses
CREATE POLICY "Admin users can manage pending AI responses"
    ON public.pending_ai_responses
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
CREATE POLICY "Service role can manage pending AI responses"
    ON public.pending_ai_responses
    FOR ALL
    TO service_role
    USING (true);

-- Create function to clean up old processed responses
CREATE OR REPLACE FUNCTION cleanup_old_pending_responses()
RETURNS void AS $$
BEGIN
    -- Delete processed responses older than 24 hours
    DELETE FROM public.pending_ai_responses 
    WHERE status IN ('processed', 'cancelled', 'failed')
    AND updated_at < NOW() - INTERVAL '24 hours';
    
    -- Delete pending responses older than 2 hours (something went wrong)
    DELETE FROM public.pending_ai_responses 
    WHERE status = 'pending'
    AND scheduled_for < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pending_ai_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pending_ai_responses_updated_at_trigger
    BEFORE UPDATE ON public.pending_ai_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_pending_ai_responses_updated_at();
