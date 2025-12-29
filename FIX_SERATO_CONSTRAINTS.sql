-- Fix Serato Connection Constraints
-- Run this in Supabase SQL Editor

-- 1. First, clean up any duplicate connections per DJ
-- Keep only the most recent connection for each DJ
DELETE FROM serato_connections a
USING serato_connections b
WHERE a.dj_id = b.dj_id 
  AND a.created_at < b.created_at;

-- 2. Add proper unique constraint on dj_id (required for upsert to work)
ALTER TABLE serato_connections 
DROP CONSTRAINT IF EXISTS serato_connections_dj_id_unique;

ALTER TABLE serato_connections 
ADD CONSTRAINT serato_connections_dj_id_unique UNIQUE (dj_id);

-- 3. Drop the partial unique index (no longer needed with proper constraint)
DROP INDEX IF EXISTS idx_serato_connections_active_dj;

-- Verify the constraint exists
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'serato_connections'::regclass;

