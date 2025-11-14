-- Create email_tracking table to track email opens and other events
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL, -- Resend email ID
  recipient_email TEXT NOT NULL,
  sender_email TEXT,
  subject TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  contact_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key to contacts
  CONSTRAINT email_tracking_contact_id_fkey FOREIGN KEY (contact_id) 
    REFERENCES contacts(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_tracking_email_id ON email_tracking(email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient_email ON email_tracking(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_tracking_contact_id ON email_tracking(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_event_type ON email_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_created_at ON email_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_tracking_opened_at ON email_tracking(opened_at) WHERE opened_at IS NOT NULL;

-- Add comment
COMMENT ON TABLE email_tracking IS 'Tracks email events (sent, delivered, opened, clicked) from Resend webhooks';

