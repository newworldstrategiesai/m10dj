-- Add primary cover source field to organizations table
-- This determines which photo (artist or venue) to use as primary when both are set

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_primary_cover_source TEXT DEFAULT 'artist' CHECK (requests_primary_cover_source IN ('artist', 'venue'));

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.requests_primary_cover_source IS 'Determines which photo to use as primary cover when both artist and venue photos are set. Options: "artist" or "venue". Defaults to "artist".';

