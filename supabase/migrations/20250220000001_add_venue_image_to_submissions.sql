-- Add venue_image_url field to contact_submissions table
-- This will store images scraped from the web for venue locations

ALTER TABLE contact_submissions 
ADD COLUMN IF NOT EXISTS venue_image_url TEXT,
ADD COLUMN IF NOT EXISTS venue_image_fetched_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_submissions_venue_image_url 
ON contact_submissions(venue_image_url) 
WHERE venue_image_url IS NOT NULL;

COMMENT ON COLUMN contact_submissions.venue_image_url IS 'URL of venue image scraped from web (Google Places, etc.)';
COMMENT ON COLUMN contact_submissions.venue_image_fetched_at IS 'Timestamp when venue image was last fetched';

