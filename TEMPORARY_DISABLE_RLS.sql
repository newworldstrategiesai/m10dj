-- TEMPORARY DISABLE RLS - Turn off RLS entirely for testing

-- Disable RLS on contact_submissions table
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'contact_submissions';

-- Test direct insert to make sure table works
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('RLS Disabled Test', 'test@example.com', 'Wedding', 'Testing with RLS completely disabled')
RETURNING id, name, email; 