-- FINAL WORKING RLS - Re-enable RLS with a working policy

-- Re-enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "simple_insert_policy" ON contact_submissions;

-- Create policy that allows ALL users to insert (no role restrictions)
-- This is the most permissive policy possible
CREATE POLICY "allow_all_inserts" ON contact_submissions 
FOR INSERT 
WITH CHECK (true);

-- Create policy for authenticated users to manage data (for admin)
CREATE POLICY "allow_authenticated_read_update" ON contact_submissions 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Test the new policy with direct insert
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('Final Policy Test', 'final@test.com', 'Wedding', 'Testing final working policy')
RETURNING id, name, email;

-- Verify final state  
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'contact_submissions';
SELECT schemaname, tablename, policyname, cmd, roles FROM pg_policies WHERE tablename = 'contact_submissions'; 