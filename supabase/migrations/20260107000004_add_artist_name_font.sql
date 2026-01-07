-- Add requests_artist_name_font to organizations table (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'requests_artist_name_font'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_artist_name_font TEXT DEFAULT 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif';

        COMMENT ON COLUMN public.organizations.requests_artist_name_font IS 'Font family for the artist/display name on the requests page.';
    END IF;
END $$;

-- Add requests_artist_name_text_transform to organizations table (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'requests_artist_name_text_transform'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_artist_name_text_transform TEXT DEFAULT 'uppercase';

        -- Add check constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'organizations_requests_artist_name_text_transform_check'
        ) THEN
            ALTER TABLE public.organizations
            ADD CONSTRAINT organizations_requests_artist_name_text_transform_check 
            CHECK (requests_artist_name_text_transform IN ('uppercase', 'lowercase', 'none'));
        END IF;

        COMMENT ON COLUMN public.organizations.requests_artist_name_text_transform IS 'Text transform for the artist/display name: uppercase, lowercase, or none (normal case).';
    END IF;
END $$;

-- Add stroke (text outline) controls (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'requests_artist_name_stroke_enabled'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_artist_name_stroke_enabled BOOLEAN DEFAULT false,
        ADD COLUMN requests_artist_name_stroke_width INTEGER DEFAULT 2,
        ADD COLUMN requests_artist_name_stroke_color TEXT DEFAULT '#000000';

        COMMENT ON COLUMN public.organizations.requests_artist_name_stroke_enabled IS 'Whether to show a stroke/outline around the display name text.';
        COMMENT ON COLUMN public.organizations.requests_artist_name_stroke_width IS 'Width of the stroke in pixels.';
        COMMENT ON COLUMN public.organizations.requests_artist_name_stroke_color IS 'Color of the stroke (hex format).';
    END IF;
END $$;

-- Add drop shadow controls (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'requests_artist_name_shadow_enabled'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_artist_name_shadow_enabled BOOLEAN DEFAULT true,
        ADD COLUMN requests_artist_name_shadow_x_offset INTEGER DEFAULT 3,
        ADD COLUMN requests_artist_name_shadow_y_offset INTEGER DEFAULT 3,
        ADD COLUMN requests_artist_name_shadow_blur INTEGER DEFAULT 6,
        ADD COLUMN requests_artist_name_shadow_color TEXT DEFAULT 'rgba(0, 0, 0, 0.8)';

        COMMENT ON COLUMN public.organizations.requests_artist_name_shadow_enabled IS 'Whether to show a drop shadow on the display name text.';
        COMMENT ON COLUMN public.organizations.requests_artist_name_shadow_x_offset IS 'Horizontal offset of the drop shadow in pixels.';
        COMMENT ON COLUMN public.organizations.requests_artist_name_shadow_y_offset IS 'Vertical offset of the drop shadow in pixels.';
        COMMENT ON COLUMN public.organizations.requests_artist_name_shadow_blur IS 'Blur radius of the drop shadow in pixels.';
        COMMENT ON COLUMN public.organizations.requests_artist_name_shadow_color IS 'Color of the drop shadow (rgba format).';
    END IF;
END $$;
