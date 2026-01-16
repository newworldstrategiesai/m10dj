-- Ensure request_tab_defaults table has the required default data
-- This migration ensures the platform default row exists even if it was missed

-- Insert platform default (organization_id IS NULL) if it doesn't exist
INSERT INTO request_tab_defaults (organization_id, song_request_enabled, shoutout_enabled, tip_enabled) 
VALUES (NULL, true, true, true)
ON CONFLICT (organization_id) DO NOTHING;

-- Verify the data exists
DO $$
DECLARE
  platform_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO platform_count
  FROM request_tab_defaults
  WHERE organization_id IS NULL;
  
  IF platform_count = 0 THEN
    RAISE EXCEPTION 'Platform default row was not created. Check the table structure.';
  ELSE
    RAISE NOTICE 'Platform default row exists (count: %)', platform_count;
  END IF;
END $$;
