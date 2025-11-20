-- Add "next" option to crowd_requests table
-- This allows users to pay extra to bump their song to be played next (higher priority than fast-track)

-- Add is_next column
ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS is_next BOOLEAN DEFAULT FALSE;

-- Add next_fee column (fee in cents)
ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS next_fee INTEGER DEFAULT 0;

-- Update priority_order logic: next = 0, fast-track = 1, regular = 1000
-- This is handled in application logic, but we ensure the column exists
-- Update existing fast-track requests to have priority_order = 1 (next will be 0)
UPDATE crowd_requests 
SET priority_order = 1 
WHERE is_fast_track = TRUE AND priority_order = 0;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_crowd_requests_is_next ON crowd_requests(is_next);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_next_fee ON crowd_requests(next_fee);

-- Add comment
COMMENT ON COLUMN crowd_requests.is_next IS 'If true, song will be played next (highest priority)';
COMMENT ON COLUMN crowd_requests.next_fee IS 'Additional fee in cents for "next" option';

