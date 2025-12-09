-- Add platform_owner flag to organizations table
-- This allows M10 DJ Company (platform owner) to bypass subscription restrictions
-- SAFE: Only adds optional column, doesn't change existing behavior

-- Add column if it doesn't exist
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS is_platform_owner BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_is_platform_owner 
ON organizations(is_platform_owner) 
WHERE is_platform_owner = TRUE;

-- Add comment
COMMENT ON COLUMN organizations.is_platform_owner IS 
'Platform owner organizations (like M10 DJ Company) bypass subscription restrictions and have full access';

-- Note: We'll manually set this flag for M10 DJ Company after running this migration
-- Run this query to identify and mark M10 DJ Company:
-- UPDATE organizations SET is_platform_owner = TRUE WHERE name ILIKE '%m10%' OR slug ILIKE '%m10%';

