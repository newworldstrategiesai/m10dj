-- ============================================================================
-- COMPREHENSIVE DATA ISOLATION FIX
-- ============================================================================
-- This migration adds organization_id to ALL tables that need multi-tenant
-- data isolation and sets up proper RLS policies.
--
-- CRITICAL SECURITY FIX: Prevents data leakage between organizations
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Ensure is_platform_admin function exists
-- ============================================================================

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email IN (
      'admin@m10djcompany.com',
      'manager@m10djcompany.com',
      'djbenmurray@gmail.com'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get default organization_id for backfilling
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  -- Store in a temporary table for use in subsequent steps
  CREATE TEMP TABLE IF NOT EXISTS migration_default_org (org_id UUID);
  DELETE FROM migration_default_org;
  INSERT INTO migration_default_org (org_id) VALUES (default_org_id);
END $$;

-- ============================================================================
-- STEP 2: Add organization_id to content/configuration tables
-- ============================================================================

-- Helper function to safely add organization_id to a table
CREATE OR REPLACE FUNCTION safe_add_organization_id(
  table_name TEXT,
  backfill_from_table TEXT DEFAULT NULL,
  backfill_join TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  table_exists BOOLEAN;
  table_name_param TEXT := table_name;
BEGIN
  -- Check if table exists (use format to avoid ambiguity)
  EXECUTE format(
    'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = ''public'' AND table_name = %L)',
    table_name_param
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'Table % does not exist, skipping', table_name_param;
    RETURN;
  END IF;
  
  -- Add column
  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE', table_name_param);
  
  -- Create index
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_organization_id ON %I(organization_id)', table_name_param, table_name_param);
  
  -- Backfill from related table if specified
  IF backfill_from_table IS NOT NULL AND backfill_join IS NOT NULL THEN
    EXECUTE format(
      'UPDATE %I SET organization_id = %I.organization_id FROM %I WHERE %I.organization_id IS NULL AND %s',
      table_name_param, backfill_from_table, backfill_from_table, table_name_param, backfill_join
    );
  END IF;
  
  -- Backfill remaining with default
  EXECUTE format('UPDATE %I SET organization_id = (SELECT org_id FROM migration_default_org) WHERE organization_id IS NULL', table_name_param);
  
  -- Add comment
  EXECUTE format('COMMENT ON COLUMN %I.organization_id IS ''Organization that owns this record. Required for multi-tenant isolation.''', table_name_param);
END;
$$ LANGUAGE plpgsql;

-- Testimonials
SELECT safe_add_organization_id('testimonials');

-- FAQs
SELECT safe_add_organization_id('faqs');

-- Preferred Vendors
SELECT safe_add_organization_id('preferred_vendors');

-- Preferred Venues
SELECT safe_add_organization_id('preferred_venues');

-- Services
SELECT safe_add_organization_id('services');

-- Blog Posts
SELECT safe_add_organization_id('blog_posts');

-- Gallery Images
SELECT safe_add_organization_id('gallery_images');

-- ============================================================================
-- STEP 3: Add organization_id to communication tables
-- ============================================================================

-- SMS Conversations
SELECT safe_add_organization_id('sms_conversations');

-- Pending AI Responses
SELECT safe_add_organization_id('pending_ai_responses');

-- Received Emails
SELECT safe_add_organization_id('received_emails');

-- Email Messages
SELECT safe_add_organization_id('email_messages');

-- Email Attachments (backfill from email_messages if possible)
SELECT safe_add_organization_id('email_attachments', 'email_messages', 'email_attachments.email_message_id = email_messages.id');

-- Email Sync Log
SELECT safe_add_organization_id('email_sync_log');

-- Email OAuth Tokens
SELECT safe_add_organization_id('email_oauth_tokens');

-- Messenger Messages
SELECT safe_add_organization_id('messenger_messages');

-- Messenger Sync Log
SELECT safe_add_organization_id('messenger_sync_log');

-- Instagram Messages
SELECT safe_add_organization_id('instagram_messages');

-- Instagram Sync Log
SELECT safe_add_organization_id('instagram_sync_log');

-- Communication Log
SELECT safe_add_organization_id('communication_log');

-- Email Templates
SELECT safe_add_organization_id('email_templates');

-- Follow Up Reminders
SELECT safe_add_organization_id('follow_up_reminders');

-- ============================================================================
-- STEP 4: Add organization_id to business operation tables
-- ============================================================================

-- Meeting Types
SELECT safe_add_organization_id('meeting_types');

-- Availability Patterns
SELECT safe_add_organization_id('availability_patterns');

-- Availability Overrides
SELECT safe_add_organization_id('availability_overrides');

-- Meeting Bookings
SELECT safe_add_organization_id('meeting_bookings');

-- Admin Assistant Logs
SELECT safe_add_organization_id('admin_assistant_logs');

-- Pricing Config
SELECT safe_add_organization_id('pricing_config');

-- Quote Selections (backfill from contracts, invoices, or contacts via lead_id)
-- Add organization_id column first
SELECT safe_add_organization_id('quote_selections');

-- Then backfill from related tables if they exist
DO $$
BEGIN
  -- Backfill from contracts if contract_id exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quote_selections' 
    AND column_name = 'contract_id'
  ) THEN
    UPDATE quote_selections 
    SET organization_id = contracts.organization_id 
    FROM contracts 
    WHERE quote_selections.contract_id = contracts.id 
    AND quote_selections.organization_id IS NULL;
  END IF;
  
  -- Backfill from invoices if invoice_id exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quote_selections' 
    AND column_name = 'invoice_id'
  ) THEN
    UPDATE quote_selections 
    SET organization_id = invoices.organization_id 
    FROM invoices 
    WHERE quote_selections.invoice_id = invoices.id 
    AND quote_selections.organization_id IS NULL;
  END IF;
  
  -- Backfill from contacts via lead_id if lead_id exists
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'quote_selections' 
    AND column_name = 'lead_id'
  ) THEN
    UPDATE quote_selections 
    SET organization_id = contacts.organization_id 
    FROM contacts 
    WHERE quote_selections.lead_id = contacts.id 
    AND quote_selections.organization_id IS NULL;
    
    -- Also try contact_submissions if lead_id references that
    UPDATE quote_selections 
    SET organization_id = contact_submissions.organization_id 
    FROM contact_submissions 
    WHERE quote_selections.lead_id = contact_submissions.id 
    AND quote_selections.organization_id IS NULL;
  END IF;
