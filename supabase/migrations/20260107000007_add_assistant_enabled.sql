-- Add requests_assistant_enabled to organizations table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='organizations' AND column_name='requests_assistant_enabled') THEN
        ALTER TABLE public.organizations
        ADD COLUMN requests_assistant_enabled BOOLEAN DEFAULT TRUE;
        COMMENT ON COLUMN public.organizations.requests_assistant_enabled IS 'Whether to display the TipJar assistant chat widget on the requests page.';
    END IF;
END $$;

