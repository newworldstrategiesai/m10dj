-- Add charity donation fields to organizations table
-- Allows admins to donate all or a portion of tip jar proceeds to a nonprofit/charity

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS charity_donation_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS charity_donation_percentage INTEGER DEFAULT 0 CHECK (charity_donation_percentage >= 0 AND charity_donation_percentage <= 100),
ADD COLUMN IF NOT EXISTS charity_name TEXT,
ADD COLUMN IF NOT EXISTS charity_url TEXT,
ADD COLUMN IF NOT EXISTS charity_description TEXT;

-- Add comments
COMMENT ON COLUMN public.organizations.charity_donation_enabled IS 'Whether charity donations are enabled for this organization';
COMMENT ON COLUMN public.organizations.charity_donation_percentage IS 'Percentage of tip jar proceeds to donate (0-100). 100 means all proceeds go to charity.';
COMMENT ON COLUMN public.organizations.charity_name IS 'Name of the charity/nonprofit organization';
COMMENT ON COLUMN public.organizations.charity_url IS 'URL to the charity/nonprofit website';
COMMENT ON COLUMN public.organizations.charity_description IS 'Description of the charity/nonprofit (optional)';

-- Create index for charity lookup
CREATE INDEX IF NOT EXISTS idx_organizations_charity_enabled ON organizations(charity_donation_enabled) WHERE charity_donation_enabled = TRUE;

