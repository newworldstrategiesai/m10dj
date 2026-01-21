-- Check current organization_members policies
SELECT 
  schemaname,
  tablename, 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'organization_members'
ORDER BY policyname;

-- Also check if the helper functions exist
SELECT 
  proname,
  pg_get_function_identity_arguments(oid) as args,
  obj_description(oid, 'pg_proc') as description
FROM pg_proc 
WHERE proname LIKE '%check_%organization%'
ORDER BY proname;
