-- FINAL CONTACT POLICY FIX - Allow anonymous users to submit contact forms

-- Drop the current contact submission policies
DROP POLICY IF EXISTS "cs_public_insert_v2" ON contact_submissions;
DROP POLICY IF EXISTS "cs_auth_select_v2" ON contact_submissions;
DROP POLICY IF EXISTS "cs_auth_update_v2" ON contact_submissions;

-- Create a policy that explicitly allows anonymous users to insert
CREATE POLICY "allow_anonymous_contact_insert" ON contact_submissions 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow authenticated users (admins) to do everything
CREATE POLICY "allow_authenticated_contact_access" ON contact_submissions 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Show the final policies for contact_submissions
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'contact_submissions'; 