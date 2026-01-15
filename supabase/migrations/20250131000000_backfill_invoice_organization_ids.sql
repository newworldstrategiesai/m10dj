-- Backfill invoice organization_id
-- Associates invoices with M10 organization when organization_id is null
-- Priority: contact.organization_id > M10 platform owner org

-- Step 1: Find M10 platform owner organization
DO $$
DECLARE
  m10_org_id UUID;
  invoices_updated INTEGER := 0;
  invoices_from_contact INTEGER := 0;
  invoices_from_m10 INTEGER := 0;
BEGIN
  -- Find M10 platform owner organization
  SELECT id INTO m10_org_id
  FROM organizations
  WHERE is_platform_owner = TRUE
  LIMIT 1;
  
  -- If not found by flag, try to find by name/slug
  IF m10_org_id IS NULL THEN
    SELECT id INTO m10_org_id
    FROM organizations
    WHERE name ILIKE '%m10%' OR slug ILIKE '%m10%'
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  IF m10_org_id IS NULL THEN
    RAISE NOTICE '⚠️ Could not find M10 organization. Please run MARK_M10_DJ_AS_PLATFORM_OWNER.sql first.';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Found M10 organization: %', m10_org_id;
  
  -- Step 2: Update invoices that have null organization_id
  -- First, try to get organization_id from contact
  UPDATE invoices i
  SET organization_id = c.organization_id
  FROM contacts c
  WHERE i.organization_id IS NULL
    AND i.contact_id = c.id
    AND c.organization_id IS NOT NULL;
  
  GET DIAGNOSTICS invoices_from_contact = ROW_COUNT;
  RAISE NOTICE '✅ Updated % invoices with organization_id from contact', invoices_from_contact;
  
  -- Step 3: For remaining invoices with null organization_id, assign to M10
  UPDATE invoices
  SET organization_id = m10_org_id
  WHERE organization_id IS NULL;
  
  GET DIAGNOSTICS invoices_from_m10 = ROW_COUNT;
  RAISE NOTICE '✅ Updated % invoices with M10 organization_id', invoices_from_m10;
  
  invoices_updated := invoices_from_contact + invoices_from_m10;
  RAISE NOTICE '✅ Total invoices updated: %', invoices_updated;
  
  -- Step 4: Verify results
  RAISE NOTICE '📊 Verification:';
  RAISE NOTICE '   - Invoices with null organization_id: %', (
    SELECT COUNT(*) FROM invoices WHERE organization_id IS NULL
  );
  RAISE NOTICE '   - Invoices with M10 organization_id: %', (
    SELECT COUNT(*) FROM invoices WHERE organization_id = m10_org_id
  );
END $$;

-- Step 5: Create index if it doesn't exist (for performance)
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id 
ON invoices(organization_id) 
WHERE organization_id IS NOT NULL;

-- Step 6: Add comment
COMMENT ON COLUMN invoices.organization_id IS 
'Organization that owns this invoice. Required for multi-tenant isolation. Backfilled from contact or M10 platform owner organization.';
