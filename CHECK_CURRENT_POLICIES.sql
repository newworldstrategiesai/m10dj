-- CHECK CURRENT POLICIES - See what policies exist right now

SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'contact_submissions'
ORDER BY policyname; 