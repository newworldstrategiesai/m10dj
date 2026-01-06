-- Add CashApp and Venmo username fields to organizations table
-- These allow each organization to set their own payment usernames for the requests page

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_cashapp_tag TEXT,
ADD COLUMN IF NOT EXISTS requests_venmo_username TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.requests_cashapp_tag IS 'CashApp tag for receiving tips on the requests page (e.g., $username)';
COMMENT ON COLUMN public.organizations.requests_venmo_username IS 'Venmo username for receiving tips on the requests page (e.g., @username)';

