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

