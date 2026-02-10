-- Add MC introduction field to music_questionnaires table
-- Fixes: "Could not find the 'mc_introduction' column of 'music_questionnaires' in the schema cache"
-- Code expects this column (questionnaire save/get/verify, find-questionnaire, etc.)

ALTER TABLE music_questionnaires
ADD COLUMN IF NOT EXISTS mc_introduction TEXT;

COMMENT ON COLUMN music_questionnaires.mc_introduction IS 'MC introduction text. NULL = not set, empty string = declined, text = custom introduction';
