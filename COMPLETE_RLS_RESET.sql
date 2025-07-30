-- COMPLETE RLS RESET - Try a completely different policy approach

-- Disable RLS temporarily 
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- Test that insert works with RLS disabled
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('RLS Disabled Test 2', 'disabled2@test.com', 'Wedding', 'Should work with RLS off')
RETURNING id, name, email;

-- Re-enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop ALL policies
DROP POLICY IF EXISTS "fresh_insert_policy" ON contact_submissions;
DROP POLICY IF EXISTS "allow_authenticated_read_update" ON contact_submissions;

-- Try the most basic policy possible - no role checks at all
CREATE POLICY "basic_insert" ON contact_submissions 
FOR INSERT WITH CHECK (true);

-- For admin - simple authenticated access
CREATE POLICY "basic_admin" ON contact_submissions 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Test the basic policy
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('Basic Policy Test', 'basic@test.com', 'Wedding', 'Testing basic policy')
RETURNING id, name, email;

-- Show final setup
SELECT 'Final Policies:' as info;
SELECT policyname, cmd, roles, with_check FROM pg_policies WHERE tablename = 'contact_submissions';

SELECT 'RLS Status:' as info;
SELECT rowsecurity FROM pg_tables WHERE tablename = 'contact_submissions'; 