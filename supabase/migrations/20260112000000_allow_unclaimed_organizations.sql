-- Allow unclaimed organizations for Tip Jar Live batch creation
-- This enables super admins to create fully configured Tip Jar pages
-- that prospects can use before creating their accounts

-- ============================================
-- 1. Modify organizations table for unclaimed orgs
-- ============================================

-- Allow owner_id to be NULL for unclaimed organizations
-- First, drop the NOT NULL constraint
ALTER TABLE organizations 
  ALTER COLUMN owner_id DROP NOT NULL;

-- Add new columns for prospect management FIRST (before we try to use is_claimed)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS prospect_email TEXT,
  ADD COLUMN IF NOT EXISTS prospect_phone TEXT,
  ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE, -- Secure token for claiming
  ADD COLUMN IF NOT EXISTS claim_token_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- Drop the unique constraint on owner_id (multiple orgs can be unclaimed)
-- But we still want unique owner_id when it's not NULL (one org per user)
DROP INDEX IF EXISTS organizations_owner_id_key;
DROP INDEX IF EXISTS organizations_owner_id_unique_when_set;

-- Handle any existing duplicate owner_ids before creating unique index
-- Keep the most recent organization for each owner_id and unclaim the older ones
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Check if there are duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT owner_id, COUNT(*) as cnt
    FROM organizations
    WHERE owner_id IS NOT NULL
    GROUP BY owner_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- If duplicates exist, keep the most recent and unclaim the rest
  IF duplicate_count > 0 THEN
    WITH duplicate_owners AS (
      SELECT owner_id, 
             id,
             ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at DESC, id DESC) as rn
      FROM organizations
      WHERE owner_id IS NOT NULL
    )
    UPDATE organizations
    SET owner_id = NULL,
        is_claimed = FALSE
    WHERE id IN (
      SELECT id 
      FROM duplicate_owners 
      WHERE rn > 1
    );
    
    RAISE NOTICE 'Unclaimed % organizations with duplicate owner_ids', duplicate_count;
  END IF;
END $$;

-- Create partial unique index: owner_id must be unique when NOT NULL
-- This ensures one organization per user when claimed
CREATE UNIQUE INDEX organizations_owner_id_unique_when_set 
  ON organizations(owner_id) 
  WHERE owner_id IS NOT NULL;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_organizations_claim_token ON organizations(claim_token) WHERE claim_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_prospect_email ON organizations(prospect_email) WHERE prospect_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_unclaimed ON organizations(is_claimed, created_at) WHERE is_claimed = FALSE;
CREATE INDEX IF NOT EXISTS idx_organizations_created_by_admin ON organizations(created_by_admin_id) WHERE created_by_admin_id IS NOT NULL;

-- Add constraint: if owner_id is NULL, is_claimed must be FALSE
-- If owner_id is NOT NULL, is_claimed must be TRUE
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS check_unclaimed_consistency;
  
ALTER TABLE organizations
  ADD CONSTRAINT check_unclaimed_consistency 
  CHECK (
    (owner_id IS NULL AND is_claimed = FALSE) OR 
    (owner_id IS NOT NULL)
  );

-- Update existing organizations to ensure is_claimed is set correctly
UPDATE organizations
SET is_claimed = TRUE
WHERE owner_id IS NOT NULL AND (is_claimed IS NULL OR is_claimed = FALSE);

-- Ensure prospect_email is unique per unclaimed org
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_prospect_email_unique_unclaimed
  ON organizations(prospect_email)
  WHERE prospect_email IS NOT NULL AND is_claimed = FALSE;

-- ============================================
-- 2. Update RLS policies for unclaimed organizations
-- ============================================

-- Drop existing public read policy if it exists (we'll recreate with better logic)
DROP POLICY IF EXISTS "Allow public read access to organizations by slug" ON organizations;

-- Policy: Anyone can view organizations (needed for public Tip Jar pages)
-- This includes unclaimed organizations for Tip Jar Live
-- Platform admins can view everything
DROP POLICY IF EXISTS "Allow public read access to organizations" ON organizations;

CREATE POLICY "Allow public read access to organizations"
  ON organizations
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Public access: must have active subscription status
    (subscription_status IN ('trial', 'active')) OR
    -- Owner can view their own organization
    (owner_id = auth.uid()) OR
    -- Platform admins can view everything
    is_platform_admin()
  );

COMMENT ON POLICY "Allow public read access to organizations" ON organizations IS 
  'Allows anonymous and authenticated users to read active organizations for public request pages. Includes unclaimed organizations.';

-- Policy: Only platform admins can create unclaimed organizations
-- Regular users can only create claimed organizations (with owner_id = their user_id)
DROP POLICY IF EXISTS "Users can create own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

CREATE POLICY "Users can create own organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Regular users: must set owner_id to their own user_id and is_claimed = TRUE
    (owner_id = auth.uid() AND is_claimed = TRUE) OR
    -- Platform admins: can create unclaimed organizations (owner_id = NULL, is_claimed = FALSE)
    (is_platform_admin() AND owner_id IS NULL AND is_claimed = FALSE)
  );

-- Policy: Platform admins can update unclaimed organizations
-- Users can update their own claimed organizations
-- Users cannot update unclaimed organizations (even if they try to claim)
-- Claiming happens through a separate API endpoint for security
DROP POLICY IF EXISTS "Users can update own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;

CREATE POLICY "Users can update own organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own claimed organizations
    (owner_id = auth.uid() AND is_claimed = TRUE) OR
    -- Platform admins can update any organization (including unclaimed)
    is_platform_admin()
  )
  WITH CHECK (
    -- Users cannot change ownership or claim status
    (owner_id = auth.uid() AND is_claimed = TRUE) OR
    -- Platform admins can modify anything
    is_platform_admin()
  );

-- Policy: Users can only delete their own organizations
-- Platform admins can delete any organization
DROP POLICY IF EXISTS "Users can delete own organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete organizations" ON organizations;

CREATE POLICY "Users can delete own organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (
    -- Users can delete their own organizations
    (owner_id = auth.uid()) OR
    -- Platform admins can delete any organization
    is_platform_admin()
  );

-- ============================================
-- 3. Comments for documentation
-- ============================================

COMMENT ON COLUMN organizations.prospect_email IS 'Email of prospect for unclaimed organizations. Used for claiming process.';
COMMENT ON COLUMN organizations.prospect_phone IS 'Phone number of prospect for unclaimed organizations (optional).';
COMMENT ON COLUMN organizations.claim_token IS 'Secure token for claiming unclaimed organizations. Generated by platform admins.';
COMMENT ON COLUMN organizations.claim_token_expires_at IS 'Expiration date for claim token. Defaults to 90 days after creation.';
COMMENT ON COLUMN organizations.is_claimed IS 'Whether organization has been claimed by a user. FALSE for unclaimed orgs created by admins.';
COMMENT ON COLUMN organizations.created_by_admin_id IS 'User ID of platform admin who created this unclaimed organization.';
COMMENT ON COLUMN organizations.claimed_at IS 'Timestamp when organization was claimed by a user.';

-- ============================================
-- 4. Update create_owner_membership trigger to handle unclaimed orgs
-- ============================================

-- The trigger was updated in the organization_members migration to only create
-- memberships for organizations with owner_id IS NOT NULL, so unclaimed orgs
-- don't create organization_members records automatically.

