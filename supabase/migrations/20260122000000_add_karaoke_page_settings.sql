-- Add karaoke page customization settings to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS karaoke_page_title TEXT,
ADD COLUMN IF NOT EXISTS karaoke_page_description TEXT,
ADD COLUMN IF NOT EXISTS karaoke_main_heading TEXT,
ADD COLUMN IF NOT EXISTS karaoke_welcome_message TEXT,
ADD COLUMN IF NOT EXISTS karaoke_signup_success_message TEXT,
ADD COLUMN IF NOT EXISTS karaoke_queue_position_message TEXT,
ADD COLUMN IF NOT EXISTS karaoke_estimated_wait_message TEXT,
ADD COLUMN IF NOT EXISTS karaoke_show_welcome_message BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS karaoke_show_current_singer BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS karaoke_show_queue_preview BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS karaoke_show_estimated_wait BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS karaoke_theme TEXT DEFAULT 'default' CHECK (karaoke_theme IN ('default', 'dark', 'colorful', 'minimal'));

-- Add karaoke operational settings to karaoke_settings table
ALTER TABLE karaoke_settings
ADD COLUMN IF NOT EXISTS max_concurrent_singers INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS phone_field_mode TEXT DEFAULT 'required' CHECK (phone_field_mode IN ('required', 'optional', 'hidden'));