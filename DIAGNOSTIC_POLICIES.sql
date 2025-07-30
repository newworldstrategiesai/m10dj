-- DIAGNOSTIC - Check current RLS policies and table status

SELECT 'RLS STATUS:' as section;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'contact_submissions';

SELECT 'ALL POLICIES ON CONTACT_SUBMISSIONS:' as section;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contact_submissions'
ORDER BY policyname;

SELECT 'POLICY COUNT:' as section;
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'contact_submissions';

-- Test a simple insert to see what happens
SELECT 'TESTING DIRECT INSERT:' as section;
INSERT INTO contact_submissions (name, email, event_type, message) 
VALUES ('Diagnostic Test', 'diagnostic@test.com', 'Wedding', 'Testing current policies')
RETURNING id, name, email; 