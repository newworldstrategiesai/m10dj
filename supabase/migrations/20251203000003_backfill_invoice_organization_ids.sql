-- Backfill organization_id for existing invoices
-- This ensures all invoices have organization_id set based on their contact's organization

-- First, try to get organization_id directly from contact if it exists
UPDATE public.invoices i
SET organization_id = c.organization_id
FROM public.contacts c
WHERE i.contact_id = c.id
  AND i.organization_id IS NULL
  AND c.organization_id IS NOT NULL;

-- Then, for invoices still without organization_id, get it from the contact's user_id -> organizations relationship
UPDATE public.invoices i
SET organization_id = (
  SELECT o.id
  FROM public.organizations o
  INNER JOIN public.contacts c ON o.owner_id = c.user_id
  WHERE c.id = i.contact_id
  LIMIT 1
)
WHERE i.organization_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.contacts c
    INNER JOIN public.organizations o ON o.owner_id = c.user_id
    WHERE c.id = i.contact_id
  );

-- Finally, for any remaining invoices without organization_id, use the first organization as fallback
UPDATE public.invoices i
SET organization_id = (
  SELECT id FROM public.organizations ORDER BY created_at ASC LIMIT 1
)
WHERE i.organization_id IS NULL
  AND EXISTS (SELECT 1 FROM public.organizations LIMIT 1);

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.invoices
  WHERE organization_id IS NOT NULL;
  
  SELECT COUNT(*) INTO remaining_count
  FROM public.invoices
  WHERE organization_id IS NULL;
  
  RAISE NOTICE '✅ Backfilled organization_id for invoices';
  RAISE NOTICE '📊 Invoices with organization_id: %', updated_count;
  RAISE NOTICE '⚠️  Invoices without organization_id: %', remaining_count;
END $$;

COMMENT ON COLUMN public.invoices.organization_id IS 'Organization that owns this invoice. Required for multi-tenant isolation. Backfilled from contact organization.';

