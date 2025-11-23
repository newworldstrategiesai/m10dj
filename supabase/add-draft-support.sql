-- Add support for draft/incomplete submissions
-- Run this in Supabase SQL Editor

-- Add is_draft column to contact_submissions table
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Add venue_name and venue_address columns if they don't exist (for better venue tracking)
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS venue_name TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- Add event_time column if it doesn't exist
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS event_time TIME;

-- Add guests column if it doesn't exist
ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS guests TEXT;

-- Create index on is_draft for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_draft 
ON contact_submissions(is_draft) 
WHERE is_draft = true;

-- Create index on email for faster draft lookups
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email 
ON contact_submissions(email);

-- Add comment for documentation
COMMENT ON COLUMN contact_submissions.is_draft IS 'Marks incomplete submissions that were auto-saved before user submitted the form';