END $$;

-- Admin Tasks
SELECT safe_add_organization_id('admin_tasks');

-- Email Tracking
SELECT safe_add_organization_id('email_tracking');

-- Quote Analytics
SELECT safe_add_organization_id('quote_analytics');

-- Notification Log
SELECT safe_add_organization_id('notification_log');

-- Service Selection Tokens (backfill from contacts)
SELECT safe_add_organization_id('service_selection_tokens', 'contacts', 'service_selection_tokens.contact_id = contacts.id');

-- Service Selections (backfill from contacts)
SELECT safe_add_organization_id('service_selections', 'contacts', 'service_selections.contact_id = contacts.id');

-- Automation Queue
SELECT safe_add_organization_id('automation_queue');

-- Automation Templates
SELECT safe_add_organization_id('automation_templates');

-- Automation Log
SELECT safe_add_organization_id('automation_log');

-- Discount Codes (standalone table, no direct relationship - will use default org)
SELECT safe_add_organization_id('discount_codes');

-- Discount Usage (backfill from discount_codes, invoices, or contacts)
-- Add organization_id column first
SELECT safe_add_organization_id('discount_usage');

-- Then backfill from related tables if they exist
DO $$
BEGIN
  -- Backfill from discount_codes
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'discount_usage' 
    AND column_name = 'discount_code_id'
  ) THEN
    UPDATE discount_usage 
    SET organization_id = discount_codes.organization_id 
    FROM discount_codes 
    WHERE discount_usage.discount_code_id = discount_codes.id 
    AND discount_usage.organization_id IS NULL;
  END IF;
  
  -- Backfill from invoices
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'discount_usage' 
    AND column_name = 'invoice_id'
  ) THEN
    UPDATE discount_usage 
    SET organization_id = invoices.organization_id 
    FROM invoices 
    WHERE discount_usage.invoice_id = invoices.id 
    AND discount_usage.organization_id IS NULL;
  END IF;
  
  -- Backfill from contacts
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'discount_usage' 
    AND column_name = 'contact_id'
  ) THEN
    UPDATE discount_usage 
    SET organization_id = contacts.organization_id 
    FROM contacts 
    WHERE discount_usage.contact_id = contacts.id 
    AND discount_usage.organization_id IS NULL;
  END IF;
END $$;

-- Late Fees (backfill from invoices)
SELECT safe_add_organization_id('late_fees', 'invoices', 'late_fees.invoice_id = invoices.id');

-- Payment Reminders (backfill from invoices)
SELECT safe_add_organization_id('payment_reminders', 'invoices', 'payment_reminders.invoice_id = invoices.id');

-- Contract Templates
SELECT safe_add_organization_id('contract_templates');

-- Questionnaire Submission Log (backfill from contacts)
SELECT safe_add_organization_id('questionnaire_submission_log', 'contacts', 'questionnaire_submission_log.lead_id = contacts.id');

-- Cleanup helper function
DROP FUNCTION IF EXISTS safe_add_organization_id(TEXT, TEXT, TEXT);

-- ============================================================================
-- STEP 5: Create RLS policies for all tables with organization_id
-- ============================================================================

