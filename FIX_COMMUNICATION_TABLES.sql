-- Quick fix for missing communication system tables
-- Run this in your Supabase SQL Editor or database tool

-- Add additional fields to contact_submissions for better tracking
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP WITH TIME ZONE;

-- Create communication_log table to track all interactions
CREATE TABLE IF NOT EXISTS communication_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_submission_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'sms', 'call', 'note', 'meeting')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  sent_by TEXT,
  sent_to TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_templates table for reusable templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_type TEXT DEFAULT 'general' CHECK (template_type IN ('general', 'follow_up', 'quote', 'booking_confirmation', 'thank_you')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create follow_up_reminders table
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_submission_id UUID NOT NULL REFERENCES contact_submissions(id) ON DELETE CASCADE,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('follow_up', 'quote_follow_up', 'event_check_in', 'payment_reminder')),
  message TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_communication_log_contact_submission_id ON communication_log(contact_submission_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_created_at ON communication_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_log_type ON communication_log(communication_type);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_date ON follow_up_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_contact_id ON follow_up_reminders(contact_submission_id);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_priority ON contact_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_follow_up_date ON contact_submissions(follow_up_date);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist, then create them
DROP TRIGGER IF EXISTS update_communication_log_updated_at ON communication_log;
CREATE TRIGGER update_communication_log_updated_at BEFORE UPDATE ON communication_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_follow_up_reminders_updated_at ON follow_up_reminders;
CREATE TRIGGER update_follow_up_reminders_updated_at BEFORE UPDATE ON follow_up_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for new tables
ALTER TABLE communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage all communication data
CREATE POLICY "auth_manage_communication_log" ON communication_log FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_manage_email_templates" ON email_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_manage_follow_up_reminders" ON follow_up_reminders FOR ALL USING (auth.role() = 'authenticated');

-- Allow public read access to active email templates (for potential future public use)
CREATE POLICY "public_read_email_templates" ON email_templates FOR SELECT USING (is_active = true);

-- Insert default email templates
INSERT INTO email_templates (name, subject, content, template_type) VALUES 
(
  'Initial Response',
  'Thank you for your inquiry - M10 DJ Company',
  E'Hi {{client_name}},\n\nThank you for reaching out to M10 DJ Company about your {{event_type}}!\n\nWe\'re excited to help make your event unforgettable. I\'ve reviewed your request and would love to discuss the details with you.\n\nHere\'s what happens next:\n• I\'ll prepare a personalized quote based on your needs\n• We can schedule a call to discuss your vision\n• I\'ll check availability for {{event_date}}\n\nFeel free to call me directly at (901) 410-2020 or reply to this email with any questions.\n\nLooking forward to working with you!\n\nBest regards,\nBen Murray\nM10 DJ Company\nPhone: (901) 410-2020\nEmail: djbenmurray@gmail.com',
  'follow_up'
),
(
  'Quote Follow-up',
  'Following up on your M10 DJ quote',
  E'Hi {{client_name}},\n\nI wanted to follow up on the quote I sent for your {{event_type}} on {{event_date}}.\n\nDo you have any questions about the services or pricing? I\'m happy to customize the package to better fit your needs and budget.\n\nYour date is still available, but popular dates do book up quickly. I\'d love to secure your spot and start planning an amazing event!\n\nPlease let me know if you\'d like to move forward or if you need any additional information.\n\nBest regards,\nBen Murray\nM10 DJ Company\nPhone: (901) 410-2020',
  'quote'
),
(
  'Booking Confirmation',
  'Your event is confirmed! - M10 DJ Company',
  E'Hi {{client_name}},\n\nFantastic news! Your {{event_type}} on {{event_date}} is officially confirmed!\n\nI\'m thrilled to be part of your special day. Here are the next steps:\n\n• I\'ll send you a detailed timeline 2 weeks before your event\n• We\'ll have a final planning call 1 week prior\n• Feel free to send me your must-play and do-not-play songs anytime\n\nIf you have any questions or need to make changes, don\'t hesitate to reach out.\n\nThank you for choosing M10 DJ Company. I can\'t wait to help make your event unforgettable!\n\nBest regards,\nBen Murray\nM10 DJ Company\nPhone: (901) 410-2020',
  'booking_confirmation'
) ON CONFLICT (name) DO NOTHING;

-- Show confirmation that tables were created
SELECT 'Communication system tables created successfully!' as status;