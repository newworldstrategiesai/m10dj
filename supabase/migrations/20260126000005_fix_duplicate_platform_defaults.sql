-- Fix duplicate platform defaults in request_tab_defaults table
-- The UNIQUE constraint should prevent this, but if duplicates exist, clean them up

-- Delete duplicate platform defaults, keeping only the most recent one
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (ORDER BY updated_at DESC, created_at DESC) as rn
  FROM request_tab_defaults
  WHERE organization_id IS NULL
)
DELETE FROM request_tab_defaults
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Verify only one platform default exists
DO $$
DECLARE
  platform_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO platform_count
  FROM request_tab_defaults
  WHERE organization_id IS NULL;
  
  IF platform_count > 1 THEN
    RAISE WARNING 'Still have % platform defaults after cleanup. Manual cleanup required.', platform_count;
  ELSIF platform_count = 0 THEN
    -- Re-insert platform default if it was accidentally deleted
    INSERT INTO request_tab_defaults (organization_id, song_request_enabled, shoutout_enabled, tip_enabled) 
    VALUES (NULL, true, true, true)
    ON CONFLICT (organization_id) DO NOTHING;
    RAISE NOTICE 'Platform default was missing, re-inserted';
  ELSE
    RAISE NOTICE 'Platform default exists (count: %)', platform_count;
  END IF;
END $$;
