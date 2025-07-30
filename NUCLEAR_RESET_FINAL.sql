-- NUCLEAR RESET - Completely wipe and rebuild RLS for contact_submissions

-- First, disable RLS completely
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- Test insert with RLS disabled (should work)
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('RLS Disabled Test', 'disabled@test.com', 'Wedding', 'Should work with RLS off')
RETURNING id, name, email;

-- Drop ALL policies using dynamic SQL to ensure we get everything
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'contact_submissions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON contact_submissions', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Verify all policies are gone
SELECT 'POLICIES AFTER CLEANUP:' as info;
SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE tablename = 'contact_submissions';

-- Re-enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policy for public inserts
CREATE POLICY "allow_public_insert" ON contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create admin policy for authenticated users
CREATE POLICY "allow_admin_all" ON contact_submissions 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Test insert with new policies
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('New Policy Test', 'newpolicy@test.com', 'Wedding', 'Testing new policies')
RETURNING id, name, email;

-- Show final state
SELECT 'FINAL POLICIES:' as info;
SELECT policyname, cmd, roles, with_check FROM pg_policies WHERE tablename = 'contact_submissions';

SELECT 'FINAL RLS STATUS:' as info;
SELECT rowsecurity FROM pg_tables WHERE tablename = 'contact_submissions'; 