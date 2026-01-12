-- Migration: Add wavy background configuration options
-- These columns store configuration for the wavy background animation

-- Add requests_wavy_colors (JSON array of color strings)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_wavy_colors'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_wavy_colors JSONB DEFAULT '["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"]'::jsonb;
        COMMENT ON COLUMN public.organizations.requests_wavy_colors IS 'Array of color strings for wavy background waves (JSON array format)';
    END IF;
END $$;

-- Add requests_wavy_wave_width (number)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_wavy_wave_width'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_wavy_wave_width INTEGER DEFAULT 50;
        COMMENT ON COLUMN public.organizations.requests_wavy_wave_width IS 'Width/thickness of the wave lines (default: 50)';
    END IF;
END $$;

-- Add requests_wavy_background_fill (string)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_wavy_background_fill'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_wavy_background_fill TEXT DEFAULT 'black';
        COMMENT ON COLUMN public.organizations.requests_wavy_background_fill IS 'Background color behind the waves (hex format, default: black)';
    END IF;
END $$;

-- Add requests_wavy_blur (number)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_wavy_blur'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_wavy_blur INTEGER DEFAULT 10;
        COMMENT ON COLUMN public.organizations.requests_wavy_blur IS 'Blur intensity applied to the waves (default: 10)';
    END IF;
END $$;

-- Add requests_wavy_speed (text: "slow" | "fast")
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_wavy_speed'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_wavy_speed TEXT DEFAULT 'fast';
        COMMENT ON COLUMN public.organizations.requests_wavy_speed IS 'Animation speed of the waves: slow or fast (default: fast)';
    END IF;
END $$;

-- Add CHECK constraint for requests_wavy_speed
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organizations_requests_wavy_speed_check'
    ) THEN
        ALTER TABLE public.organizations
        ADD CONSTRAINT organizations_requests_wavy_speed_check 
        CHECK (requests_wavy_speed IN ('slow', 'fast'));
    END IF;
END $$;

-- Add requests_wavy_wave_opacity (number)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='organizations' 
        AND column_name='requests_wavy_wave_opacity'
    ) THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_wavy_wave_opacity DECIMAL(3,2) DEFAULT 0.5;
        COMMENT ON COLUMN public.organizations.requests_wavy_wave_opacity IS 'Opacity of the wave animation (0-1, default: 0.5)';
    END IF;
END $$;

-- Add CHECK constraint for requests_wavy_wave_opacity
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organizations_requests_wavy_wave_opacity_check'
    ) THEN
        ALTER TABLE public.organizations
        ADD CONSTRAINT organizations_requests_wavy_wave_opacity_check 
        CHECK (requests_wavy_wave_opacity >= 0 AND requests_wavy_wave_opacity <= 1);
    END IF;
END $$;
