-- Combined migration to add all missing columns to crowd_requests table
-- Run this in your Supabase SQL Editor if migrations haven't been applied

-- =====================================================
-- PART 1: Add "next" option columns
-- =====================================================

-- Add is_next column
ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS is_next BOOLEAN DEFAULT FALSE;

-- Add next_fee column (fee in cents)
ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS next_fee INTEGER DEFAULT 0;

-- Update existing fast-track requests to have priority_order = 1 (next will be 0)
UPDATE crowd_requests 
SET priority_order = 1 
WHERE is_fast_track = TRUE AND priority_order = 0;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_crowd_requests_is_next ON crowd_requests(is_next);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_next_fee ON crowd_requests(next_fee);

-- Add comments
COMMENT ON COLUMN crowd_requests.is_next IS 'If true, song will be played next (highest priority)';
COMMENT ON COLUMN crowd_requests.next_fee IS 'Additional fee in cents for "next" option';

-- =====================================================
-- PART 2: Add payment_code column
-- =====================================================

-- Add payment_code column to crowd_requests table for CashApp/Venmo verification
ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS payment_code VARCHAR(20);

-- Create index for payment code lookups
CREATE INDEX IF NOT EXISTS idx_crowd_requests_payment_code ON crowd_requests(payment_code);

-- Generate payment codes for existing requests that don't have one
UPDATE crowd_requests
SET payment_code = 'M10-' || UPPER(SUBSTRING(id::text, 1, 6))
WHERE payment_code IS NULL;

-- Create function to generate unique payment codes
CREATE OR REPLACE FUNCTION generate_payment_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate code: M10-XXXXXX where XXXXXX is random alphanumeric
        code := 'M10-' || UPPER(
            SUBSTRING(
                MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text),
                1, 6
            )
        );
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM crowd_requests WHERE payment_code = code) INTO exists_check;
        
        -- If code doesn't exist, return it
        IF NOT exists_check THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION: Check that all columns exist
-- =====================================================

-- Verify columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'crowd_requests' 
    AND table_schema = 'public'
    AND column_name IN ('is_next', 'next_fee', 'payment_code')
ORDER BY column_name;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed! All columns should now exist.';
END $$;

