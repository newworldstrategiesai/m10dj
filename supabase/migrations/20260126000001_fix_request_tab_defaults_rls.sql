-- Fix RLS policies for request_tab_defaults to allow public read access
-- The tab visibility settings are not sensitive and should be readable by anyone
-- This fixes 500 errors when querying from client-side code

-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Platform admins can view all request tab defaults" ON request_tab_defaults;
DROP POLICY IF EXISTS "Org admins can view their org request tab defaults" ON request_tab_defaults;
DROP POLICY IF EXISTS "Platform admins can manage platform request tab defaults" ON request_tab_defaults;
DROP POLICY IF EXISTS "Org admins can manage their org request tab defaults" ON request_tab_defaults;

-- Allow anyone to read platform defaults (organization_id IS NULL)
CREATE POLICY "Anyone can view platform request tab defaults"
  ON request_tab_defaults FOR SELECT
  USING (organization_id IS NULL);

-- Allow anyone to read organization defaults (they're just visibility settings)
CREATE POLICY "Anyone can view organization request tab defaults"
  ON request_tab_defaults FOR SELECT
  USING (organization_id IS NOT NULL);

-- Platform admins can manage platform defaults (INSERT/UPDATE/DELETE only, not SELECT)
CREATE POLICY "Platform admins can manage platform request tab defaults"
  ON request_tab_defaults FOR INSERT, UPDATE, DELETE
  USING (
    organization_id IS NULL
    AND EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    organization_id IS NULL
    AND EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Organization owners/admins can manage their org defaults (INSERT/UPDATE/DELETE only, not SELECT)
CREATE POLICY "Org admins can manage their org request tab defaults"
  ON request_tab_defaults FOR INSERT, UPDATE, DELETE
  USING (
    organization_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = request_tab_defaults.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND product_context = 'tipjar'
        AND (
          owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = request_tab_defaults.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
          )
        )
      )
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = request_tab_defaults.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
      OR EXISTS (
        SELECT 1 FROM organizations
        WHERE id = request_tab_defaults.organization_id
        AND product_context = 'tipjar'
        AND (
          owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = request_tab_defaults.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
          )
        )
      )
    )
  );

-- Service role policy remains unchanged (already exists)
-- No need to recreate it
