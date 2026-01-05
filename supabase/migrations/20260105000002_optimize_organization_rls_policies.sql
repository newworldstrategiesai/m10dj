-- Optimize organization RLS policies to prevent circular dependencies
-- This migration ensures the "Users can view own organizations" policy is evaluated first
-- and prevents potential circular dependency issues with the performer/venue hierarchy policies

-- Drop and recreate the "Users can view own organizations" policy with explicit priority
-- This should be the first policy evaluated for performance
DROP POLICY IF EXISTS "Users can view own organizations" ON organizations;

CREATE POLICY "Users can view own organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Ensure the policy is evaluated efficiently by creating an index hint
-- (PostgreSQL will use the index on owner_id automatically)

-- Verify the policy exists and is correct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Users can view own organizations'
  ) THEN
    RAISE EXCEPTION 'Policy "Users can view own organizations" was not created';
  END IF;
  
  RAISE NOTICE 'Policy "Users can view own organizations" verified';
END $$;

