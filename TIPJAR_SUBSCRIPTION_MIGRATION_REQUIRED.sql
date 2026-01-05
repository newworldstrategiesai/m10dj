-- TipJar.live Subscription System - Required SQL Migration
-- 
-- This migration ensures the organizations table supports TipJar subscription tiers
-- Run this in Supabase SQL Editor if the subscription_tier constraint doesn't include 'white_label'
--
-- Date: January 2025
-- Status: Required for TipJar launch

-- Step 1: Update subscription_tier CHECK constraint to include 'white_label'
-- This allows the white_label tier (typically for platform owners like M10 DJ Company)

ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_subscription_tier_check 
CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', 'white_label'));

-- Step 2: Verify subscription_status constraint includes all statuses
-- This should already be correct, but verify it includes: 'trial', 'active', 'cancelled', 'past_due'

-- Check current constraint (run this separately to verify):
-- SELECT 
--   conname AS constraint_name,
--   pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'organizations'::regclass
--   AND conname LIKE '%subscription_status%';

-- If subscription_status constraint needs updating:
-- ALTER TABLE public.organizations
-- DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;
--
-- ALTER TABLE public.organizations
-- ADD CONSTRAINT organizations_subscription_status_check
-- CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due'));

-- Step 3: Verify required columns exist (run this separately to verify):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'organizations'
--   AND column_name IN (
--     'subscription_tier',
--     'subscription_status',
--     'stripe_customer_id',
--     'stripe_subscription_id',
--     'trial_ends_at'
--   )
-- ORDER BY column_name;

-- Expected columns:
-- - subscription_tier: TEXT (with CHECK constraint including 'white_label')
-- - subscription_status: TEXT (with CHECK constraint)
-- - stripe_customer_id: TEXT (nullable)
-- - stripe_subscription_id: TEXT (nullable)
-- - trial_ends_at: TIMESTAMP WITH TIME ZONE (nullable)

-- Step 4: If any columns are missing, add them:
-- (Usually these should already exist from the base organizations table migration)

-- ALTER TABLE public.organizations
-- ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter',
-- ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
-- ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
-- ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
-- ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Verification query (run after applying migration):
-- SELECT 
--   conname AS constraint_name,
--   pg_get_constraintdef(oid) AS constraint_definition
-- FROM pg_constraint
-- WHERE conrelid = 'organizations'::regclass
--   AND conname = 'organizations_subscription_tier_check';

-- Expected output should show:
-- CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', 'white_label'))

