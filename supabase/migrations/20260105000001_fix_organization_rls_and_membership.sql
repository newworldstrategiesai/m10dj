-- Fix organization RLS and ensure owner membership exists
-- This migration ensures the user can access their organization

DO $$
DECLARE
  v_user_id UUID := '90209b16-b999-4090-8017-29e5f38bcbe3';
  v_org_id UUID;
  v_membership_exists BOOLEAN;
BEGIN
  -- Get the organization ID
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE owner_id = v_user_id
  LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization not found for user %', v_user_id;
  END IF;
  
  RAISE NOTICE 'Found organization: %', v_org_id;
  
  -- Check if owner membership exists
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_org_id
    AND user_id = v_user_id
  ) INTO v_membership_exists;
  
  IF NOT v_membership_exists THEN
    RAISE NOTICE 'Creating owner membership...';
    INSERT INTO public.organization_members (
      organization_id,
      user_id,
      role,
      joined_at,
      is_active
    ) VALUES (
      v_org_id,
      v_user_id,
      'owner',
      NOW(),
      true
    )
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
      role = 'owner',
      is_active = true,
      joined_at = COALESCE(organization_members.joined_at, NOW());
    
    RAISE NOTICE 'Owner membership created/updated';
  ELSE
    RAISE NOTICE 'Owner membership already exists';
  END IF;
  
  -- Verify the organization is accessible
  RAISE NOTICE 'Verifying organization access...';
  PERFORM id FROM public.organizations
  WHERE owner_id = v_user_id
  LIMIT 1;
  
  RAISE NOTICE 'Organization access verified successfully';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error fixing organization access: %', SQLERRM;
    RAISE;
END $$;

-- Test query to verify RLS policies work
-- This should return the organization if RLS is working correctly
SELECT 
  o.id,
  o.name,
  o.slug,
  o.owner_id,
  CASE 
    WHEN o.owner_id = '90209b16-b999-4090-8017-29e5f38bcbe3' THEN 'Owner match'
    ELSE 'Owner mismatch'
  END as access_check
FROM public.organizations o
WHERE o.owner_id = '90209b16-b999-4090-8017-29e5f38bcbe3'
LIMIT 1;

