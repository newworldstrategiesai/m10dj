-- Add subtitle styling columns to organizations table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_font') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_font TEXT DEFAULT 'Impact, "Arial Black", "Helvetica Neue", Arial, sans-serif';
        COMMENT ON COLUMN public.organizations.requests_subtitle_font IS 'Font family for the subtitle/location on the requests page.';
    END IF;
END $$;

-- Add requests_subtitle_text_transform
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_text_transform') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_text_transform TEXT DEFAULT 'none';
        COMMENT ON COLUMN public.organizations.requests_subtitle_text_transform IS 'Text transform for the subtitle: uppercase, lowercase, or none (normal case).';
    END IF;
END $$;

-- Add CHECK constraint for requests_subtitle_text_transform
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_requests_subtitle_text_transform_check') THEN
        ALTER TABLE public.organizations
        ADD CONSTRAINT organizations_requests_subtitle_text_transform_check CHECK (requests_subtitle_text_transform IN ('uppercase', 'lowercase', 'none'));
    END IF;
END $$;

-- Add subtitle stroke controls
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_stroke_enabled') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_stroke_enabled BOOLEAN DEFAULT false;
        COMMENT ON COLUMN public.organizations.requests_subtitle_stroke_enabled IS 'Whether to show a stroke/outline around the subtitle text.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_stroke_width') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_stroke_width INTEGER DEFAULT 2;
        COMMENT ON COLUMN public.organizations.requests_subtitle_stroke_width IS 'Width of the stroke in pixels.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_stroke_color') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_stroke_color TEXT DEFAULT '#000000';
        COMMENT ON COLUMN public.organizations.requests_subtitle_stroke_color IS 'Color of the stroke (hex format).';
    END IF;
END $$;

-- Add subtitle drop shadow controls
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_shadow_enabled') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_shadow_enabled BOOLEAN DEFAULT true;
        COMMENT ON COLUMN public.organizations.requests_subtitle_shadow_enabled IS 'Whether to show a drop shadow on the subtitle text.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_shadow_x_offset') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_shadow_x_offset INTEGER DEFAULT 3;
        COMMENT ON COLUMN public.organizations.requests_subtitle_shadow_x_offset IS 'Horizontal offset of the drop shadow in pixels.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_shadow_y_offset') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_shadow_y_offset INTEGER DEFAULT 3;
        COMMENT ON COLUMN public.organizations.requests_subtitle_shadow_y_offset IS 'Vertical offset of the drop shadow in pixels.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_shadow_blur') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_shadow_blur INTEGER DEFAULT 6;
        COMMENT ON COLUMN public.organizations.requests_subtitle_shadow_blur IS 'Blur radius of the drop shadow in pixels.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_shadow_color') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_shadow_color TEXT DEFAULT 'rgba(0, 0, 0, 0.8)';
        COMMENT ON COLUMN public.organizations.requests_subtitle_shadow_color IS 'Color of the drop shadow (rgba format).';
    END IF;
END $$;

-- Add subtitle color
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_color') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_color TEXT DEFAULT '#ffffff';
        COMMENT ON COLUMN public.organizations.requests_subtitle_color IS 'Color of the subtitle text on the requests page (hex format).';
    END IF;
END $$;

-- Add subtitle kerning
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_subtitle_kerning') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_subtitle_kerning NUMERIC(5, 2) DEFAULT 0;
        COMMENT ON COLUMN public.organizations.requests_subtitle_kerning IS 'Letter spacing (kerning) for the subtitle on the requests page in pixels.';
    END IF;
END $$;

-- Add show subtitle toggle
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_show_subtitle') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_show_subtitle BOOLEAN DEFAULT true;
        COMMENT ON COLUMN public.organizations.requests_show_subtitle IS 'Whether to show the subtitle/location on the requests page.';
    END IF;
END $$;

