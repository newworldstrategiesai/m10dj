-- Add Venmo phone number field to organizations table
-- This allows each organization to set their own Venmo phone number for more reliable deep links

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_venmo_phone_number TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.requests_venmo_phone_number IS 'Venmo phone number (10 digits) for receiving payments via deep links. Using phone number instead of username prevents customers from needing to verify the phone number when making payments.';

