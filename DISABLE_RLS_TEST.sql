-- DISABLE RLS TEST - Temporarily disable RLS to test, then re-enable with simple policy

-- First, let's see what's currently happening
SELECT current_user, session_user, auth.role();

-- Temporarily disable RLS on contact_submissions
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- Test insert with RLS disabled (this should work)
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('RLS Disabled Test', 'rlstest@example.com', 'Wedding', 'Testing with RLS disabled')
RETURNING id, name, email;

-- Re-enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "contact_submissions_insert_all" ON contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_admin_read" ON contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_admin_update" ON contact_submissions;

-- Create the absolute simplest policy possible
-- This bypasses all role checks and just allows everything
CREATE POLICY "simple_insert_policy" ON contact_submissions 
FOR INSERT WITH CHECK (true);

-- Test insert with simple policy
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('Simple Policy Test', 'simple@example.com', 'Wedding', 'Testing with simple policy')
RETURNING id, name, email;

-- Show current policies
SELECT schemaname, tablename, policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'contact_submissions';

-- Show current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'contact_submissions'; 