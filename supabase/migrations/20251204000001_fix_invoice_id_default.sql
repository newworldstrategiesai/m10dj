-- Fix invoices.id column to have default UUID generation
-- The column_default was null, which is causing insert failures

-- First, check if the default is missing
DO $$
BEGIN
  -- Check current default
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'invoices' 
      AND column_name = 'id' 
      AND column_default LIKE '%gen_random_uuid%'
  ) THEN
    -- Set the default if it's missing
    ALTER TABLE public.invoices 
    ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    RAISE NOTICE '✅ Fixed invoices.id default to gen_random_uuid()';
  ELSE
    RAISE NOTICE 'ℹ️  invoices.id already has correct default';
  END IF;
END $$;

COMMENT ON COLUMN public.invoices.id IS 'Primary key UUID, auto-generated on insert';

