-- =====================================================
-- CLEANUP DUPLICATE "BEN MURRAY" CONTACTS
-- Run this in Supabase SQL Editor
-- =====================================================

-- This script will:
-- 1. Find all "Ben Murray" contacts with phone 9014977001
-- 2. Keep the one with the most complete data (or most recent)
-- 3. Soft delete all duplicates

-- Step 1: Identify duplicates
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
    event_date,
    venue_name,
    -- Calculate completeness score (higher = more complete)
    (
      CASE WHEN email_address IS NOT NULL AND email_address != '' THEN 1 ELSE 0 END +
      CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END +
      CASE WHEN organization_id IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN event_date IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN venue_name IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN venue_address IS NOT NULL THEN 1 ELSE 0 END
    ) as completeness_score
  FROM contacts
  WHERE deleted_at IS NULL
    AND LOWER(TRIM(COALESCE(first_name, ''))) = 'ben'
    AND LOWER(TRIM(COALESCE(last_name, ''))) = 'murray'
    AND phone IS NOT NULL
    AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '%9014977001%'
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
-- Step 2: Show what will be deleted (preview)
SELECT 
  'PREVIEW: Contacts to be deleted' as action,
  COUNT(*) as count_to_delete,
  ARRAY_AGG(id ORDER BY id) as contact_ids
FROM contacts_to_delete;

-- Step 3: Uncomment the UPDATE below to actually delete duplicates
/*
UPDATE contacts
SET 
  deleted_at = NOW(),
  updated_at = NOW()
WHERE id IN (
  SELECT id FROM contacts_to_delete
);
*/

-- Step 4: Verify results
SELECT 
  'Remaining Ben Murray contacts' as status,
  COUNT(*) as remaining_count,
  ARRAY_AGG(id ORDER BY created_at DESC) as remaining_ids
FROM contacts
WHERE deleted_at IS NULL
  AND LOWER(TRIM(COALESCE(first_name, ''))) = 'ben'
  AND LOWER(TRIM(COALESCE(last_name, ''))) = 'murray'
  AND phone IS NOT NULL
  AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE '%9014977001%';
