-- Add requests_default_preset_amount to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_default_preset_amount INTEGER NULL;

COMMENT ON COLUMN public.organizations.requests_default_preset_amount IS 'Default preset amount button to be selected when the requests page loads, in cents. If NULL, defaults to the maximum preset amount.';