-- Helper function to create RLS policies (safer than dynamic execution for policies)
CREATE OR REPLACE FUNCTION create_org_policy_select(table_name TEXT, allow_null BOOLEAN DEFAULT FALSE)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS "Users can view their organization''s %I" ON %I', table_name, table_name);
  
  -- Create new policy
  EXECUTE format(
    'CREATE POLICY "Users can view their organization''s %I" ON %I FOR SELECT USING (%s)',
    table_name,
    table_name,
    CASE 
      WHEN allow_null THEN 'organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) OR is_platform_admin() OR organization_id IS NULL'
      ELSE 'organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) OR is_platform_admin()'
    END
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_org_policy_insert(table_name TEXT, allow_public BOOLEAN DEFAULT FALSE)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policies if they exist
  EXECUTE format('DROP POLICY IF EXISTS "Anyone can insert into %I" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Users can insert into their organization''s %I" ON %I', table_name, table_name);
  
  -- Create new policy
  IF allow_public THEN
    EXECUTE format(
      'CREATE POLICY "Anyone can insert into %I" ON %I FOR INSERT TO anon, authenticated WITH CHECK (true)',
      table_name, table_name
    );
  ELSE
    EXECUTE format(
      'CREATE POLICY "Users can insert into their organization''s %I" ON %I FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) OR is_platform_admin())',
      table_name, table_name
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_org_policy_update(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS "Users can update their organization''s %I" ON %I', table_name, table_name);
  
  -- Create new policy
  EXECUTE format(
    'CREATE POLICY "Users can update their organization''s %I" ON %I FOR UPDATE USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) OR is_platform_admin())',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_org_policy_delete(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policy if it exists
  EXECUTE format('DROP POLICY IF EXISTS "Users can delete their organization''s %I" ON %I', table_name, table_name);
  
  -- Create new policy
  EXECUTE format(
    'CREATE POLICY "Users can delete their organization''s %I" ON %I FOR DELETE USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()) OR is_platform_admin())',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql;

-- Enable RLS and create policies for each table
DO $$
DECLARE
  table_name TEXT;
  table_exists BOOLEAN;
  tables_to_process TEXT[] := ARRAY[
    'testimonials', 'faqs', 'preferred_vendors', 'preferred_venues', 'services',
    'blog_posts', 'gallery_images', 'sms_conversations', 'pending_ai_responses',
    'received_emails', 'email_messages', 'email_attachments', 'email_sync_log',
    'email_oauth_tokens', 'messenger_messages', 'messenger_sync_log',
    'instagram_messages', 'instagram_sync_log', 'communication_log',
    'email_templates', 'follow_up_reminders', 'meeting_types',
    'availability_patterns', 'availability_overrides', 'meeting_bookings',
    'admin_assistant_logs', 'pricing_config', 'quote_selections',
    'admin_tasks', 'email_tracking', 'quote_analytics', 'notification_log',
    'service_selection_tokens', 'service_selections', 'automation_queue',
    'automation_templates', 'automation_log', 'discount_codes',
    'discount_usage', 'late_fees', 'payment_reminders', 'contract_templates',
    'questionnaire_submission_log'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_process
  LOOP
    -- Check if table exists (use format to avoid ambiguity)
    EXECUTE format(
      'SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ''public'' AND table_name = %L)',
      table_name
    ) INTO table_exists;
    
    IF NOT table_exists THEN
      RAISE NOTICE 'Table % does not exist, skipping RLS policies', table_name;
      CONTINUE;
    END IF;
    
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    
    -- Create policies based on table type (helper functions will drop existing policies)
    IF table_name IN ('testimonials', 'faqs', 'preferred_vendors', 'preferred_venues', 'services', 'blog_posts', 'gallery_images') THEN
      -- Content tables: public read, authenticated write
      PERFORM create_org_policy_select(table_name, true);
      PERFORM create_org_policy_insert(table_name, false);
    ELSIF table_name IN ('service_selection_tokens', 'service_selections', 'questionnaire_submission_log') THEN
      -- Public insert tables
      PERFORM create_org_policy_select(table_name, false);
      PERFORM create_org_policy_insert(table_name, true);
    ELSE
      -- Standard tables: authenticated only
      PERFORM create_org_policy_select(table_name, false);
      PERFORM create_org_policy_insert(table_name, false);
    END IF;
    
    PERFORM create_org_policy_update(table_name);
    PERFORM create_org_policy_delete(table_name);
  END LOOP;
END $$;

-- Cleanup helper functions
DROP FUNCTION IF EXISTS create_org_policy_select(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS create_org_policy_insert(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS create_org_policy_update(TEXT);
DROP FUNCTION IF EXISTS create_org_policy_delete(TEXT);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables now have organization_id and proper RLS policies.
-- 
-- Next steps:
-- 1. Update API routes to filter by organization_id
-- 2. Test data isolation between organizations
-- 3. Verify platform admins can still see all data
-- ============================================================================

COMMIT;
