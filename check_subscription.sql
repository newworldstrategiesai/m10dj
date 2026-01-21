-- Check organization subscription status
SELECT
    o.id,
    o.name,
    o.subscription_status,
    o.subscription_tier,
    o.trial_ends_at,
    o.is_platform_owner,
    CASE
        WHEN o.subscription_status = 'active' THEN 'ACTIVE - Should work'
        WHEN o.subscription_status = 'trial' AND o.trial_ends_at > NOW() THEN 'TRIAL_VALID - Should work'
        WHEN o.subscription_status = 'trial' AND o.trial_ends_at <= NOW() THEN 'TRIAL_EXPIRED - Will not work'
        WHEN o.is_platform_owner = true THEN 'PLATFORM_OWNER - Should always work'
        ELSE 'INACTIVE - Will not work'
    END as karaoke_access_status
FROM organizations o
WHERE o.id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';