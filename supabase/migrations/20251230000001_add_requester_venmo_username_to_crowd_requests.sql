-- Add requester_venmo_username field to crowd_requests table
-- This stores the customer's Venmo username when they pay via Venmo

ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS requester_venmo_username TEXT;

COMMENT ON COLUMN crowd_requests.requester_venmo_username IS 'Venmo username of the customer who made the payment (for Venmo payments only)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_crowd_requests_requester_venmo_username 
ON crowd_requests(requester_venmo_username) 
WHERE requester_venmo_username IS NOT NULL;

