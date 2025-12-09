-- ============================================================================
-- UPDATE RLS POLICIES TO SUPPORT TEAM MEMBERS
-- ============================================================================
-- This migration updates all RLS policies to support organization_members
-- table, allowing team members (admin, member, viewer) to access their
-- organization's data based on their role.
--
-- CRITICAL: This must be run after organization_members table is created
-- ============================================================================

BEGIN;

-- ============================================================================
-- Helper function to update SELECT policies to support team members
-- ============================================================================
CREATE OR REPLACE FUNCTION update_org_policy_select_for_team_members(
  table_name TEXT,
  allow_public_read BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policy
  EXECUTE format('DROP POLICY IF EXISTS "Users can view their organization''s %I" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Public can view %I" ON %I', table_name, table_name);
  
  IF allow_public_read THEN
    -- Public read access (for content tables like testimonials, faqs, etc.)
    EXECUTE format(
      'CREATE POLICY "Public can view %I" ON %I FOR SELECT USING (true)',
      table_name, table_name
    );
  ELSE
    -- Organization-scoped access (supports team members)
    EXECUTE format(
      'CREATE POLICY "Users can view their organization''s %I" ON %I FOR SELECT USING (
        organization_id IN (
          SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM organization_members 
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR is_platform_admin()
      )',
      table_name, table_name
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper function to update INSERT policies to support team members
-- ============================================================================
CREATE OR REPLACE FUNCTION update_org_policy_insert_for_team_members(
  table_name TEXT,
  allow_public_insert BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policy
  EXECUTE format('DROP POLICY IF EXISTS "Users can insert into their organization''s %I" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "Public can insert into %I" ON %I', table_name, table_name);
  
  IF allow_public_insert THEN
    -- Public insert (for forms like contact_submissions, service_selections)
    EXECUTE format(
      'CREATE POLICY "Public can insert into %I" ON %I FOR INSERT WITH CHECK (true)',
      table_name, table_name
    );
  ELSE
    -- Organization-scoped insert (supports team members)
    EXECUTE format(
      'CREATE POLICY "Users can insert into their organization''s %I" ON %I FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM organization_members 
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR is_platform_admin()
      )',
      table_name, table_name
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper function to update UPDATE policies to support team members
-- ============================================================================
CREATE OR REPLACE FUNCTION update_org_policy_update_for_team_members(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policy
  EXECUTE format('DROP POLICY IF EXISTS "Users can update their organization''s %I" ON %I', table_name, table_name);
  
  -- Organization-scoped update (supports team members)
  EXECUTE format(
    'CREATE POLICY "Users can update their organization''s %I" ON %I FOR UPDATE USING (
      organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
      OR organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
      OR is_platform_admin()
    )',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper function to update DELETE policies to support team members
-- ============================================================================
CREATE OR REPLACE FUNCTION update_org_policy_delete_for_team_members(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Drop existing policy
  EXECUTE format('DROP POLICY IF EXISTS "Users can delete their organization''s %I" ON %I', table_name, table_name);
  
  -- Organization-scoped delete (supports team members)
  -- Note: In practice, you may want to restrict DELETE to owners/admins only
  -- This can be done via application-level permissions
  EXECUTE format(
    'CREATE POLICY "Users can delete their organization''s %I" ON %I FOR DELETE USING (
      organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
      OR organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
      OR is_platform_admin()
    )',
    table_name, table_name
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Update RLS policies for all tables with organization_id
-- ============================================================================
DO $$
DECLARE
  table_name TEXT;
  table_exists BOOLEAN;
  tables_to_process TEXT[] := ARRAY[
    -- Content tables (public read)
    'testimonials', 'faqs', 'preferred_vendors', 'preferred_venues', 'services',
    'blog_posts', 'gallery_images',
    
    -- Communication tables
    'sms_conversations', 'pending_ai_responses', 'received_emails', 
    'email_messages', 'email_attachments', 'email_sync_log', 'email_oauth_tokens',
    'messenger_messages', 'messenger_sync_log', 'instagram_messages', 
    'instagram_sync_log', 'communication_log', 'email_templates',
    
    -- Business operations
    'follow_up_reminders', 'meeting_types', 'availability_patterns',
    'availability_overrides', 'meeting_bookings', 'admin_assistant_logs',
    'pricing_config', 'quote_selections', 'admin_tasks', 'email_tracking',
    'quote_analytics', 'notification_log', 'service_selection_tokens',
    'service_selections', 'automation_queue', 'automation_templates',
    'automation_log', 'discount_codes', 'discount_usage', 'late_fees',
    'payment_reminders', 'contract_templates', 'questionnaire_submission_log'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_process
  LOOP
    -- Check if table exists
    EXECUTE format(
      'SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ''public'' AND table_name = %L)',
      table_name
    ) INTO table_exists;
    
    IF NOT table_exists THEN
      RAISE NOTICE 'Table % does not exist, skipping RLS policy update', table_name;
      CONTINUE;
    END IF;
    
    -- Check if table has organization_id column
    EXECUTE format(
      'SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = ''public'' 
        AND table_name = %L 
        AND column_name = ''organization_id''
      )',
      table_name
    ) INTO table_exists;
    
    IF NOT table_exists THEN
      RAISE NOTICE 'Table % does not have organization_id column, skipping', table_name;
      CONTINUE;
    END IF;
    
    -- Update policies based on table type
    IF table_name IN ('testimonials', 'faqs', 'preferred_vendors', 'preferred_venues', 'services', 'blog_posts', 'gallery_images') THEN
      -- Content tables: public read, authenticated write
      PERFORM update_org_policy_select_for_team_members(table_name, true);
      PERFORM update_org_policy_insert_for_team_members(table_name, false);
    ELSIF table_name IN ('service_selection_tokens', 'service_selections', 'questionnaire_submission_log', 'contact_submissions') THEN
      -- Public insert tables (forms)
      PERFORM update_org_policy_select_for_team_members(table_name, false);
      PERFORM update_org_policy_insert_for_team_members(table_name, true);
    ELSE
      -- Standard tables: authenticated only
      PERFORM update_org_policy_select_for_team_members(table_name, false);
      PERFORM update_org_policy_insert_for_team_members(table_name, false);
    END IF;
    
    PERFORM update_org_policy_update_for_team_members(table_name);
    PERFORM update_org_policy_delete_for_team_members(table_name);
    
    RAISE NOTICE 'Updated RLS policies for table: %', table_name;
  END LOOP;
END $$;

-- ============================================================================
-- Also update policies for tables that were added in earlier migrations
-- ============================================================================

-- Contacts table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    PERFORM update_org_policy_select_for_team_members('contacts', false);
    PERFORM update_org_policy_insert_for_team_members('contacts', false);
    PERFORM update_org_policy_update_for_team_members('contacts');
    PERFORM update_org_policy_delete_for_team_members('contacts');
    RAISE NOTICE 'Updated RLS policies for table: contacts';
  END IF;
END $$;

-- Events table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    PERFORM update_org_policy_select_for_team_members('events', false);
    PERFORM update_org_policy_insert_for_team_members('events', false);
    PERFORM update_org_policy_update_for_team_members('events');
    PERFORM update_org_policy_delete_for_team_members('events');
    RAISE NOTICE 'Updated RLS policies for table: events';
  END IF;
END $$;

-- Crowd requests table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crowd_requests') THEN
    PERFORM update_org_policy_select_for_team_members('crowd_requests', false);
    PERFORM update_org_policy_insert_for_team_members('crowd_requests', true); -- Public can submit requests
    PERFORM update_org_policy_update_for_team_members('crowd_requests');
    PERFORM update_org_policy_delete_for_team_members('crowd_requests');
    RAISE NOTICE 'Updated RLS policies for table: crowd_requests';
  END IF;
END $$;

-- Messages table (SMS)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    PERFORM update_org_policy_select_for_team_members('messages', false);
    PERFORM update_org_policy_insert_for_team_members('messages', false);
    PERFORM update_org_policy_update_for_team_members('messages');
    PERFORM update_org_policy_delete_for_team_members('messages');
    RAISE NOTICE 'Updated RLS policies for table: messages';
  END IF;
END $$;

-- Cleanup helper functions
DROP FUNCTION IF EXISTS update_org_policy_select_for_team_members(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS update_org_policy_insert_for_team_members(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS update_org_policy_update_for_team_members(TEXT);
DROP FUNCTION IF EXISTS update_org_policy_delete_for_team_members(TEXT);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All RLS policies now support team members from organization_members table.
-- 
-- Team members can now:
-- - View their organization's data
-- - Create/edit data based on their role (enforced at application level)
-- - Access is controlled by organization_members.is_active flag
--
-- Next steps:
-- 1. Test data isolation with team members
-- 2. Verify permissions work correctly
-- 3. Update API routes to use team member context
-- ============================================================================

COMMIT;

