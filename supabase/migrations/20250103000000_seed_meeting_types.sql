-- ============================================================================
-- SEED MEETING TYPES
-- ============================================================================
-- Inserts default meeting types for the scheduling system
-- Handles organization_id if it exists (allows NULL for platform-wide types)
-- ============================================================================

BEGIN;

-- Insert default meeting types
-- Uses ON CONFLICT to avoid duplicates based on name (if unique constraint exists)
-- Or we'll use a WHERE NOT EXISTS check

-- Check if organization_id column exists and handle accordingly
DO $$
DECLARE
  has_org_id BOOLEAN;
BEGIN
  -- Check if organization_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_types' 
    AND column_name = 'organization_id'
  ) INTO has_org_id;

  IF has_org_id THEN
    -- Insert with organization_id = NULL (platform-wide/default types)
    INSERT INTO meeting_types (name, description, duration_minutes, color, display_order, is_active, organization_id)
    SELECT * FROM (VALUES
      ('Consultation', 'Initial consultation to discuss your event', 30, '#3b82f6', 1, true, NULL::UUID),
      ('Planning Meeting', 'Detailed planning session for your event', 60, '#8b5cf6', 2, true, NULL::UUID),
      ('Follow-up Call', 'Quick follow-up call', 15, '#10b981', 3, true, NULL::UUID),
      ('Final Details', 'Final event details and timeline review', 45, '#f59e0b', 4, true, NULL::UUID)
    ) AS v(name, description, duration_minutes, color, display_order, is_active, organization_id)
    WHERE NOT EXISTS (
      SELECT 1 FROM meeting_types 
      WHERE meeting_types.name = v.name 
      AND (meeting_types.organization_id IS NULL OR meeting_types.organization_id = v.organization_id)
    );
  ELSE
    -- Insert without organization_id (original schema)
    INSERT INTO meeting_types (name, description, duration_minutes, color, display_order, is_active)
    SELECT * FROM (VALUES
      ('Consultation', 'Initial consultation to discuss your event', 30, '#3b82f6', 1, true),
      ('Planning Meeting', 'Detailed planning session for your event', 60, '#8b5cf6', 2, true),
      ('Follow-up Call', 'Quick follow-up call', 15, '#10b981', 3, true),
      ('Final Details', 'Final event details and timeline review', 45, '#f59e0b', 4, true)
    ) AS v(name, description, duration_minutes, color, display_order, is_active)
    WHERE NOT EXISTS (
      SELECT 1 FROM meeting_types 
      WHERE meeting_types.name = v.name
    );
  END IF;
END $$;

COMMIT;

