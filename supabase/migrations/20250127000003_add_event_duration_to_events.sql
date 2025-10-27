-- Add event_duration column to events table if it doesn't exist

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'events' 
    AND column_name = 'event_duration'
  ) THEN
    ALTER TABLE public.events 
    ADD COLUMN event_duration NUMERIC(4,1);
    
    COMMENT ON COLUMN public.events.event_duration IS 'Duration of event in hours (e.g., 4.5)';
  END IF;
END $$;

