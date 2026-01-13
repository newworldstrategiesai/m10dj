-- Add extended event fields to events table to match contacts table
-- This allows event-specific data to be stored directly on events

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS setup_time TIME,
ADD COLUMN IF NOT EXISTS venue_type TEXT,
ADD COLUMN IF NOT EXISTS venue_room TEXT;

-- Add comments to explain the new fields
COMMENT ON COLUMN public.events.setup_time IS 'Time when DJ/vendor should arrive to set up equipment before the event';
COMMENT ON COLUMN public.events.venue_type IS 'Type of venue (e.g., clubhouse, ballroom, restaurant, outdoor)';
COMMENT ON COLUMN public.events.venue_room IS 'Specific room or area within the venue (e.g., "Main Ballroom", "Clubhouse")';

-- Add index for venue_type for potential filtering/analytics
CREATE INDEX IF NOT EXISTS events_venue_type_idx ON public.events(venue_type);
