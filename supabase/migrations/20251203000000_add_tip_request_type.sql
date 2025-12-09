-- Migration to add 'tip' as a valid request_type option
-- This allows users to send tips without requesting songs or shoutouts

-- Update crowd_requests table to allow 'tip' request type
ALTER TABLE crowd_requests 
  DROP CONSTRAINT IF EXISTS crowd_requests_request_type_check;

ALTER TABLE crowd_requests 
  ADD CONSTRAINT crowd_requests_request_type_check 
  CHECK (request_type IN ('song_request', 'shoutout', 'tip'));

-- Update organizations table to allow 'tip' as default request type
ALTER TABLE organizations 
  DROP CONSTRAINT IF EXISTS organizations_requests_default_request_type_check;

ALTER TABLE organizations 
  ADD CONSTRAINT organizations_requests_default_request_type_check 
  CHECK (requests_default_request_type IN ('song_request', 'shoutout', 'tip'));

-- Add comment explaining the tip request type
COMMENT ON COLUMN crowd_requests.request_type IS 'Type of request: song_request, shoutout, or tip';

