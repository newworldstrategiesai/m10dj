-- Allow anonymous users to read crowd_requests by payment_code
-- This is needed for the success page to display bundled songs
-- without requiring authentication

-- Drop policy if it exists
DROP POLICY IF EXISTS "Anonymous users can view requests by payment code" ON crowd_requests;

-- Create policy for anonymous users to view crowd_requests that share a payment_code
-- This allows the success page to query for bundled songs
CREATE POLICY "Anonymous users can view requests by payment code"
  ON crowd_requests
  FOR SELECT
  TO anon
  USING (
    -- Allow viewing if payment_code is not null (means it's part of a bundle or single payment)
    payment_code IS NOT NULL
  );

-- Add comment
COMMENT ON POLICY "Anonymous users can view requests by payment code" ON crowd_requests IS 
  'Allows anonymous users to view crowd requests with a payment_code (for success page bundled songs display)';

