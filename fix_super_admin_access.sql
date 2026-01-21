-- Fix super admin organization access
-- User ID: aa23eed5-de23-4b28-bc5d-26e72077e7a8

DO $$
DECLARE
    super_admin_user_id UUID := 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';
    platform_org_id UUID;
    existing_org_count INTEGER;
BEGIN
    -- Check if any organizations exist
    SELECT COUNT(*) INTO existing_org_count FROM organizations;

    RAISE NOTICE 'Total organizations found: %', existing_org_count;

    -- Check if platform owner organization already exists
    SELECT id INTO platform_org_id
    FROM organizations
    WHERE is_platform_owner = true
    LIMIT 1;

    IF platform_org_id IS NULL THEN
        RAISE NOTICE 'No platform owner organization found. Creating one...';

        -- Create platform owner organization
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

    -- Ensure super admin is the owner of the platform organization
    UPDATE organizations
    SET owner_id = super_admin_user_id
    WHERE id = platform_org_id AND owner_id != super_admin_user_id;

    -- Ensure super admin is a member of the platform owner organization
    INSERT INTO organization_members (organization_id, user_id, is_active)
    VALUES (platform_org_id, super_admin_user_id, true)
    ON CONFLICT (organization_id, user_id) DO UPDATE SET
        is_active = true,
        updated_at = NOW();

    RAISE NOTICE 'Super admin membership ensured for organization: %', platform_org_id;

    -- If no organizations existed before, also create a default organization for regular users
    IF existing_org_count = 0 THEN
        RAISE NOTICE 'No organizations existed. Creating default organization for testing...';

        INSERT INTO organizations (
            name,
            slug,
            owner_id,
            subscription_tier,
            subscription_status,
            trial_ends_at,
            requests_header_artist_name
        ) VALUES (
            'Default Organization',
            'default-org',
            super_admin_user_id,
            'starter',
            'trial',
            NOW() + INTERVAL '14 days',
            'Default DJ'
        );

        RAISE NOTICE 'Created default organization for testing';
    END IF;

END $$;