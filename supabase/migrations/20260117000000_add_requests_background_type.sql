-- Migration: Add requests_background_type column
-- This column stores the type of background animation to use on the requests page
-- Options: gradient, subtle, bubble, spiral, aurora, smoke, smooth-spiral, vortex, none

-- Add requests_background_type column
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_background_type'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_background_type TEXT DEFAULT 'gradient';
        COMMENT ON COLUMN public.organizations.requests_background_type IS 'Type of background animation: gradient, subtle, bubble, spiral, aurora, smoke, smooth-spiral, vortex, or none. Used when no video or cover photo is set.';
    END IF;
END $$;
