-- Add requests_artist_name_color and requests_artist_name_kerning to organizations table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_artist_name_color') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_artist_name_color TEXT DEFAULT '#ffffff';
        COMMENT ON COLUMN public.organizations.requests_artist_name_color IS 'Color of the artist/display name on the requests page (hex format).';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_artist_name_kerning') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_artist_name_kerning NUMERIC(5, 2) DEFAULT 0;
        COMMENT ON COLUMN public.organizations.requests_artist_name_kerning IS 'Letter spacing (kerning) for the artist/display name on the requests page in pixels.';
    END IF;
END $$;

