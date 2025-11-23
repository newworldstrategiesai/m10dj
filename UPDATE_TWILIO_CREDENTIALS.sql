-- Run this SQL in your Supabase SQL Editor to update Twilio credentials
-- Make sure to replace the user_id with your actual admin user ID
-- You can find it by running: SELECT id, email FROM auth.users WHERE email = 'djbenmurray@gmail.com';

-- Step 1: Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    twilio_sid text,
    twilio_auth_token text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Step 2: Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;

-- Step 4: Create policies
CREATE POLICY "Users can view their own API keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON public.api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Create index
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- Step 6: Insert or update the credentials
-- First, get your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'djbenmurray@gmail.com';

-- Then run this (replace USER_ID_HERE with your actual user ID from above):
-- Replace YOUR_TWILIO_SID and YOUR_TWILIO_AUTH_TOKEN with your actual credentials
INSERT INTO public.api_keys (user_id, twilio_sid, twilio_auth_token, updated_at)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'djbenmurray@gmail.com' LIMIT 1),
    'YOUR_TWILIO_SID',
    'YOUR_TWILIO_AUTH_TOKEN',
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    twilio_sid = EXCLUDED.twilio_sid,
    twilio_auth_token = EXCLUDED.twilio_auth_token,
    updated_at = NOW();

-- Verify it worked:
SELECT 
    id,
    user_id,
    LEFT(twilio_sid, 10) || '...' as masked_sid,
    LEFT(twilio_auth_token, 10) || '...' as masked_token,
    updated_at
FROM public.api_keys
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'djbenmurray@gmail.com' LIMIT 1);

