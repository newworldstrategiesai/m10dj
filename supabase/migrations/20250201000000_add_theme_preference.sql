-- Add theme preference to admin_settings
-- This allows admins to set a global theme preference (light/dark) for the entire app

-- No schema changes needed - we'll use the existing admin_settings table
-- with setting_key = 'app_theme' and setting_value = 'light' | 'dark' | 'system'

-- Add a comment to document the setting
COMMENT ON TABLE admin_settings IS 'Stores admin preferences including app theme preference (app_theme: light|dark|system)';

