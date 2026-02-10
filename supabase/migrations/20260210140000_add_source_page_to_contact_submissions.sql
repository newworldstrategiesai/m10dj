-- Add source_page to contact_submissions for tracking which page the inquiry form was on
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS source_page TEXT;

COMMENT ON COLUMN public.contact_submissions.source_page IS 'URL pathname of the page where the form was opened (e.g. /memphis-wedding-dj, /contact)';

CREATE INDEX IF NOT EXISTS idx_contact_submissions_source_page
  ON public.contact_submissions(source_page)
  WHERE source_page IS NOT NULL;
