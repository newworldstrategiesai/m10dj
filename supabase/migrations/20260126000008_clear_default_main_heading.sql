-- Clear the default "What would you like to request?" heading for all organizations
-- This hides the heading by default since the frontend now checks for the default value

-- Set to NULL for organizations that have the default value
UPDATE public.organizations
SET requests_main_heading = NULL
WHERE requests_main_heading = 'What would you like to request?'
   OR requests_main_heading = 'What would you like to request??'; -- Handle variant with double ??

-- Update the column default to NULL instead of the text value
-- This way new organizations won't have the heading by default
ALTER TABLE public.organizations
ALTER COLUMN requests_main_heading SET DEFAULT NULL;

-- Optionally, clear it for a specific organization (M10 DJ Company)
-- Uncomment the following if you want to specifically target M10 DJ Company
-- UPDATE public.organizations
-- SET requests_main_heading = NULL
-- WHERE slug = 'm10djcompany';

-- Add comment
COMMENT ON COLUMN public.organizations.requests_main_heading IS 'Main heading for the requests page. NULL means hidden by default. Set a custom value to show a heading.';
