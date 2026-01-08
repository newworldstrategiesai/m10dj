-- Remove requests_background_animation_enabled column
-- This column was replaced by requests_background_type which provides more options
-- (gradient, subtle, bubble, spiral, aurora, none)

ALTER TABLE organizations
DROP COLUMN IF EXISTS requests_background_animation_enabled;

