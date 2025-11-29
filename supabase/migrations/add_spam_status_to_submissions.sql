-- Add 'spam' status to contact_submissions table
-- This allows submissions to be marked as spam

-- Drop the existing constraint
ALTER TABLE contact_submissions DROP CONSTRAINT IF EXISTS contact_submissions_status_check;

-- Add the new constraint with 'spam' included
ALTER TABLE contact_submissions ADD CONSTRAINT contact_submissions_status_check 
  CHECK (status IN ('new', 'contacted', 'quoted', 'booked', 'completed', 'cancelled', 'spam'));

