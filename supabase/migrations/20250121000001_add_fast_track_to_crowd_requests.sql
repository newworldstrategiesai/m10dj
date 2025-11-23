-- Add fast-track option to crowd_requests table
-- NOTE: Run migration 20250121000000_create_crowd_requests.sql FIRST if table doesn't exist

DO $$
BEGIN
  -- Check if table exists before trying to alter it
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crowd_requests') THEN
    -- Add columns if they don't exist
    ALTER TABLE crowd_requests 
    ADD COLUMN IF NOT EXISTS is_fast_track BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fast_track_fee INTEGER DEFAULT 0, -- Fast-track fee in cents (added to base amount)
    ADD COLUMN IF NOT EXISTS priority_order INTEGER DEFAULT 1000; -- Lower numbers = higher priority (0 = fast-track, 1000 = regular)
    
    -- Update priority_order for existing rows (set regular requests to 1000)
    UPDATE crowd_requests 
    SET priority_order = 1000 
    WHERE priority_order IS NULL OR priority_order = 0;
    
    -- Create indexes for sorting by priority and date
    CREATE INDEX IF NOT EXISTS idx_crowd_requests_priority ON crowd_requests(priority_order ASC, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_crowd_requests_fast_track ON crowd_requests(is_fast_track, payment_status);
  ELSE
    RAISE NOTICE 'Table crowd_requests does not exist. Please run migration 20250121000000_create_crowd_requests.sql first.';
  END IF;
END $$;

-- Priority order explanation:
-- Fast-track requests get priority_order = 0 (set by application)
-- Regular requests get priority_order = 1000 (default)
-- Within each group, sort by created_at (newest first)

