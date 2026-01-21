-- Add spam_status field to contacts table
-- This allows contacts to be marked as spam to filter them out of normal views

ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS spam_status VARCHAR(20) DEFAULT 'not_spam'
CHECK (spam_status IN ('not_spam', 'spam', 'potential_spam'));

-- Add index for spam filtering
CREATE INDEX IF NOT EXISTS contacts_spam_status_idx ON public.contacts(spam_status);

-- Add comment explaining the field
COMMENT ON COLUMN public.contacts.spam_status IS 'Spam classification: not_spam (default), spam, potential_spam. Spam contacts are filtered from normal views.';