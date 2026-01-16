-- Cleanup duplicate "Ben Murray" contacts
-- This script identifies duplicates by name + phone and keeps the best one

-- Step 1: Find all Ben Murray contacts with phone 9014977001
-- Keep the one with the most complete data or most recent

WITH ben_murray_contacts AS (
  SELECT 
    id,
    first_name,
    last_name,
    email_address,
    phone,
    created_at,
    updated_at,
    organization_id,
    -- Calculate completeness score
    (
      CASE WHEN email_address IS NOT NULL AND email_address != '' THEN 1 ELSE 0 END +
      CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END +
      CASE WHEN organization_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN event_date IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN venue_name IS NOT NULL THEN 1 ELSE 0 END
    ) as completeness_score
  FROM contacts
  WHERE deleted_at IS NULL
    AND LOWER(TRIM(first_name)) = 'ben'
    AND LOWER(TRIM(last_name)) = 'murray'
    AND phone IS NOT NULL
    AND REPLACE(phone, '\D', '') LIKE '%9014977001%'
),
ranked_contacts AS (
  SELECT 
    id,
    completeness_score,
    created_at,
    ROW_NUMBER() OVER (
      ORDER BY 
        completeness_score DESC,
        created_at DESC
    ) as rn
  FROM ben_murray_contacts
),
contacts_to_delete AS (
  SELECT id
  FROM ranked_contacts
  WHERE rn > 1  -- Keep only the first (best) one
)
-- Soft delete duplicates
UPDATE contacts
SET 
  deleted_at = NOW(),
  updated_at = NOW()
WHERE id IN (SELECT id FROM contacts_to_delete);

-- Show results
SELECT 
  'Cleanup complete' as status,
  COUNT(*) as duplicates_deleted
FROM contacts
WHERE deleted_at IS NOT NULL
  AND LOWER(TRIM(first_name)) = 'ben'
  AND LOWER(TRIM(last_name)) = 'murray'
  AND phone IS NOT NULL
  AND REPLACE(phone, '\D', '') LIKE '%9014977001%';
