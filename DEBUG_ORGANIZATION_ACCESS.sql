-- Debug script to test organization access
-- Run this in Supabase SQL Editor while logged in as the user

-- First, check if we can see the organization as the authenticated user
SELECT 
  id,
  name,
  slug,
  owner_id,
  subscription_tier,
  subscription_status,
  product_context
FROM public.organizations
WHERE owner_id = auth.uid();

-- Check organization_members
SELECT 
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  om.is_active,
  o.name as organization_name
FROM public.organization_members om
JOIN public.organizations o ON o.id = om.organization_id
WHERE om.user_id = auth.uid()
AND om.is_active = true;

-- Test the RLS policy directly
-- This should work if RLS is configured correctly
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.organizations
WHERE owner_id = auth.uid();

-- Check if there are any RLS policy conflicts
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'organizations'
ORDER BY policyname;

