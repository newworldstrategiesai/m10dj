-- Disable audio upload by default for new organizations during onboarding
-- This ensures new TipJar users start with audio upload disabled and can enable it later if needed

-- Update the default value for the column
ALTER TABLE public.organizations
  ALTER COLUMN requests_show_audio_upload SET DEFAULT FALSE;

-- Add comment to document the change
COMMENT ON COLUMN public.organizations.requests_show_audio_upload IS 'Show/hide audio upload option on requests page. Disabled by default during onboarding.';
