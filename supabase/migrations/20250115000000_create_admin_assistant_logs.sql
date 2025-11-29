-- Create admin_assistant_logs table for tracking assistant interactions
CREATE TABLE IF NOT EXISTS public.admin_assistant_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    message TEXT NOT NULL,
    response TEXT,
    functions_called TEXT[],
    usage_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_assistant_logs_user_id ON public.admin_assistant_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_assistant_logs_created_at ON public.admin_assistant_logs(created_at);

-- Enable RLS
ALTER TABLE public.admin_assistant_logs ENABLE ROW LEVEL SECURITY;

-- Admin users can view their own logs
CREATE POLICY "Admin users can view their own logs"
    ON public.admin_assistant_logs
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        auth.email() IN (
            'admin@m10djcompany.com',
            'manager@m10djcompany.com',
            'djbenmurray@gmail.com'
        )
    );

-- Service role can insert logs
CREATE POLICY "Service role can insert logs"
    ON public.admin_assistant_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

