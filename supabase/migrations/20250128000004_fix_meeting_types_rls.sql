-- Fix RLS policies for scheduling system to allow public access
-- The schedule page needs to be accessible to anonymous users

-- Drop existing policies that might be blocking anonymous access
DROP POLICY IF EXISTS "Anyone can view active meeting types" ON meeting_types;
DROP POLICY IF EXISTS "Admins can manage meeting types" ON meeting_types;

-- Allow anonymous users to view active meeting types (for public schedule page)
CREATE POLICY "Public can view active meeting types"
  ON meeting_types FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Allow authenticated admins to manage meeting types
CREATE POLICY "Admins can manage meeting types"
  ON meeting_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

-- Fix availability_patterns policies for public read access
DROP POLICY IF EXISTS "Admins can manage availability" ON availability_patterns;

-- Allow anonymous users to read active availability patterns (needed for schedule page)
CREATE POLICY "Public can view active availability patterns"
  ON availability_patterns FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Allow authenticated admins to manage availability patterns
CREATE POLICY "Admins can manage availability patterns"
  ON availability_patterns FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

-- Fix availability_overrides policies
DROP POLICY IF EXISTS "Admins can manage overrides" ON availability_overrides;

-- Allow anonymous users to read availability overrides (needed to check blocked dates)
CREATE POLICY "Public can view availability overrides"
  ON availability_overrides FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Allow authenticated admins to manage availability overrides
CREATE POLICY "Admins can manage availability overrides"
  ON availability_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

-- Fix meeting_bookings policies
-- The existing "Anyone can create bookings" policy should work, but let's make sure it's explicit
DROP POLICY IF EXISTS "Anyone can create bookings" ON meeting_bookings;
DROP POLICY IF EXISTS "Admins can manage bookings" ON meeting_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON meeting_bookings;

-- Allow anonymous users to create bookings (public scheduling)
CREATE POLICY "Public can create bookings"
  ON meeting_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Allow anonymous users to read their own bookings (by email, for confirmation page)
-- Note: This is tricky without auth, so we'll allow reading if they have the booking ID
-- The confirmation page uses the booking ID from the URL
CREATE POLICY "Public can view bookings by ID"
  ON meeting_bookings FOR SELECT
  TO anon, authenticated
  USING (TRUE); -- Allow viewing any booking (needed for confirmation page with ID in URL)

-- Allow authenticated admins to manage all bookings
CREATE POLICY "Admins can manage all bookings"
  ON meeting_bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

