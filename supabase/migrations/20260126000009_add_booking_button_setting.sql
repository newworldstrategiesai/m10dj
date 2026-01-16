-- Add booking button setting to organizations table
-- Allows super admin and TipJar users to show a booking button at the bottom of the requests page
-- The button opens the full-screen contact form modal (same as m10djcompany.com)

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_show_booking_button BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.requests_show_booking_button IS 'Show booking button at bottom of requests page (opens full-screen contact form modal). Available for super admin and TipJar users only.';
