-- ULTIMATE CONTACT POLICY FIX - Allow all users to insert contact submissions

-- Drop all existing contact submission policies
DROP POLICY IF EXISTS "allow_anonymous_contact_insert" ON contact_submissions;
DROP POLICY IF EXISTS "allow_authenticated_contact_access" ON contact_submissions;

-- Create the most permissive policy possible for inserts
-- This will allow anyone (authenticated or not) to insert
CREATE POLICY "contact_submissions_insert_all" ON contact_submissions 
FOR INSERT WITH CHECK (true);

-- Allow authenticated users to select and update (for admin dashboard)
CREATE POLICY "contact_submissions_admin_read" ON contact_submissions 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "contact_submissions_admin_update" ON contact_submissions 
FOR UPDATE USING (auth.role() = 'authenticated');

-- Test the policy by attempting a direct insert (this should work in SQL)
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('Policy Test', 'policy@test.com', 'Wedding', 'Testing ultimate policy')
RETURNING id, name, email;

-- Show final policies
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'contact_submissions'; 