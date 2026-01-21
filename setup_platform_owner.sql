-- Setup platform owner organization for super admin access
-- Run this if the super admin doesn't have organization access

-- Replace 'super-admin-email@example.com' with the actual super admin email
-- Replace 'super-admin-user-id' with the actual user ID from the auth.users table

DO $$
DECLARE
    super_admin_user_id UUID := 'super-admin-user-id'; -- Replace with actual user ID
    platform_org_id UUID;
BEGIN
    -- Check if platform owner organization already exists
    SELECT id INTO platform_org_id
    FROM organizations
    WHERE is_platform_owner = true
    LIMIT 1;

    -- If no platform owner organization exists, create one
    IF platform_org_id IS NULL THEN
        INSERT INTO organizations (
            name,
            slug,
            owner_id,
            is_platform_owner,
            subscription_tier,
            subscription_status,
            trial_ends_at,
            requests_header_artist_name
        ) VALUES (
            'M10 DJ Company',
            'm10dj',
            super_admin_user_id,
            true,
            'enterprise',
            'active',
            NOW() + INTERVAL '1 year',
            'M10 DJ Company'
        )
        RETURNING id INTO platform_org_id;

        RAISE NOTICE 'Created platform owner organization with ID: %', platform_org_id;
    ELSE
        RAISE NOTICE 'Platform owner organization already exists with ID: %', platform_org_id;
    END IF;

    -- Ensure super admin is a member of the platform owner organization
    INSERT INTO organization_members (organization_id, user_id, is_active)
    VALUES (platform_org_id, super_admin_user_id, true)
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        is_active = true,
        updated_at = NOW();

    RAISE NOTICE 'Super admin membership ensured for organization: %', platform_org_id;

END $$;