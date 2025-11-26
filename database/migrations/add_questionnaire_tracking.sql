-- Add tracking fields to music_questionnaires table
-- This migration adds started_at, reviewed_at, and last_reminder_sent_at fields

ALTER TABLE music_questionnaires 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_started_at ON music_questionnaires(started_at);
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_reviewed_at ON music_questionnaires(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_last_reminder_sent_at ON music_questionnaires(last_reminder_sent_at);

-- Create index for finding incomplete questionnaires (started but not completed)
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_incomplete 
ON music_questionnaires(lead_id) 
WHERE completed_at IS NULL AND started_at IS NOT NULL;

COMMENT ON COLUMN music_questionnaires.started_at IS 'Timestamp when the questionnaire was first accessed/started';
COMMENT ON COLUMN music_questionnaires.reviewed_at IS 'Timestamp when the questionnaire was last reviewed/viewed';
COMMENT ON COLUMN music_questionnaires.last_reminder_sent_at IS 'Timestamp when the last reminder was sent to complete the questionnaire';
COMMENT ON COLUMN music_questionnaires.reminder_count IS 'Number of reminders sent for this questionnaire';

