-- Migration: Add header background color settings
-- Allows users to set a custom solid color or gradient for the header background
-- when no video, photo, or animation is set

-- Add requests_header_background_type
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_header_background_type'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_header_background_type TEXT DEFAULT 'solid';
        COMMENT ON COLUMN public.organizations.requests_header_background_type IS 'Type of header background: solid or gradient. Used when no video, photo, or animation is set.';
    END IF;
END $$;

-- Add CHECK constraint for requests_header_background_type
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organizations_requests_header_background_type_check'
    ) THEN
        ALTER TABLE public.organizations
        ADD CONSTRAINT organizations_requests_header_background_type_check 
        CHECK (requests_header_background_type IN ('solid', 'gradient'));
    END IF;
END $$;

-- Add requests_header_background_color (for solid color)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_header_background_color'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_header_background_color TEXT DEFAULT '#000000';
        COMMENT ON COLUMN public.organizations.requests_header_background_color IS 'Solid background color for header (hex format, e.g., #000000). Used when requests_header_background_type is "solid" and no media is set.';
    END IF;
END $$;

-- Add requests_header_background_gradient_start (for gradient start color)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_header_background_gradient_start'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_header_background_gradient_start TEXT DEFAULT '#000000';
        COMMENT ON COLUMN public.organizations.requests_header_background_gradient_start IS 'Gradient start color for header (hex format, e.g., #000000). Used when requests_header_background_type is "gradient" and no media is set.';
    END IF;
END $$;

-- Add requests_header_background_gradient_end (for gradient end color)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_header_background_gradient_end'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_header_background_gradient_end TEXT DEFAULT '#1a1a1a';
        COMMENT ON COLUMN public.organizations.requests_header_background_gradient_end IS 'Gradient end color for header (hex format, e.g., #1a1a1a). Used when requests_header_background_type is "gradient" and no media is set.';
    END IF;
END $$;

