-- CHECK AND FINAL FIX - Check current state and fix any remaining issues

-- First, let's see what we have
SELECT 'Current RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'contact_submissions';

SELECT 'Current Policies:' as info;
SELECT schemaname, tablename, policyname, cmd, roles, with_check FROM pg_policies WHERE tablename = 'contact_submissions';

-- The policies exist, so let's just refresh the connection and test
-- Drop and recreate the insert policy to refresh it
DROP POLICY IF EXISTS "allow_all_inserts" ON contact_submissions;

-- Recreate with a fresh name to avoid any caching issues
CREATE POLICY "fresh_insert_policy" ON contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Test the refreshed policy
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('Fresh Policy Test', 'fresh@test.com', 'Wedding', 'Testing refreshed policy')
RETURNING id, name, email;

-- Show final state
SELECT 'Final State:' as info;
SELECT schemaname, tablename, policyname, cmd, roles FROM pg_policies WHERE tablename = 'contact_submissions'; 