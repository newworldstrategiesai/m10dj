-- Add extended event fields to contacts table for better data extraction
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS venue_type TEXT,
ADD COLUMN IF NOT EXISTS venue_room TEXT,
ADD COLUMN IF NOT EXISTS guest_arrival_time TIME,
ADD COLUMN IF NOT EXISTS event_occasion TEXT,
ADD COLUMN IF NOT EXISTS event_for TEXT,
ADD COLUMN IF NOT EXISTS is_surprise BOOLEAN;

-- Add comments to explain the fields
COMMENT ON COLUMN public.contacts.venue_type IS 'Type of venue (e.g., clubhouse, ballroom, outdoor)';
COMMENT ON COLUMN public.contacts.venue_room IS 'Specific room or area within venue (e.g., clubhouse, main ballroom)';
COMMENT ON COLUMN public.contacts.guest_arrival_time IS 'Time when guests should arrive (may differ from event start time)';
COMMENT ON COLUMN public.contacts.event_occasion IS 'Specific occasion type (e.g., surprise birthday party, anniversary)';
COMMENT ON COLUMN public.contacts.event_for IS 'Who the event is for (e.g., wife, daughter, boss)';
COMMENT ON COLUMN public.contacts.is_surprise IS 'Whether the event is a surprise';
