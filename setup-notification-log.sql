-- Quick setup script for notification_log table
-- Run this directly in your Supabase SQL editor if migrations aren't working

-- Create notification_log table for tracking notification attempts
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_submission_id UUID,
  notification_type TEXT NOT NULL DEFAULT 'lead_alert',
  sms_success BOOLEAN DEFAULT FALSE,
  sms_attempts INTEGER DEFAULT 0,
  sms_error TEXT,
  sms_phone_used TEXT,
  email_success BOOLEAN DEFAULT FALSE,
  email_error TEXT,
  webhook_success BOOLEAN DEFAULT FALSE,
  webhook_error TEXT,
  total_attempts INTEGER DEFAULT 0,
  successful_methods INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_log_submission_id ON notification_log(contact_submission_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_log_success ON notification_log(sms_success, email_success);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notification_log_updated_at ON notification_log;
CREATE TRIGGER update_notification_log_updated_at
  BEFORE UPDATE ON notification_log
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_log_updated_at();

-- Create RLS policies
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Policy for admin users to view all notification logs
CREATE POLICY "Admin users can view all notification logs" ON notification_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        'djbenmurray@gmail.com',
        'admin@m10djcompany.com',
        'manager@m10djcompany.com'
      )
    )
  );

-- Policy for service role to insert notification logs
CREATE POLICY "Service role can insert notification logs" ON notification_log
  FOR INSERT WITH CHECK (true);

-- Policy for service role to update notification logs
CREATE POLICY "Service role can update notification logs" ON notification_log
  FOR UPDATE USING (true);

-- Add foreign key constraint if contact_submissions table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contact_submissions') THEN
    -- Check if constraint doesn't already exist
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_notification_log_contact_submission') THEN
      ALTER TABLE notification_log 
      ADD CONSTRAINT fk_notification_log_contact_submission 
      FOREIGN KEY (contact_submission_id) REFERENCES contact_submissions(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Add comments
COMMENT ON TABLE notification_log IS 'Tracks all notification attempts for contact form submissions';
COMMENT ON COLUMN notification_log.contact_submission_id IS 'References the contact submission that triggered notifications (if available)';
COMMENT ON COLUMN notification_log.notification_type IS 'Type of notification (lead_alert, follow_up, daily_digest, etc.)';
COMMENT ON COLUMN notification_log.sms_success IS 'Whether SMS notification was successful';
COMMENT ON COLUMN notification_log.sms_attempts IS 'Number of SMS attempts made';
COMMENT ON COLUMN notification_log.successful_methods IS 'Total number of successful notification methods';

-- Success message
SELECT 'notification_log table created successfully!' as result;
