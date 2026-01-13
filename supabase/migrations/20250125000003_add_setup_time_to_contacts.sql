-- Add setup_time field to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS setup_time TIME;

-- Add comment to explain the field
COMMENT ON COLUMN public.contacts.setup_time IS 'Setup time (when DJ should arrive to set up equipment before the event)';
