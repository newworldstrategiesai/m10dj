-- Add cta_source to contact_submissions for tracking which button opened the inquiry form
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS cta_source TEXT;

COMMENT ON COLUMN public.contact_submissions.cta_source IS 'Which CTA opened the form (e.g. hero, packages-essential, nav, footer)';

CREATE INDEX IF NOT EXISTS idx_contact_submissions_cta_source
  ON public.contact_submissions(cta_source)
  WHERE cta_source IS NOT NULL;
