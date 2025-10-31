-- Add service selection token fields to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS service_selection_token TEXT,
ADD COLUMN IF NOT EXISTS service_selection_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS contacts_service_selection_token_idx ON contacts(service_selection_token);

-- Add comment
COMMENT ON COLUMN contacts.service_selection_token IS 'Secure token for service selection page access';
COMMENT ON COLUMN contacts.service_selection_sent_at IS 'Timestamp when service selection link was last sent';

