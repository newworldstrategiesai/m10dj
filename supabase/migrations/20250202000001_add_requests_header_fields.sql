-- Add header fields to organizations table for public requests page
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_header_artist_name TEXT,
ADD COLUMN IF NOT EXISTS requests_header_location TEXT,
ADD COLUMN IF NOT EXISTS requests_header_date TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.requests_header_artist_name IS 'Artist/DJ name displayed in the requests page header';
COMMENT ON COLUMN public.organizations.requests_header_location IS 'Location/venue name displayed in the requests page header';
COMMENT ON COLUMN public.organizations.requests_header_date IS 'Date displayed in the requests page header';

