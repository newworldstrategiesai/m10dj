-- Add Fast Track and Next Song fee fields to organizations table
-- These allow each organization to set their own priority placement fees

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_fast_track_fee INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS requests_next_fee INTEGER DEFAULT 2000;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.requests_fast_track_fee IS 'Fast Track fee in cents (e.g., 1000 = $10.00). Allows song to be played next.';
COMMENT ON COLUMN public.organizations.requests_next_fee IS 'Next Song fee in cents (e.g., 2000 = $20.00). Allows song to jump to front of queue.';

-- Set default values for existing organizations based on admin_settings if available
-- This migration preserves existing settings
UPDATE public.organizations
SET 
  requests_fast_track_fee = COALESCE(
    (SELECT setting_value::INTEGER 
     FROM admin_settings 
     WHERE admin_settings.user_id = organizations.owner_id 
     AND admin_settings.setting_key = 'crowd_request_fast_track_fee' 
     LIMIT 1),
    1000
  ),
  requests_next_fee = COALESCE(
    (SELECT setting_value::INTEGER 
     FROM admin_settings 
     WHERE admin_settings.user_id = organizations.owner_id 
     AND admin_settings.setting_key = 'crowd_request_next_fee' 
     LIMIT 1),
    2000
  )
WHERE requests_fast_track_fee IS NULL OR requests_next_fee IS NULL;

