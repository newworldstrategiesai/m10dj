-- Add social_links field to organizations table for Link Tree style social links
-- This allows admins to add social media links that will be displayed in the header

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN organizations.social_links IS 'Array of social links objects. Each object should have: {platform: string, url: string, label: string, enabled: boolean, order: number}. Supported platforms: facebook, instagram, twitter, youtube, tiktok, linkedin, snapchat, pinterest, custom';

-- Example structure:
-- [
--   {
--     "platform": "facebook",
--     "url": "https://facebook.com/yourpage",
--     "label": "Facebook",
--     "enabled": true,
--     "order": 1
--   },
--   {
--     "platform": "instagram",
--     "url": "https://instagram.com/yourhandle",
--     "label": "Instagram",
--     "enabled": true,
--     "order": 2
--   }
-- ]

