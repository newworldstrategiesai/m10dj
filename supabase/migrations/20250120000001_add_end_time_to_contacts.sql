-- Add end_time field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add comment to explain the field
COMMENT ON COLUMN public.contacts.end_time IS 'Event end time (when the event concludes)';

