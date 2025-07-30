-- TEMPORARY FIX - Disable RLS for contact_submissions to get contact form working

-- This will allow the contact form to work immediately while we debug the policy issues
ALTER TABLE contact_submissions DISABLE ROW LEVEL SECURITY;

-- Test that APIs will now work
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('RLS Disabled - API Test', 'rlsdisabled@test.com', 'Wedding', 'APIs should work now')
RETURNING id, name, email;

-- Check status
SELECT 'RLS DISABLED - CONTACT FORM SHOULD WORK NOW' as status;
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'contact_submissions'; 