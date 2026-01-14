-- Add end_time column to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Add comment
COMMENT ON COLUMN public.contracts.end_time IS 'Event end time';
