-- Add SMS notification tracking to karaoke_signups
-- Track when notifications were sent to prevent duplicates

ALTER TABLE karaoke_signups 
ADD COLUMN IF NOT EXISTS next_up_notification_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE karaoke_signups 
ADD COLUMN IF NOT EXISTS next_up_notification_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE karaoke_signups 
ADD COLUMN IF NOT EXISTS currently_singing_notification_sent BOOLEAN DEFAULT FALSE;

ALTER TABLE karaoke_signups 
ADD COLUMN IF NOT EXISTS currently_singing_notification_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE karaoke_signups 
ADD COLUMN IF NOT EXISTS sms_notification_error TEXT; -- Store error if SMS fails

-- Make phone number required (for new signups)
-- Note: This will fail if there are existing signups without phone numbers
-- If you have existing data, first update them or use a default value
-- ALTER TABLE karaoke_signups ALTER COLUMN singer_phone SET NOT NULL;

-- Add indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_next_up_notification ON karaoke_signups(next_up_notification_sent, status);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_singer_phone ON karaoke_signups(singer_phone) WHERE singer_phone IS NOT NULL;

-- Add comments
COMMENT ON COLUMN karaoke_signups.singer_phone IS 'Required phone number for SMS notifications when singer is next up';
COMMENT ON COLUMN karaoke_signups.next_up_notification_sent IS 'Whether "next up" SMS notification has been sent';
COMMENT ON COLUMN karaoke_signups.currently_singing_notification_sent IS 'Whether "currently singing" SMS notification has been sent';
COMMENT ON COLUMN karaoke_signups.sms_notification_error IS 'Error message if SMS notification failed to send';
