-- Add onboarding tracking to organizations table
-- Tracks onboarding progress and completion

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{}'::jsonb;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_organizations_onboarding_completed 
ON organizations(onboarding_completed_at) 
WHERE onboarding_completed_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN organizations.onboarding_completed_at IS 'Timestamp when user completed onboarding';
COMMENT ON COLUMN organizations.onboarding_progress IS 'JSON object tracking which onboarding steps have been completed';

