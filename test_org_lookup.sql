-- Test organization lookup for super admin user
-- This simulates what getCurrentOrganization() does

DO $$
DECLARE
    super_admin_user_id UUID := 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';
    found_org RECORD;
BEGIN
    RAISE NOTICE 'Testing organization lookup for user: %', super_admin_user_id;

    -- First try: user is owner
    SELECT o.* INTO found_org
    FROM organizations o
    WHERE o.owner_id = super_admin_user_id
    LIMIT 1;

    IF found_org.id IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: User is owner of organization: % (%)', found_org.name, found_org.id;
        RAISE NOTICE '  - Is platform owner: %', found_org.is_platform_owner;
        RAISE NOTICE '  - Subscription status: %', found_org.subscription_status;
        RETURN;
    END IF;

    -- Second try: user is a member
    SELECT o.* INTO found_org
    FROM organization_members om
    JOIN organizations o ON o.id = om.organization_id
    WHERE om.user_id = super_admin_user_id AND om.is_active = true
    LIMIT 1;

    IF found_org.id IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: User is member of organization: % (%)', found_org.name, found_org.id;
        RAISE NOTICE '  - Is platform owner: %', found_org.is_platform_owner;
        RAISE NOTICE '  - Subscription status: %', found_org.subscription_status;
        RETURN;
    END IF;

    RAISE NOTICE 'FAILURE: User has no organization access!';
    RAISE NOTICE '  - Not an owner of any organization';
    RAISE NOTICE '  - Not a member of any active organization';

END $$;