-- Migration: Remove 'bubble' and 'spiral' from requests_background_type CHECK constraint
-- These animation options were removed from the UI, so we need to update the database constraint

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE public.organizations
    DROP CONSTRAINT IF EXISTS organizations_requests_background_type_check;

    -- Recreate the constraint without 'bubble' and 'spiral'
    ALTER TABLE public.organizations
    ADD CONSTRAINT organizations_requests_background_type_check
    CHECK (requests_background_type IN ('gradient', 'subtle', 'aurora', 'smoke', 'smooth-spiral', 'vortex', 'fireflies', 'wavy', 'none'));
    
    -- Update the comment to reflect the new allowed values
    COMMENT ON COLUMN public.organizations.requests_background_type IS 'Type of background animation: gradient, subtle, aurora, smoke, smooth-spiral, vortex, fireflies, wavy, or none. Used when no video or cover photo is set.';
END
$$;
