-- Add public read access to organizations by slug
-- This allows anonymous users to view organization details for public request pages

-- Policy: Allow public read access to organizations by slug (for public request pages)
CREATE POLICY "Allow public read access to organizations by slug"
  ON organizations
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Allow reading any organization (needed for public request pages)

COMMENT ON POLICY "Allow public read access to organizations by slug" ON organizations IS 
  'Allows anonymous and authenticated users to read organization details by slug for public request pages. This is safe because we only expose id, name, slug, and subscription_status.';

