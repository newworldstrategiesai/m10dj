-- Create emails table for storing received emails via Resend
CREATE TABLE IF NOT EXISTS public.received_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id TEXT UNIQUE NOT NULL,
  
  -- Email headers
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  reply_to TEXT,
  subject TEXT,
  message_id TEXT,
  
  -- Email content
  html_body TEXT,
  text_body TEXT,
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  headers JSONB,
  spam_score FLOAT,
  
  -- Status flags
  read BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  snoozed BOOLEAN DEFAULT FALSE,
  snooze_until TIMESTAMPTZ,
  
  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT received_emails_resend_email_id_key UNIQUE (resend_email_id)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_received_emails_from ON public.received_emails(from_email);
CREATE INDEX IF NOT EXISTS idx_received_emails_to ON public.received_emails USING GIN(to_emails);
CREATE INDEX IF NOT EXISTS idx_received_emails_received_at ON public.received_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_received_emails_read ON public.received_emails(read) WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_received_emails_archived ON public.received_emails(archived) WHERE NOT deleted;

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_received_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_received_emails_updated_at_trigger ON public.received_emails;
CREATE TRIGGER update_received_emails_updated_at_trigger
  BEFORE UPDATE ON public.received_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_received_emails_updated_at();

-- Enable RLS
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

-- Create policies (admin only access)
CREATE POLICY "Admin can view all emails"
  ON public.received_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email IN ('djbenmurray@gmail.com', 'm10djcompany@gmail.com', 'admin@m10djcompany.com')
        OR (auth.users.raw_user_meta_data->>'role')::text = 'admin'
      )
    )
  );

CREATE POLICY "Admin can update emails"
  ON public.received_emails
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email IN ('djbenmurray@gmail.com', 'm10djcompany@gmail.com', 'admin@m10djcompany.com')
        OR (auth.users.raw_user_meta_data->>'role')::text = 'admin'
      )
    )
  );

-- Allow the service role to insert (for webhook)
CREATE POLICY "Service role can insert emails"
  ON public.received_emails
  FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMENT ON TABLE public.received_emails IS 'Stores emails received via Resend webhooks';

