-- Add subtitle type selection fields to organizations table
-- This allows users to choose between City/State (location), Venue, or Custom text for subtitle

-- Add requests_subtitle_type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_type') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_type TEXT DEFAULT 'location';
        COMMENT ON COLUMN public.organizations.requests_subtitle_type IS 'Type of subtitle content: location (city/state), venue, or custom.';
    END IF;
END $$;

-- Add CHECK constraint for requests_subtitle_type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_requests_subtitle_type_check') THEN
        ALTER TABLE public.organizations
        ADD CONSTRAINT organizations_requests_subtitle_type_check CHECK (requests_subtitle_type IN ('location', 'venue', 'custom'));
    END IF;
END $$;

-- Add requests_subtitle_venue
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_venue') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_venue TEXT;
        COMMENT ON COLUMN public.organizations.requests_subtitle_venue IS 'Venue name to display as subtitle (when subtitle_type is venue).';
    END IF;
END $$;

-- Add requests_subtitle_custom_text
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_custom_text') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_custom_text TEXT;
        COMMENT ON COLUMN public.organizations.requests_subtitle_custom_text IS 'Custom text to display as subtitle (when subtitle_type is custom).';
    END IF;
END $$;

-- Update subtitle font to be nullable (it will default to artist name font if null)
-- This allows the subtitle to use the same font as the display name by default
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_font' AND is_nullable = 'NO') THEN
        ALTER TABLE public.organizations
        ALTER COLUMN requests_subtitle_font DROP NOT NULL;
    END IF;
END $$;

